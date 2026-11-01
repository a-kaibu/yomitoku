---
title: "長さの前置きを読み、その分だけ切り出す"
description: "swift-nio の getLengthPrefixedSlice が、先頭の整数で長さを読み、その後ろの決まった長さの部分を切り出す処理。読めないときは nil を返す。"
language: swift
project: "SwiftNIO"
repo: https://github.com/apple/swift-nio
license: Apache-2.0
copyright: "Copyright (c) 2021 Apple Inc. and the SwiftNIO project authors"
commit: "108daca35da6a1b4ed8da29c1dfbd19668b9b8fc"
file: Sources/NIOCore/ByteBuffer-lengthPrefix.swift
lines: [138, 151]
function: "getLengthPrefixedSlice(at:endianness:as:)"
difficulty: 2
tags: [パース, ネットワーク]
format: 2
---
## ひとことで

ネットワークの電文は、「先頭に長さを書き、その後ろに中身を置く」形がよく使われます。この関数は、指定した位置の整数で長さを読み、その長さ分の部分を取り出します。

## コード

```swift:line-numbers=138
    public func getLengthPrefixedSlice<Integer>(
        at index: Int,
        endianness: Endianness = .big,
        as integer: Integer.Type
    ) -> ByteBuffer? where Integer: FixedWidthInteger {
        guard let lengthPrefix = self.getInteger(at: index, endianness: endianness, as: Integer.self),
            let messageLength = Int(exactly: lengthPrefix),
            let messageBuffer = self.getSlice(at: index + MemoryLayout<Integer>.size, length: messageLength)
        else {
            return nil
        }

        return messageBuffer
    }
```

## 前提知識

- **`ByteBuffer`**: バイト列を効率よく扱う、SwiftNIO の型です。
- **長さの前置き（length prefix）**: 中身の前に、長さを整数で書いておく形式です。
- **`endianness`**: 整数のバイトの並び方（大きい方から、か、小さい方から、か）です。
- **`Int(exactly:)`**: 値を `Int` に変換できれば値を、できなければ nil を返します。

## 何をしているか

### 1. 長さの整数を読む

指定した位置から、長さを表す整数を読みます。読めなければ、ここで nil になります。

```swift:line-numbers=143
        guard let lengthPrefix = self.getInteger(at: index, endianness: endianness, as: Integer.self),
```
### 2. 長さを Int にし、中身の部分を切り出す

読んだ整数を `Int` に変換し、整数の後ろから、その長さ分の部分を切り出します。どちらか一方でも失敗すれば、nil を返します。

```swift:line-numbers=144
            let messageLength = Int(exactly: lengthPrefix),
            let messageBuffer = self.getSlice(at: index + MemoryLayout<Integer>.size, length: messageLength)
```
### 3. 切り出した部分を返す

すべてそろったら、中身の部分を返します。元の `ByteBuffer` はコピーされず、同じ領域の一部として返ります。

```swift:line-numbers=150
        return messageBuffer
    }
```
## ここがすごい

- **1 段ずつ確かめる**: 長さ、変換、切り出しの 3 段階で、失敗をそれぞれ見逃しません。
- **コピーしない**: 切り出した部分は、元の領域を指すスライスです。
- **読み取り専用**: 指定した位置から読むだけなので、元のバッファを変えません。

## まとめ

- 先頭の整数で、中身の長さを読む。
- 長さを `Int` にして、その分の部分を切り出す。
- 失敗したら nil、成功したら中身の部分を返す。
