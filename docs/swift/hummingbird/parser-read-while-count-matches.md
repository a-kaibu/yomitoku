---
title: "同じ文字が続くあいだ読み進め、読んだ個数を返す"
description: "バッファの現在位置から、指定した文字が続くあいだだけ読み進める Hummingbird の HBParser の read(while:)。読んだ個数を返す。"
language: swift
project: "Hummingbird"
repo: https://github.com/hummingbird-project/hummingbird
license: Apache-2.0
copyright: "Copyright (c) the Hummingbird authors"
commit: "341e11f65d8e24cf87e9aae427c040f0084ada4e"
file: Sources/HummingbirdCore/Utils/HBParser.swift
lines: [277, 286]
function: "read(while:)"
difficulty: 1
tags: [パース, 文字列処理]
format: 2
---
## ひとことで

`   abc` の先頭にある空白を読み飛ばすように、同じ文字が続くあいだだけ位置を進め、その個数を返します。HTTP の値を解析するとき、区切りの前の空白などを数えるのに使えます。

## コード

```swift:line-numbers=277
    @discardableResult package mutating func read(while: Unicode.Scalar) -> Int {
        var count = 0
        while !self.reachedEnd(),
            unsafeCurrent() == `while`
        {
            unsafeAdvance()
            count += 1
        }
        return count
    }
```

## 前提知識

- **`Parser` の位置**: パーサは、内部に現在の位置を持ちます。読むと、位置が先へ進みます。
- **`unsafeCurrent()`**: 現在の位置の文字を、範囲の確認なしで取り出す内部の関数です。`reachedEnd()` で終わりを確かめてから呼びます。
- **`unsafeAdvance()`**: 位置を 1 つ進める内部の関数です。範囲の確認は、呼ぶ前の条件で済ませています。
- **`@discardableResult`**: 戻り値を使わなくても、警告を出さない印です。

## 何をしているか

### 1. 個数を 0 にして、読み進める条件を作る

`count` は、読んだ文字の数を数える変数です。`while` の条件は、終わりに達していないことと、現在の文字が指定の文字であることの 2 つです。

```swift:line-numbers=278
        var count = 0
        while !self.reachedEnd(),
            unsafeCurrent() == `while`
        {
```
### 2. 条件を満たすあいだ、1 つずつ進める

条件が成り立つあいだ、位置を 1 つ進め、個数を 1 増やします。

```swift:line-numbers=282
            unsafeAdvance()
            count += 1
        }
```
### 3. 読んだ個数を返す

条件が崩れた位置で止まり、そこまでに読んだ個数を返します。

```swift:line-numbers=285
        return count
    }
```
## ここがすごい

- **位置の確認を 1 か所に**: 終わりの判定を条件の先頭に書いているので、範囲外の文字を読むことがありません。
- **戻り値で結果が分かる**: 読んだ個数を返すので、呼ぶ側は、何文字飛ばしたかを続けて使えます。
- **同じ形の関数が多い**: 文字、文字の集合、関数で条件を決められる版が並んでいます。使う場面に応じて、同じ読み方を選べます。

## まとめ

- 終わりでないことと、指定の文字であることを、同時に確かめる。
- 条件が成り立つあいだ、位置と個数を 1 つずつ進める。
- 読んだ個数を返すので、続きの処理に使える。
