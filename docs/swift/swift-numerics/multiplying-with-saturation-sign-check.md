---
title: "掛け算の結果が溢れたら、最大値か最小値に丸める"
description: "整数の掛け算が型の範囲を超えたとき、エラーにせず、符号に合わせて最大値か最小値を返す関数。上位の半分と下位の半分の符号を比べて、溢れたかどうかを判定する。"
language: swift
project: "Swift Numerics"
repo: https://github.com/apple/swift-numerics
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2023 Apple Inc. and the Swift Numerics project authors"
commit: "669f6185187f8e1b5857a25c4bbe6c34a3a02b96"
file: Sources/IntegerUtilities/SaturatingArithmetic.swift
lines: [91, 96]
function: "FixedWidthInteger.multipliedWithSaturation(by:)"
difficulty: 3
tags: [数値計算, ビット演算, 防御的プログラミング]
format: 2
---
## ひとことで

整数の掛け算は、結果が型の範囲を超えると値が折り返されてしまいます。`multipliedWithSaturation(by:)` は、そうならずに **範囲の端に丸めて** 返します。たとえば `Int8` で `-16 × -8 = 128` は、`Int8` の最大値 `127` になります。
エラーで止めずに、近い値を返したいときに使えます。

## コード

```swift:line-numbers=91
  public func multipliedWithSaturation(by other: Self) -> Self {
    let (high, low) = multipliedFullWidth(by: other)
    let wrapped = Self(truncatingIfNeeded: low)
    if high == wrapped.signbit { return wrapped }
    return Self.max &- high.signbit
  }
```

## 前提知識

- **オーバーフロー**: 型で表せる範囲を超えた値は、通常の掛け算では折り返されて、まったく違う値になります。
- **`multipliedFullWidth(by:)`**: 結果を、上位の半分と下位の半分の 2 つに分けて返す演算です。溢れた分も失われません。
- **`signbit`**: この式は、符号が負なら `~0`（すべてのビットが 1）、そうでなければ `0` を返す内部の性質です。

## 何をしているか

### 1. 全部のビットを上位と下位に分ける

`multipliedFullWidth` で、積を 2 つに分けます。`high` が上位、`low` が下位です。ここでは `wrapped` に、下位だけを元の型へ切り詰めた値を入れています。

```swift:line-numbers=91
  public func multipliedWithSaturation(by other: Self) -> Self {
    let (high, low) = multipliedFullWidth(by: other)
    let wrapped = Self(truncatingIfNeeded: low)
```
### 2. 上位の符号が、下位の符号と揃っているか調べる

積が型の中に収まっていれば、上位は下位の符号が延びたものになっています。つまり `high` と `wrapped.signbit` が一致します。一致したら、折り返しは起きていないので、`wrapped` をそのまま返します。

```swift:line-numbers=94
    if high == wrapped.signbit { return wrapped }
```
### 3. 溢れたら、符号で最大値か最小値を選ぶ

一致しなければ溢れています。`high` の符号が正なら、積は正の方向へ溢れたので、最大値を返します。負なら、負の方向へ溢れたので、最小値を返します。

`Self.max &- high.signbit` は、`high` が正なら `max - 0 = max` です。`high` が負なら `max - (-1)` で、`max + 1` が溢れて `min` になります。だから 1 つの式で両方の場合を返せます。

```swift:line-numbers=95
    return Self.max &- high.signbit
```
`signbit` は、次の定義です。

```swift:line-numbers=19
  var signbit: Self {
    return self < .zero ? ~.zero : .zero
  }
```
## ここがすごい

- **分岐が 1 つだけ**: 溢れたかどうかの判定は `==` の 1 回だけです。最大と最小の選択は、符号のビットを引き算に使うことで、条件分岐をなくしています。
- **溢れた分を捨てない**: 上位の半分を使うので、「溢れたかどうか」を正確に判定できます。単に大きい数と比べると、正しく判定できない場合があります。
- **通常の掛け算と同じ結果**: 溢れなければ、普通の掛け算と同じ値を返します。ドキュメントにもそう書かれています。

## まとめ

- 掛け算の積を、上位と下位に分けると、溢れたかどうかを符号で判定できる。
- 溢れたときは、積の符号で最大値か最小値を選ぶ。
- 符号のビットを引き算に使うと、選択を 1 行で書ける。
