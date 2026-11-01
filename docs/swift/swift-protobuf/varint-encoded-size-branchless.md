---
title: "割り算もループもなしで、可変長整数のバイト数を求める"
description: "Protocol Buffers の varint（可変長整数）が何バイトになるかを、先頭の 0 の数だけから計算する関数。掛け算と足し算と 1 回の割り算で、分岐なしに答えが出る。"
language: swift
project: "SwiftProtobuf"
repo: https://github.com/apple/swift-protobuf
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2016 Apple Inc. and the project authors"
commit: "61e40fbe39c7b40e48dec12ac96f73521372f34e"
file: Sources/SwiftProtobuf/Varint.swift
lines: [23, 28]
function: "Varint.encodedSize(of: UInt32)"
difficulty: 3
tags: [ビット演算, 数値計算, 最適化, 低レイヤ]
format: 2
---
## ひとことで

Protocol Buffers は、整数を **varint（可変長整数）** で書きます。小さい数は 1 バイト、大きい数は 10 バイトまで、必要な分だけ使います。
この関数は、ある `UInt32` の値を書くのに **何バイト必要か** を求めます。実際に書き出さずに、サイズだけを先に知りたいときに使われます。たとえば `1` は 1 バイト、`128` は 2 バイトです。

## コード

::: code-group

```swift:line-numbers=23 [日本語訳]
    package static func encodedSize(of value: UInt32) -> Int {
        // この計算は C++ の CodedOutputStream::VarintSize32(uint32_t) から取ったもので、分岐のない計算を行う。
        // （上の実装の続き）
        let clz = value.leadingZeroBitCount
        return ((UInt32.bitWidth &* 9 &+ 64) &- (clz &* 9)) / 64
    }
```

```swift:line-numbers=23 [原文]
    package static func encodedSize(of value: UInt32) -> Int {
        // This logic comes from the upstream C++ for CodedOutputStream::VarintSize32(uint32_t),
        // it provides a branchless calculation of the size.
        let clz = value.leadingZeroBitCount
        return ((UInt32.bitWidth &* 9 &+ 64) &- (clz &* 9)) / 64
    }
```

:::

## 前提知識

- **varint の仕組み**: 1 バイトで 7 ビットのデータを運び、残りの 1 ビットで「続きがあるか」を示します。だから、7 ビットずつに区切った数がバイト数になります。
- **`leadingZeroBitCount`**: 上位に続く 0 の数です。値のビット数は `bitWidth - leadingZeroBitCount` で求まります。
- **`&*`、`&+`、`&-`**: オーバーフローを検査しない演算です。
- **`package`**: 同じパッケージの中からだけ使えるアクセス修飾子です。

## 何をしているか

### 1. 先頭の 0 の数を数える

値の上位に 0 がどれだけ続くかを、`leadingZeroBitCount` で求めます。

```swift:line-numbers=26
        let clz = value.leadingZeroBitCount
```
### 2. 整数だけの式で割り算する

ビット数 `b` を 7 で割って切り上げた数が、必要なバイト数です。ここでは、そのかわりに `(9 × b + 64) / 64` という式を使っています。

```swift:line-numbers=27
        return ((UInt32.bitWidth &* 9 &+ 64) &- (clz &* 9)) / 64
```
`b` は `bitWidth - clz` なので、式を整理すると `(9 × bitWidth + 64 - 9 × clz) / 64` の形になります。コードの `UInt32.bitWidth &* 9 &+ 64` と `clz &* 9` が、それに当たります。

例として `128`（ビット数 8）を計算します。`clz` は 24 なので、`(288 + 64 - 216) / 64 = 136 / 64 = 2` です。`128` は 2 バイトになります。

## ここがすごい

- **分岐がない**: 「1 バイトに収まるか、2 バイトか…」と条件を並べると、値によって処理が変わります。この式は、どの値でも同じ命令の列で終わります。
- **割り算を 2 のべき乗に**: 最後の `/ 64` は、ただのシフトで済みます。`9 / 64` という比率が、7 で割る代わりになっています。
- **近似が正確**: `(9b + 64) / 64` は、ビット数 0〜64 のすべてで「7 で割って切り上げた値」と一致します。整数だけで、正確な答えが出せるのがポイントです。
- **出典が明記されている**: コメントに、C++ の実装から取ったことが書かれています。性能のための式を、元の実装と関連付けられます。

## まとめ

- varint のバイト数は、ビット数を 7 で割って切り上げた値になる。
- 割り算を、掛け算・足し算・2 のべき乗の割り算で置き換えると、分岐なしで計算できる。
- 数式の正しさは、端の値（0 や境界のビット数）で確かめると安心できる。
