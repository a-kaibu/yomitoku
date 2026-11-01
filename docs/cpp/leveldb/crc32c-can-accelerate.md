---
title: 既知の答えと比べて CPU の CRC 命令が使えるかを確かめる
description: LevelDB の CRC32C で、ハードウェアの高速命令が使えるかを判定する関数。実際に短い文字列の CRC を計算させ、あらかじめわかっている正解と比べるだけで判定する。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/crc32c.cc
lines: [265, 280]
function: CanAccelerateCRC32C
difficulty: 2
format: 2
tags: [移植性, 最適化, 防御的プログラミング]
---

## ひとことで

CRC32C は、データが壊れていないか確かめる検査値の一種です。最近の x86 や ARM の CPU には、これを計算する専用の命令があり、ソフトウェアで計算するよりずっと速く求められます。
`CanAccelerateCRC32C` は、その専用命令が今の環境で使えるかを判定する関数です。判定方法は単純で、**実際に計算させて、正解と一致するか** を見るだけです。

## コード

::: code-group

```cpp:line-numbers=265 [日本語訳]
// このプログラムを動かしている CPU が CRC32C の計算を
// 高速化できるかを判定する。
static bool CanAccelerateCRC32C() {
  // port::AcceleretedCRC32C は高速化できないときに 0 を返す。
  static const char kTestCRCBuffer[] = "TestCRCBuffer";
  static const char kBufSize = sizeof(kTestCRCBuffer) - 1;
  static const uint32_t kTestCRCValue = 0xdcbc59fa;

  return port::AcceleratedCRC32C(0, kTestCRCBuffer, kBufSize) == kTestCRCValue;
}

uint32_t Extend(uint32_t crc, const char* data, size_t n) {
  static bool accelerate = CanAccelerateCRC32C();
  if (accelerate) {
    return port::AcceleratedCRC32C(crc, data, n);
  }
```

```cpp:line-numbers=265 [原文]
// Determine if the CPU running this program can accelerate the CRC32C
// calculation.
static bool CanAccelerateCRC32C() {
  // port::AcceleretedCRC32C returns zero when unable to accelerate.
  static const char kTestCRCBuffer[] = "TestCRCBuffer";
  static const char kBufSize = sizeof(kTestCRCBuffer) - 1;
  static const uint32_t kTestCRCValue = 0xdcbc59fa;

  return port::AcceleratedCRC32C(0, kTestCRCBuffer, kBufSize) == kTestCRCValue;
}

uint32_t Extend(uint32_t crc, const char* data, size_t n) {
  static bool accelerate = CanAccelerateCRC32C();
  if (accelerate) {
    return port::AcceleratedCRC32C(crc, data, n);
  }
```

:::

## 前提知識

- **`static`（関数に付けたとき）**: 関数をこのファイルの中だけで使えるようにします。
- **`static`（関数の中の変数に付けたとき）**: 最初に通ったときに 1 回だけ初期化され、その後は値が保たれる変数になります。C++11 以降、この初期化は複数スレッドから同時に呼ばれても 1 回だけ安全に行われます。
- **`static const char kTestCRCBuffer[] = "TestCRCBuffer";`**: 文字列の配列です。最後に終端の `'\0'` が付くので、`sizeof` は文字数 + 1 になります。
- **`port::AcceleratedCRC32C`**: LevelDB の移植層（`port`）にある関数です。CPU の専用命令で CRC を計算します。使えない環境では 0 を返すように作られています（関数内のコメントにそう書かれています）。
- **引用の後半**: 引用の最後の部分は、この関数の結果を使う `Extend` の冒頭です。

## 何をしているか

### 1. テスト用のデータと正解

```cpp:line-numbers=269
  static const char kTestCRCBuffer[] = "TestCRCBuffer";
  static const char kBufSize = sizeof(kTestCRCBuffer) - 1;
  static const uint32_t kTestCRCValue = 0xdcbc59fa;
```
`"TestCRCBuffer"` という 13 文字の文字列と、その CRC32C の正しい値 `0xdcbc59fa` を用意します。`kBufSize` は `sizeof` から終端の 1 を引いた 13 です。

### 2. 計算させて比べる

```cpp:line-numbers=273
  return port::AcceleratedCRC32C(0, kTestCRCBuffer, kBufSize) == kTestCRCValue;
```
専用命令の版で同じ文字列の CRC を計算させます。

- 専用命令が使えれば、`0xdcbc59fa` が返り、`true` になります。
- 使えない環境では 0 が返り、`false` になります。

### 3. 結果を 1 回だけ覚える

```cpp:line-numbers=277
  static bool accelerate = CanAccelerateCRC32C();
  if (accelerate) {
    return port::AcceleratedCRC32C(crc, data, n);
  }
```
CRC を計算する `Extend` 関数の最初で、`static bool accelerate = CanAccelerateCRC32C();` としています。判定は初めて `Extend` が呼ばれたときの 1 回だけです。
2 回目以降は覚えておいた `accelerate` を見て、`true` なら専用命令の版に任せ、`false` ならこの後に続くソフトウェア版（表を引く方式）で計算します。

## ここがすごい

- **「使えるか」を答えで判定する**: CPU の機能を調べるには、ふつう `cpuid` のような命令で機能フラグを読みます。でもそれは CPU の種類ごとにやり方が違います。ここでは「計算させて、結果が正しければ使える」と判定するので、移植層の関数が「使えなければ 0 を返す」という約束さえ守れば、判定のコードは 1 つで済みます。
- **正しさまで確かめられる**: 結果を既知の答えと比べるので、万一、専用命令の実装やコンパイル設定がおかしくて間違った値を返す場合も、ソフトウェア版に切り替わります。速さのために正しさを犠牲にしません。
- **判定は 1 回だけ**: 関数内 `static` の初期化は 1 度しか行われず、しかもスレッド安全です。毎回の CRC 計算に判定のコストがかかりません。自前でフラグやロックを用意する必要もありません。
- **0 は正解になりえない**: 正解の値が 0 ではないので、「使えない」を表す 0 と区別できます。

## まとめ

- 機能が使えるかは、「実際に使ってみて、既知の答えと比べる」ことで判定できる。
- その方法なら、環境ごとの判定コードを書かずに済み、間違った実装も検出できる。
- 一度だけでよい初期化は、関数内の `static` 変数に任せるとスレッド安全で簡単。
- 高速な経路が使えないときのために、遅くても確実な経路を必ず残しておく。
