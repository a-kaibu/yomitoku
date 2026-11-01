---
title: "整数を、後ろから 4 ビットずつ取り出して 16 進数にする"
description: "整数を 16 進数の文字列にする標準ライブラリの処理。下の 4 ビットを表から引き、右へ 4 ビットずらすことを繰り返す。大文字と小文字は、1 つの値の加算で切り替える。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2024 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Integers.swift
lines: [1453, 1467]
function: "_BinaryIntegerToASCII (radix 16 branch)"
difficulty: 1
tags: [数値計算, 文字列処理, ビット演算]
format: 2
---
## ひとことで

16 進数は、1 桁が 4 ビット（0 から 15）に当たります。そのため、整数を 16 進数の文字列にするのに、割り算は要りません。
この処理は、下の 4 ビットを取り出して文字にし、右へ 4 ビットずらすことを、値が 0 になるまで繰り返します。大文字か小文字かは、最後に足す値で決めます。

## コード

```swift:line-numbers=1453
  } else if radix == (16 as T.Magnitude) {
    let lookup: _InlineArray<16, UInt8> = [
      0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
      0x41, 0x42, 0x43, 0x44, 0x45, 0x46
    ]
    let adjustment: UInt8 = uppercase ? 0 : 0x20

    while value != (0 as T.Magnitude) {
      offset &-= 1
      unsafe buffer.storeBytes(
        of: lookup[unchecked: Int(truncatingIfNeeded: value & 0xf)] | adjustment,
        toUncheckedByteOffset: offset,
        as: UInt8.self)
      value >>= 4
    }
```

## 前提知識

- **16 進数**: `0` から `9` と、`A` から `F`（または小文字の `a` から `f`）の 16 種類の数字で表す方式です。1 桁は 4 ビットに当たります。
- **`& 0xf`**: 下の 4 ビットだけを取り出すマスクです。
- **`>>= 4`**: 4 ビット右へずらす操作です。下の 4 ビットが捨てられ、次の 4 ビットが下に来ます。
- **ASCII の大文字と小文字**: `A` は 0x41、`a` は 0x61 で、差は 0x20（32）です。

## 何をしているか

### 1. 大文字か小文字かで、加える値を決める

大文字なら `0`、小文字なら `0x20` を、後で文字に足します。16 進数の文字は、この 1 つの値の違いで切り替えられます。

```swift:line-numbers=1454
    let lookup: _InlineArray<16, UInt8> = [
      0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
      0x41, 0x42, 0x43, 0x44, 0x45, 0x46
    ]
    let adjustment: UInt8 = uppercase ? 0 : 0x20
```
### 2. 下の 4 ビットを文字にして、後ろから書く

値の下の 4 ビットを表から引き、大文字か小文字かの値を足して、1 文字書きます。書く位置は、末尾から前へ 1 つずつ進みます。

```swift:line-numbers=1460
    while value != (0 as T.Magnitude) {
      offset &-= 1
      unsafe buffer.storeBytes(
        of: lookup[unchecked: Int(truncatingIfNeeded: value & 0xf)] | adjustment,
        toUncheckedByteOffset: offset,
        as: UInt8.self)
```
### 3. 4 ビット右へずらし、値が 0 になるまで続ける

書いたら、値を 4 ビット右へずらします。値が 0 になったら、すべての桁を書き終わったので、終わりです。

```swift:line-numbers=1466
      value >>= 4
    }
```
例として `255` を書きます。下の 4 ビットは `F` で、次に `F` を書きます。値を 4 ビットずらすと `0xF` になり、また `F` を書きます。結果は `FF` です。小文字で書くときは、`ff` になります。

## ここがすごい

- **割り算がまったく要らない**: 2 進数の 4 ビットがそのまま 1 桁なので、シフトとマスクだけで桁を取り出せます。
- **大文字と小文字の切り替えが 1 回の加算**: 表は 1 つで、最後に 0x20 を足すかどうかだけを変えます。
- **同じ仕組みを 8 進数でも使える**: 8 進数は 3 ビットずつなので、同じ形の処理を `& 7` と `>>= 3` で書けます。このファイルには、その分岐も並んでいます。

## まとめ

- 16 進数は、4 ビットずつ取り出すので、割り算が要らない。
- 大文字と小文字は、表に足す 1 つの値で切り替える。
- 進数が 2 の冪なら、マスクとシフトだけで桁を取り出せる。
