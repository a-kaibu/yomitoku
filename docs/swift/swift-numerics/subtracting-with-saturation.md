---
title: "符号なしの引き算は 0 で止まり、符号付きは最小値か最大値へ飽和する"
description: "整数の引き算を、型の範囲に飽和させる関数。符号なし整数では負になったら 0 で止め、符号付き整数では溢れた向きに応じて最大値を返す。"
language: swift
project: "Swift Numerics"
repo: https://github.com/apple/swift-numerics
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2023 Apple Inc. and the Swift Numerics project authors"
commit: "669f6185187f8e1b5857a25c4bbe6c34a3a02b96"
file: Sources/IntegerUtilities/SaturatingArithmetic.swift
lines: [59, 64]
function: "FixedWidthInteger.subtractingWithSaturation(_:)"
difficulty: 2
tags: [数値計算, 防御的プログラミング, ジェネリクス]
format: 2
---
## ひとことで

`UInt` の `37 - 42` は負になりますが、符号なしの型では表せません。`subtractingWithSaturation(_:)` は、このような場合に **0 で止めて** 返します。符号付きの型なら、溢れた向きに応じて最大値を返します。

## コード

```swift:line-numbers=59
  @inlinable
  public func subtractingWithSaturation(_ other: Self) -> Self {
    let (wrapped, overflow) = subtractingReportingOverflow(other)
    if !overflow { return wrapped }
    return Self.isSigned ? Self.max &- signbit : 0
  }
```

## 前提知識

- **`subtractingReportingOverflow`**: 引き算の結果と、溢れたかどうかを組で返すメソッドです。
- **`Self.isSigned`**: その型が符号付きかどうかを表す定数です。
- **`Self.max &- signbit`**: 正の方向へ溢れたときの最大値です（前の記事の `signbit` を参照）。
- **`Self.zero`**: 0 です。

## 何をしているか

### 1. 溢れていなければそのまま

`subtractingReportingOverflow` が溢れなかったら、計算結果をそのまま返します。

```swift:line-numbers=61
    let (wrapped, overflow) = subtractingReportingOverflow(other)
    if !overflow { return wrapped }
```
### 2. 溢れたら型によって変える

溢れた場合は、型によって答えが変わります。

```swift:line-numbers=63
    return Self.isSigned ? Self.max &- signbit : 0
```
- 符号付きの型なら、溢れた向きに応じて最大値を返します。
- 符号なしの型なら、負の結果は表せないので、0 を返します。

## ここがすごい

- **符号なしでは下限が 0 になる**: 符号なしの型は 0 より小さい値を持てません。だから「負になった」は、ちょうど 0 に飽和させるのが自然です。この 1 行で、符号なし特有の性質を扱えます。
- **同じ関数が型を選ぶ**: `Self.isSigned` は、コンパイル時に決まる定数です。`UInt` でも `Int` でも同じコードが正しく動きます。
- **注意: 加算の逆では必ずしもない**: コメントにある通り、`a.addingWithSaturation(-b)` と `a.subtractingWithSaturation(b)` は、`b` が符号付きの最小値のとき結果が変わります。`-b` が表せないからです。

## まとめ

- 符号なしの引き算は、負になったら 0 で飽和させるのが自然。
- 型が符号付きかどうかは、コンパイル時の定数で分岐できる。
- 「引き算 = 負の足し算」は、最小値で成り立たないことがある。
