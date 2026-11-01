---
title: "64 ビットの表で、ASCII の小文字かを判定して大文字にする"
description: "1 つの 64 ビット整数を表として使い、ASCII の小文字を 1 回のシフトで判定して大文字に変える標準ライブラリの処理。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/String.swift
lines: [1083, 1105]
function: "_uppercaseASCII(_:)"
difficulty: 3
tags: [ビット演算, 文字列処理, 低レイヤ]
format: 2
---
## ひとことで

ASCII の小文字 `a` から `z` を、大文字 `A` から `Z` に変えます。判定に 64 ビットの整数を「表」として使い、1 回のシフトで、その文字が小文字かどうかを調べます。

## コード

::: code-group

```swift:line-numbers=1083 [日本語訳]
  @inline(__always)
  internal func _uppercaseASCII(_ x: UInt8) -> UInt8 {
    /// 大文字に変える必要がある ASCII 文字の「表」です。
    /// 文字がどのビットに対応するかは、
    /// 文字の ASCII 値から 1 を引いて 2 で割った値で決まります。ビットが 1 なら、
    /// その文字が小文字であることを表します。そうでなければ 0 です。
    let _lowercaseTable: UInt64 =
      0b0001_1111_1111_1111_0000_0000_0000_0000 &<< 32

    // 表を見て、変換が必要かどうかを調べます。
    // 必要なら 0x20 を引き、そうでなければ 0 を引きます。
    // 次の処理と同じ意味です。
    // 次の処理と同じ意味です。
    // switch で書くと、次のようになります。
    // A から Z の範囲の x のとき、
    // x から 0x20 を引いた値を返します。
    // それ以外のとき、
    // x をそのまま返します。
    // （switch 文の終わり）
    let isLower = _lowercaseTable &>> UInt64(((x &- 1) & 0b0111_1111) &>> 1)
    let toSubtract = (isLower & 0x1) &<< 5
    return x &- UInt8(truncatingIfNeeded: toSubtract)
  }
```

```swift:line-numbers=1083 [原文]
  @inline(__always)
  internal func _uppercaseASCII(_ x: UInt8) -> UInt8 {
    /// A "table" for which ASCII characters need to be upper cased.
    /// To determine which bit corresponds to which ASCII character, subtract 1
    /// from the ASCII value of that character and divide by 2. The bit is set if
    /// that character is a lower case character; otherwise, it's not set.
    let _lowercaseTable: UInt64 =
      0b0001_1111_1111_1111_0000_0000_0000_0000 &<< 32

    // Lookup if it should be shifted in our ascii table, then we subtract 0x20 if
    // it should, 0x0 if not.
    // This code is equivalent to:
    // This code is equivalent to:
    // switch sourcex {
    // case let x where (x >= 0x41 && x <= 0x5a):
    //   return x &- 0x20
    // case let x:
    //   return x
    // }
    let isLower = _lowercaseTable &>> UInt64(((x &- 1) & 0b0111_1111) &>> 1)
    let toSubtract = (isLower & 0x1) &<< 5
    return x &- UInt8(truncatingIfNeeded: toSubtract)
  }
```

:::

## 前提知識

- **ASCII の大文字と小文字**: `A` は `0x41`、`a` は `0x61` で、差はちょうど `0x20`（2 進数の 1 ビット）です。そのため、小文字から `0x20` を引くと大文字になります。
- **ビットの表**: 64 個の 0 か 1 を、1 つの整数に並べたものです。何番目のビットが 1 かで、ある文字の性質を表します。
- **`&>>`**: 値を右へずらすオーバーフローしない演算子です。ずらす量の上限を超えても、エラーになりません。
- **`&-`**: 折り返す引き算です。ここでは、`x - 1` が 0 の場合でもエラーにならないように使っています。

## 何をしているか

### 1. 小文字の位置を示すビットの表を用意する

`0b` で始まる数は、2 進数の表記です。`&<< 32` で、表を上の 32 ビットに移しています。この位置が、アルファベットの位置と対応しています。

```swift:line-numbers=1089
    let _lowercaseTable: UInt64 =
      0b0001_1111_1111_1111_0000_0000_0000_0000 &<< 32
```
### 2. 文字に対応するビットを、シフトで取り出す

文字の値から 1 を引いて 2 で割ると、表の中の位置が決まります。その位置のビットを、シフトで右端へ持ってきます。

```swift:line-numbers=1102
    let isLower = _lowercaseTable &>> UInt64(((x &- 1) & 0b0111_1111) &>> 1)
```
### 3. 小文字なら 0x20 を引く

取り出したビットが 1 なら、`0x20` を引きます。0 なら、何もしません。ビットを 5 つ左へずらした値に変えて、引く量を作ります。

```swift:line-numbers=1103
    let toSubtract = (isLower & 0x1) &<< 5
    return x &- UInt8(truncatingIfNeeded: toSubtract)
```
## ここがすごい

- **分岐がない**: `if` や `switch` を使わずに、ビットの計算だけで判定しています。CPU で、予測しにくい分岐を避けられます。
- **表が 1 つの数**: 小文字の一覧を、1 つの 64 ビット整数に収めています。メモリの参照も不要です。
- **比較の元の式を残している**: コメントに、同じ意味の `switch` 文を書いています。表の意味が、読んで分かるようになっています。

## まとめ

- 小文字の位置を、1 つの整数のビットで表す。
- 文字の値から位置を計算し、シフトでビットを取り出す。
- 小文字なら `0x20` を引くと、大文字になる。
