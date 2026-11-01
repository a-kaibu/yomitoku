---
title: "範囲の外の添字を、エラーにせず nil で返す"
description: "配列などの添字が範囲内かを確かめ、範囲内なら要素を、範囲外なら nil を返す Vapor の subscript(safe:)。"
language: swift
project: "Vapor"
repo: https://github.com/vapor/vapor
license: MIT
copyright: "Copyright (c) 2020 Qutheory, LLC"
commit: "0f2a8ee9f38b2589c066b604de3e3168ed54c82d"
file: Sources/Vapor/Utilities/Collection+Safe.swift
lines: [1, 6]
function: "subscript(safe:)"
difficulty: 1
tags: [防御的プログラミング, イディオム]
format: 2
---
## ひとことで

配列の添字に、範囲外の番号を指定すると、普通はプログラムが止まります。この添字は、範囲外のときは `nil` を返すので、止まらずに「値がない」として扱えます。

## コード

::: code-group

```swift:line-numbers=1 [日本語訳]
extension Collection {
    /// 添字が範囲内なら要素を、範囲外なら nil を返します。
    subscript(safe index: Index) -> Element? {
        self.indices.contains(index) ? self[index] : nil
    }
}
```

```swift:line-numbers=1 [原文]
extension Collection {
    /// Returns the element at the specified index if it is within bounds, otherwise nil.
    subscript(safe index: Index) -> Element? {
        self.indices.contains(index) ? self[index] : nil
    }
}
```

:::

## 前提知識

- **添字（index）**: 配列などで、位置を指定するための値です。`array[0]` は先頭の要素を表します。
- **範囲外の添字**: 要素の数を超える添字です。普通の添字の書き方では、実行時エラーになります。
- **オプショナル（`Element?`）**: 値があるか、ないかを表す型です。値がないときは `nil` を返します。
- **`indices`**: コレクションの有効な添字の範囲です。`contains` で、ある添字がその範囲に入るかを調べられます。

## 何をしているか

### 1. 添字が有効な範囲に入るかを調べる

`self.indices.contains(index)` で、添字が有効かを確かめます。ここでは、その結果で分岐します。

```swift:line-numbers=3
    subscript(safe index: Index) -> Element? {
```
### 2. 有効なら要素を、無効なら nil を返す

条件が真なら、通常の添字で要素を取り出します。偽なら、`nil` を返します。三項演算子 `? :` で 1 行に書かれています。

```swift:line-numbers=4
        self.indices.contains(index) ? self[index] : nil
```
## ここがすごい

- **書き方が普通の添字と揃う**: `array[safe: 5]` のように書けるので、呼ぶ側の読み方が自然です。
- **エラーで止まらない**: 外部から来た番号など、確かでない添字を扱うときに、安全に使えます。
- **どのコレクションでも使える**: `Collection` の拡張として書かれているので、配列、文字列、辞書の添字の並びなどに使えます。

## まとめ

- 添字が範囲内かを `indices.contains` で確かめる。
- 範囲内なら要素を、範囲外なら `nil` を返す。
- 確かでない番号を扱うときに、この添字を使う。
