---
title: 待ち手が寝ていないなら、起こすシステムコールは要らない
description: 1 回だけの合図を送る Baton::post。状態を 5 つに分け、待ち手がまだ眠っていない場合は CAS 1 回で済ませて futex の呼び出しを省く。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/Baton.h
lines: [149, 184]
function: Baton::post
difficulty: 2
tags: [並行処理, 状態機械, 最適化, システムコール]
---

## ひとことで

`Baton`（バトン）は、あるスレッドが別のスレッドに **1 回だけ「準備できたよ」と知らせる** ための 4 バイトの道具です。
`post()` が知らせる側、`wait()` が待つ側です。
`post()` は、待つ側がまだ眠っていなければ、OS を呼ばずに状態を書き換えるだけで終わります。

## コード

::: code-group

```cpp:line-numbers=149 [日本語訳]
  void post() noexcept {
    if (!MayBlock) {
      /// スピンのみの版
      ///
      assert(
          ((1 << state_.load(std::memory_order_relaxed)) &
           ((1 << INIT) | (1 << EARLY_DELIVERY))) != 0);
      state_.store(EARLY_DELIVERY, std::memory_order_release);
      return;
    }

    /// ブロックしうる版
    ///
    uint32_t before = state_.load(std::memory_order_acquire);

    assert(before == INIT || before == WAITING || before == TIMED_OUT);

    if (before == INIT &&
        state_.compare_exchange_strong(
            before,
            EARLY_DELIVERY,
            std::memory_order_release,
            std::memory_order_relaxed)) {
      return;
    }

    assert(before == WAITING || before == TIMED_OUT);

    if (before == TIMED_OUT) {
      return;
    }

    assert(before == WAITING);
    state_.store(LATE_DELIVERY, std::memory_order_release);
    detail::futexWake(&state_, 1);
  }
```

```cpp:line-numbers=149 [原文]
  void post() noexcept {
    if (!MayBlock) {
      /// Spin-only version
      ///
      assert(
          ((1 << state_.load(std::memory_order_relaxed)) &
           ((1 << INIT) | (1 << EARLY_DELIVERY))) != 0);
      state_.store(EARLY_DELIVERY, std::memory_order_release);
      return;
    }

    /// May-block versions
    ///
    uint32_t before = state_.load(std::memory_order_acquire);

    assert(before == INIT || before == WAITING || before == TIMED_OUT);

    if (before == INIT &&
        state_.compare_exchange_strong(
            before,
            EARLY_DELIVERY,
            std::memory_order_release,
            std::memory_order_relaxed)) {
      return;
    }

    assert(before == WAITING || before == TIMED_OUT);

    if (before == TIMED_OUT) {
      return;
    }

    assert(before == WAITING);
    state_.store(LATE_DELIVERY, std::memory_order_release);
    detail::futexWake(&state_, 1);
  }
```

:::

状態は次の 5 つで、同じクラスの後半で定義されています。

```cpp:line-numbers=300
  enum State : uint32_t {
    INIT = 0,
    EARLY_DELIVERY = 1,
    WAITING = 2,
    LATE_DELIVERY = 3,
    TIMED_OUT = 4,
  };
```

## 前提知識

- **テンプレート引数 `MayBlock`**: `Baton<true>` と `Baton<false>` で別のクラスが作られます。`false` 版は「待つ側が決して眠らない（回り続ける）」版です。`if (!MayBlock)` の条件はコンパイル時に決まるので、使われない側は最適化で消えます。
- **`compare_exchange_strong(expected, desired, ...)`**: atomic 変数が `expected` と等しければ `desired` に書き換えて `true` を返します。違えば、今の値を `expected` に書き戻して `false` を返します。
- **メモリオーダー**: `release` で書いた値を `acquire` で読んだスレッドは、書いた側が **それより前に** 行ったすべての書き込みを見られます。バトンを渡す前に用意したデータが、受け取った側から確実に見えるようにするための約束です。
- **futex**: Linux の仕組みで、「この 4 バイトの値が X のままなら眠る」「この番地で眠っているスレッドを起こす」をシステムコールで行います。`detail::futexWake(&state_, 1)` は 1 スレッドを起こします。
- **`assert`**: デバッグビルドで条件を確かめ、偽ならプログラムを止めます。
- **`1 << x` のビット集合**: 最初の `assert` は「今の状態が INIT か EARLY_DELIVERY のどちらか」を、ビットの集合で一度に調べるテクニックです。

## 何をしているか

### 1. 回るだけの版

```cpp:line-numbers=150
    if (!MayBlock) {
      /// スピンのみの版
      ///
      assert(
          ((1 << state_.load(std::memory_order_relaxed)) &
           ((1 << INIT) | (1 << EARLY_DELIVERY))) != 0);
      state_.store(EARLY_DELIVERY, std::memory_order_release);
      return;
    }
```

`MayBlock == false` なら、待つ側は眠らないので起こす必要がありません。
`EARLY_DELIVERY` を `release` で書き込んで終わりです。

### 2. 待ち手がまだ来ていない場合

```cpp:line-numbers=162
    uint32_t before = state_.load(std::memory_order_acquire);

    assert(before == INIT || before == WAITING || before == TIMED_OUT);

    if (before == INIT &&
        state_.compare_exchange_strong(
            before,
            EARLY_DELIVERY,
            std::memory_order_release,
            std::memory_order_relaxed)) {
      return;
    }
```

状態を読み、`INIT` なら `EARLY_DELIVERY` への CAS を試します。
成功すれば「先に届けておいた」ことになり、そのまま戻ります。
後から来た `wait()` は、状態が `EARLY_DELIVERY` なのを見てすぐに戻ります。その判定をしているのが次の `try_wait` です。

```cpp:line-numbers=222
  FOLLY_ALWAYS_INLINE bool try_wait() noexcept {
    auto s = state_.load(std::memory_order_acquire);
    assert(s == INIT || s == EARLY_DELIVERY);
    return FOLLY_LIKELY(s == EARLY_DELIVERY);
  }
```

### 3. 待ち手が眠っている場合

```cpp:line-numbers=175
    assert(before == WAITING || before == TIMED_OUT);

    if (before == TIMED_OUT) {
      return;
    }

    assert(before == WAITING);
    state_.store(LATE_DELIVERY, std::memory_order_release);
    detail::futexWake(&state_, 1);
```

CAS が失敗した、または最初から `INIT` ではなかったなら、状態は `WAITING` か `TIMED_OUT` です。

- `TIMED_OUT`: 待つ側はタイムアウトしてもう諦めています。何もせず戻ります。
- `WAITING`: 待つ側が futex で眠っています。`LATE_DELIVERY` を書き込み、`futexWake` で 1 スレッドを起こします。

### 4. 2 つのシナリオ

1. **post が先**: 状態は `INIT → EARLY_DELIVERY`。システムコールは 0 回です。
2. **wait が先**: 待つ側がしばらく回った後、`INIT → WAITING` に変えて眠ります。post は `WAITING → LATE_DELIVERY` にしてから起こします。

## ここがすごい

- **速い道を先に**: 多くの場面では `post` が `wait` より先に呼ばれるか、待つ側はまだ回っている段階です。そのとき `post` は atomic 操作 1〜2 回で終わります。素直に「毎回 futexWake する」と書くと、誰も眠っていないのにシステムコールを払うことになります。
- **状態を細かく分ける**: 「届いた」を `EARLY_DELIVERY` と `LATE_DELIVERY` に分けることで、デバッグ時に「誰がどの順で来たか」を `assert` で厳しく確認できます。`TIMED_OUT` を分けることで、もう誰も待っていないのに起こそうとする無駄も省けます。
- **使い方を制限して速くする**: クラス冒頭のコメントのとおり、Baton は「1 回の寿命で post も wait も 1 回まで」という強い制約を持ちます。制約があるから、汎用のセマフォより単純で速い実装になります。
- **4 バイトで完結**: 状態は 1 つの `uint32_t` だけで、futex がそのまま扱える大きさです。

## まとめ

- 「起こす」処理は、相手が本当に眠っているときだけ行えばよい。
- 状態を細かく分けると、余計な処理を省けるうえに不正な使い方も検出しやすくなる。
- CAS は「自分が先に来たか」を判定する道具としても使える。
- 用途を絞った同期部品は、汎用品より速く小さくできる。

