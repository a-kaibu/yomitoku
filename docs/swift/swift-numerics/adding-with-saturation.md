---
title: "溢れたら最大値で止める「飽和加算」"
description: "整数の足し算で、結果が型の範囲を超えたら最大値（または最小値）で止める関数。溢れたかどうかの判定と、符号ビットを全部 1 にする小さな工夫で、分岐なしに符号を決める。"
language: swift
project: "Swift Numerics"
repo: https://github.com/apple/swift-numerics
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2023 Apple Inc. and the Swift Numerics project authors"
commit: "669f6185187f8e1b5857a25c4bbe6c34a3a02b96"
file: Sources/IntegerUtilities/SaturatingArithmetic.swift
lines: [36, 40]
function: "FixedWidthInteger.addingWithSaturation(_:)"
difficulty: 2
tags: [数値計算, 防御的プログラミング, ビット演算]
format: 2
---
## ひとことで

`Int8` の `84 + 100` は 184 で、`Int8` の範囲（-128〜127）には入りません。普通の足し算ならプログラムが止まるか、回り込みで別の値になります。
`addingWithSaturation(_:)` は、結果を型の範囲に **飽和（clamp）させて** 返します。この例では 127 になります。画像の明るさや音量のように、上限で止めたい計算に向いています。

## コード

```swift:line-numbers=36
  @inlinable
  public func addingWithSaturation(_ other: Self) -> Self {
    let (wrapped, overflow) = addingReportingOverflow(other)
    return overflow ? Self.max &- signbit : wrapped
  }
```

## 前提知識

- **`addingReportingOverflow`**: 足し算の結果と、溢れたかどうか（`Bool`）を組で返すメソッドです。溢れても止まりません。
- **`Self.max`**: その型で表せる最大値です。
- **`signbit`**: 符号の状態を表す値です。負なら全ビットが 1（`~0`）、そうでなければ 0 です。関数の下の説明で引用しています。
- **`&-`**: オーバーフローを検査しない引き算です。

## 何をしているか

### 1. 溢れたかを先に調べる

`addingReportingOverflow` で、普通に足した結果と溢れたかを同時に得ます。溢れていなければ、その値をそのまま使えます。

```swift:line-numbers=38
    let (wrapped, overflow) = addingReportingOverflow(other)
```
### 2. 溢れたら、符号に応じて最大値か最小値へ

溢れたとき、答えは最大値か最小値のどちらかです。`signbit` が使われるのは、この向きを 1 行で決めるためです。

```swift:line-numbers=39
    return overflow ? Self.max &- signbit : wrapped
```
`signbit` は、負の値なら全ビットが 1（`~0`）、正の値なら 0 です。`Self.max &- signbit` は、正の溢れなら `max - 0 = max`、負の溢れなら `max - (~0)` で、`max` の 2 の補数の差を取った値になります。

<!-- source: Sources/IntegerUtilities/SaturatingArithmetic.swift -->
```swift:line-numbers=19
  var signbit: Self {
    return self < .zero ? ~.zero : .zero
```
## ここがすごい

- **溢れを例外にしない**: 結果の範囲を超えたら、止めるのではなく端の値にそろえます。音の大きさや画面の座標など、「上限で止まるのが正しい」計算では、この性質がそのまま意味になります。
- **符号の向きを分岐なしで決める**: `if` で「正なら max、負なら min」と書く代わりに、`signbit` のビットパターンで 1 回の引き算で決めています。
- **通常の計算と同じ結果になる**: コメントにもある通り、溢れなければ普通の足し算と全く同じ結果です。安全な計算を追加しているだけなので、既存のコードに置き換えても壊れません。

## まとめ

- 溢れたときの動きを、止めるか、端に飽和させるかは設計の選択になる。
- 溢れたかどうかは、普通の計算と同時に得られる。
- 符号による分岐は、符号のビットパターンを使うと 1 行にまとまる。
