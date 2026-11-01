---
title: "ZigZag で符号化された数を、元の符号つき整数に戻す"
description: "ZigZag 符号化された 64 ビットの符号なし整数を、元の符号つき整数に戻す関数。最下位ビットで符号を取り出し、残りを 1 ビット右にずらした値と XOR で合わせる。"
language: swift
project: "SwiftProtobuf"
repo: https://github.com/apple/swift-protobuf
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2016 Apple Inc. and the project authors"
commit: "61e40fbe39c7b40e48dec12ac96f73521372f34e"
file: Sources/SwiftProtobuf/ZigZag.swift
lines: [62, 64]
function: "ZigZag.decoded(_:) for UInt64"
difficulty: 2
tags: [ビット演算, 数値計算, 低レイヤ]
format: 2
---
## ひとことで

ZigZag 符号化された数を、元の符号つき整数に戻すのが、この関数です。読み込んだ varint を符号なしの `UInt64` として受け取り、`Int64` に変換します。
たとえば `1` は `-1`、`2` は `1`、`3` は `-2` に戻ります。

## コード

```swift:line-numbers=62
    static func decoded(_ value: UInt64) -> Int64 {
        Int64(value >> 1) ^ -Int64(value & 1)
    }
```

## 前提知識

- **ZigZag 符号化**: 符号つき整数を、絶対値が小さいほど小さい符号なしの数にする方法です。`0, -1, 1, -2, 2, …` が `0, 1, 2, 3, 4, …` に対応します。
- **最下位ビット**: 2 進数の一番右のビットです。ZigZag では、これが符号を表します。
- **算術右シフト（`>>`）**: 負の数を右にずらすと、符号ビットが広がります。

## 何をしているか

### 1. 関数の形を確かめる

入力は符号なしの `UInt64` で、varint から読んだ値です。出力は符号つきの `Int64` です。

```swift:line-numbers=62
    static func decoded(_ value: UInt64) -> Int64 {
```
### 2. 1 ビット右にずらし、符号で反転する

`value >> 1` で、符号のビットを取り除いた値を作ります。`value & 1` は、最下位ビットです。これが 1 なら、元の数は負なので、`-Int64(value & 1)` は `-1` になり、XOR で全ビットを反転させます。0 なら `0` で、そのままです。

```swift:line-numbers=63
        Int64(value >> 1) ^ -Int64(value & 1)
```
例として、`3` は `(3 >> 1) ^ -(3 & 1) = 1 ^ -1 = -2` になります。`2` は `1 ^ 0 = 1` になります。

## ここがすごい

- **符号を最下位ビットに置いている**: 符号を最後のビットで表すので、絶対値の部分を先にずらして取り出せます。
- **反転を XOR で書く**: `-1` との XOR は、すべてのビットを反転させます。条件分岐なしで、負の数の補数の形に戻せます。
- **符号化と対で読むと分かりやすい**: 符号化は `(value << 1) ^ (value >> 63)` で、この式を逆にたどると、復号の式になります。

## まとめ

- 復号は、1 ビット右にずらした値と、最下位ビットから作った符号の XOR で求まる。
- 符号は最下位ビットに入っているので、取り出しは 1 回のビット操作で済む。
- 符号化と対で読むと、式の意味が理解しやすい。
