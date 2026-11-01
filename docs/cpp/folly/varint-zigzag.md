---
title: 負の数を「小さな正の数」に折りたたむ ZigZag 符号化
description: 符号付き整数を 0, -1, 1, -2, 2… の順に 0, 1, 2, 3, 4… へ対応させる encodeZigZag と decodeZigZag。算術シフトと XOR だけで、分岐なしに変換と逆変換を行う。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/Varint.h
lines: [87, 105]
function: folly::encodeZigZag / folly::decodeZigZag
difficulty: 2
format: 2
tags: [ビット演算, イディオム, 数値計算]
---

## ひとことで

`encodeZigZag` は、符号付き整数を **絶対値が小さいほど小さい符号なし整数** に変換します。

| 元の値 | 0 | -1 | 1 | -2 | 2 | -3 |
| --- | --- | --- | --- | --- | --- | --- |
| 変換後 | 0 | 1 | 2 | 3 | 4 | 5 |

正と負を交互に並べるので「ジグザグ」と呼ばれます。`decodeZigZag` はその逆変換です。Protocol Buffers などの可変長整数（varint）と組み合わせて使われます。

## コード

::: code-group

```cpp:line-numbers=87 [日本語訳]
/**
 * ZigZag 符号化は、絶対値の小さい符号付き整数を
 * 小さい（正の）値の符号なし整数に写す。これがないと、
 * 負の値を Varint で符号化すると 9 か 10 バイトも使ってしまう。
 *
 * x >= 0 なら encodeZigZag(x) == 2*x
 * x <  0 なら encodeZigZag(x) == -2*x - 1
 */

inline uint64_t encodeZigZag(int64_t val) {
  // Google の protocol buffer の文書から拝借したビット技。
  // val は符号付きなので val >> 63 は算術シフトになる
  auto uval = static_cast<uint64_t>(val);
  return static_cast<uint64_t>((uval << 1) ^ (val >> 63));
}

inline int64_t decodeZigZag(uint64_t val) {
  return static_cast<int64_t>((val >> 1) ^ -(val & 1));
}
```

```cpp:line-numbers=87 [原文]
/**
 * ZigZag encoding that maps signed integers with a small absolute value
 * to unsigned integers with a small (positive) values. Without this,
 * encoding negative values using Varint would use up 9 or 10 bytes.
 *
 * if x >= 0, encodeZigZag(x) == 2*x
 * if x <  0, encodeZigZag(x) == -2*x - 1
 */

inline uint64_t encodeZigZag(int64_t val) {
  // Bit-twiddling magic stolen from the Google protocol buffer document;
  // val >> 63 is an arithmetic shift because val is signed
  auto uval = static_cast<uint64_t>(val);
  return static_cast<uint64_t>((uval << 1) ^ (val >> 63));
}

inline int64_t decodeZigZag(uint64_t val) {
  return static_cast<int64_t>((val >> 1) ^ -(val & 1));
}
```

:::

## 前提知識

- **`int64_t` と `uint64_t`**: 64 ビットの符号付き整数と符号なし整数です。負の数は「2 の補数」という形で表され、`-1` はすべてのビットが `1` です。
- **`static_cast<uint64_t>(val)`**: 型の変換です。ビット列はそのままで、符号なしとして解釈し直します。`-1` なら `0xFFFFFFFFFFFFFFFF` になります。
- **算術右シフト**: 符号付き整数を右にずらすとき、左から **符号ビットのコピー** が入ります（C++20 で規格化。それ以前も主要コンパイラはこの動作）。そのため `val >> 63` は、`val` が 0 以上なら `0`、負なら `-1`（全ビット `1`）になります。
- **論理右シフト**: 符号なし整数の右シフトでは、左から常に `0` が入ります。
- **`^`**: XOR です。全ビット `1` と XOR すると全ビットが反転し、`0` と XOR すると変わりません。
- **`-(val & 1)`**: `val & 1` は最下位ビット（0 か 1）です。符号なしの `1` を符号反転すると、全ビット `1` になります。

## 何をしているか

### 1. エンコード

```cpp:line-numbers=96
inline uint64_t encodeZigZag(int64_t val) {
  // Bit-twiddling magic stolen from the Google protocol buffer document;
  // val >> 63 is an arithmetic shift because val is signed
  auto uval = static_cast<uint64_t>(val);
  return static_cast<uint64_t>((uval << 1) ^ (val >> 63));
}
```

式は `(uval << 1) ^ (val >> 63)` です。

- **`val = 2` の場合**: `uval << 1` は `4`。`val >> 63` は `0`。結果は `4`。
- **`val = -2` の場合**: `-2` のビット列は `…11111110`。`<< 1` すると `…11111100`。`val >> 63` は全ビット `1` なので、XOR すると全ビット反転して `…00000011` = `3`。

つまり、

- 0 以上なら `2 * x`
- 負なら `2 * x` を全ビット反転したもの、つまり `-2 * x - 1`

になります。これは コメントの式そのものです。

### 2. デコード

```cpp:line-numbers=103
inline int64_t decodeZigZag(uint64_t val) {
  return static_cast<int64_t>((val >> 1) ^ -(val & 1));
}
```

式は `(val >> 1) ^ -(val & 1)` です。

- **`val = 4` の場合**: 最下位ビットは `0` なので `-(0)` = `0`。`4 >> 1` = `2`。結果は `2`。
- **`val = 3` の場合**: 最下位ビットは `1` なので `-(1)` = 全ビット `1`。`3 >> 1` = `1` を全ビット反転すると `…11111110` = `-2`。

**最下位ビットが「元が負だったか」の印** になっているわけです。

## ここがすごい

### なぜ必要なのか

varint は、小さい数ほど少ないバイト数で表せる符号化です（1 バイトに 7 ビットずつ詰める）。ところが負の数をそのまま `uint64_t` に変えると、`-1` は `0xFFFF…FF` という巨大な数になり、**10 バイト** も使ってしまいます。

ZigZag を通すと `-1` は `1` になり、1 バイトで済みます。「絶対値の小さい数がよく出る」データでは、大きな節約になります。

### 分岐がない

素直に書くと、

```cpp
if (x >= 0) return 2 * x; else return -2 * x - 1;
```

のような分岐になります。この実装は、算術シフトで「符号を全ビットに広げたマスク」を作り、XOR で「負のときだけ反転」を実現しているので、`if` がありません。どんな入力でも同じ命令列で処理できます。

### オーバーフローしない

`-2 * x - 1` を符号付きのまま計算すると、`x` が `INT64_MIN` 付近のときにあふれて未定義動作になります。エンコードではシフトを `uval`（符号なし）に対して行っているので、ビットがはみ出しても単に捨てられるだけで、安全です。

コメントにあるとおり、この式自体は Protocol Buffers の文書に載っている定番の技です。

## まとめ

- 符号付き整数を varint にするなら、先に ZigZag で「小さい正の数」に写すと短くなる。
- `x >> 63`（算術シフト）は「負なら全ビット 1、そうでなければ 0」のマスクになる。
- XOR とマスクを組み合わせると、「条件によって反転する」を分岐なしで書ける。
- ビット操作は符号なし型で行うと、オーバーフローの未定義動作を避けられる。
