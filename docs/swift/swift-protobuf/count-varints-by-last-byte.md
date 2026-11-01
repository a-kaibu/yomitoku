---
title: "varint の個数を、値を復号せずに数える"
description: "詰め込まれた varint のバイト列に、いくつの数値が入っているかを数える関数。各 varint の最後のバイトだけを数えるので、数値を復号しない。"
language: swift
project: "SwiftProtobuf"
repo: https://github.com/apple/swift-protobuf
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2016 Apple Inc. and the project authors"
commit: "61e40fbe39c7b40e48dec12ac96f73521372f34e"
file: Sources/SwiftProtobuf/Varint.swift
lines: [63, 77]
function: "Varint.countVarintsInBuffer(start:count:)"
difficulty: 2
tags: [パース, 低レイヤ]
format: 2
---
## ひとことで

Protocol Buffers には、数値をバイト列へ詰めた形式があります。この関数は、その中に数値がいくつ入っているかを数えます。数値を 1 つずつ復号せず、バイトの性質だけを数えて済ませます。

## コード

::: code-group

```swift:line-numbers=63 [日本語訳]
    /// バイト列に詰められた varint の数を数えます。
    static func countVarintsInBuffer(start: UnsafeRawPointer, count: Int) -> Int {
        // すべての varint を復号しなくても、個数は数えられます。
        // どの varint にも、値が 128 未満のバイトがちょうど 1 つあります。
        // その 1 つのバイトを数えれば、個数になります。
        var n = 0
        var ints = 0
        while n < count {
            if start.load(fromByteOffset: n, as: UInt8.self) < 128 {
                ints &+= 1
            }
            n &+= 1
        }
        return ints
    }
```

```swift:line-numbers=63 [原文]
    /// Counts the number of distinct varints in a packed byte buffer.
    static func countVarintsInBuffer(start: UnsafeRawPointer, count: Int) -> Int {
        // We don't need to decode all the varints to count how many there
        // are.  Just observe that every varint has exactly one byte with
        // value < 128. So we just count those...
        var n = 0
        var ints = 0
        while n < count {
            if start.load(fromByteOffset: n, as: UInt8.self) < 128 {
                ints &+= 1
            }
            n &+= 1
        }
        return ints
    }
```

:::

## 前提知識

- **varint**: 数値を 7 ビットずつに分けて、1 バイトずつ書く可変長の形式です。小さい数値ほど短く書けます。
- **最上位ビット**: 1 バイトの 8 ビットのうち、いちばん左のビットです。varint では、このビットが 1 なら「まだ続く」、0 なら「ここで終わり」を表します。
- **`UnsafeRawPointer`**: 型を決めずに、メモリ上のバイトを直接指すポインタです。`load(fromByteOffset:as:)` で、指定した位置の値を読みます。

## 何をしているか

### 1. 数える準備をする

```swift:line-numbers=68
        var n = 0
        var ints = 0
```
### 2. 1 バイトずつ、128 未満かを調べる

128 未満のバイトは、最上位ビットが 0 のバイトです。これは、varint の最後のバイトです。

```swift:line-numbers=70
        while n < count {
            if start.load(fromByteOffset: n, as: UInt8.self) < 128 {
                ints &+= 1
            }
            n &+= 1
        }
```
### 3. 数えた個数を返す

```swift:line-numbers=76
        return ints
    }
```
## ここがすごい

- **数値を復号しない**: 数値そのものを作らないので、とても速く数えられます。
- **性質を 1 つ見抜いている**: 各 varint は、最後のバイトだけが最上位ビット 0 です。そのため、128 未満のバイトを数えると、varint の個数になります。
- **分岐の少ない単純な形**: 1 バイトずつ同じ判定を繰り返すだけなので、読みやすく、最適化もしやすい形です。

## まとめ

- varint の最後のバイトだけ最上位ビットが 0 なので、値は 128 未満になる。
- その性質で数えれば、数値を復号せずに個数が分かる。
- 配列の要素数を先に知りたいときに使える。
