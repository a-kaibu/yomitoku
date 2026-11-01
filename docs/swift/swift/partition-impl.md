---
title: "両端から指を歩み寄らせて、条件で二分する"
description: "partition(by:) の本体 _partitionImpl。左右の両端から探索を進め、位置が間違っている要素同士を交換する、クイックソートの分割と同じ方法。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2023 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/CollectionAlgorithms.swift
lines: [414, 445]
function: "MutableCollection._partitionImpl(by:)"
difficulty: 3
tags: [アルゴリズム, ソート, 標準ライブラリ]
format: 2
---
## ひとことで

`partition(by:)` は、条件を満たす要素をすべて後ろへ、満たさない要素を前へ集めて、その境目の位置を返すメソッドです。`_partitionImpl` はその本体です。左右の両端から 2 本の指を歩み寄らせ、位置が間違っている要素どうしを交換します。これは、クイックソートの分割（Hoare の分割）と同じ考え方です。たとえば `[30, 40, 20, 30, 30, 60, 10]` を「30 より大きい」で分けると、`[30, 10, 20, 30, 30, 60, 40]` になり、境目の位置 5 が返ります。

## コード

::: code-group

```swift:line-numbers=414 [日本語訳]
  @inlinable
  internal mutating func _partitionImpl(
    by belongsInSecondPartition: (Element) throws -> Bool
  ) rethrows -> Index {
    var lo = startIndex
    var hi = endIndex
    while true {
      // この時点での不変条件です。
      // 次の条件が成り立ちます。
      // `lo <= hi` が成り立つこと。
      // `startIndex ..< lo` のすべての要素は、前半に属すること。
      // `hi ..< endIndex` のすべての要素は、後半に属すること。

      // `lo` から、正しい場所にないかもしれない要素を探します。
      while true {
        guard lo < hi else { return lo }
        if try belongsInSecondPartition(self[lo]) { break }
        formIndex(after: &lo)
      }

      // `hi` から、`lo` と交換できる要素を下へ探します。
      while true {
        formIndex(before: &hi)
        guard lo < hi else { return lo }
        if try !belongsInSecondPartition(self[hi]) { break }
      }

      swapAt(lo, hi)
      formIndex(after: &lo)
    }
    fatalError()
  }
```

```swift:line-numbers=414 [原文]
  @inlinable
  internal mutating func _partitionImpl(
    by belongsInSecondPartition: (Element) throws -> Bool
  ) rethrows -> Index {
    var lo = startIndex
    var hi = endIndex
    while true {
      // Invariants at this point:
      //
      // * `lo <= hi`
      // * all elements in `startIndex ..< lo` belong in the first partition
      // * all elements in `hi ..< endIndex` belong in the second partition

      // Find next element from `lo` that may not be in the right place.
      while true {
        guard lo < hi else { return lo }
        if try belongsInSecondPartition(self[lo]) { break }
        formIndex(after: &lo)
      }

      // Find next element down from `hi` that we can swap `lo` with.
      while true {
        formIndex(before: &hi)
        guard lo < hi else { return lo }
        if try !belongsInSecondPartition(self[hi]) { break }
      }

      swapAt(lo, hi)
      formIndex(after: &lo)
    }
    fatalError()
  }
```

:::

## 前提知識

- **`where Self: BidirectionalCollection`**: 書き換えられて、かつ前後どちらにも進めるコレクションだけに、このメソッドを追加しています。
- **`startIndex` と `endIndex`**: 最初の要素の位置と、最後の要素の次の位置です。
- **`formIndex(after:)` と `formIndex(before:)`**: 添字を 1 つ進める、または戻す操作です。
- **`guard lo < hi else { return lo }`**: 2 本の指が出会ったら、境目として `lo` を返します。
- **`fatalError()`**: 呼ばれるとプログラムを止める関数です。ここは決して到達しない場所なので、戻り値なしで関数を抜けないことをコンパイラに示すために置かれています。

## 何をしているか

`[30, 40, 20, 30, 30, 60, 10]` を「30 より大きい」で分ける例を追います。`lo` を 0、`hi` を 7（末尾の次）から始めます。

### 1. 左から、後半へ行くべき要素を探す

`lo` を進めて、後半へ行くべき要素で止めます。位置 0 の `30` は前半でよいので進みます。位置 1 の `40` は後半へ行くべきなので、そこで止まります。

```swift:line-numbers=427
      // `lo` から、正しい場所にないかもしれない要素を探します。
      while true {
        guard lo < hi else { return lo }
        if try belongsInSecondPartition(self[lo]) { break }
        formIndex(after: &lo)
      }
```
### 2. 右から、前半へ行くべき要素を探す

`hi` を 1 つ戻してから、前半へ行くべき要素を探します。位置 6 の `10` は前半へ行くべきなので、そこで止まります。

```swift:line-numbers=434
      // `hi` から、`lo` と交換できる要素を下へ探します。
      while true {
        formIndex(before: &hi)
        guard lo < hi else { return lo }
        if try !belongsInSecondPartition(self[hi]) { break }
      }
```
### 3. 交換して、左の指を進める

`40` と `10` を交換すると、`[30, 10, 20, 30, 30, 60, 40]` になります。そのあと、`lo` を 1 つ進めます。

```swift:line-numbers=441
      swapAt(lo, hi)
      formIndex(after: &lo)
```
### 4. 指が出会ったら、境目を返す

2 周目では、`lo` が 60 で止まり、`hi` が 5 まで戻ります。`lo < hi` が成り立たなくなったところで、境目として `5` を返します。

```swift:line-numbers=421
      // この時点での不変条件です。
      // 次の条件が成り立ちます。
      // `lo <= hi` が成り立つこと。
      // `startIndex ..< lo` のすべての要素は、前半に属すること。
      // `hi ..< endIndex` のすべての要素は、後半に属すること。
```
## ここがすごい

- **両端から進むので、無駄な交換が少ない**: 1 方向だけに進めると、同じ要素を何度も動かすことがあります。両端から歩み寄ると、交換は位置が間違っている組に限られます。
- **不変条件をコメントに残している**: ループの各周の始まりで、`lo` より左は前半、`hi` より右は後半、という条件が成り立ちます。コメントがこの条件を明示しているので、正しさを追いやすくなっています。
- **戻り値の境目で、分割の結果が決まる**: 分割の後の位置から、前半と後半の範囲が決まります。境目を返すだけで、後続の処理に必要な情報がそろいます。

## まとめ

- 両端の指を歩み寄らせ、位置が間違っている要素どうしを交換する。
- 不変条件を保つことで、正しさを確かめやすくする。
- 最後に、前半と後半の境目を返す。
