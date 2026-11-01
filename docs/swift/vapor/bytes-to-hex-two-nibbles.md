---
title: "1 バイトを上位と下位の 4 ビットに分け、16 進数の 2 文字にする"
description: "バイト列を 16 進数の文字列へ変える Vapor の処理。1 バイトを 16 で割った商と余りを、文字の表で引いて 2 文字にする。"
language: swift
project: "Vapor"
repo: https://github.com/vapor/vapor
license: MIT
copyright: "Copyright (c) 2020 Qutheory, LLC"
commit: "0f2a8ee9f38b2589c066b604de3e3168ed54c82d"
file: Sources/Vapor/Utilities/Bytes+Hex.swift
lines: [23, 43]
function: "hexEncodedBytes(uppercase:)"
difficulty: 1
tags: [文字列処理, 低レイヤ]
format: 2
---
## ひとことで

バイトの並びを、16 進数の文字の並びに変えます。1 バイトは 2 桁の 16 進数で表せるので、上の 4 ビットと下の 4 ビットに分けて、それぞれ 1 文字にします。

## コード

```swift:line-numbers=23
    public func hexEncodedBytes(uppercase: Bool = false) -> [UInt8] {
        let table: [UInt8] = uppercase ? radix16TableUppercase : radix16TableLowercase

        return .init(capacity: self.count * 2) { span in
            for byte in self {
                let nibs = byte.quotientAndRemainder(dividingBy: 16)

                span.append(table[numericCast(nibs.quotient)])
                span.append(table[numericCast(nibs.remainder)])
            }
        }
    }
}

private let radix16TableUppercase: [UInt8] = [
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
]

private let radix16TableLowercase: [UInt8] = [
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66,
]
```

## 前提知識

- **16 進数**: 0 から 9 と A から F（または a から f）の 16 種類の数字で表す方法です。1 桁で 4 ビットを表せます。
- **商と余り**: `quotientAndRemainder(dividingBy:)` は、割り算の商と余りを一度に返します。1 バイトを 16 で割ると、商が上の 4 ビット、余りが下の 4 ビットになります。
- **表（テーブル）**: 値の番号から、対応する文字を引くための配列です。`radix16TableLowercase` の先頭は `0x30`（文字 `0`）です。
- **`0x30` などの書き方**: 16 進数で書いた数値です。`0x41` は文字 `A`、`0x61` は文字 `a` の文字コードです。

## 何をしているか

### 1. 大文字と小文字の、どちらの表を使うか決める

`uppercase` の値によって、使う表を選びます。

```swift:line-numbers=24
        let table: [UInt8] = uppercase ? radix16TableUppercase : radix16TableLowercase
```
### 2. 1 バイトを、2 つの 4 ビットに分ける

1 バイトを 16 で割ると、商（上の 4 ビット）と余り（下の 4 ビット）が得られます。どちらも 0 から 15 の値です。

```swift:line-numbers=27
            for byte in self {
                let nibs = byte.quotientAndRemainder(dividingBy: 16)

                span.append(table[numericCast(nibs.quotient)])
                span.append(table[numericCast(nibs.remainder)])
```
### 3. 表を引いて、2 文字を追加する

商と余りを表の番号として使い、対応する文字をそれぞれ追加します。

```swift:line-numbers=41
private let radix16TableLowercase: [UInt8] = [
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66,
```
## ここがすごい

- **割り算で桁を取り出す**: 2 進数のビットを、16 で割るだけで上下に分けられます。16 進数の桁と、ビットの位置が対応しています。
- **表を使う**: 数字と文字の変換を、計算ではなく表の参照で行っています。表を変えれば、大文字と小文字を切り替えられます。
- **受け取る型を広くしている**: `Collection` の条件にしているので、`Data` や `[UInt8]` など、バイトの並びならどれにも使えます。

## まとめ

- 1 バイトを 16 で割り、商と余りの 2 つの 4 ビットに分ける。
- 商と余りを表の番号として、2 つの 16 進数の文字にする。
- 大文字か小文字かは、使う表で決める。
