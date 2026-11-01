---
title: OR 1 回で「delay〜2×delay」の乱数を作るバックオフ
description: スピンロックの待ち時間を決める関数。試行回数に応じて待ち時間を倍々に延ばし、ビットマスクと OR で範囲内のばらつきを加えて、スレッドが同時に起きるのを防ぐ。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/base/internal/spinlock_wait.cc
lines: [61, 79]
function: base_internal::SpinLockSuggestedDelayNS
difficulty: 2
tags: [並行処理, ビット演算, 乱数]
---

## ひとことで

`SpinLockSuggestedDelayNS` は、ロック待ちの何回目（`loop`）かを受け取り、**次に何ナノ秒眠るべきか** を返します。
待つ回数が増えるほど待ち時間を倍々に延ばし（指数バックオフ）、さらに乱数で少しずつずらします。結果は約 128 マイクロ秒から 4 ミリ秒の範囲になります。

乱数を範囲に収める部分が、割り算も比較も使わない `delay | ((delay - 1) & r)` という 1 行になっているのが見どころです。

## コード

::: code-group

```cpp:line-numbers=61 [日本語訳]
static std::atomic<uint64_t> delay_rand;

// ループの "loop" 回目に勧める待ち時間をナノ秒で返す
int SpinLockSuggestedDelayNS(int loop) {
  // 多くのスレッドがスピンしているとき、スレッド間でばらつきを出すための
  // 弱い疑似乱数生成器。
  uint64_t r = delay_rand.load(std::memory_order_relaxed);
  r = 0x5deece66dLL * r + 0xb;   // nrand48() の定数
  delay_rand.store(r, std::memory_order_relaxed);

  if (loop < 0 || loop > 32) {   // loop を 0..32 に制限
    loop = 32;
  }
  const int kMinDelay = 128 << 10;  // 128us
  // 8 回ごとに待ち時間を 2 倍にする。最大 16 倍（2ms）まで。
  int delay = kMinDelay << (loop / 8);
  // delay..2*delay の範囲でランダムにし、結果を 128us..4ms の範囲にする。
  return delay | ((delay - 1) & static_cast<int>(r));
}
```

```cpp:line-numbers=61 [原文]
static std::atomic<uint64_t> delay_rand;

// Return a suggested delay in nanoseconds for iteration number "loop"
int SpinLockSuggestedDelayNS(int loop) {
  // Weak pseudo-random number generator to get some spread between threads
  // when many are spinning.
  uint64_t r = delay_rand.load(std::memory_order_relaxed);
  r = 0x5deece66dLL * r + 0xb;   // numbers from nrand48()
  delay_rand.store(r, std::memory_order_relaxed);

  if (loop < 0 || loop > 32) {   // limit loop to 0..32
    loop = 32;
  }
  const int kMinDelay = 128 << 10;  // 128us
  // Double delay every 8 iterations, up to 16x (2ms).
  int delay = kMinDelay << (loop / 8);
  // Randomize in delay..2*delay range, for resulting 128us..4ms range.
  return delay | ((delay - 1) & static_cast<int>(r));
}
```

:::

## 前提知識

- **指数バックオフ**: 失敗するたびに待ち時間を 2 倍、4 倍と延ばしていく戦略です。混雑しているときにみんなが何度も再挑戦して、さらに混雑するのを防ぎます。
- **`static std::atomic<uint64_t> delay_rand;`**: ファイル内だけで見えるグローバル変数です。`static` なグローバル変数はゼロで初期化されます。
- **線形合同法**: `r = a * r + c` を繰り返して疑似乱数を作る、昔からある簡単な方法です。ここで使う定数は、POSIX の `nrand48()` と同じものです（コメントのとおり）。
- **`128 << 10`**: 128 を左に 10 ビットずらす、つまり `128 × 1024 = 131072` です。ナノ秒なので約 131 マイクロ秒です。コメントでは「128us」と丸めて書いています。
- **`static_cast<int>(r)`**: 64 ビットの乱数を `int` に変換します。

## 何をしているか

### 1. 乱数を進める

```cpp:line-numbers=67
  uint64_t r = delay_rand.load(std::memory_order_relaxed);
  r = 0x5deece66dLL * r + 0xb;   // nrand48() の定数
  delay_rand.store(r, std::memory_order_relaxed);
```

共有の `delay_rand` を読み、線形合同法で次の値を計算して書き戻します。
`load` と `store` が別々なので、2 つのスレッドが同時にここを通ると同じ乱数を使うこともあります。しかし目的は「だいたいばらける」ことなので、それで問題ありません（コメントにも「弱い」疑似乱数と書かれています）。

### 2. 回数の上限を決める

```cpp:line-numbers=71
  if (loop < 0 || loop > 32) {   // loop を 0..32 に制限
    loop = 32;
  }
```

`loop` を 0〜32 の範囲に収めます。負の値や大きすぎる値は 32 として扱います。

### 3. 基本の待ち時間を決める

```cpp:line-numbers=74
  const int kMinDelay = 128 << 10;  // 128us
  // 8 回ごとに待ち時間を 2 倍にする。最大 16 倍（2ms）まで。
  int delay = kMinDelay << (loop / 8);
```

`delay = kMinDelay << (loop / 8)` なので、8 回ごとに 2 倍になります。

| loop | loop / 8 | delay |
| --- | --- | --- |
| 0〜7 | 0 | 約 128 µs |
| 8〜15 | 1 | 約 256 µs |
| 16〜23 | 2 | 約 512 µs |
| 24〜31 | 3 | 約 1 ms |
| 32 | 4 | 約 2 ms |

### 4. 乱数でずらす

```cpp:line-numbers=78
  return delay | ((delay - 1) & static_cast<int>(r));
```

`delay` は 2 のべき乗です。小さな数で考えると、`delay = 8`（`1000`）なら `delay - 1 = 7`（`0111`）です。

- `(delay - 1) & r` は、`r` の下位 3 ビットだけを取り出すので 0〜7 になります。
- それを `delay` と OR します。`delay` は上のビット 1 つだけ、乱数は下の 3 ビットだけなので、重なるビットがありません。OR は足し算と同じになり、結果は 8〜15 です。

つまり結果は必ず `delay` 以上 `2 × delay` 未満です。最大の `delay`（約 2 ms）でも 4 ms 未満に収まります。

## ここがすごい

- **割り算なしの範囲指定**: 普通に書くと `delay + r % delay` になります。`%`（割り算の余り）は CPU にとって比較的重い命令です。`delay` が 2 のべき乗であることを使い、AND と OR だけで同じ範囲を作っています。
- **「ずらす」ことの意味**: 多くのスレッドが同じロックで待っているとき、全員が同じ時間だけ眠ると、全員が同時に起きてまた奪い合いになります。乱数で起きる時刻をばらすと、この「一斉起床」を避けられます。
- **段階を粗くして急に延ばさない**: 毎回 2 倍にすると、すぐに待ち時間が長くなりすぎます。8 回ごとに 2 倍、最大 16 倍という緩やかな延ばし方にしています。
- **乱数の質より軽さ**: 暗号用の乱数生成器のような重い処理は使わず、共有変数への雑な読み書きで済ませています。ばらつけば十分という目的に合った手抜きです。

## まとめ

- 待ちの再試行は、指数的に延ばしつつ乱数でずらすと混雑を避けられる。
- `n` が 2 のべき乗なら、`n | (r & (n - 1))` で `n` 以上 `2n` 未満の値が作れる。
- 2 のべき乗と、それより小さい数の OR は足し算と同じ。
- 目的に必要なぶんだけの品質で作る。ばらつけばよい乱数に重い生成器はいらない。
