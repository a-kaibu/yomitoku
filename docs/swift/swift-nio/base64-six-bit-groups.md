---
title: "3 バイトを 6 ビットずつ切り分けて、Base64 の 4 文字にする"
description: "Base64 エンコードで、3 バイトのかたまりを 6 ビットずつの 4 つの値に切り分け、それぞれを文字に変える関数群。残りのバイトがないときは、埋め草の「=」を出す。"
language: swift
project: "SwiftNIO"
repo: https://github.com/apple/swift-nio
license: Apache-2.0
copyright: "Copyright (c) 2017-2023 Apple Inc. and the SwiftNIO project authors"
commit: "108daca35da6a1b4ed8da29c1dfbd19668b9b8fc"
file: Sources/_NIOBase64/Base64.swift
lines: [160, 195]
function: "Base64.encode(alphabet:firstByte:secondByte:)"
difficulty: 2
tags: [ビット演算, 文字列処理, 低レイヤ]
format: 2
---
## ひとことで

Base64 は、バイト列を、英数字と記号の 64 種類の文字だけで書き直す方法です。メールの添付や、URL に載せない文字列などに使われます。
3 バイトは 24 ビットで、これを 6 ビットずつ 4 つに分けると、それぞれが 0〜63 の値になります。この 4 つの値を、文字に変えたものが Base64 の 4 文字です。
この 4 つの関数は、その 1 文字ずつを作ります。

## コード

::: code-group

```swift:line-numbers=160 [日本語訳]
    static func encode(alphabet: [UInt8], firstByte: UInt8) -> UInt8 {
        let index = firstByte >> 2
        return alphabet[Int(index)]
    }

    @usableFromInline
    static func encode(alphabet: [UInt8], firstByte: UInt8, secondByte: UInt8?) -> UInt8 {
        var index = (firstByte & 0b00000011) << 4
        if let secondByte = secondByte {
            index += (secondByte & 0b11110000) >> 4
        }
        return alphabet[Int(index)]
    }

    @usableFromInline
    static func encode(alphabet: [UInt8], secondByte: UInt8?, thirdByte: UInt8?) -> UInt8 {
        guard let secondByte = secondByte else {
            // 2 バイト目がなければ、埋め草の `=` を出すだけです。
            return Base64.encodePaddingCharacter
        }
        var index = (secondByte & 0b00001111) << 2
        if let thirdByte = thirdByte {
            index += (thirdByte & 0b11000000) >> 6
        }
        return alphabet[Int(index)]
    }

    @usableFromInline
    static func encode(alphabet: [UInt8], thirdByte: UInt8?) -> UInt8 {
        guard let thirdByte = thirdByte else {
            // 3 バイト目がなければ、埋め草の `=` を出します。
            return Base64.encodePaddingCharacter
        }
        let index = thirdByte & 0b00111111
        return alphabet[Int(index)]
    }
```

```swift:line-numbers=160 [原文]
    static func encode(alphabet: [UInt8], firstByte: UInt8) -> UInt8 {
        let index = firstByte >> 2
        return alphabet[Int(index)]
    }

    @usableFromInline
    static func encode(alphabet: [UInt8], firstByte: UInt8, secondByte: UInt8?) -> UInt8 {
        var index = (firstByte & 0b00000011) << 4
        if let secondByte = secondByte {
            index += (secondByte & 0b11110000) >> 4
        }
        return alphabet[Int(index)]
    }

    @usableFromInline
    static func encode(alphabet: [UInt8], secondByte: UInt8?, thirdByte: UInt8?) -> UInt8 {
        guard let secondByte = secondByte else {
            // No second byte means we are just emitting padding.
            return Base64.encodePaddingCharacter
        }
        var index = (secondByte & 0b00001111) << 2
        if let thirdByte = thirdByte {
            index += (thirdByte & 0b11000000) >> 6
        }
        return alphabet[Int(index)]
    }

    @usableFromInline
    static func encode(alphabet: [UInt8], thirdByte: UInt8?) -> UInt8 {
        guard let thirdByte = thirdByte else {
            // No third byte means just padding.
            return Base64.encodePaddingCharacter
        }
        let index = thirdByte & 0b00111111
        return alphabet[Int(index)]
    }
```

:::

## 前提知識

- **ビットの切り出し**: `&` でマスクし、`>>` や `<<` でずらすと、整数の中の一部のビットだけを取り出せます。
- **アルファベット**: 0〜63 の値を、文字に変える表です。`alphabet[Int(index)]` で、値に対応する文字を取り出します。
- **埋め草（パディング）**: 3 バイトのかたまりが足りないとき、Base64 では `=` を出して、4 文字の長さを揃えます。

## 何をしているか

### 1. 1 文字目: 1 バイト目の上位 6 ビット

1 バイト目を右に 2 ずらすと、上位 6 ビットが残ります。これが 1 文字目の値です。

```swift:line-numbers=161
        let index = firstByte >> 2
        return alphabet[Int(index)]
```
### 2. 2 文字目: 1 バイト目の下位 2 ビットと、2 バイト目の上位 4 ビット

1 バイト目の下位 2 ビットを、上位へ 4 つずらします。2 バイト目があれば、その上位 4 ビットを下位へずらして、足し合わせます。2 バイト目がなければ、1 バイト目の 2 ビットだけで値を作ります。

```swift:line-numbers=166
    static func encode(alphabet: [UInt8], firstByte: UInt8, secondByte: UInt8?) -> UInt8 {
        var index = (firstByte & 0b00000011) << 4
        if let secondByte = secondByte {
            index += (secondByte & 0b11110000) >> 4
        }
        return alphabet[Int(index)]
```
### 3. 3 文字目: 2 バイト目の下位 4 ビットと、3 バイト目の上位 2 ビット

2 バイト目の下位 4 ビットを左に 2 ずらします。3 バイト目があれば、その上位 2 ビットを右へずらして加えます。2 バイト目がなければ、埋め草の `=` を返します。

```swift:line-numbers=175
    static func encode(alphabet: [UInt8], secondByte: UInt8?, thirdByte: UInt8?) -> UInt8 {
        guard let secondByte = secondByte else {
            // 2 バイト目がなければ、埋め草の `=` を出すだけです。
            return Base64.encodePaddingCharacter
        }
        var index = (secondByte & 0b00001111) << 2
        if let thirdByte = thirdByte {
            index += (thirdByte & 0b11000000) >> 6
        }
        return alphabet[Int(index)]
```
### 4. 4 文字目: 3 バイト目の下位 6 ビット

3 バイト目の下位 6 ビットが、そのまま 4 文字目の値です。3 バイト目がなければ、`=` を返します。

```swift:line-numbers=188
    static func encode(alphabet: [UInt8], thirdByte: UInt8?) -> UInt8 {
        guard let thirdByte = thirdByte else {
            // 3 バイト目がなければ、埋め草の `=` を出します。
            return Base64.encodePaddingCharacter
        }
        let index = thirdByte & 0b00111111
        return alphabet[Int(index)]
```
## ここがすごい

- **6 ビットに揃えるための、ずらしとマスク**: 3 バイトの 24 ビットを、4 つの 6 ビットに分けます。各関数は、必要なビットだけを `&` で切り出すので、他のビットに影響しません。
- **欠けたバイトを、関数の分岐で表す**: 2 バイト目や 3 バイト目が `nil` のとき、その文字だけを `=` にします。終わりの処理を、別の特別な場合分けにしなくて済みます。
- **文字の表だけで変換できる**: 値から文字への変換は、アルファベットの表を引くだけです。計算は整数の演算だけで終わります。

## まとめ

- Base64 の 4 文字は、3 バイトを 6 ビットずつに切った値を、表で文字に変えたもの。
- 欠けたバイトの文字は、`=` の埋め草になる。
- 各文字は、必要なビットだけを切り出す小さな関数として分けられている。
