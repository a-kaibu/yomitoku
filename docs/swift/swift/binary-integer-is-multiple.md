---
title: "「割り切れるか」の判定に潜む 2 つの落とし穴"
description: "x が y の倍数かを判定する isMultiple(of:)。0 で割る問題と、Int.min を -1 で割るとあふれる問題を、絶対値で計算することで両方避けている。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2024 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Integers.swift
lines: [1313, 1327]
function: "BinaryInteger.isMultiple(of:)"
difficulty: 1
tags: [防御的プログラミング, 数値計算, 標準ライブラリ]
format: 2
---
## ひとことで

`12.isMultiple(of: 3)` は true、`12.isMultiple(of: 5)` は false です。「割り切れるか」を判定するメソッドです。`x % y == 0` と書けば済みそうですが、それだと 0 で割ったときと、最小の負の数を -1 で割ったときにプログラムが止まってしまいます。この実装は、その 2 つを避けています。

## コード

::: code-group

```swift:line-numbers=1313 [日本語訳]
  @inlinable
  public func quotientAndRemainder(dividingBy rhs: Self)
    -> (quotient: Self, remainder: Self) {
    return (self / rhs, self % rhs)
  }
  
  @inlinable
  public func isMultiple(of other: Self) -> Bool {
    // 0 の倍数は 0 だけです。
    if other == 0 { return self == 0 }
    // 絶対値で判定します。これなら、ほかの端のケースはありません。
    // `self % other` と書くと、
    // 0 を中心に対称でない型では、トラップすることがあるからです。
    return self.magnitude % other.magnitude == 0
  }
```

```swift:line-numbers=1313 [原文]
  @inlinable
  public func quotientAndRemainder(dividingBy rhs: Self)
    -> (quotient: Self, remainder: Self) {
    return (self / rhs, self % rhs)
  }
  
  @inlinable
  public func isMultiple(of other: Self) -> Bool {
    // Nothing but zero is a multiple of zero.
    if other == 0 { return self == 0 }
    // Do the test in terms of magnitude, which guarantees there are no other
    // edge cases. If we write this as `self % other` instead, it could trap
    // for types that are not symmetric around zero.
    return self.magnitude % other.magnitude == 0
  }
```

:::

## 前提知識

- **`extension BinaryInteger`**: すべての整数型に共通の実装として書かれています。
- **`Self`**: このメソッドを持っている型そのもの（`Int` なら `Int`）を表します。
- **`%`**: 割り算の余りです。Swift では、0 で割るとプログラムが停止します。
- **`magnitude`**: 絶対値です。型は `Magnitude` という符号なしの型になります。`Int` の `magnitude` は `UInt` です。
- **2 の補数と非対称性**: `Int8` は -128 から 127 の値を表せます。負の側が 1 つ多いので、-128 の絶対値 128 は `Int8` に入りません。`Int` でも同じで、`Int.min` の絶対値は `Int` に収まりません。

## 何をしているか

### 1. 0 の倍数を先に扱う

0 の倍数は 0 だけです（0 に何を掛けても 0 になるからです）。なので、`other` が 0 なら、`self` が 0 かどうかを返します。`self % 0` を計算させないことで、停止を避けます。

```swift:line-numbers=1321
    // 0 の倍数は 0 だけです。
    if other == 0 { return self == 0 }
```
### 2. 絶対値で余りを計算する

`self.magnitude % other.magnitude == 0` で判定します。倍数かどうかは符号に関係ないので、絶対値で計算しても答えは同じです。たとえば `Int8.min.isMultiple(of: -1)` を素直に `-128 % -1` で計算すると、内部で `-128 / -1 = 128` を計算しようとして、`Int8` からあふれて停止します。絶対値なら `UInt8` の `128 % 1 = 0` になり、正しく true になります。

```swift:line-numbers=1323
    // 絶対値で判定します。これなら、ほかの端のケースはありません。
    // `self % other` と書くと、
    // 0 を中心に対称でない型では、トラップすることがあるからです。
    return self.magnitude % other.magnitude == 0
```
## ここがすごい

- **端のケースを 1 行で防ぐ**: 0 のまわりで対称でない型で `%` が停止する問題を、絶対値（符号なし）に変換するだけで回避しています。符号なしの型は 0 以上しか表さないので、あふれる組み合わせがありません。
- **API として用意する意味**: `x % y == 0` は誰でも書けますが、端のケースまで正しく書ける人は多くありません。標準ライブラリが正しい実装を提供すれば、ユーザーは落とし穴を気にせずに済みます。Swift 5 で追加されたメソッドです。
- **コメントが理由を説明している**: 「なぜ `self % other` と書かないのか」が、コメントに直接書かれています。コードを読む人が、同じ罠に気づけるようになっています。

## まとめ

- `x % y == 0` には、「y が 0」「x が最小値で y が -1」という 2 つの落とし穴がある。
- 符号付き整数は負の側が 1 つ多いので、最小値の絶対値は同じ型に入らない。
- 符号に関係ない判定は、絶対値（符号なし）で計算すると安全になる。
