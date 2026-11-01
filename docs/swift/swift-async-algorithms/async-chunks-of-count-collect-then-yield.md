---
title: "非同期の列を、指定した個数ずつの配列にまとめて返す"
description: "非同期シーケンスの要素を、指定した個数になるまで読み足してから 1 つのコレクションとして返す AsyncChunksOfCountSequence の next()。"
language: swift
project: "Swift Async Algorithms"
repo: https://github.com/apple/swift-async-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 Apple Inc. and the Swift project authors"
commit: "cbde9aed744bc058974e6bd5c0367ca55a6bf97c"
file: Sources/AsyncAlgorithms/AsyncChunksOfCountSequence.swift
lines: [55, 74]
function: "AsyncChunksOfCountSequence.Iterator の next()"
difficulty: 2
tags: [非同期, イテレータ]
format: 2
---
## ひとことで

非同期で届く値を、指定した個数（たとえば 3 個）ずつまとめて、1 つの配列のような塊にして返します。値が届くのを `await` で待ちながら、個数がそろうまで読み足していきます。

## コード

```swift:line-numbers=55
    public mutating func next() async rethrows -> Collected? {
      guard let first = try await base.next() else {
        return nil
      }

      if count == 1 {
        return Collected(CollectionOfOne(first))
      }

      var result: Collected = .init()
      result.append(first)

      while let next = try await base.next() {
        result.append(next)
        if result.count == count {
          break
        }
      }
      return result
    }
```

## 前提知識

- **`AsyncSequence` と `await`**: 値が届くのを待ってから次の値を取り出す列です。`await base.next()` は、次の値が届くまで処理を一時停止します。
- **`RangeReplaceableCollection`**: 要素を追加できる、配列のような型の条件です。`Collected` には、`[Int]` などが入ります。
- **`CollectionOfOne`**: 要素が 1 つだけの、軽量なコレクションです。
- **`rethrows` と `async`**: 元の列がエラーを投げれば、その分だけこの関数もエラーを投げます。

## 何をしているか

### 1. 最初の要素を読む

まず 1 つ読みます。読めなければ、列の終わりなので `nil` を返します。

```swift:line-numbers=56
      guard let first = try await base.next() else {
        return nil
      }
```
### 2. 個数が 1 なら、その 1 つだけを返す

`count` が 1 のときは、読み足す必要がありません。1 つだけのコレクションを作って返します。

```swift:line-numbers=60
      if count == 1 {
        return Collected(CollectionOfOne(first))
      }
```
### 3. 個数がそろうまで、読み足す

空のコレクションに最初の要素を入れ、続けて次の値を読みます。個数に達したら `break` で止めます。

```swift:line-numbers=64
      var result: Collected = .init()
      result.append(first)

      while let next = try await base.next() {
        result.append(next)
        if result.count == count {
          break
        }
      }
```
### 4. まとまりを返す

個数がそろったコレクションを返します。列の途中で終わったときは、それまでに集まった分だけを返します。

```swift:line-numbers=73
      return result
```
## ここがすごい

- **個数で区切る**: 時間で区切るのではなく、個数がそろったら返すので、結果の大きさが予測できます。
- **1 つだけの特別扱い**: `count == 1` を別に書くことで、よくある場合を、余計な処理なしで済ませています。
- **待ちながら集める**: 値が届くまでは `await` で待つので、ほかの処理を止めずに、まとまりを作れます。

## まとめ

- 最初の 1 つを読み、個数に達するまで読み足す。
- 個数が 1 のときは、特別に 1 つだけのコレクションを返す。
- 列の終わりに達したら、集まった分だけを返す。
