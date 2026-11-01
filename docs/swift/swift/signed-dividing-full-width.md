---
title: "絶対値で割って、符号を付け直す 2 倍幅の割り算"
description: "符号付き整数の dividingFullWidth。被除数の絶対値を取り、符号なしの割り算に任せてから、商と余りに符号を付け直す。最小値の商を正しく扱う。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2024 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Integers.swift
lines: [3689, 3721]
function: "FixedWidthInteger.dividingFullWidth(_:)（符号付き）"
difficulty: 3
tags: [数値計算, ビット演算, ジェネリクス, 標準ライブラリ]
format: 2
---
## ひとことで

`dividingFullWidth` は、上位と下位に分かれた 2 倍幅の数（たとえば 128 ビット）を、ふつうの幅の数（64 ビット）で割り、商と余りを返すメソッドです。符号付き整数のこの版は、被除数と除数を絶対値にして符号なしの割り算をします。そして、最後に符号を付け直します。たとえば -7 ÷ 2 なら、7 ÷ 2 を計算して商 3、余り 1 を求め、符号を付けて商 -3、余り -1 とします。

## コード

::: code-group

```swift:line-numbers=3689 [日本語訳]
  @export(implementation)
  public func dividingFullWidth(
    _ dividend: (high: Self, low: Magnitude)
  ) -> (quotient: Self, remainder: Self) {
    // 被除数の絶対値を求めます。
    var magnitudeHigh = Magnitude(truncatingIfNeeded: dividend.high)
    var magnitudeLow  = dividend.low
    if dividend.high < .zero {
      let carry: Bool
      (magnitudeLow, carry) = (~magnitudeLow).addingReportingOverflow(1)
      magnitudeHigh = ~magnitudeHigh &+ (carry ? 1 : 0)
    }
    // 絶対値どうしで割り算します（符号なし版を使います）。
    let (unsignedQuotient, unsignedRemainder) = magnitude.dividingFullWidth(
      (high: magnitudeHigh, low: magnitudeLow)
    )
    // 商の符号を付け直します。被除数と除数の符号が違えば、商は負です。
    // 商が Self に入らなければ、ここでトラップします。
    let quotient: Self
    if self ^ dividend.high < .zero {
      // 商は表現できても、その絶対値が Self に入らないことがあります。
      // 商が Self.min のときがそれにあたるので、この場合を注意深く扱います。
      // そのため、ここでは特別な処理をします。
      _precondition(unsignedQuotient <= Self.min.magnitude,
                    "Quotient is not representable.")
      quotient = Self(truncatingIfNeeded: 0 &- unsignedQuotient)
    } else {
      quotient = Self(unsignedQuotient)
    }
    var remainder = Self(unsignedRemainder)
    if dividend.high < .zero { remainder = 0 &- remainder }
    return (quotient, remainder)
  }
```

```swift:line-numbers=3689 [原文]
  @export(implementation)
  public func dividingFullWidth(
    _ dividend: (high: Self, low: Magnitude)
  ) -> (quotient: Self, remainder: Self) {
    // Get magnitude of dividend:
    var magnitudeHigh = Magnitude(truncatingIfNeeded: dividend.high)
    var magnitudeLow  = dividend.low
    if dividend.high < .zero {
      let carry: Bool
      (magnitudeLow, carry) = (~magnitudeLow).addingReportingOverflow(1)
      magnitudeHigh = ~magnitudeHigh &+ (carry ? 1 : 0)
    }
    // Do division on magnitudes (using unsigned implementation):
    let (unsignedQuotient, unsignedRemainder) = magnitude.dividingFullWidth(
      (high: magnitudeHigh, low: magnitudeLow)
    )
    // Fixup sign: quotient is negative if dividend and divisor disagree.
    // We will also trap here if the quotient does not fit in Self.
    let quotient: Self
    if self ^ dividend.high < .zero {
      // It is possible that the quotient is representable but its magnitude
      // is not representable as Self (if quotient is Self.min), so we have
      // to handle that case carefully here.
      _precondition(unsignedQuotient <= Self.min.magnitude,
                    "Quotient is not representable.")
      quotient = Self(truncatingIfNeeded: 0 &- unsignedQuotient)
    } else {
      quotient = Self(unsignedQuotient)
    }
    var remainder = Self(unsignedRemainder)
    if dividend.high < .zero { remainder = 0 &- remainder }
    return (quotient, remainder)
  }
```

:::

## 前提知識

- **タプル引数 `(high: Self, low: Magnitude)`**: 2 倍幅の数を、符号付きの上位と符号なしの下位で表しています。
- **2 の補数での符号反転**: 負の数の絶対値は、全ビットを反転してから 1 を足すと求まります。
- **`addingReportingOverflow(_:)`**: 足した結果と、桁あふれしたかどうかを返します。
- **`self ^ dividend.high < .zero`**: 2 つの数の排他的論理和が負になるのは、符号ビットが違うとき、つまり符号が違うときです。
- **`0 &- x`**: 符号を反転します。オーバーフローを許す引き算です。

## 何をしているか

### 1. 被除数の絶対値を作る

負の被除数なら、全ビットを反転して 1 を足します。下位で桁あふれしたら、その繰り上がりを上位へ足します。2 桁の数で繰り上がりを扱うのと同じ考え方です。

```swift:line-numbers=3693
    // 被除数の絶対値を求めます。
    var magnitudeHigh = Magnitude(truncatingIfNeeded: dividend.high)
    var magnitudeLow  = dividend.low
    if dividend.high < .zero {
      let carry: Bool
      (magnitudeLow, carry) = (~magnitudeLow).addingReportingOverflow(1)
      magnitudeHigh = ~magnitudeHigh &+ (carry ? 1 : 0)
    }
```
### 2. 絶対値どうしで、符号なしの割り算をする

被除数の絶対値と、除数の絶対値で、符号なし版の `dividingFullWidth` を呼びます。符号を気にせずに割り算ができるので、実装がずっと単純になります。

```swift:line-numbers=3701
    // 絶対値どうしで割り算します（符号なし版を使います）。
    let (unsignedQuotient, unsignedRemainder) = magnitude.dividingFullWidth(
      (high: magnitudeHigh, low: magnitudeLow)
    )
```
### 3. 商に符号を付ける

被除数と除数の符号が違えば、商は負です。ここで注意が要るのは、商が `Int8.min`（-128）になる場合です。絶対値の 128 は `Int8` に入りません。そこで、絶対値が `Self.min` の絶対値以下かを符号なしのまま確かめてから、符号を付けます。

```swift:line-numbers=3705
    // 商の符号を付け直します。被除数と除数の符号が違えば、商は負です。
    // 商が Self に入らなければ、ここでトラップします。
    let quotient: Self
    if self ^ dividend.high < .zero {
      // 商は表現できても、その絶対値が Self に入らないことがあります。
      // 商が Self.min のときがそれにあたるので、この場合を注意深く扱います。
      // そのため、ここでは特別な処理をします。
      _precondition(unsignedQuotient <= Self.min.magnitude,
                    "Quotient is not representable.")
      quotient = Self(truncatingIfNeeded: 0 &- unsignedQuotient)
    } else {
      quotient = Self(unsignedQuotient)
    }
```
### 4. 余りに符号を付ける

余りの符号は、被除数の符号に合わせます。-7 ÷ 2 なら余りは -1 です。これは Swift の `%` と同じ規則で、`-7 % 2 == -1` になります。

```swift:line-numbers=3718
    var remainder = Self(unsignedRemainder)
    if dividend.high < .zero { remainder = 0 &- remainder }
```
## ここがすごい

- **難しい部分を 1 か所にまとめる**: 符号付きの割り算を直接書くと、場合分けが増えて大変です。符号を外して符号なしの割り算に任せ、前後で符号を処理するだけにしたので、正しさを確かめやすくなっています。
- **最小値の扱い**: 絶対値が型に入らない `Self.min` の商は、特別に扱われています。コメントに、なぜ注意が要るのかが書かれています。
- **結果が Swift の `%` と一致**: 余りの符号を被除数に合わせるので、整数の `/` と `%` の規則と同じになります。

## まとめ

- 符号付きの 2 倍幅の割り算は、絶対値で割って符号を付け直す。
- 商が最小値のときは、絶対値が型に入らないので、符号なしのまま確かめる。
- 余りの符号は被除数に合わせる。
