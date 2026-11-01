---
title: "変換して、最初に値が出たところで止める"
description: "swift-algorithms の firstNonNil(_:) で、各要素を変換し、最初に nil でない結果が出たところで探索を止める関数。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/FirstNonNil.swift
lines: [34, 43]
function: "Sequence.firstNonNil(_:)"
difficulty: 1
tags: [探索, アルゴリズム]
format: 2
---
## ひとことで

たくさんの候補から、条件に合う最初の結果を 1 つだけ取りたいことがあります。この関数は、要素を 1 つずつ変換し、最初に値が得られた時点で結果を返します。残りの要素は、読まずに済みます。

## コード

```swift:line-numbers=34
  public func firstNonNil<Result>(
    _ transform: (Element) throws -> Result?
  ) rethrows -> Result? {
    for value in self {
      if let value = try transform(value) {
        return value
      }
    }
    return nil
  }
```

## 前提知識

- **`Sequence`**: 要素を順に読める列の型です。配列やセットなどが当てはまります。
- **変換クロージャ**: 要素を受け取り、別の値を返す関数です。ここでは `Result?` を返します。
- **`Optional` の `if let`**: 結果が nil でなければ、中身を取り出して使います。
- **`rethrows`**: 渡されたクロージャがエラーを投げたときだけ、この関数もエラーを投げる書き方です。

## 何をしているか

### 1. 要素を順に読み、変換する

`for` で要素を先頭から読み、渡された変換を 1 つずつ試します。

```swift:line-numbers=37
    for value in self {
      if let value = try transform(value) {
```
### 2. 値が出たら、すぐに返す

変換の結果が nil でなければ、その値を返します。ここで処理が終わるので、後ろの要素は読まれません。

```swift:line-numbers=39
        return value
      }
```
### 3. 最後まで値が出なければ、nil を返す

すべての要素を試しても値が出なければ、`nil` を返します。

```swift:line-numbers=42
    return nil
```
## ここがすごい

- **無駄な変換をしない**: 最初の一致で止まるので、後ろの要素に変換の処理を行いません。重い処理があっても、必要な分だけ動きます。
- **先に全部変換しない**: `map` で全部変換してから `first` を取る方法では、残りの要素も変換されてしまいます。
- **nil を値として扱える**: 「値がない」を nil で表し、そのまま戻り値の型に使っています。

## まとめ

- 要素を先頭から順に変換する。
- nil でない結果が出たら、その時点で返す。
- 最後まで出なければ nil を返す。
