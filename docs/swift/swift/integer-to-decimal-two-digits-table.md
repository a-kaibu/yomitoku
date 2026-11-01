---
title: "整数を、後ろから 2 桁ずつ表を引いて文字にする"
description: "整数を 10 進数の文字列にするとき、0 から 99 までの 2 桁の組を並べた表を引き、後ろから 2 桁ずつ書き込む標準ライブラリの処理。割り算の回数が半分になる。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2024 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Integers.swift
lines: [1438, 1452]
function: "_BinaryIntegerToASCII(negative:magnitude:radix:uppercase:buffer:)"
difficulty: 2
tags: [数値計算, 文字列処理, 最適化]
format: 2
---
## ひとことで

整数を文字列にするには、一番下の桁から順に、10 で割った余りを文字にしていくのが基本です。しかし、それでは桁の数だけ割り算が必要です。
この関数は、**2 桁ずつ** まとめて処理します。0 から 99 までの 2 桁の組を並べた表を用意しておき、`value % 100` で表を引きます。割り算は、2 桁に 1 回で済みます。

## コード

```swift:line-numbers=1438
    while value >= (10 as T.Magnitude) {
      offset &-= 2
      unsafe buffer.storeBytes(
        of: lookup[unchecked: Int(truncatingIfNeeded: value % 100)],
        toUncheckedByteOffset: offset,
        as: (UInt8, UInt8).self)
      value /= 100
    }
    if value != (0 as T.Magnitude) {
      offset &-= 1
      unsafe buffer.storeBytes(
        of: UInt8(truncatingIfNeeded: value) | 0x30,
        toUncheckedByteOffset: offset,
        as: UInt8.self)
    }
```

## 前提知識

- **`value % 100` と `value / 100`**: 100 で割った余りは、下 2 桁です。商は、残りの上の桁です。
- **表引き（ルックアップ）**: 計算する代わりに、あらかじめ用意した表から値を取り出す方法です。
- **`storeBytes`**: 指定したバイトの位置に、値を直接書き込む関数です。ここでは末尾から前へ書き込んでいきます。

## 何をしているか

### 1. 0 のときは、「0」を 1 文字書く

値が 0 のときは、表を使わずに、文字 `0` を 1 つ書きます。

```swift:line-numbers=1408
  if value == (0 as T.Magnitude) {
    offset &-= 1
    unsafe buffer.storeBytes(
      of: 0x30 /* "0" */,
      toUncheckedByteOffset: offset,
      as: UInt8.self)
```
### 2. 10 進数の場合は、表を使う

10 進数のときは、2 桁ずつまとめる表を使います。表の中には、`00` から `99` までの組が、順番に入っています。

```swift:line-numbers=1414
  } else if radix == (10 as T.Magnitude) {
    // 2 桁をまとめて表から引きます。
    let lookup: _InlineArray<100, (UInt8, UInt8)> = [
```
### 3. 2 桁ずつ後ろから書く

値が 10 以上の間は、下 2 桁を表から引き、その 2 文字を後ろから書きます。残りを 100 で割って、次の 2 桁へ進みます。

```swift:line-numbers=1438
    while value >= (10 as T.Magnitude) {
      offset &-= 2
      unsafe buffer.storeBytes(
        of: lookup[unchecked: Int(truncatingIfNeeded: value % 100)],
        toUncheckedByteOffset: offset,
        as: (UInt8, UInt8).self)
      value /= 100
    }
```
### 4. 最後に残った 1 桁を書く

値が 10 より小さくなったら、残った 1 桁を 1 文字書きます。0 なら、何も書きません。

```swift:line-numbers=1446
    if value != (0 as T.Magnitude) {
      offset &-= 1
      unsafe buffer.storeBytes(
        of: UInt8(truncatingIfNeeded: value) | 0x30,
        toUncheckedByteOffset: offset,
        as: UInt8.self)
    }
```
例として `1234` を見ます。下 2 桁の `34` を後ろに書き、値は `12` になります。次に `12` を表から引いて、その前に書きます。値は `0` になったので終わります。結果は `1234` です。

## ここがすごい

- **割り算の回数が半分**: 1 桁ずつ割るのではなく、2 桁ずつ割るので、割り算は桁数の半分で済みます。整数の割り算は遅いので、この差が効きます。
- **定数の割り算は、掛け算に変わる**: `100` は定数なので、コンパイラは割り算を掛け算とシフトに置き換えられます。表の添字の計算も、速く終わります。
- **後ろから書くので、コピーがいらない**: 文字列の先頭を後で決める必要がなく、確保した領域の末尾から順に埋めていけます。

## まとめ

- 10 進数の変換は、後ろから 2 桁ずつ表を引くと、割り算が半分で済む。
- 割る数が定数なら、コンパイラが速い計算に置き換えてくれる。
- 末尾から書き込めば、文字列をコピーせずに組み立てられる。
