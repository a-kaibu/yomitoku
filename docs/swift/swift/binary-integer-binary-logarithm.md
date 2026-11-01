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
---
## ひとことで

`_binaryLogarithm()` は、正の整数 `x` について **2 進数で書いたときの最上位の 1 の位置**（0 から数える）を返します。これは log₂(x) の小数点以下を切り捨てた値と同じです。
たとえば `x = 20`（2 進数 `10100`）なら、最上位の 1 は 4 ビット目なので 4 を返します（2⁴ = 16 ≤ 20 < 32 = 2⁵）。
`Int` のような固定長の整数だけでなく、何千ビットもある可変長の整数型でも動くように書かれています。

## コード

```swift:line-numbers=1290
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

## 前提知識

- **`BinaryInteger`**: 2 進数で表現されるすべての整数型が準拠するプロトコルです。`Int` や `UInt8` のほか、ユーザーが作った巨大整数型も準拠できます。
- **`bitWidth`**: その値を表すのに使っているビット数です。固定長なら型ごとに一定（`Int` は 64）、可変長なら値ごとに変わります。
- **`quotientAndRemainder(dividingBy:)`**: 商と余りをタプルで返します。
- **`var (a, b) = ...`**: タプルを 2 つの変数に分けて受け取ります。
- **`UInt(truncatingIfNeeded:)`**: 上位のビットを切り捨てて `UInt`（64 ビット）に変換します。
- **ワード**: 整数を 64 ビットずつに区切った 1 単位です。128 ビットの整数は 2 ワードでできています。
- **`leadingZeroBitCount`**: 上位に続く 0 の数です。

## 何をしているか

### 1. 最上位ワードの位置を求める（1293〜1296 行目）

`bitWidth = 128` の整数を例にします。`(128 - 1) / 64` は商 1・余り 63 です。`remainder` を 1 増やして 64 にします。

`self >> (128 - 64)` で右に 64 ビットずらすと、最上位のワードだけが下に来ます。それを `UInt` に切り詰めたものが `word` です。

### 2. 最上位ワードが 0 なら 1 つ下へ（1302〜1306 行目）

可変長の整数では、最上位のワードが 0 のことがあります（コメントでは、符号ビット用に 0 のワードを持つ場合などが挙げられています）。そのときは `quotient` を 1 減らし、次のワードを取り出し直します。

### 3. ワード内での位置を足す（1309〜1310 行目）

`word` の中での最上位の 1 の位置は `64 - (leadingZeroBitCount + 1)` です。それに「下に何ワードあるか × 64」を足せば、全体での位置になります。

例: 値が 2⁷⁰ + 5 なら、上位ワードは `0b1000000`（2⁶）。上位の 0 は 57 個なので、ワード内の位置は 64 − 58 = 6。下に 1 ワードあるので 64 + 6 = 70 です。

## ここがすごい

- **1 ビットずつ探さない**: 素直に書くと「上から 1 ビットずつ調べる」ループになり、巨大整数では何千回も回ります。この関数はワード単位で処理し、ワードの中では `leadingZeroBitCount`（多くの CPU で 1 命令）を使うので、ほぼ一瞬です。
- **ジェネリックなのに速い**: プロトコルの機能（`bitWidth`、`>>`、`truncatingIfNeeded`）だけで書かれているので、どんな整数型でも動きます。`Int` のような固定長の型では、コンパイラが 1302 行目のループなどを最適化で消せます。
- **オーバーフローへの注意**: 1307〜1308 行目のコメントは「計算の順番が重要」と書いています。掛け算と足し算の順序を工夫して、途中の値が `Int` に収まるようにしています。
- **浮動小数点に頼らない**: `log2(Double(x))` で計算すると、大きな整数では丸め誤差で 1 ずれることがあります。整数のビット操作だけで計算するので、常に正確です。

## まとめ

- floor(log₂(x)) は「最上位の 1 の位置」なので、ビット操作で正確に求められる。
- 巨大な整数はワード単位で扱い、ワードの中は CPU 命令（leadingZeroBitCount）に任せる。
- 可変長の整数では「最上位のワードが 0」のような特殊な状態にも備える必要がある。
