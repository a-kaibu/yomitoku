---
title: "QUIC の整数の長さを、1・2・4・8 バイトの近い方へ丸める"
description: "QUIC の可変長整数は 1、2、4、8 バイトのどれかで表す決まりなので、指定された値を最も近い有効な長さへ変換する SwiftNIO の IntegerLength。"
language: swift
project: "SwiftNIO"
repo: https://github.com/apple/swift-nio
license: Apache-2.0
copyright: "Copyright (c) 2024 Apple Inc. and the SwiftNIO project authors"
commit: "108daca35da6a1b4ed8da29c1dfbd19668b9b8fc"
file: Sources/NIOCore/ByteBuffer-quicBinaryEncodingStrategy.swift
lines: [30, 38]
function: "IntegerLength.init(roundingFrom:)"
difficulty: 1
tags: [ネットワーク, ビット演算]
format: 2
---
## ひとことで

QUIC という通信プロトコルでは、整数を書くのに 1、2、4、8 バイトのどれかを使います。3 バイトという長さは存在しません。この初期化は、外から指定された長さを、表せる長さのどれかへ丸めます。

## コード

```swift:line-numbers=30
            @inlinable
            public init(roundingFrom value: Int) {
                switch value {
                case ...1: self = .one
                case 2: self = .two
                case 3, 4: self = .four
                default: self = .eight
                }
            }
```

## 前提知識

- **QUIC**: 新しい通信プロトコルで、HTTP/3 などの土台になっています。整数の書き方が、RFC 9000 で決められています。
- **可変長整数**: 値の大きさに応じて、バイト数を変える書き方です。小さい値は短く、大きい値は長く書けます。
- **`enum` の生の値**: `case one = 1` のように、ケースに整数の値を結び付けられます。`rawValue` で取り出せます。
- **`switch` の範囲パターン**: `case ...1:` は「1 以下」、`case 3, 4:` は「3 か 4」を表します。

## 何をしているか

### 1. 指定された値を、`switch` で分類する

`value` の大きさで、4 つの長さのどれかを選びます。

```swift:line-numbers=31
            public init(roundingFrom value: Int) {
                switch value {
                case ...1: self = .one
                case 2: self = .two
                case 3, 4: self = .four
                default: self = .eight
                }
```
### 2. 1 以下なら 1 バイト、2 なら 2 バイト

値が 1 以下のときは、最も短い 1 バイトを選びます。値が 2 のときは、2 バイトを選びます。

### 3. 3 と 4 は 4 バイト、それより大きければ 8 バイト

3 や 4 は、2 バイトでは足りず、4 バイトで表せます。5 以上は 8 バイトに丸めます。

## ここがすごい

- **有効な値だけを持つ**: `enum` の 4 つのケースだけが存在するので、3 バイトのような無効な長さを、型の上で表せません。
- **切り上げと上限を同時に表す**: 足りない値は次の長さへ、大きすぎる値は最大の長さへ丸めます。`default` が上限をまとめています。
- **分類を 1 つの `switch` で書く**: 範囲が重ならないように並べて、読みやすくしています。

## まとめ

- QUIC の整数は、1、2、4、8 バイトのどれかだけ。
- 指定された値は、表せる長さのうち、次に大きい長さへ丸める。
- 最大を超えた値は、8 バイトに上限を揃える。
