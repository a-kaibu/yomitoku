---
title: "同じオプションの値が再び来たら、入力元の情報を合わせて上書きする"
description: "同じキーの引数を複数回受け取ったとき、新しい値で置き換えつつ、どの入力位置から来たかの情報を結合する ParsedValues の set。"
language: swift
project: "Swift Argument Parser"
repo: https://github.com/apple/swift-argument-parser
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "38ca4eceb349155836701b88da3e0986eb9d1e1c"
file: Sources/ArgumentParser/Parsing/ParsedValues.swift
lines: [42, 53]
function: "set(_:)"
difficulty: 2
tags: [CLI, データ構造]
format: 2
---
## ひとことで

`--name a --name b` のように、同じオプションが複数回指定されたときの処理です。値は新しいものに置き換えますが、どの入力位置から来たかの記録は、前の記録と合わせて残します。

## コード

::: code-group

```swift:line-numbers=42 [日本語訳]
  mutating func set(_ element: Element) {
    if let e = elements[element.key] {
      // 同じキーの値があれば、入力元の情報をまとめます。
      // 前に使った入力元の位置を、このキーのために覚えておく必要があります。
      // 同じオプションを複数回指定した場合の対応です。
      var element = element
      element.inputOrigin.formUnion(e.inputOrigin)
      elements[element.key] = element
    } else {
      elements[element.key] = element
    }
  }
```

```swift:line-numbers=42 [原文]
  mutating func set(_ element: Element) {
    if let e = elements[element.key] {
      // Merge the source values. We need to keep track
      // of any previous source indexes we have used for
      // this key.
      var element = element
      element.inputOrigin.formUnion(e.inputOrigin)
      elements[element.key] = element
    } else {
      elements[element.key] = element
    }
  }
```

:::

## 前提知識

- **入力元（InputOrigin）**: 値がコマンドラインのどの位置から来たかを、集合として持つ情報です。
- **辞書の添字**: `elements[key]` は、キーに対応する値を返します。値がなければ `nil` です。
- **`formUnion`**: 集合に、別の集合の要素をすべて加える（和集合にする）メソッドです。
- **`if let e = ...`**: 値があるかどうかを確かめ、あれば取り出して分岐する書き方です。

## 何をしているか

### 1. 同じキーの値がすでにあるかを調べる

`elements[element.key]` で、同じキーの値を探します。あれば、前の値の入力元を引き継ぐ処理に進みます。

```swift:line-numbers=43
    if let e = elements[element.key] {
```
### 2. 入力元の情報を合わせて、新しい値で置き換える

新しい値の入力元に、前の値の入力元を加えます。そのうえで、新しい値を辞書に入れます。前の入力位置の記録は残ります。

```swift:line-numbers=44
      // 同じキーの値があれば、入力元の情報をまとめます。
      // 前に使った入力元の位置を、このキーのために覚えておく必要があります。
      // 同じオプションを複数回指定した場合の対応です。
      var element = element
      element.inputOrigin.formUnion(e.inputOrigin)
      elements[element.key] = element
```
### 3. なければ、そのまま追加する

同じキーの値がなければ、新しい値をそのまま入れます。

```swift:line-numbers=50
    } else {
      elements[element.key] = element
    }
```
## ここがすごい

- **記録を失わない**: 値は置き換えても、どの位置から来たかの記録は消えません。後で、エラー表示などに使えます。
- **集合の和で合わせる**: `formUnion` 1 回で、2 つの記録が重複なくまとまります。
- **同じ書き方で新旧を扱う**: 既存の値があるかどうかで分岐するだけで、初めての値と 2 回目以降を同じ `set` で扱えます。

## まとめ

- 同じキーがあれば、入力元の記録を合わせてから、新しい値で置き換える。
- なければ、そのまま追加する。
- 値の置き換えと、入力位置の記録を分けて考えると分かりやすい。
