---
title: "非同期の列を、隣り合う 2 つずつの組に変換する"
description: "非同期シーケンスの要素を、前の要素を覚えながら 1 つずつ読み、隣り合う 2 つの組として返す AsyncAdjacentPairsSequence の next()。"
language: swift
project: "Swift Async Algorithms"
repo: https://github.com/apple/swift-async-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2022 Apple Inc. and the Swift project authors"
commit: "cbde9aed744bc058974e6bd5c0367ca55a6bf97c"
file: Sources/AsyncAlgorithms/AsyncAdjacentPairsSequence.swift
lines: [69, 80]
function: "AsyncAdjacentPairsSequence.Iterator の next()"
difficulty: 2
tags: [非同期, イテレータ]
format: 2
---
## ひとことで

非同期で届く値の列（`AsyncSequence`）を、隣り合う 2 つずつの組に変えます。前に読んだ値を 1 つ覚えておき、次の値が届くたびに組にして返します。

## コード

```swift:line-numbers=69
    public mutating func next() async rethrows -> (Base.Element, Base.Element)? {
      if previousElement == nil {
        previousElement = try await base.next()
      }

      guard let previous = previousElement, let next = try await base.next() else {
        return nil
      }

      previousElement = next
      return (previous, next)
    }
```

## 前提知識

- **`AsyncSequence`**: `await` で 1 つずつ値を取り出せる列です。値がまだ届いていない間は、処理を一時停止して待ちます。
- **イテレータ**: 列の要素を、先頭から 1 つずつ取り出す仕組みです。`next()` を呼ぶと、次の要素を返します。
- **オプショナル（`?`）**: 値がまだないことや、列の終わりを表します。`nil` は、もう値が出ないことを表します。
- **`mutating`**: 構造体の中の値を書き換えるメソッドに付けるキーワードです。

## 何をしているか

### 1. 前の要素を、覚えておく

最初の 1 回だけ、先頭の要素を読んで `previousElement` に入れます。以降は、ここに「直前に返した要素」が入っています。

```swift:line-numbers=21
  ///
  /// // First: 1, Second: 2
```
```swift:line-numbers=70
      if previousElement == nil {
        previousElement = try await base.next()
      }

```
### 2. 次の要素を読み、組にする

次の要素を読みます。読めなければ、列の終わりなので `nil` を返します。読めたら、直前の要素と組にして返し、次の回のために次の要素を覚えます。

```swift:line-numbers=74
      guard let previous = previousElement, let next = try await base.next() else {
        return nil
      }

      previousElement = next
      return (previous, next)
```
## ここがすごい

- **1 つ分だけ覚える**: 列の全部を保存せず、直前の 1 つだけを持ちます。長い列でも、メモリをほとんど使いません。
- **値が届くまで待つ**: `await` で待つので、値が届く前にスレッドを止めることはありません。
- **列の終わりを正しく扱う**: 次の要素がないときは、組を作らずに `nil` を返します。

## まとめ

- 直前の要素を 1 つだけ覚えておき、次の要素と組にして返す。
- 非同期の列でも、`await` を付けて同じ考え方で書ける。
- 次の要素がないときは `nil` を返して列の終わりを知らせる。
