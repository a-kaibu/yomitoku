---
title: "符号付きの 2 倍幅割り算を、符号なしの割り算に帰着させる"
description: "128 ビットの被除数を 64 ビットの数で割る dividingFullWidth の符号付き版。絶対値を作って符号なしで割り、最後に符号を付け直す。Int.min という例外にも対応する。"
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
tags: [数値計算, ビット演算, 防御的プログラミング, 標準ライブラリ]
---
## ひとことで

`dividingFullWidth` は、上位と下位の 2 つに分かれた 2 倍幅の数（たとえば 128 ビット）を、ふつうの幅の数（64 ビット）で割り、商と余りを返すメソッドです。
符号付き整数のこの版は、**割られる数と割る数を絶対値にして符号なしの割り算をし、最後に符号を付け直す** という方法をとります。たとえば -7 ÷ 2 なら、7 ÷ 2 = 3 余り 1 を求め、商 -3、余り -1 にします。

## コード

```swift:line-numbers=3689
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

## 前提知識

- **タプル引数 `(high: Self, low: Magnitude)`**: 2 倍幅の数を、符号付きの上位と符号なしの下位で表しています。
- **2 の補数での符号反転**: 負の数の絶対値は「全ビットを反転（`~`）して 1 を足す」で求まります。たとえば 8 ビットで -3 は `11111101`、反転すると `00000010`、1 を足すと `00000011`（3）です。
- **`addingReportingOverflow(1)`**: 1 を足した結果と、桁あふれしたかどうか（`Bool`）を返します。
- **`.zero`**: その型の 0 です。
- **`self ^ dividend.high < .zero`**: 2 つの数の XOR が負になるのは、最上位ビット（符号ビット）が違うとき、つまり符号が違うときです。
- **`0 &- x`**: 符号を反転します（オーバーフローを許す引き算）。

## 何をしているか

### 1. 被除数の絶対値を作る（この部分）

2 倍幅の数を反転して 1 を足します。ただし 1 を足すのは下位だけで、下位があふれたら（`carry`）上位にも 1 を足します。2 桁の数で繰り上がりを扱うのと同じです。

### 2. 符号なしで割る（この部分）

`magnitude`（割る数の絶対値）の `dividingFullWidth` を呼びます。こちらは符号なし版で、別の場所で実装されています。

### 3. 商に符号を付ける（この部分）

割られる数と割る数の符号が違えば、商は負です。

ここで特別な注意が要ります。`Int8` で考えると、商が -128（`Int8.min`）になる場合、絶対値 128 は `Int8` に入りません。そこで「128 以下か」を符号なしのまま確かめてから（この部分）、`0 &- 128` を `Int8` に切り詰めます。結果は正しく -128 になります。

### 4. 余りに符号を付ける（この部分）

余りの符号は、割られる数の符号に合わせます。-7 ÷ 2 なら余りは -1。これは Swift の `%` と同じ規則です（`-7 % 2 == -1`）。

## ここがすごい

- **難しい部分は 1 か所にまとめる**: 符号付きの割り算を直接書くのは大変です。符号を外して符号なしの割り算に任せ、前後で符号を処理するだけにしたので、本体のアルゴリズムは 1 つで済みます。
- **最小値の罠をきちんと処理**:この部分コメントにある通り、「商は表せるのに、その絶対値は表せない」というケースがあります。素直に `-Self(unsignedQuotient)` と書くと、この場合に停止してしまいます。符号なしのまま範囲を確認し、ビットのまま反転することで正しく扱っています。
- **XOR で符号の違いを判定**: `(a < 0) != (b < 0)` と書く代わりに `a ^ b < 0` としています。比較 2 回と論理演算が、XOR 1 回と比較 1 回になります。

## まとめ

- 符号付きの計算は、絶対値で計算してから符号を付け直すと単純になることが多い。
- 2 の補数では、最小値の絶対値だけが同じ型に入らない。そこは特別に扱う。
- 2 つの数の XOR が負なら、符号が違う。
