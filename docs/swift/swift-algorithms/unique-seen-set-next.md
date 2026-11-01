---
title: "一度見た値を覚えておき、新しいものだけ返す"
description: "swift-algorithms の uniqued() で、重複した要素を飛ばして返すイテレータの next()。見た値を Set に入れ、insert の結果で判断する。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Unique.swift
lines: [51, 58]
function: "UniquedSequence.Iterator.next()"
difficulty: 2
tags: [ハッシュ, イテレータ]
format: 2
---
## ひとことで

`[1, 2, 1, 3, 2]` から、重複を除いて `1, 2, 3` だけを順に取り出したいことがあります。この関数は、これまでに見た値を `Set` に覚えておき、初めて見た値だけを返します。

## コード

```swift:line-numbers=51
    public mutating func next() -> Base.Element? {
      while let element = base.next() {
        if seen.insert(projection(element)).inserted {
          return element
        }
      }
      return nil
    }
```

## 前提知識

- **`Set`**: 同じ値を 2 回入れられない集合です。値が入っているかを素早く調べられます。
- **`Hashable`**: 値をハッシュ（数字の指紋）にできる型です。`Set` の要素になるには、これが必要です。
- **`insert(_:)` の戻り値**: 値を入れたときに、`inserted` でそれが新しかったかを教えてくれます。
- **`while let`**: 次の要素がある間、繰り返し読みます。

## 何をしているか

### 1. 次の要素を読む

元の列から要素を 1 つずつ取り出します。取り出せなくなったら、ループを抜けます。

```swift:line-numbers=52
      while let element = base.next() {
```
### 2. 値を Set に入れ、新しいかを確かめる

`insert` で `seen` に値を入れます。`inserted` が `true` なら、初めて見た値です。

```swift:line-numbers=53
        if seen.insert(projection(element)).inserted {
```
### 3. 新しい値なら返す

初めて見た値だけを、そのまま返します。重複していた値は、このブロックに入らず次の要素へ進みます。

```swift:line-numbers=54
          return element
        }
```
### 4. 最後まで読んだら終わる

元の列がなくなったら、nil を返して終わります。

```swift:line-numbers=57
      return nil
```
## ここがすごい

- **1 回の操作で確かめる**: 「入っているか」を調べてから入れるのではなく、`insert` 1 回で両方を行います。
- **見た値だけを覚える**: 全部を配列にコピーせず、必要な分だけ `Set` に記録します。
- **遅延評価と組み合わせられる**: 値は読まれるたびに判断されるので、大きな列でも先頭から必要な分だけ処理できます。

## まとめ

- 見た値を `Set` に覚えておく。
- `insert` の `inserted` で、新しい値かを判断する。
- 新しい値だけを、順番どおりに返す。
