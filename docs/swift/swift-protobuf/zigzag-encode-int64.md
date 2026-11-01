---
title: "負の数を、小さい非負の数に並べ替える（ZigZag 符号化）"
description: "64 ビットの符号つき整数を、絶対値が小さいほど小さい符号なしの数に変える関数。負の数を符号ビットだけ延ばすと 10 バイトになってしまう問題を、ZigZag 符号化で避ける。"
language: swift
project: "SwiftProtobuf"
repo: https://github.com/apple/swift-protobuf
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2016 Apple Inc. and the project authors"
commit: "61e40fbe39c7b40e48dec12ac96f73521372f34e"
file: Sources/SwiftProtobuf/ZigZag.swift
lines: [38, 40]
function: "ZigZag.encoded(_:) for Int64"
difficulty: 2
tags: [ビット演算, 数値計算, 低レイヤ]
format: 2
---
## ひとことで

Protocol Buffers の varint は、小さい数を少ないバイトで書けます。しかし、負の数は上位のビットが 1 で埋まっているので、64 ビットとして書くと、常に 10 バイトになります。
この関数は、符号つきの数を **ZigZag 符号化** で、絶対値が小さいほど小さくなる符号なしの数に変えます。`0` は `0`、`-1` は `1`、`1` は `2`、`-2` は `3` になります。

## コード

```swift:line-numbers=38
    static func encoded(_ value: Int64) -> UInt64 {
        UInt64(bitPattern: (value << 1) ^ (value >> 63))
    }
```

## 前提知識

- **varint**: 小さい値ほど少ないバイトで書く整数の形式です。上位ビットが 0 なら、短く書けます。
- **符号ビット**: 整数の最上位のビットです。負の数では 1 になります。
- **算術右シフト（`>>`）**: 符号ビットを、右にずれた先の位置へ広げながらずらす操作です。負の数は `-1` になります。
- **XOR（`^`）**: 2 つのビットが違うと 1 になる演算です。

## 何をしているか

### 1. 関数の形を確かめる

入力は符号つきの `Int64`、出力は符号なしの `UInt64` です。符号なしの値は、varint で短く書けます。

```swift:line-numbers=38
    static func encoded(_ value: Int64) -> UInt64 {
```
### 2. 2 倍して、符号と XOR で混ぜる

`value << 1` で 2 倍にします。`value >> 63` は、正なら `0`、負なら `-1`（すべてのビットが 1）になります。これを XOR で混ぜると、正の数は `2 × value`、負の数は `-2 × value - 1` になります。

```swift:line-numbers=39
        UInt64(bitPattern: (value << 1) ^ (value >> 63))
```
例として、`-1` は `(-2) ^ (-1) = 1` になります。`1` は `2 ^ 0 = 2` になります。`-2` は `(-4) ^ (-1) = 3` になります。

## ここがすごい

- **絶対値が小さければ、符号化後も小さい**: `-1` や `1` は、どちらも 1 桁の値になります。varint で 1 バイトに収まります。
- **分岐がない**: 正か負かで条件分岐せず、符号のビットを使った 2 回のシフトと XOR だけで変換します。
- **元に戻せる**: 対応する復号（`decoded`）は、`(value >> 1) ^ -(value & 1)` の形で、同じ数に戻せます。1 対 1 の対応なので、情報は失われません。

## まとめ

- 負の数を、小さい符号なしの数に並べ替えると、varint で短く書ける。
- 2 倍して符号のビットを XOR で混ぜるだけで、分岐なしに変換できる。
- 変換は 1 対 1 なので、復号して元の数に戻せる。
