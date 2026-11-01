---
title: 1 つのミューテックスと条件変数で、すべての call_once を捌く
description: std::call_once の実装 __call_once。全 once_flag で共有するミューテックスと条件変数を使い、実行中は鍵を手放して関数を呼ぶ。例外が出たら状態を戻して待っているスレッドを起こす。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/src/call_once.cpp
lines: [33, 70]
function: std::__call_once
difficulty: 3
format: 2
tags: [並行処理, エラー処理, 設計パターン]
---
## ひとことで

`std::call_once(flag, f)` は、複数のスレッドから同時に呼ばれても、関数 `f` を **ちょうど 1 回だけ** 実行する仕組みです。初期化処理を 1 回だけ行いたいときに使います。
`__call_once` はその本体で、`once_flag` の状態を「未実行」「実行中」「完了」の 3 つで管理します。
`f` が例外を投げたら「未実行」に戻し、ほかのスレッドが再挑戦できるようにします。

## コード

::: code-group

```cpp:line-numbers=33 [日本語訳]
void __call_once(volatile once_flag::_State_type& flag, void* arg, void (*func)(void*)) {
#if !_LIBCPP_HAS_THREADS

  if (flag == once_flag::_Unset) {
    auto guard = std::__make_exception_guard([&flag] { flag = once_flag::_Unset; });
    flag       = once_flag::_Pending;
    func(arg);
    flag = once_flag::_Complete;
    guard.__complete();
  }

#else // スレッドあり（!_LIBCPP_HAS_THREADS の else 側）

  __libcpp_mutex_lock(&mut);
  while (flag == once_flag::_Pending)
    __libcpp_condvar_wait(&cv, &mut);
  if (flag == once_flag::_Unset) {
    auto guard = std::__make_exception_guard([&flag] {
      __libcpp_mutex_lock(&mut);
      __libcpp_relaxed_store(&flag, once_flag::_Unset);
      __libcpp_mutex_unlock(&mut);
      __libcpp_condvar_broadcast(&cv);
    });

    __libcpp_relaxed_store(&flag, once_flag::_Pending);
    __libcpp_mutex_unlock(&mut);
    func(arg);
    __libcpp_mutex_lock(&mut);
    __libcpp_atomic_store(&flag, once_flag::_Complete, _AO_Release);
    __libcpp_mutex_unlock(&mut);
    __libcpp_condvar_broadcast(&cv);
    guard.__complete();
  } else {
    __libcpp_mutex_unlock(&mut);
  }

#endif // !_LIBCPP_HAS_THREADS の終わり
}
```

```cpp:line-numbers=33 [原文]
void __call_once(volatile once_flag::_State_type& flag, void* arg, void (*func)(void*)) {
#if !_LIBCPP_HAS_THREADS

  if (flag == once_flag::_Unset) {
    auto guard = std::__make_exception_guard([&flag] { flag = once_flag::_Unset; });
    flag       = once_flag::_Pending;
    func(arg);
    flag = once_flag::_Complete;
    guard.__complete();
  }

#else // !_LIBCPP_HAS_THREADS

  __libcpp_mutex_lock(&mut);
  while (flag == once_flag::_Pending)
    __libcpp_condvar_wait(&cv, &mut);
  if (flag == once_flag::_Unset) {
    auto guard = std::__make_exception_guard([&flag] {
      __libcpp_mutex_lock(&mut);
      __libcpp_relaxed_store(&flag, once_flag::_Unset);
      __libcpp_mutex_unlock(&mut);
      __libcpp_condvar_broadcast(&cv);
    });

    __libcpp_relaxed_store(&flag, once_flag::_Pending);
    __libcpp_mutex_unlock(&mut);
    func(arg);
    __libcpp_mutex_lock(&mut);
    __libcpp_atomic_store(&flag, once_flag::_Complete, _AO_Release);
    __libcpp_mutex_unlock(&mut);
    __libcpp_condvar_broadcast(&cv);
    guard.__complete();
  } else {
    __libcpp_mutex_unlock(&mut);
  }

#endif // !_LIBCPP_HAS_THREADS
}
```

:::

## 前提知識

- **`once_flag` の状態**: ヘッダで `_Unset = 0`（未実行）、`_Pending = 1`（実行中）、`_Complete`（すべてのビットが 1、完了）と定義されています。
- **`volatile ... &`**: `volatile` は「この変数はコンパイラが知らないところで変わるかもしれない」という指定、`&` は参照（呼び出し側の変数そのもの）です。
- **`void* arg, void (*func)(void*)`**: 関数ポインタと、それに渡す引数です。テンプレートの `call_once` が、任意の関数を「`void*` を受け取る関数」の形に包んで渡してきます。こうすると、この関数をライブラリ本体（`.cpp`）に 1 つだけ置けます。
- **ミューテックスと条件変数**: ミューテックスは排他の鍵です。条件変数は「条件が整うまで眠って待つ」ための仕組みで、`wait` は鍵を手放して眠り、起こされたら鍵を取り直します。`broadcast` は待っている全員を起こします。
- **`__make_exception_guard(ラムダ)`**: 例外で抜けたときだけラムダ（その場で作る関数）を実行する道具です。正常に終わったら `__complete()` を呼んで無効にします。
- **`[&flag]`**: ラムダが外の変数 `flag` を参照で使えるようにする指定です。
- **`_AO_Release`**: release（解放）というメモリ順序です。この書き込みより前の処理結果が、この値を acquire で読んだほかのスレッドから見えることを保証します。

## 何をしているか

ヘッダ側では、まず状態を acquire で読み、`_Complete` ならこの関数を呼ばずに戻ります。ここに来るのは、まだ完了していないときだけです。

### 1. スレッドなしの環境

```cpp:line-numbers=34
#if !_LIBCPP_HAS_THREADS

  if (flag == once_flag::_Unset) {
    auto guard = std::__make_exception_guard([&flag] { flag = once_flag::_Unset; });
    flag       = once_flag::_Pending;
    func(arg);
    flag = once_flag::_Complete;
    guard.__complete();
  }
```

鍵が要らないので、状態を見て `_Unset` なら実行するだけです。例外の場合は guard が状態を `_Unset` に戻します。

### 2. 実行中なら待つ

```cpp:line-numbers=46
  __libcpp_mutex_lock(&mut);
  while (flag == once_flag::_Pending)
    __libcpp_condvar_wait(&cv, &mut);
```

共有のミューテックス `mut` を取り、状態が `_Pending` の間は条件変数 `cv` で眠ります。

### 3. 自分が実行する

```cpp:line-numbers=49
  if (flag == once_flag::_Unset) {
    auto guard = std::__make_exception_guard([&flag] {
      __libcpp_mutex_lock(&mut);
      __libcpp_relaxed_store(&flag, once_flag::_Unset);
      __libcpp_mutex_unlock(&mut);
      __libcpp_condvar_broadcast(&cv);
    });

    __libcpp_relaxed_store(&flag, once_flag::_Pending);
    __libcpp_mutex_unlock(&mut);
    func(arg);
    __libcpp_mutex_lock(&mut);
    __libcpp_atomic_store(&flag, once_flag::_Complete, _AO_Release);
    __libcpp_mutex_unlock(&mut);
    __libcpp_condvar_broadcast(&cv);
    guard.__complete();
```

状態が `_Unset` なら自分の番です。

1. 例外用の guard を用意する。
2. 状態を `_Pending` にして、**鍵を手放してから** `func(arg)` を呼ぶ。
3. 終わったら鍵を取り直し、状態を `_Complete` に release で書き、鍵を手放して全員を起こす。
4. guard を無効化する。

### 4. すでに完了していた

```cpp:line-numbers=65
  } else {
    __libcpp_mutex_unlock(&mut);
  }
```

待っている間に別のスレッドが完了させていたら、鍵を手放して戻るだけです。

### 例外が起きたとき

スレッド A が実行中に例外が出ると、guard のラムダが動きます。鍵を取って状態を `_Unset` に戻し、全員を起こします。眠っていたスレッド B は起きて状態を見直し、`_Unset` なので自分が実行役になります。

## ここがすごい

- **全フラグで鍵を共有**: ミューテックスと条件変数はファイルに 1 組だけです。`once_flag` 自体は整数 1 つなので、とても小さく、静的に初期化できます。共有していても、競合が起きるのは「まだ完了していない」ごく短い期間だけです。完了後はヘッダ側の読み出しだけで済むからです。
- **関数を呼ぶ間は鍵を持たない**: `__libcpp_mutex_unlock(&mut)` で鍵を手放してから `func` を呼んでいます。鍵を持ったまま呼ぶと、`func` の中で別の `once_flag` の `call_once` を使ったとき、同じ共有の鍵を取ろうとして自分自身を待つ（デッドロック）ことになります。「実行中」の状態を `_Pending` として記録しておけば、鍵がなくても他スレッドは待つべきだとわかります。
- **例外安全**: 規格は「関数が例外を投げたら、その呼び出しは実行しなかったことにする」と定めています。guard を使って、例外の経路でだけ状態を戻し、待っている全員を起こしています。起こさないと、待っているスレッドは永久に眠ったままになります。
- **release / acquire の対**: `_Complete` を release で書き、ヘッダ側で acquire で読むので、`func` が行った初期化の結果を、ほかのスレッドが確実に見られます。

## まとめ

- 「1 回だけ実行」は、未実行・実行中・完了の 3 状態で管理できる。
- 時間のかかる処理やユーザーのコードを呼ぶときは、鍵を手放す。状態変数で「実行中」を表せばよい。
- 例外の経路で状態を戻し、待っているスレッドを起こさないと、永久に待たせてしまう。
- 共有の鍵 1 つでも、使うのが短い期間だけなら十分に実用的。
