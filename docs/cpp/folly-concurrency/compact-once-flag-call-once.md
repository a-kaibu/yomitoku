---
title: 1 バイトで作る「一度だけ実行」、例外が出たら次の人に譲る
description: folly::call_once の 1 バイト版フラグ compact_once_flag の中核。3 つの状態と atomic_wait で、std::call_once の弱点だった例外時のデッドロックを避ける。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/CallOnce.h
lines: [214, 241]
function: compact_once_flag::call_once_impl
difficulty: 2
tags: [並行処理, 状態機械, エラー処理, 標準ライブラリ]
---

## ひとことで

`call_once(flag, f)` は、たくさんのスレッドから同時に呼ばれても **`f` を 1 回だけ実行する** 関数です。初期化処理などに使います。
ここで読む `call_once_impl` は、そのためのフラグを **1 バイト** で実現する `compact_once_flag` の中核部分です。
`f` が例外を投げたら「未実行」に戻し、待っている別のスレッドにやり直してもらいます。

## コード

```cpp:line-numbers=214
  template <typename F>
  FOLLY_ALWAYS_INLINE bool call_once_impl(F&& f) {
    while (true) {
      uint8_t expected = kInit;
      if (state_.compare_exchange_weak(
              expected, kActive, std::memory_order_acquire)) {
        bool pass = false;
        SCOPE_EXIT {
          state_.store(pass ? kDone : kInit, std::memory_order_release);
          folly::atomic_notify_all(&state_);
        };
        pass = f();
        return pass;
      }
      if (expected == kDone) {
        return true;
      }
      folly::atomic_wait(&state_, kActive);
    }
  }

  template <typename F, typename... Args>
  FOLLY_NOINLINE void call_once_slow(F&& f, Args&&... args) {
    call_once_impl([&]() -> bool {
      std::invoke(std::forward<F>(f), std::forward<Args>(args)...);
      return true;
    });
  }
```

状態は 3 つで、同じクラスの中で次のように定義されています。

```cpp:line-numbers=197
  // kDone is 0 so test_once() compiles to test+jnz on x86.
  static constexpr uint8_t kDone = 0;
  static constexpr uint8_t kInit = 1;
  static constexpr uint8_t kActive = 2;
```

## 前提知識

- **テンプレートと `F&& f`**: どんな関数でも受け取れる書き方です。`&&` はここでは「転送参照」と呼ばれ、渡されたものをコピーせずにそのまま受け取ります。
- **ラムダ式 `[&]() -> bool { ... }`**: その場で作る無名関数です。`[&]` は周りの変数を参照で使えるという意味、`-> bool` は戻り値の型です。
- **`std::invoke(f, args...)`**: 関数でもメンバ関数ポインタでも、統一的に呼び出せる標準関数です。
- **`std::forward`**: 受け取った引数を、元の性質（一時オブジェクトかどうか）を保ったまま次へ渡します。
- **`compare_exchange_weak(expected, desired, order)`**: 値が `expected` なら `desired` に書き換えて `true`、違えば今の値を `expected` に入れて `false` を返します。`weak` は、まれに理由なく失敗することがある代わりに速い版です。ループの中で使う前提です。
- **`SCOPE_EXIT { ... };`**: Folly のマクロで、ブロックを抜けるときに **必ず** 中身を実行します。普通に `return` しても、例外で抜けても実行されます。
- **`atomic_wait(&x, v)` / `atomic_notify_all(&x)`**: 「`x` が `v` の間は眠る」「`x` で眠っているスレッドを全員起こす」という操作です。C++20 の `std::atomic::wait` / `notify_all` に相当します。

## 何をしているか

### 実行権を取りに行く

```cpp:line-numbers=217
      uint8_t expected = kInit;
      if (state_.compare_exchange_weak(
              expected, kActive, std::memory_order_acquire)) {
```
状態を `kInit`（未実行）から `kActive`（誰かが実行中）に変える CAS を試します。
成功したスレッドだけが `f` を実行する権利を得ます。

### 実行して後片付けを予約する

```cpp:line-numbers=220
        bool pass = false;
        SCOPE_EXIT {
          state_.store(pass ? kDone : kInit, std::memory_order_release);
          folly::atomic_notify_all(&state_);
        };
        pass = f();
        return pass;
```
`pass` を `false` で用意し、`SCOPE_EXIT` で後片付けを予約してから `f()` を呼びます。
後片付けでは、`pass` が真なら `kDone`、偽なら `kInit` を書き込み、待っている全員を起こします。

- `f()` が正常に `true` を返した: `pass = true` になってから抜けるので、状態は `kDone` になります。
- `f()` が例外を投げた: `pass = f();` の代入が行われないまま抜けるので `pass` は `false` のまま。状態は `kInit` に戻ります。

### 実行権を取れなかった場合

```cpp:line-numbers=228
      if (expected == kDone) {
        return true;
      }
      folly::atomic_wait(&state_, kActive);
```
CAS が失敗すると、`expected` に今の状態が入っています。
`kDone` ならもう誰かが成功させたので `true` を返します。
`kActive` なら誰かが実行中なので、`atomic_wait` で状態が `kActive` でなくなるまで眠ります。
起きたらループの先頭に戻り、もう一度 CAS を試します。前の人が失敗して `kInit` に戻っていれば、今度は自分が実行する番です。

### call_once から呼ばれる形

```cpp:line-numbers=235
  template <typename F, typename... Args>
  FOLLY_NOINLINE void call_once_slow(F&& f, Args&&... args) {
    call_once_impl([&]() -> bool {
      std::invoke(std::forward<F>(f), std::forward<Args>(args)...);
      return true;
    });
  }
```
`call_once_slow` は、利用者の `f` を「実行したら `true` を返すラムダ」で包んで `call_once_impl` に渡します。
戻り値を返さない普通の関数でも、成功・失敗の枠組みに乗せられます。

## ここがすごい

- **例外でデッドロックしない**: `call_once` 関数の説明コメントによれば、libstdc++ の `std::call_once` は、最初の呼び出しで例外が出ると次の呼び出しがデッドロックする欠陥を持っていました。ここでは `SCOPE_EXIT` で必ず状態を戻して全員を起こすので、2 人目が正しくやり直せます。
- **1 バイトに収める**: 状態 3 つに `std::atomic<uint8_t>` 1 つで足り、ミューテックスを持ちません。クラスの直後の `static_assert` で 1 バイトであることを保証しています。
- **速い道は 1 命令**: `kDone` を 0 にしたことで、「もう実行済みか」の確認が x86 で「0 かどうか調べて分岐」の 2 命令になります（定数の定義に付いたコメント）。
- **成否を返す版と共通化**: 例外を使わない `try_call_once` も、同じ `call_once_impl` に「戻り値で成否を返すラムダ」を渡すだけで実現しています。

## まとめ

- 「一度だけ実行」は、未実行・実行中・完了の 3 状態と CAS で作れる。
- 後片付けを `SCOPE_EXIT` で予約しておくと、例外が出ても状態を正しく戻せる。
- 待つ側は「実行中」でなくなるまで眠り、起きたら最初からやり直すと、失敗時の引き継ぎも自然に書ける。
- よく通る判定が 0 との比較になるように状態の値を選ぶと、速い道がさらに速くなる。
