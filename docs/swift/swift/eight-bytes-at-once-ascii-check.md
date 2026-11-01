---
title: "8 バイトをまとめて読み、すべて ASCII かを 1 回の AND で調べる"
description: "バイト列のすべてが ASCII（最上位ビットが 0）かどうかを、8 バイトずつ読んでマスクとの AND で判定する標準ライブラリの関数。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/StringCreate.swift
lines: [41, 45]
function: "allASCII(wordAt:)"
difficulty: 2
tags: [ビット演算, 文字列処理, 低レイヤ]
format: 2
---
## ひとことで

文字列のバイトが、すべて ASCII（0 から 127 まで）かどうかを、1 バイトずつではなく 8 バイトまとめて調べます。ASCII のバイトは最上位ビットが 0 なので、そのビットだけを見れば十分です。

## コード

```swift:line-numbers=41
  @_transparent
  func allASCII(wordAt pointer: UnsafePointer<UInt8>) -> Bool {
    let word = unsafe UnsafeRawPointer(pointer).loadUnaligned(as: Word.self)
    return word & mask == 0
  }
```

## 前提知識

- **ASCII**: 0 から 127 までの値で表される文字です。UTF-8 では、1 バイトで表せる文字がこれにあたります。
- **最上位ビット**: 1 バイトの 8 ビットのうち、いちばん左のビットです。値 `0x80`（`10000000`）は、このビットだけが 1 の値です。
- **ワード**: CPU が一度に扱える大きさのデータです。64 ビットの環境では 8 バイトです。
- **`loadUnaligned`**: 位置がそろっていない場所からも、指定した型の値を読み出すメソッドです。

## 何をしているか

### 1. 8 バイトを、まとめて読む

ポインタの位置から、`Word`（64 ビット環境では 8 バイト）を読みます。

```swift:line-numbers=43
    let word = unsafe UnsafeRawPointer(pointer).loadUnaligned(as: Word.self)
```
### 2. マスクで、最上位ビットだけを調べる

マスクは、8 バイトそれぞれの最上位ビットだけが 1 の値です。読んだ値とマスクの AND が 0 なら、どのバイトにも最上位ビットが立っていません。つまり、8 バイトはすべて ASCII です。

```swift:line-numbers=22
  let mask = Word(truncatingIfNeeded: 0x80808080_80808080 as UInt64)
```
```swift:line-numbers=44
    return word & mask == 0
```
## ここがすごい

- **まとめて判定する**: 8 バイトを 1 回の AND で確かめるので、1 バイトずつ調べるより速く済みます。
- **結果を 0 かどうかだけで判断する**: どのバイトが違うかを探す必要がありません。0 でなければ、ASCII ではない部分が含まれています。
- **同じ考え方を広げている**: 下の `allASCII(blockAt:)` では、4 ワード分（32 バイト）を同じ考え方でまとめて調べています。

## まとめ

- ASCII のバイトは、最上位ビットが 0 になっている。
- 8 バイトを読み、`0x80` のマスクとの AND が 0 なら、すべて ASCII。
- 1 回の AND で 8 バイトを判定でき、速く調べられる。
