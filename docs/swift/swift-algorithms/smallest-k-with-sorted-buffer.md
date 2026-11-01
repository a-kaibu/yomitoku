---
title: "全部を並べ替えずに、小さい方から k 件を取り出す"
description: "大量の要素から、小さい方から k 件だけを求める関数。最初の k 件を並べ、残りは「今の k 番目より小さいものだけ」を挿入する。全体を並べ替えるより、必要な作業が少ない。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/MinMax.swift
lines: [15, 37]
function: "Sequence._minImplementation(count:sortedBy:)"
difficulty: 2
tags: [アルゴリズム, ソート, イテレータ]
format: 2
---
## ひとことで

`min(count:)` は、要素の中から **小さい方から k 件だけ** を取り出します。たとえば 1 万件の中から一番小さい 10 件が欲しいなら、1 万件を全部並べ替える必要はありません。
この関数は、最初の k 件だけを並べておき、残りは「今の k 番目より小さいもの」だけを、正しい位置に差し込みます。

## コード

::: code-group

```swift:line-numbers=15 [日本語訳]
  internal func _minImplementation(
    count: Int,
    sortedBy areInIncreasingOrder: (Element, Element) throws -> Bool
  ) rethrows -> [Element] {
    var iterator = makeIterator()

    var result: [Element] = []
    result.reserveCapacity(count)
    while result.count < count, let e = iterator.next() {
      result.append(e)
    }
    try result.sort(by: areInIncreasingOrder)

    while let e = iterator.next() {
      // `e` が `result` に入るには、`result[count - 1]` より厳密に小さくなければなりません。
      guard try areInIncreasingOrder(e, result[count - 1]) else { continue }
      result.removeLast()
      let insertionIndex =
        try result.partitioningIndex { try areInIncreasingOrder(e, $0) }
      result.insert(e, at: insertionIndex)
    }

    return result
```

```swift:line-numbers=15 [原文]
  internal func _minImplementation(
    count: Int,
    sortedBy areInIncreasingOrder: (Element, Element) throws -> Bool
  ) rethrows -> [Element] {
    var iterator = makeIterator()

    var result: [Element] = []
    result.reserveCapacity(count)
    while result.count < count, let e = iterator.next() {
      result.append(e)
    }
    try result.sort(by: areInIncreasingOrder)

    while let e = iterator.next() {
      // To be part of `result`, `e` must be strictly less than `result[count - 1]`.
      guard try areInIncreasingOrder(e, result[count - 1]) else { continue }
      result.removeLast()
      let insertionIndex =
        try result.partitioningIndex { try areInIncreasingOrder(e, $0) }
      result.insert(e, at: insertionIndex)
    }

    return result
```

:::

## 前提知識

- **`Sequence` と `makeIterator()`**: 先頭から 1 つずつ要素を取り出せる仕組みです。`iterator.next()` は、要素があれば値を、なければ `nil` を返します。
- **`partitioningIndex`**: 条件が `false` から `true` に変わる位置を、二分探索で探す関数です。並べた配列に、要素を差し込む位置を探すのに使います。
- **`areInIncreasingOrder`**: 2 つの要素を比べて、前の要素が先に来るべきなら `true` を返す判定です。

## 何をしているか

### 1. 最初の k 件を取り、並べておく

最初の `count` 件を `result` に入れて、並べ替えます。ここまでで、`result` は今までの中の小さい方の `count` 件です。

```swift:line-numbers=19
    var iterator = makeIterator()

    var result: [Element] = []
    result.reserveCapacity(count)
    while result.count < count, let e = iterator.next() {
      result.append(e)
    }
    try result.sort(by: areInIncreasingOrder)
```
### 2. 残りは、今の k 番目より小さいものだけ入れる

残りの要素を 1 つずつ見ます。`result` の最後（今の k 番目）より小さくなければ、捨てます。小さければ、いちばん大きい要素を外して、`e` を正しい位置へ入れます。

```swift:line-numbers=28
    while let e = iterator.next() {
      // `e` が `result` に入るには、`result[count - 1]` より厳密に小さくなければなりません。
      guard try areInIncreasingOrder(e, result[count - 1]) else { continue }
      result.removeLast()
      let insertionIndex =
        try result.partitioningIndex { try areInIncreasingOrder(e, $0) }
      result.insert(e, at: insertionIndex)
    }
```
例として `[5, 2, 9, 1, 7, 3]` で `k = 2` の場合を見ます。最初の 2 件 `[5, 2]` を並べて `[2, 5]` にします。次の `9` は `5` より小さくないので捨てます。`1` は `5` より小さいので、`5` を外して `[1, 2]` になります。`7` と `3` は `2` より小さくないので捨てます。結果は `[1, 2]` です。

## ここがすごい

- **全体を並べ替えない**: 全部を並べると `n log n` の作業が必要です。この方法は、大半の要素を「最後より大きい」の 1 回の比較で捨てます。
- **挿入位置は二分探索**: 差し込む位置を、`partitioningIndex` の二分探索で探します。比べる回数は少なくて済みます。
- **メモリが k 件分だけ**: 結果を置く配列の大きさは `k` のままです。入力が何万件あっても、余分な配列を作りません。
- **大きい k では切り替える**: ライブラリの `Collection` 版では、件数が全体の 10% を超えると、まるごと並べ替える方が速いと判断して切り替えています（コードのコメントに書かれています）。

## まとめ

- 小さい方から k 件は、最初の k 件を並べて、残りは今の k 番目と比べるだけで求められる。
- 差し込む位置は二分探索で探すので、挿入の作業が少ない。
- k が全体に比べて大きいときは、全部を並べ替える方が速いことがある。
