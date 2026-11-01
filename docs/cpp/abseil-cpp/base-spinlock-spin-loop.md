---
title: CPU が 1 個ならスピンしない、適応的なスピンループ
description: スピンロックが取れないときに、少しだけ空回りしてロックの解放を待つ関数。回数は CPU の数で決め、初回に一度だけ CAS で設定する。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/base/internal/spinlock.cc
lines: [100, 123]
function: SpinLock::SpinLoop
difficulty: 2
tags: [並行処理, 最適化, ロック不要]
---

## ひとことで

`SpinLock::SpinLoop` は、ロックがほかのスレッドに握られているときに、**眠る前に少しだけ空回り（スピン）して** 解放を待つ関数です。
空回りする回数は、マルチコアなら 1000 回、CPU が 1 個なら 1 回です。CPU が 1 個しかないなら、自分が空回りしている間にロックを持つスレッドは動けないので、待っても無駄だからです。

## コード

::: code-group

```cpp:line-numbers=100 [日本語訳]
// 一定の時間（adaptive_spin_count_ 回のループ）の間に、ロックの値が変わるかを
// 見張る。最後にロックから読んだ値を
// このメソッドの戻り値にする。
ABSL_CONST_INIT std::atomic<int> SpinLock::adaptive_spin_count_{0};
uint32_t SpinLock::SpinLoop() {
  // すでに SpinLock の遅い道にいるので、ここで
  // adaptive_spin_count を初期化する。
  if (adaptive_spin_count_.load(std::memory_order_relaxed) == 0) {
    int current_spin_count = 0;
    int new_spin_count = NumCPUs() > 1 ? 1000 : 1;
    // これが失敗しても値は変わらないまま。意図した時間だけスピンしない
    // かもしれないが、それでも安全だ。次に SpinLoop を呼んだときに
    // もう一度試す。
    adaptive_spin_count_.compare_exchange_weak(
        current_spin_count, new_spin_count, std::memory_order_relaxed,
        std::memory_order_relaxed);
  }
  int c = adaptive_spin_count_.load(std::memory_order_relaxed);
  uint32_t lock_value;
  do {
    lock_value = lockword_.load(std::memory_order_relaxed);
  } while ((lock_value & kSpinLockHeld) != 0 && --c > 0);
  return lock_value;
}
```

```cpp:line-numbers=100 [原文]
// Monitor the lock to see if its value changes within some time period
// (adaptive_spin_count_ loop iterations). The last value read from the lock
// is returned from the method.
ABSL_CONST_INIT std::atomic<int> SpinLock::adaptive_spin_count_{0};
uint32_t SpinLock::SpinLoop() {
  // We are already in the slow path of SpinLock, initialize the
  // adaptive_spin_count here.
  if (adaptive_spin_count_.load(std::memory_order_relaxed) == 0) {
    int current_spin_count = 0;
    int new_spin_count = NumCPUs() > 1 ? 1000 : 1;
    // If this fails, the value will remain unchanged. We may not spin for the
    // intended duration, but that is still safe. We will try again on the next
    // call to SpinLoop.
    adaptive_spin_count_.compare_exchange_weak(
        current_spin_count, new_spin_count, std::memory_order_relaxed,
        std::memory_order_relaxed);
  }
  int c = adaptive_spin_count_.load(std::memory_order_relaxed);
  uint32_t lock_value;
  do {
    lock_value = lockword_.load(std::memory_order_relaxed);
  } while ((lock_value & kSpinLockHeld) != 0 && --c > 0);
  return lock_value;
}
```

:::

## 前提知識

- **スピンロック**: ロックが取れないとき、OS に眠らせてもらう代わりに、ループで何度も状態を確認して待つロックです。ロックがすぐ解放されるなら、眠って起きるよりずっと速く取れます。
- **`std::atomic<int>`**: 複数スレッドから安全に読み書きできる整数です。
- **`static` メンバ変数**: `SpinLock::adaptive_spin_count_` はクラスに 1 つだけあり、すべての `SpinLock` で共有されます。
- **`ABSL_CONST_INIT`**: この変数がプログラム開始前に（定数として）初期化されることを保証させるマクロです。初期化順の問題を防ぎます。
- **`compare_exchange_weak(expected, desired, ...)`**: 「今の値が `expected` なら `desired` にする」を不可分に行います。`weak` は、値が一致していてもまれに失敗してよい版です。
- **`memory_order_relaxed`**: 他のメモリ操作との順序を保証しない、いちばん軽い読み書きです。
- **`lockword_`**: このスピンロックの状態を表す 32 ビット整数です。`kSpinLockHeld` のビットが立っていれば、誰かがロックを持っています。

## 何をしているか

### 1. スピン回数を一度だけ決める

```cpp:line-numbers=107
  if (adaptive_spin_count_.load(std::memory_order_relaxed) == 0) {
    int current_spin_count = 0;
    int new_spin_count = NumCPUs() > 1 ? 1000 : 1;
    // これが失敗しても値は変わらないまま。意図した時間だけスピンしない
    // かもしれないが、それでも安全だ。次に SpinLoop を呼んだときに
    // もう一度試す。
    adaptive_spin_count_.compare_exchange_weak(
        current_spin_count, new_spin_count, std::memory_order_relaxed,
        std::memory_order_relaxed);
  }
```

`adaptive_spin_count_` が 0（まだ決まっていない）なら、`NumCPUs()` を見て回数を決めます。
CAS を使っているので、複数のスレッドが同時にここに来ても、書き込むのは最初の 1 つだけです。コメントにあるとおり、CAS が失敗しても次回またやり直すだけなので安全です。

この処理は「すでにロックの取得に一度失敗した」遅い道でしか実行されません。ロックがすぐ取れる普通の場合には、CPU 数を調べるコストがかかりません。

### 2. ロックが空くまで、または回数切れまで回る

```cpp:line-numbers=117
  int c = adaptive_spin_count_.load(std::memory_order_relaxed);
  uint32_t lock_value;
  do {
    lock_value = lockword_.load(std::memory_order_relaxed);
  } while ((lock_value & kSpinLockHeld) != 0 && --c > 0);
```

8 コアのマシンで、ロックを持つスレッドが 300 回ぶんの時間で手放す場合を考えます。

- `c = 1000` から始めます。
- `lockword_` を読み、`kSpinLockHeld` のビットが立っている間は `c` を減らしながら繰り返します。
- 300 回目くらいでビットが消えたら、ループを抜けます。

ロックがなかなか空かなければ、`c` が 0 になった時点で抜けます。CPU が 1 個のマシンでは `c = 1` なので、ほぼ即座に抜けます。

### 3. 最後に読んだ値を返す

```cpp:line-numbers=122
  return lock_value;
```

ループの最後に読んだ `lockword_` の値を返します。呼び出し元の `SlowLock` は、この値を使ってすぐにロックの取得を試みます。もう一度読み直す手間が省けます。

## ここがすごい

- **環境に合わせて戦略を変える**: シングルコアで 1000 回スピンするのは、ただ CPU 時間を捨てるだけです。マルチコアなら、別のコアでロックの持ち主が作業を終えるのを待つ価値があります。この判断を 1 つの数で表しています。
- **遅延初期化を CAS 1 回で**: スピン回数を決める処理を、ミューテックスなどを使わずに CAS で書いています。ロックを作る部品の中で別のロックを使うと、循環や再帰の問題が起きかねないので、アトミック操作だけで完結させています。
- **読むだけのスピン**: ループの中では `load` しかしていません。書き込みを伴う CAS を何度も繰り返すと、CPU 間でキャッシュラインの奪い合いが激しくなります。読むだけなら、値が変わるまで各コアのキャッシュで済みます。
- **すべて `relaxed`**: スピン中は「空いたかどうか」の目安を得られればよく、厳密な順序は実際にロックを取るときの操作に任せています。必要のない同期のコストを払いません。

## まとめ

- スピンは「相手が別のコアで動いている」ときだけ意味がある。CPU 数で回数を変えるとよい。
- めったに通らない遅い道に、初期化のような重い処理を寄せる。
- スピン中は書き込まずに読むだけにすると、キャッシュの奪い合いを減らせる。
- 低レベルの同期部品は、他のロックに頼らずアトミック操作だけで組み立てる。
