---
title: "文字列の数字を 1 桁ずつ積み上げ、整数に変える"
description: "文字列の数字を、基数に従って 1 桁ずつ読み、値を積み上げる標準ライブラリの関数。負の数は引き算で積むので、最小値も溢れずに読める。桁が溢れたときは nil を返す。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2021 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/IntegerParsing.swift
lines: [14, 57]
function: "_parseIntegerDigits(ascii:radix:isNegative:)"
difficulty: 2
tags: [文字列処理, 数値計算, 防御的プログラミング]
format: 2
---
## ひとことで

`Int("123")` や `Int("ff", radix: 16)` のように、文字列から整数を作るとき、標準ライブラリはこの関数の仲間で、桁を 1 つずつ読みます。
値は、読んだ桁を積み上げて作ります。たとえば `"123"` は、`0 → 1 → 12 → 123` と変わります。読めない文字や、溢れる値は `nil` にします。

## コード

::: code-group

```swift:line-numbers=14 [日本語訳]
internal func _parseIntegerDigits<Result: FixedWidthInteger>(
  ascii codeUnits: UnsafeBufferPointer<UInt8>, radix: Int, isNegative: Bool
) -> Result? {
  _internalInvariant(radix >= 2 && radix <= 36)
  guard _fastPath(!codeUnits.isEmpty) else { return nil }
  
  // 文字の定数は、読みやすいように名前をつけています:
  let _0 = 48 as UInt8, _A = 65 as UInt8, _a = 97 as UInt8
  
  let numericalUpperBound: UInt8
  let uppercaseUpperBound: UInt8
  let lowercaseUpperBound: UInt8
  if radix <= 10 {
    numericalUpperBound = _0 &+ UInt8(truncatingIfNeeded: radix)
    uppercaseUpperBound = _A
    lowercaseUpperBound = _a
  } else {
    numericalUpperBound = _0 &+ 10
    uppercaseUpperBound = _A &+ UInt8(truncatingIfNeeded: radix &- 10)
    lowercaseUpperBound = _a &+ UInt8(truncatingIfNeeded: radix &- 10)
  }
  let multiplicand = Result(truncatingIfNeeded: radix)
  var result = 0 as Result
  for unsafe digit in unsafe codeUnits {
    let digitValue: Result
    if _fastPath(digit >= _0 && digit < numericalUpperBound) {
      digitValue = Result(truncatingIfNeeded: digit &- _0)
    } else if _fastPath(digit >= _A && digit < uppercaseUpperBound) {
      digitValue = Result(truncatingIfNeeded: digit &- _A &+ 10)
    } else if _fastPath(digit >= _a && digit < lowercaseUpperBound) {
      digitValue = Result(truncatingIfNeeded: digit &- _a &+ 10)
    } else {
      return nil
    }
    let overflow1: Bool
    (result, overflow1) = result.multipliedReportingOverflow(by: multiplicand)
    let overflow2: Bool
    (result, overflow2) = isNegative
      ? result.subtractingReportingOverflow(digitValue)
      : result.addingReportingOverflow(digitValue)
    guard _fastPath(!overflow1 && !overflow2) else { return nil }
  }
  return result
}
```

```swift:line-numbers=14 [原文]
internal func _parseIntegerDigits<Result: FixedWidthInteger>(
  ascii codeUnits: UnsafeBufferPointer<UInt8>, radix: Int, isNegative: Bool
) -> Result? {
  _internalInvariant(radix >= 2 && radix <= 36)
  guard _fastPath(!codeUnits.isEmpty) else { return nil }
  
  // ASCII constants, named for clarity:
  let _0 = 48 as UInt8, _A = 65 as UInt8, _a = 97 as UInt8
  
  let numericalUpperBound: UInt8
  let uppercaseUpperBound: UInt8
  let lowercaseUpperBound: UInt8
  if radix <= 10 {
    numericalUpperBound = _0 &+ UInt8(truncatingIfNeeded: radix)
    uppercaseUpperBound = _A
    lowercaseUpperBound = _a
  } else {
    numericalUpperBound = _0 &+ 10
    uppercaseUpperBound = _A &+ UInt8(truncatingIfNeeded: radix &- 10)
    lowercaseUpperBound = _a &+ UInt8(truncatingIfNeeded: radix &- 10)
  }
  let multiplicand = Result(truncatingIfNeeded: radix)
  var result = 0 as Result
  for unsafe digit in unsafe codeUnits {
    let digitValue: Result
    if _fastPath(digit >= _0 && digit < numericalUpperBound) {
      digitValue = Result(truncatingIfNeeded: digit &- _0)
    } else if _fastPath(digit >= _A && digit < uppercaseUpperBound) {
      digitValue = Result(truncatingIfNeeded: digit &- _A &+ 10)
    } else if _fastPath(digit >= _a && digit < lowercaseUpperBound) {
      digitValue = Result(truncatingIfNeeded: digit &- _a &+ 10)
    } else {
      return nil
    }
    let overflow1: Bool
    (result, overflow1) = result.multipliedReportingOverflow(by: multiplicand)
    let overflow2: Bool
    (result, overflow2) = isNegative
      ? result.subtractingReportingOverflow(digitValue)
      : result.addingReportingOverflow(digitValue)
    guard _fastPath(!overflow1 && !overflow2) else { return nil }
  }
  return result
}
```

:::

## 前提知識

- **基数（radix）**: 10 進数なら 10、16 進数なら 16 です。1 桁の値の範囲が変わります。
- **`UnsafeBufferPointer<UInt8>`**: ASCII の文字コードの並びを、コピーせずに指す型です。
- **`multipliedReportingOverflow` と `addingReportingOverflow`**: 掛け算と足し算を行い、溢れたかどうかを一緒に返す関数です。
- **`_fastPath`**: よく通る道だと、コンパイラに教えるための印です。動きは変わりません。

## 何をしているか

### 1. 基数に応じて、数字と英字の範囲を決める

基数が 10 以下なら、数字の範囲だけを使います。11 以上なら、英字の `a` や `A` から続く 10 以上の値も使います。

```swift:line-numbers=23
  let numericalUpperBound: UInt8
  let uppercaseUpperBound: UInt8
  let lowercaseUpperBound: UInt8
  if radix <= 10 {
    numericalUpperBound = _0 &+ UInt8(truncatingIfNeeded: radix)
    uppercaseUpperBound = _A
    lowercaseUpperBound = _a
  } else {
    numericalUpperBound = _0 &+ 10
    uppercaseUpperBound = _A &+ UInt8(truncatingIfNeeded: radix &- 10)
    lowercaseUpperBound = _a &+ UInt8(truncatingIfNeeded: radix &- 10)
  }
```
### 2. 1 桁の文字を、値に変える

各文字の値を、範囲に応じて求めます。数字なら `0` を引き、大文字なら `A` を引いて 10 を足します。範囲にない文字なら `nil` を返します。

```swift:line-numbers=37
  for unsafe digit in unsafe codeUnits {
    let digitValue: Result
    if _fastPath(digit >= _0 && digit < numericalUpperBound) {
      digitValue = Result(truncatingIfNeeded: digit &- _0)
    } else if _fastPath(digit >= _A && digit < uppercaseUpperBound) {
      digitValue = Result(truncatingIfNeeded: digit &- _A &+ 10)
    } else if _fastPath(digit >= _a && digit < lowercaseUpperBound) {
      digitValue = Result(truncatingIfNeeded: digit &- _a &+ 10)
    } else {
      return nil
    }
```
### 3. 結果を基数倍して、桁を足すか引く

今の結果を基数倍して、読んだ桁の値を足します。負の数のときは足す代わりに引きます。溢れたら `nil` を返します。

```swift:line-numbers=48
    let overflow1: Bool
    (result, overflow1) = result.multipliedReportingOverflow(by: multiplicand)
    let overflow2: Bool
    (result, overflow2) = isNegative
      ? result.subtractingReportingOverflow(digitValue)
      : result.addingReportingOverflow(digitValue)
    guard _fastPath(!overflow1 && !overflow2) else { return nil }
```
### 4. 溢れなければ、結果を返す

すべての桁を読み終えたら、結果を返します。

```swift:line-numbers=55
  }
  return result
```
負の数を引いて作るのは、最小値を読むためです。`Int64` の最小値は `-9223372036854775808` で、その絶対値は `Int64.max` より 1 大きいので、正の数として積むと溢れてしまいます。引いて積めば、途中で溢れずに読めます。

## ここがすごい

- **溢れの検査が、桁ごとに入る**: 掛け算と足し算を、溢れを確かめながら行います。大きすぎる数字は、途中で `nil` になります。
- **負の数の最小値を読める**: 負の数を引いて積むので、正の数として積むと溢れる `Int.min` も、正しく読めます。
- **英字の範囲の計算を 1 回にまとめる**: 基数ごとの上限を、ループの前に 1 回だけ計算します。ループの中は、比べて引くだけです。

## まとめ

- 文字列の整数は、1 桁ずつ読んで、基数倍と足し算で積み上げる。
- 負の数は引いて積むと、最小値を溢れさせずに読める。
- 溢れや範囲外の文字は、途中で `nil` にして断る。
