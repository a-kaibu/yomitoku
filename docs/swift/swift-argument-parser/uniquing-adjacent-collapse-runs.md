---
title: "連続して同じ値が続く部分を、1 つにまとめる"
description: "隣り合う同じ要素の並びを、先頭の 1 つだけに縮める Argument Parser の uniquingAdjacentElements()。離れた同じ値は残す。"
language: swift
project: "Swift Argument Parser"
repo: https://github.com/apple/swift-argument-parser
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "38ca4eceb349155836701b88da3e0986eb9d1e1c"
file: Sources/ArgumentParser/Utilities/SequenceExtensions.swift
lines: [25, 37]
function: "uniquingAdjacentElements()"
difficulty: 2
tags: [データ構造, イディオム]
format: 2
---
## ひとことで

`[1, 2, 2, 2, 3, 3, 2, 2, 1]` のように、同じ値が連続している部分を、1 つにまとめます。結果は `[1, 2, 3, 2, 1]` です。`uniquing()` と違い、離れた場所に同じ値があっても残します。

## コード

```swift:line-numbers=25
  func uniquingAdjacentElements() -> [Element] {
    var iterator = makeIterator()
    guard let first = iterator.next()
    else { return [] }

    var result = [first]
    while let element = iterator.next() {
      if result.last != element {
        result.append(element)
      }
    }
    return result
  }
```

## 前提知識

- **`Sequence`**: 要素を先頭から順に取り出せる型の条件です。`makeIterator()` で、取り出し役を作れます。
- **イテレータ**: 要素を 1 つずつ返す役です。`next()` を呼ぶと、次の要素が返るか、終わりなら `nil` が返ります。
- **`guard let`**: 空の列を先に処理して、その後は要素がある前提で書くための書き方です。
- **`result.last`**: 結果の配列の最後の要素です。空なら `nil` になります。

## 何をしているか

### 1. 先頭の要素を取り出し、結果を始める

列の先頭を取り出します。空なら、結果も空です。先頭があれば、それを `result` の最初の要素にします。

```swift:line-numbers=26
    var iterator = makeIterator()
    guard let first = iterator.next()
    else { return [] }

    var result = [first]
```
### 2. 直前の結果と違う値だけを足す

次の要素を順に取り出し、結果の最後と比べます。違う値なら追加します。同じ値なら、連続の途中なので無視します。

```swift:line-numbers=31
    while let element = iterator.next() {
      if result.last != element {
        result.append(element)
      }
    }
```
### 3. 結果を返す

連続が縮められた配列を返します。

```swift:line-numbers=36
    return result
```
## ここがすごい

- **比べるのは直前だけ**: 結果の最後と比べるだけなので、配列全体を探す必要がありません。
- **離れた同じ値は残る**: 連続していない場合は、前の値と違うので追加されます。`uniquing()` とは、ここが違います。
- **空の列の扱いを先に書く**: `guard let` で、先頭がない場合を最初に処理しています。以降の処理は、要素がある前提で読めます。

## まとめ

- 結果の最後と比べて、違う値だけを追加する。
- 同じ値が続く場合は、先頭の 1 つだけ残る。
- 離れた同じ値は、別の塊として残る。
