---
title: 64 ビットに「世代」と「待ち人数」を同居させる条件変数
description: ロックフリーなデータ構造に「眠って待つ」を後付けする EventCount。上位 32 ビットの世代番号だけを futex で監視し、待ち人数が 0 なら起こす処理を省く。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/EventCount.h
lines: [142, 174]
function: EventCount::doNotify / prepareWait / wait
difficulty: 3
tags: [並行処理, ロック不要, ビット演算, システムコール]
---

## ひとことで

`EventCount` は、ロックを使わないデータ構造（ロックフリーキューなど）に「空なら眠って待つ」機能を足すための **条件変数** です。
1 つの 64 ビット整数に、上位 32 ビットで「通知の世代番号（エポック）」、下位 32 ビットで「今待っている人数」を詰め込んでいます。
通知する側は世代を 1 進めるだけで、待っている人がいるときだけ OS に起こしてもらいます。

## コード

::: code-group

```cpp:line-numbers=142 [日本語訳]
inline void EventCount::doNotify(int n) noexcept {
  uint64_t prev = val_.fetch_add(kAddEpoch, std::memory_order_acq_rel);
  if (FOLLY_UNLIKELY(prev & kWaiterMask)) {
    detail::futexWake(
        reinterpret_cast<detail::Futex<std::atomic>*>(&val_) + kEpochOffset, n);
  }
}

inline EventCount::Key EventCount::prepareWait() noexcept {
  uint64_t prev = val_.fetch_add(kAddWaiter, std::memory_order_acq_rel);
  return Key(prev >> kEpochShift);
}

inline void EventCount::cancelWait() noexcept {
  // 正しさだけなら memory_order_relaxed で十分だが、待ち人数が
  // 早く 0 になるほど、無駄な起こし（つまりシステムコール）を
  // する可能性が低くなる。
  uint64_t prev = val_.fetch_add(kSubWaiter, std::memory_order_seq_cst);
  DCHECK_NE((prev & kWaiterMask), 0);
}

inline void EventCount::wait(Key key) noexcept {
  while ((val_.load(std::memory_order_acquire) >> kEpochShift) == key.epoch_) {
    detail::futexWait(
        reinterpret_cast<detail::Futex<std::atomic>*>(&val_) + kEpochOffset,
        key.epoch_);
  }
  // 正しさだけなら memory_order_relaxed で十分だが、待ち人数が
  // 早く 0 になるほど、無駄な起こし（つまりシステムコール）を
  // する可能性が低くなる
  uint64_t prev = val_.fetch_add(kSubWaiter, std::memory_order_seq_cst);
  DCHECK_NE((prev & kWaiterMask), 0);
}
```

```cpp:line-numbers=142 [原文]
inline void EventCount::doNotify(int n) noexcept {
  uint64_t prev = val_.fetch_add(kAddEpoch, std::memory_order_acq_rel);
  if (FOLLY_UNLIKELY(prev & kWaiterMask)) {
    detail::futexWake(
        reinterpret_cast<detail::Futex<std::atomic>*>(&val_) + kEpochOffset, n);
  }
}

inline EventCount::Key EventCount::prepareWait() noexcept {
  uint64_t prev = val_.fetch_add(kAddWaiter, std::memory_order_acq_rel);
  return Key(prev >> kEpochShift);
}

inline void EventCount::cancelWait() noexcept {
  // memory_order_relaxed would suffice for correctness, but the faster
  // #waiters gets to 0, the less likely it is that we'll do spurious wakeups
  // (and thus system calls).
  uint64_t prev = val_.fetch_add(kSubWaiter, std::memory_order_seq_cst);
  DCHECK_NE((prev & kWaiterMask), 0);
}

inline void EventCount::wait(Key key) noexcept {
  while ((val_.load(std::memory_order_acquire) >> kEpochShift) == key.epoch_) {
    detail::futexWait(
        reinterpret_cast<detail::Futex<std::atomic>*>(&val_) + kEpochOffset,
        key.epoch_);
  }
  // memory_order_relaxed would suffice for correctness, but the faster
  // #waiters gets to 0, the less likely it is that we'll do spurious wakeups
  // (and thus system calls)
  uint64_t prev = val_.fetch_add(kSubWaiter, std::memory_order_seq_cst);
  DCHECK_NE((prev & kWaiterMask), 0);
}
```

:::

定数はクラスの中で次のように定義されています。

```cpp:line-numbers=121
  static constexpr size_t kEpochOffset = kIsLittleEndian ? 1 : 0;

  // val_ stores the epoch in the most significant 32 bits and the
  // waiter count in the least significant 32 bits.
  std::atomic<uint64_t> val_;

  static constexpr uint64_t kAddWaiter = uint64_t(1);
  static constexpr uint64_t kSubWaiter = uint64_t(-1);
  static constexpr size_t kEpochShift = 32;
  static constexpr uint64_t kAddEpoch = uint64_t(1) << kEpochShift;
  static constexpr uint64_t kWaiterMask = kAddEpoch - 1;
```

## 前提知識

- **条件変数**: 「条件が満たされるまで眠る」「条件を満たしたので起こす」を行う同期の道具です。普通はミューテックスと組で使いますが、`EventCount` はミューテックスなしで使えます。
- **`fetch_add(x, order)`**: atomic 変数に `x` を足し、足す前の値を返します。`uint64_t(-1)` を足すと、符号なしの桁あふれにより 1 を引いたのと同じになります。
- **`>>` と `&`**: `val >> 32` で上位 32 ビットを取り出し、`val & 0xFFFFFFFF` で下位 32 ビットを取り出します。
- **エンディアン**: 複数バイトの整数をメモリに並べる順番です。リトルエンディアン（x86 など）では下位のバイトが先に来るので、64 ビット値の上位 32 ビットはアドレスが 4 バイト後ろにあります。
- **ポインタ演算 `p + 1`**: 4 バイトの型へのポインタに 1 を足すと、4 バイト先を指します。
- **futex**: Linux の仕組みで、`futexWait(addr, v)` は「`*addr` が `v` のままなら眠る」、`futexWake(addr, n)` は「`addr` で眠っている人を最大 `n` 人起こす」です。futex は 32 ビットの値しか扱えません。
- **`DCHECK_NE(a, b)`**: デバッグビルドで `a != b` を確認するマクロです。

## 何をしているか

使い方は、待つ側が `prepareWait()` → 条件を調べる → だめなら `wait(key)` / よければ `cancelWait()`、通知する側が条件を満たしてから `notify()` です（クラスの説明コメントより）。

### prepareWait：待ち人数を 1 増やし、今の世代を覚える

```cpp:line-numbers=150
inline EventCount::Key EventCount::prepareWait() noexcept {
  uint64_t prev = val_.fetch_add(kAddWaiter, std::memory_order_acq_rel);
  return Key(prev >> kEpochShift);
}
```
`val_` が `世代 5 / 待ち 0` だとします。`fetch_add(1)` で `世代 5 / 待ち 1` になり、戻り値の上位 32 ビット `5` を `Key` として返します。

### doNotify：世代を 1 進め、待ち人がいれば起こす

```cpp:line-numbers=142
inline void EventCount::doNotify(int n) noexcept {
  uint64_t prev = val_.fetch_add(kAddEpoch, std::memory_order_acq_rel);
  if (FOLLY_UNLIKELY(prev & kWaiterMask)) {
    detail::futexWake(
        reinterpret_cast<detail::Futex<std::atomic>*>(&val_) + kEpochOffset, n);
  }
}
```
通知側は `fetch_add(kAddEpoch)` で上位 32 ビットに 1 を足し、`世代 6 / 待ち 1` にします。
戻り値（足す前の値）の下位 32 ビットが 0 でなければ、誰かが待っているので `futexWake` を呼びます。
`notify()` は 1 人、`notifyAll()` は `INT_MAX` 人を起こします。

```cpp:line-numbers=134
inline void EventCount::notify() noexcept {
  doNotify(1);
}

inline void EventCount::notifyAll() noexcept {
  doNotify(INT_MAX);
}
```

### wait：世代が変わるまで眠る

```cpp:line-numbers=163
inline void EventCount::wait(Key key) noexcept {
  while ((val_.load(std::memory_order_acquire) >> kEpochShift) == key.epoch_) {
    detail::futexWait(
        reinterpret_cast<detail::Futex<std::atomic>*>(&val_) + kEpochOffset,
        key.epoch_);
  }
  // 正しさだけなら memory_order_relaxed で十分だが、待ち人数が
  // 早く 0 になるほど、無駄な起こし（つまりシステムコール）を
  // する可能性が低くなる
  uint64_t prev = val_.fetch_add(kSubWaiter, std::memory_order_seq_cst);
  DCHECK_NE((prev & kWaiterMask), 0);
}
```
上位 32 ビットが `Key` の値 `5` のままなら、futex で眠ります。
futex には 64 ビット全体ではなく、**上位 32 ビットの番地** を渡しています。`futexWake` と `futexWait` に渡すアドレスの `+ kEpochOffset` がそれで、リトルエンディアンでは 1（4 バイト先）になります。
世代が `6` に変わっていれば眠らずに抜け、最後に待ち人数を 1 減らします。

### 通知を取りこぼさない理由

待つ側が `prepareWait()` の後、`wait()` を呼ぶ前に通知が来たとします。
世代はすでに `6` になっているので、`wait(5)` は `while` の判定で眠らずに抜けます。
futex の「値が `5` のままなら眠る」という判定も OS の中で不可分に行われるので、判定と眠りの間に通知が割り込んでも取りこぼしません。

## ここがすごい

- **通知が安い**: 誰も待っていなければ、`notify()` は `fetch_add` 1 回で終わります。素直に「毎回 futexWake」と書くと、キューへの追加のたびにシステムコールを払うことになります。
- **1 つの整数に 2 つの情報**: 世代と待ち人数を同じ 64 ビットに置くので、「世代を進める」と「待ち人数を確認する」が 1 回の `fetch_add` で同時にできます。別々の変数だと、その間に割り込まれて取りこぼす可能性があります。
- **futex の 32 ビット制限をアドレス計算で解決**: futex は 32 ビットしか比べられないうえ、待ち人数まで比べると、他の人が待ち始めただけで「値が違う」と判定されて眠れません。そこで futex には世代の部分だけを見せています。エンディアンの違いも `kEpochOffset` 1 つで吸収しています。
- **わざと強いオーダーを使う理由をコメントで説明**: `cancelWait` のコメントによれば、`cancelWait` は `relaxed` でも正しく動きますが、待ち人数を早く 0 に戻すほど無駄な起こし（とシステムコール）が減るので `seq_cst` にしています。

## まとめ

- 「世代番号」を使うと、「通知の後に眠り始める」取りこぼしを防げる。
- 関連する 2 つの値を 1 つの atomic 整数に詰めると、1 回の操作で一緒に更新・確認できる。
- 起こす処理は待っている人がいるときだけ行うと、通知側が軽くなる。
- futex のような 32 ビットの仕組みでも、アドレスを工夫すれば 64 ビット値の一部を監視できる。

