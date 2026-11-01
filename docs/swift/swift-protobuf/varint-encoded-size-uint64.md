---
title: "64 ビットの varint のバイト数を、同じ式で求める"
description: "64 ビットの varint のサイズを計算する関数。32 ビット版と同じ式を、ビット幅だけ変えて使う。符号付きの値は、同じビットパターンのまま符号なしとして扱う。"
language: swift
project: "SwiftProtobuf"
repo: https://github.com/apple/swift-protobuf
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2016 Apple Inc. and the project authors"
commit: "61e40fbe39c7b40e48dec12ac96f73521372f34e"
file: Sources/SwiftProtobuf/Varint.swift
lines: [56, 61]
function: "Varint.encodedSize(of: UInt64)"
difficulty: 2
tags: [ビット演算, 数値計算, 低レイヤ]
format: 2
---
## ひとことで

`encodedSize(of: UInt64)` は、64 ビットの varint が何バイトになるかを求めます。`UInt32` 版と同じ考え方で、ビット幅だけが違います。最大は 10 バイトです。
符号付きの値は、`Int64(bitPattern:)` などで同じビットパターンの符号なしの値に変えてから、この関数に渡されます。負の数は上位が 1 で埋まっているので、10 バイトになります。

## コード

::: code-group

```swift:line-numbers=56 [日本語訳]
    static func encodedSize(of value: UInt64) -> Int {
        // この計算は C++ の CodedOutputStream::VarintSize64(uint64_t) から取ったもので、分岐のない計算を行う。
        // （上の実装の続き）
        let clz = value.leadingZeroBitCount
        return ((UInt64.bitWidth &* 9 &+ 64) &- (clz &* 9)) / 64
    }
```

```swift:line-numbers=56 [原文]
    static func encodedSize(of value: UInt64) -> Int {
        // This logic comes from the upstream C++ for CodedOutputStream::VarintSize64(uint64_t),
        // it provides a branchless calculation of the size.
        let clz = value.leadingZeroBitCount
        return ((UInt64.bitWidth &* 9 &+ 64) &- (clz &* 9)) / 64
    }
```

:::

## 前提知識

- **`UInt64.bitWidth`**: 64 です。
- **`leadingZeroBitCount`**: 上位の 0 の数です。
- **ビットパターン**: 同じ並びの 0 と 1 を、符号付きとして見るか符号なしとして見るかの違いです。

## 何をしているか

### 1. 上位の 0 を数える

値の上位に続く 0 の数を求めます。

```swift:line-numbers=59
        let clz = value.leadingZeroBitCount
```
### 2. ビット数から、バイト数を求める

32 ビット版と同じ式で、ビット幅だけを 64 に変えています。`(64 × 9 + 64 - clz × 9) / 64` が、必要なバイト数です。

```swift:line-numbers=60
        return ((UInt64.bitWidth &* 9 &+ 64) &- (clz &* 9)) / 64
```
例として `-1` を符号なしに変えると、`0xFFFF_FFFF_FFFF_FFFF` です。上位に 0 がないので `clz = 0` になり、`(576 + 64) / 64 = 10` バイトです。

## ここがすごい

- **式を型のビット幅で書く**: `UInt64.bitWidth` を使っているので、数字の 64 がコードに直接現れません。幅が変わっても、式はそのまま正しく動きます。
- **符号付きも同じ式で扱える**: 負の数を符号なしのビットパターンとして扱うと、上位が 1 で埋まったまま計算できます。符号付きの値のために、別の式を用意する必要がありません。
- **同じ式を型ごとに書く**: 32 ビット版と 64 ビット版は、ほぼ同じ見た目です。読み比べると、どこが違うかがすぐ分かります。

## まとめ

- 可変長整数のサイズは、ビット幅と先頭の 0 の数で決まる。
- 符号付きの値は、ビットパターンを符号なしに変えると、同じ式で扱える。
- 型のビット幅を式に使うと、型が変わっても書き直しが要らない。
