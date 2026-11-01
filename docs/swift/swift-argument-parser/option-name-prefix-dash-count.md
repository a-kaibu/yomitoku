---
title: "-x と --name を、ハイフンの数で種類の違う名前に分ける"
description: "コマンドラインの引数の先頭のハイフンの数を見て、長い名前、1 文字の名前、ハイフン 1 つの長い名前に分類する Argument Parser の Name の初期化。"
language: swift
project: "Swift Argument Parser"
repo: https://github.com/apple/swift-argument-parser
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "38ca4eceb349155836701b88da3e0986eb9d1e1c"
file: Sources/ArgumentParser/Parsing/Name.swift
lines: [24, 36]
function: "init(_:)"
difficulty: 2
tags: [CLI, パース]
format: 2
---
## ひとことで

コマンドラインの `--verbose` と `-v` と `-verbose` は、見た目が似ていますが、意味が違う名前です。この初期化は、先頭のハイフンの数と文字数を見て、どの種類の名前かを決めます。

## コード

::: code-group

```swift:line-numbers=24 [日本語訳]
  init(_ baseName: Substring) {
    assert(
      baseName.first == "-", "Attempted to create name for unprefixed argument")
    if baseName.hasPrefix("--") {
      self = .long(String(baseName.dropFirst(2)))
    } else if baseName.count == 2, let name = baseName.last {
      // 1 文字の名前（例: -x）の形です。
      self = .short(name)
    } else {
      // ハイフンを 1 つだけ付けた長い名前です。
      self = .longWithSingleDash(String(baseName.dropFirst()))
    }
  }
```

```swift:line-numbers=24 [原文]
  init(_ baseName: Substring) {
    assert(
      baseName.first == "-", "Attempted to create name for unprefixed argument")
    if baseName.hasPrefix("--") {
      self = .long(String(baseName.dropFirst(2)))
    } else if baseName.count == 2, let name = baseName.last {
      // single character "-x" style
      self = .short(name)
    } else {
      // long name with single dash
      self = .longWithSingleDash(String(baseName.dropFirst()))
    }
  }
```

:::

## 前提知識

- **オプション名**: `--output` のように、コマンドラインの引数を指定する名前です。先頭にハイフンを付けて書きます。
- **`Substring`**: 文字列の一部を、コピーせずに指す型です。引数の文字列を切り出して、そのまま判定に使えます。
- **`enum` の関連値**: `case long(String)` のように、ケースごとに値を持たせられる仕組みです。
- **`assert`**: 開発時にだけ、条件が成り立つかを確かめる文です。

## 何をしているか

### 1. `--` で始まれば、長い名前

`--` で始まるなら、長い名前です。先頭の 2 文字を取り除いた残りが、名前になります。

```swift:line-numbers=27
    if baseName.hasPrefix("--") {
      self = .long(String(baseName.dropFirst(2)))
```
### 2. ハイフン 1 つと 1 文字なら、短い名前

`-x` のように、全体が 2 文字で、文字が 1 つだけのときは、1 文字の名前です。

```swift:line-numbers=29
    } else if baseName.count == 2, let name = baseName.last {
      // 1 文字の名前（例: -x）の形です。
      self = .short(name)
```
### 3. それ以外は、ハイフン 1 つの長い名前

`-verbose` のように、ハイフン 1 つで始まる長い名前はここに入ります。

```swift:line-numbers=32
    } else {
      // ハイフンを 1 つだけ付けた長い名前です。
      self = .longWithSingleDash(String(baseName.dropFirst()))
```
## ここがすごい

- **先頭の並びだけで分類する**: 文字の数と先頭の記号だけを見て、種類を決めています。正規表現を使わずに済みます。
- **分類ごとに別のケースを使う**: 名前の種類を型で区別するので、後の処理で取り違えることがありません。
- **前提を `assert` で書く**: 先頭が `-` でない文字列を受け取ったら、開発中に気づけるようにしています。

## まとめ

- `--` で始まれば長い名前、`-x` の形なら 1 文字の名前、それ以外はハイフン 1 つの長い名前。
- 種類は文字列の先頭と長さで決める。
- 種類ごとに `enum` のケースを分けて、後の処理で区別する。
