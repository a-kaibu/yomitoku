---
title: "任意の大きさの整数で「2 を底とする対数」を求める"
description: "整数の最上位ビットの位置（floor(log2(x))）を、整数の内部表現を 64 ビット単位の「ワード」として覗きながら求める関数。可変長の巨大整数にも対応する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2024 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Integers.swift
lines: [1290, 1311]
function: "BinaryInteger._binaryLogarithm()"
difficulty: 3
tags: [ビット演算, 数値計算, ジェネリクス, 標準ライブラリ]
format: 2
---
## ひとことで

`_binaryLogarithm()` は、正の整数 `x` について、2 進数で書いたときの最上位の 1 の位置（0 から数える）を返します。これは log₂(x) の小数点以下を切り捨てた値と同じです。たとえば `x = 20`（2 進数の `10100`）なら、最上位の 1 は 4 ビット目なので 4 を返します（2⁴ = 16 ≤ 20 < 32 = 2⁵）。`Int` のような固定長の整数だけでなく、何千ビットもある可変長の整数型でも動くように書かれています。

## コード

::: code-group

```swift:line-numbers=1290 [日本語訳]
  @inlinable
  public func _binaryLogarithm() -> Int {
    _precondition(self > (0 as Self))
    var (quotient, remainder) =
      (bitWidth &- 1).quotientAndRemainder(dividingBy: UInt.bitWidth)
    remainder = remainder &+ 1
    var word = UInt(truncatingIfNeeded: self >> (bitWidth &- remainder))
    // 内部的に変数幅の整数が Magnitude.Words.Element（UInt）より大きい桁を使う場合、
    // 言い換えると、ビット幅が UInt より大きい場合は、
    // `word` が 0 になることがあります。さらに、符号付きの変数幅の整数は、
    // 符号ビットを明確にするために、先頭に 0 のワードを持つことがあります。
    // そのため、ここでは 0 を確かめて続けます。
    while word == 0 {
      quotient = quotient &- 1
      remainder = remainder &+ UInt.bitWidth
      word = UInt(truncatingIfNeeded: self >> (bitWidth &- remainder))
    }
    // 次の演算の順番が重要です。これは、
    // オーバーフローしないことを保証するためです。
    return UInt.bitWidth &* quotient &+
        (UInt.bitWidth &- (word.leadingZeroBitCount &+ 1))
  }
```

```swift:line-numbers=1290 [原文]
  @inlinable
  public func _binaryLogarithm() -> Int {
    _precondition(self > (0 as Self))
    var (quotient, remainder) =
      (bitWidth &- 1).quotientAndRemainder(dividingBy: UInt.bitWidth)
    remainder = remainder &+ 1
    var word = UInt(truncatingIfNeeded: self >> (bitWidth &- remainder))
    // If, internally, a variable-width binary integer uses digits of greater
    // bit width than that of Magnitude.Words.Element (i.e., UInt), then it is
    // possible that `word` could be zero. Additionally, a signed variable-width
    // binary integer may have a leading word that is zero to store a clear sign
    // bit.
    while word == 0 {
      quotient = quotient &- 1
      remainder = remainder &+ UInt.bitWidth
      word = UInt(truncatingIfNeeded: self >> (bitWidth &- remainder))
    }
    // Note that the order of operations below is important to guarantee that
    // we won't overflow.
    return UInt.bitWidth &* quotient &+
        (UInt.bitWidth &- (word.leadingZeroBitCount &+ 1))
  }
```

:::

## 前提知識

- **`BinaryInteger`**: 2 進数で表現されるすべての整数型が準拠するプロトコルです。`Int` や `UInt8` のほか、ユーザーが作った巨大整数型も準拠できます。
- **`bitWidth`**: その値を表すのに使っているビット数です。固定長なら型ごとに一定（`Int` は 64）、可変長なら値ごとに変わります。
- **`quotientAndRemainder(dividingBy:)`**: 商と余りをタプルで返します。
- **ワード**: 整数を 64 ビットずつに区切った 1 単位です。128 ビットの整数は 2 ワードでできています。
- **`leadingZeroBitCount`**: 上位に続く 0 の数です。

## 何をしているか

### 1. 最上位ワードを取り出す

`bitWidth` が 128 の整数を例にします。`(128 - 1) / 64` は商 1・余り 63 です。余りを 1 増やして 64 にし、`self >> (128 - 64)` で最上位の 64 ビットだけを下へずらします。それを `UInt` に切り詰めたものが `word` です。

```swift:line-numbers=1292
    _precondition(self > (0 as Self))
    var (quotient, remainder) =
      (bitWidth &- 1).quotientAndRemainder(dividingBy: UInt.bitWidth)
    remainder = remainder &+ 1
    var word = UInt(truncatingIfNeeded: self >> (bitWidth &- remainder))
```
### 2. 最上位ワードが 0 なら、1 つ下のワードへ

可変長の整数では、最上位のワードが 0 のことがあります。たとえば符号ビットを明確にするために、先頭に 0 のワードを持つ場合です。そのときは商を 1 減らし、次のワードを取り出し直します。

```swift:line-numbers=1302
    while word == 0 {
      quotient = quotient &- 1
      remainder = remainder &+ UInt.bitWidth
      word = UInt(truncatingIfNeeded: self >> (bitWidth &- remainder))
    }
```
### 3. ワード内の位置に、下のワードの分を足す

`word` の中での最上位の 1 の位置は `64 - (leadingZeroBitCount + 1)` です。それに、下にあるワード数に 64 を掛けた値を足すと、全体での位置になります。例として、値が 2⁷⁰ + 5 なら、上位ワードは 2⁶ を表す `0b1000000` です。上位の 0 は 57 個なので、ワード内の位置は 6 になります。下に 1 ワードあるので、64 + 6 = 70 が答えです。

```swift:line-numbers=1307
    // 次の演算の順番が重要です。これは、
    // オーバーフローしないことを保証するためです。
    return UInt.bitWidth &* quotient &+
        (UInt.bitWidth &- (word.leadingZeroBitCount &+ 1))
```
## ここがすごい

- **1 ビットずつ探さない**: 素直に書くと、上から 1 ビットずつ調べるループになり、巨大整数では何千回も回ります。この関数はワード単位で処理し、ワードの中では `leadingZeroBitCount` を使うので、多くの CPU では 1 命令で済みます。
- **ジェネリックなのに速い**: プロトコルの機能（`bitWidth`、`>>`、`truncatingIfNeeded`）だけで書かれているので、どんな整数型でも動きます。固定長の型では、コンパイラがこの部分のループなどを最適化で消せます。
- **演算の順番に注意**: コメントにあるとおり、掛け算と足し算の順番が結果の正しさを保っています。途中の値が `Int` に収まるように組まれています。
- **浮動小数点に頼らない**: `log2(Double(x))` で計算すると、大きな整数では丸め誤差で 1 ずれることがあります。整数のビット操作だけで計算するので、常に正確です。

## まとめ

- floor(log₂(x)) は最上位の 1 の位置なので、ビット操作で正確に求められる。
- 巨大な整数はワード単位で扱い、ワードの中は CPU 命令（leadingZeroBitCount）に任せる。
- 可変長の整数では、最上位のワードが 0 になる場合にも備える必要がある。
