---
title: "空白を飛ばして、16 進数 2 桁を 1 バイトにする"
description: "swift-nio の popNextHexByte が、先頭の空白を読み飛ばし、16 進数の 2 文字を取り出して 1 バイトにまとめる処理。1 文字しか残っていないときはエラーにする。"
language: swift
project: "SwiftNIO"
repo: https://github.com/apple/swift-nio
license: Apache-2.0
copyright: "Copyright (c) 2023 Apple Inc. and the SwiftNIO project authors"
commit: "108daca35da6a1b4ed8da29c1dfbd19668b9b8fc"
file: Sources/NIOCore/ByteBuffer-hex.swift
lines: [405, 419]
function: "popNextHexByte()"
difficulty: 2
tags: [パース, 文字列処理]
format: 2
---
## ひとことで

`"0a ff 10"` のような 16 進数の文字列から、1 バイトずつ数値を取り出したいことがあります。この関数は、空白を飛ばし、2 文字を読んで、1 バイトにまとめます。

## コード

::: code-group

```swift:line-numbers=405 [日本語訳]
    mutating func popNextHexByte() throws -> UInt8? {
        while let nextByte = self.first, nextByte.isASCIIWhitespace {
            self = self.dropFirst()
        }

        guard let firstHex = try self.popFirst()?.asciiHexNibble else {
            return nil  // 取り出せるバイトがないので、nil を返します。
        }

        guard let secondHex = try self.popFirst()?.asciiHexNibble else {
            throw ByteBuffer.HexDecodingError.invalidHexLength
        }

        return (firstHex << 4) | secondHex
    }
```

```swift:line-numbers=405 [原文]
    mutating func popNextHexByte() throws -> UInt8? {
        while let nextByte = self.first, nextByte.isASCIIWhitespace {
            self = self.dropFirst()
        }

        guard let firstHex = try self.popFirst()?.asciiHexNibble else {
            return nil  // No next byte to pop
        }

        guard let secondHex = try self.popFirst()?.asciiHexNibble else {
            throw ByteBuffer.HexDecodingError.invalidHexLength
        }

        return (firstHex << 4) | secondHex
    }
```

:::

## 前提知識

- **16 進数（hex）**: 0 から 9、a から f の 16 種類の数字で表す形です。1 バイトは 2 桁で表せます。
- **`asciiHexNibble`**: 1 文字を、0 から 15 の数値にする変換です。
- **ビットシフト `<< 4`**: 2 進数で 4 桁分、左にずらします。上の桁を 16 倍する意味になります。
- **`throws` と `nil`**: 読み残しがないときは `nil`、途中で壊れているときはエラーを返します。

## 何をしているか

### 1. 先頭の空白を飛ばす

先頭が空白の間は、1 文字ずつ読み捨てます。区切りの空白を気にせず読めます。

```swift:line-numbers=406
        while let nextByte = self.first, nextByte.isASCIIWhitespace {
            self = self.dropFirst()
        }
```
### 2. 1 文字目を読む

1 文字目を 16 進数の数値に変換します。読むものがなければ、`nil` を返して終わります。

```swift:line-numbers=410
        guard let firstHex = try self.popFirst()?.asciiHexNibble else {
            return nil  // 取り出せるバイトがないので、nil を返します。
        }
```
### 3. 2 文字目を読み、1 バイトにまとめる

2 文字目が読めなければ、桁が足りないのでエラーにします。読めたら、1 文字目を 4 ビット左にずらし、2 文字目と合わせて 1 バイトにします。

```swift:line-numbers=414
        guard let secondHex = try self.popFirst()?.asciiHexNibble else {
            throw ByteBuffer.HexDecodingError.invalidHexLength
        }

        return (firstHex << 4) | secondHex
```
## ここがすごい

- **空白に強い**: 区切りの空白があっても、同じ関数で続けて読めます。
- **桁の不足を見逃さない**: 2 文字目がないと、エラーで知らせます。
- **ビット演算で合成**: 2 つの値を、足し算ではなく、ずらしと `|` で組み立てています。

## まとめ

- 先頭の空白を読み飛ばす。
- 16 進数の 2 文字を、数値にする。
- 上の桁をずらして、1 バイトにまとめる。
