---
title: "1970 年からの経過秒数を、年・月・日へ変換する"
description: "通算の秒数から、ユリウス日を経由して西暦の年・月・日を求める SwiftProtobuf の関数。Richards のアルゴリズムを整数の割り算だけで実装している。"
language: swift
project: "SwiftProtobuf"
repo: https://github.com/apple/swift-protobuf
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the project authors"
commit: "61e40fbe39c7b40e48dec12ac96f73521372f34e"
file: Sources/SwiftProtobuf/TimeUtils.swift
lines: [38, 54]
function: "gregorianDateFromSecondsSince1970(seconds:)"
difficulty: 3
tags: [日時, 数値計算]
format: 2
---
## ひとことで

Protocol Buffers の `Timestamp` は、1970 年 1 月 1 日からの秒数で時刻を表します。JSON などに書き出すには、それを「2024 年 5 月 3 日」のような年・月・日に直す必要があります。この関数は、その変換を、ユリウス日という通算日数を使って行います。

## コード

::: code-group

```swift:line-numbers=38 [日本語訳]
internal func gregorianDateFromSecondsSince1970(seconds: Int64) -> (YY: Int32, MM: Int32, DD: Int32) {
    // Richards のアルゴリズム（Wikipedia の「ユリウス日」の項目を参照）で実装しています。
    // （「ユリウス日」の項目を参照）
    // この部分を変更するときは、
    // Test_Timestamp.testJSON_range で十分に検査してください。

    let JJ = julianDayNumberFromSecondsSince1970(seconds: seconds)
    let f = JJ + 1401 + div(div(4 * JJ + 274277, 146097) * 3, 4) - 38
    let e = 4 * f + 3
    let g = Int64(div(mod(e, 1461), 4))
    let h = 5 * g + 2
    let DD = div(mod(h, 153), 5) + 1
    let MM = mod(div(h, 153) + 2, 12) + 1
    let YY = div(e, 1461) - 4716 + div(12 + 2 - MM, 12)

    return (YY: Int32(YY), MM: Int32(MM), DD: Int32(DD))
}
```

```swift:line-numbers=38 [原文]
internal func gregorianDateFromSecondsSince1970(seconds: Int64) -> (YY: Int32, MM: Int32, DD: Int32) {
    // The following implements Richards' algorithm (see the Wikipedia article
    // for "Julian day").
    // If you touch this code, please test it exhaustively by playing with
    // Test_Timestamp.testJSON_range.

    let JJ = julianDayNumberFromSecondsSince1970(seconds: seconds)
    let f = JJ + 1401 + div(div(4 * JJ + 274277, 146097) * 3, 4) - 38
    let e = 4 * f + 3
    let g = Int64(div(mod(e, 1461), 4))
    let h = 5 * g + 2
    let DD = div(mod(h, 153), 5) + 1
    let MM = mod(div(h, 153) + 2, 12) + 1
    let YY = div(e, 1461) - 4716 + div(12 + 2 - MM, 12)

    return (YY: Int32(YY), MM: Int32(MM), DD: Int32(DD))
}
```

:::

## 前提知識

- **ユリウス日（Julian Day Number）**: 紀元前から続く通算の日数です。日付の計算が、足し算と割り算で書けるように作られています。
- **1970 年 1 月 1 日のユリウス日**: 2440588 です。この値を使うと、秒数から日数を求められます。
- **整数の割り算**: 日付の計算では、小数を使わず、整数の商と余りだけで求めます。ここでは `div` と `mod` を使い、負の値も正しく扱っています。
- **Richards のアルゴリズム**: ユリウス日から、グレゴリオ暦の年・月・日を求める方法の 1 つです。閏年の規則を、整数の式に置き換えています。

## 何をしているか

### 1. ユリウス日を求める

秒数を 1 日の秒数で割り、1970 年の基準日を足して、ユリウス日を求めます。

```swift:line-numbers=44
    let JJ = julianDayNumberFromSecondsSince1970(seconds: seconds)
```
### 2. 閏年の周期を取り入れた中間の値を作る

400 年周期（146097 日）と、4 年周期（1461 日）を使って、閏年の影響を含んだ値を作ります。この段階で、年と月の計算がしやすい形になります。

```swift:line-numbers=45
    let f = JJ + 1401 + div(div(4 * JJ + 274277, 146097) * 3, 4) - 38
    let e = 4 * f + 3
    let g = Int64(div(mod(e, 1461), 4))
    let h = 5 * g + 2
```
### 3. 日・月・年を取り出す

中間の値から、日、月、年を順に取り出します。月は 3 月始まりの年度として扱うと、閏日の影響が最後にまとまります。

```swift:line-numbers=49
    let DD = div(mod(h, 153), 5) + 1
    let MM = mod(div(h, 153) + 2, 12) + 1
    let YY = div(e, 1461) - 4716 + div(12 + 2 - MM, 12)
```
### 4. 結果を 3 つの値として返す

年、月、日を、`Int32` にして返します。

```swift:line-numbers=53
    return (YY: Int32(YY), MM: Int32(MM), DD: Int32(DD))
```
## ここがすごい

- **割り算と余りだけで完結する**: 日付の表や、長い分岐を使わずに、年・月・日を求めます。
- **負の値にも対応する**: `div` と `mod` を使うので、1970 年より前の日付も、正しく計算されます。
- **仕組みを残している**: コメントに出典とテストの場所が書かれています。式を変えるときの検査の手がかりになります。

## まとめ

- 秒数を、ユリウス日という通算の日数に変える。
- 閏年の周期を含む整数の式で、年・月・日を取り出す。
- 負の値を含めて正しく動くよう、`div` と `mod` を使う。
