---
title: 「1 が連続しているか」を足し算 1 回と AND 1 回で判定する
description: ビット列が 0x00FF のような「下から連続した 1」か、0x0F00 のような「どこかに連続した 1」かを、ループなしで判定する isMask と isShiftedMask。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [253, 276]
function: llvm::isShiftedMask_32
difficulty: 2
tags: [ビット演算, コンパイラ, ハック]
format: 2
---

## ひとことで

`isMask_32` は値が `0x000000FF` のように「**最下位から 1 が連続して並び、上は全部 0**」かどうかを判定します。
`isShiftedMask_32` はそれを少しゆるめて、`0x00000F00` のように「**どこかに 1 のかたまりが 1 つだけある**」かどうかを判定します。

コンパイラは「この定数は連続したビットのマスクか」をよく調べます（ビットフィールドの取り出し命令に置き換えられるかなどの判断）。それをループなしで答えるのがこの関数たちです。

## コード

::: code-group

```cpp:line-numbers=253 [日本語訳]
/// 引数が、最下位ビットから始まる空でない 1 の並びで、残りが 0 なら
/// true を返す（32 ビット版）。
/// 例: isMask_32(0x0000FFFFU) == true。
constexpr bool isMask_32(uint32_t Value) {
  return Value && ((Value + 1) & Value) == 0;
}

/// 引数が、最下位ビットから始まる空でない 1 の並びで、残りが 0 なら
/// true を返す（64 ビット版）。
constexpr bool isMask_64(uint64_t Value) {
  return Value && ((Value + 1) & Value) == 0;
}

/// 引数が空でない 1 の並びを 1 つ含み、残りが 0 なら true を返す
/// （32 ビット版）。例: isShiftedMask_32(0x0000FF00U) == true。
constexpr bool isShiftedMask_32(uint32_t Value) {
  return Value && isMask_32((Value - 1) | Value);
}

/// 引数が空でない 1 の並びを 1 つ含み、残りが 0 なら true を返す
/// （64 ビット版）。
constexpr bool isShiftedMask_64(uint64_t Value) {
  return Value && isMask_64((Value - 1) | Value);
}
```

```cpp:line-numbers=253 [原文]
/// Return true if the argument is a non-empty sequence of ones starting at the
/// least significant bit with the remainder zero (32 bit version).
/// Ex. isMask_32(0x0000FFFFU) == true.
constexpr bool isMask_32(uint32_t Value) {
  return Value && ((Value + 1) & Value) == 0;
}

/// Return true if the argument is a non-empty sequence of ones starting at the
/// least significant bit with the remainder zero (64 bit version).
constexpr bool isMask_64(uint64_t Value) {
  return Value && ((Value + 1) & Value) == 0;
}

/// Return true if the argument contains a non-empty sequence of ones with the
/// remainder zero (32 bit version.) Ex. isShiftedMask_32(0x0000FF00U) == true.
constexpr bool isShiftedMask_32(uint32_t Value) {
  return Value && isMask_32((Value - 1) | Value);
}

/// Return true if the argument contains a non-empty sequence of ones with the
/// remainder zero (64 bit version.)
constexpr bool isShiftedMask_64(uint64_t Value) {
  return Value && isMask_64((Value - 1) | Value);
}
```

:::

## 前提知識

- **`constexpr bool`**: コンパイル時にも計算できる、真偽値を返す関数です。
- **`uint32_t` / `uint64_t`**: 符号なしの 32 ビット / 64 ビット整数です。`#include <cstdint>` で使えます。
- **`&&`**: 論理 AND です。左側が偽なら右側は評価されません（短絡評価）。
- **`&` と `|`**: ビットごとの AND と OR です。`&` は両方 1 の桁だけ 1、`|` はどちらかが 1 なら 1 になります。
- **符号なし整数の繰り上がり**: `Value + 1` のとき、下位の 1 の並びは繰り上がりで全部 0 になり、そのすぐ上の桁が 1 になります。この性質がこの関数の鍵です。

## 何をしているか

### 1. isMask: 「+1 すると下の 1 が全部消える」

```cpp:line-numbers=256
constexpr bool isMask_32(uint32_t Value) {
  return Value && ((Value + 1) & Value) == 0;
}
```

`Value = 0b00001111` で考えます。

```
Value       = 00001111
Value + 1   = 00010000   ← 下の 1 が全部繰り上がって消えた
AND         = 00000000   → 0 なのでマスク
```

`Value = 0b00001011` だと:

```
Value       = 00001011
Value + 1   = 00001100
AND         = 00001000   → 0 でないのでマスクではない
```

下から連続した 1 だけなら、`+1` で全部が繰り上がって消え、重なる桁が無くなります。途中に 0 があると繰り上がりがそこで止まり、上の 1 が残るので AND が 0 になりません。

先頭の `Value &&` は 0 を除外するためです。0 は「1 が 1 つも無い」ので、マスクとは呼びません。

`isMask_64` は同じことを 64 ビットで行う版です。

### 2. isShiftedMask: 「下の 0 を 1 で埋めてから isMask」

```cpp:line-numbers=268
constexpr bool isShiftedMask_32(uint32_t Value) {
  return Value && isMask_32((Value - 1) | Value);
}
```

`Value = 0b00111000` で考えます。

```
Value         = 00111000
Value - 1     = 00110111   ← 最下位の 1 より下が全部 1 になる
OR            = 00111111   ← 下の 0 が埋まった
isMask(...)   → true
```

`Value - 1` は「いちばん下の 1 を 0 にして、それより下を全部 1 にする」操作です。元の値と OR を取ると、**かたまりの下にある 0 だけが 1 で埋まります**。かたまりが 1 つなら、結果は「下から連続した 1」になり、`isMask` が真を返します。

`0b01011000` のように 2 つに分かれていると、OR 後は `01011111` になり、途中に 0 が残るので偽になります。

## ここがすごい

素直に書くと「最下位の 1 を探す → そこから 1 が続く間進む → 残りが全部 0 か調べる」というループになります。ビット数に比例した時間がかかり、分岐も多くなります。

この実装は、

- **繰り上がり（`+1`）と借り（`-1`）という算術演算を、ビット列の加工に使う**
- 1 回の判定は数個の演算だけで、ループも分岐の積み重ねも無い

という点で、典型的なビットハックです。`isShiftedMask` が `isMask` を再利用して 1 行で書けているのも、「問題を既に解ける問題に変形する」発想のお手本です。

`constexpr` なので、定数に対してはコンパイル時に答えが出ます。

## まとめ

- `x + 1` は「下から続く 1 を全部 0 にして、その上を 1 にする」。
- `x - 1` は「最下位の 1 を 0 にして、その下を全部 1 にする」。
- `(x - 1) | x` で最下位の 1 より下の 0 を埋められる。
- 新しい問題を既存の関数で解ける形に変形すると、実装が短く確実になる。
