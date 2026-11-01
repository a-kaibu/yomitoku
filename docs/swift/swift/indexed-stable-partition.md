---
title: "添字で判定して、前後の順番を保ったまま分ける"
description: "添字だけを使って、条件を満たす位置を後ろへ集める安定な分割。範囲を半分に分けて再帰し、最後に真ん中を回転させて、前後それぞれの元の順番を保つ。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2023 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/CollectionAlgorithms.swift
lines: [460, 481]
function: "MutableCollection._indexedStablePartition(count:range:by:)"
difficulty: 3
tags: [アルゴリズム, 再帰, ソート, 標準ライブラリ]
format: 2
---
## ひとことで

条件を満たす要素を後ろへ集めたいけれど、前の要素も後ろの要素も、それぞれ元の順番を保ちたいことがあります。そんな安定な分割をする関数です。たとえば位置が奇数の要素を後ろへ集めると、`[a, b, c, d, e, f]` は `[a, c, e, b, d, f]` になります。前半の `a, c, e` も後半の `b, d, f` も、元の順番のままです。この関数は、範囲を半分に割って再帰的に分割し、最後に真ん中を回転させてつなぎます。判定に使うのは要素ではなく添字です。

## コード

```swift:line-numbers=460
  internal mutating func _indexedStablePartition(
    count n: Int,
    range: Range<Index>,
    by belongsInSecondPartition: (Index) throws-> Bool
  ) rethrows -> Index {
    if n == 0 { return range.lowerBound }
    if n == 1 {
      return try belongsInSecondPartition(range.lowerBound)
        ? range.lowerBound
        : range.upperBound
    }
    let h = n / 2, i = index(range.lowerBound, offsetBy: h)
    let j = try _indexedStablePartition(
      count: h,
      range: range.lowerBound..<i,
      by: belongsInSecondPartition)
    let k = try _indexedStablePartition(
      count: n - h,
      range: i..<range.upperBound,
      by: belongsInSecondPartition)
    return _rotate(in: j..<k, shiftingToStart: i)
  }
```

## 前提知識

- **再帰**: 関数が自分自身を呼び出すことです。大きな問題を同じ形の小さな問題に分けて解く、分割統治法でよく使われます。
- **`belongsInSecondPartition`**: 添字を受け取って、後半へ行くべきかを返すクロージャです。
- **`index(_:offsetBy:)`**: ある位置から、指定した数だけ先の位置を求めます。
- **`_rotate(in:shiftingToStart:)`**: 範囲の中で、指定した位置から始まる部分が先頭に来るように要素を回転させます。元の先頭部分がどこへ移ったかを返します。

## 何をしているか

### 1. 小さい範囲は、そのまま境目を決める

要素が 0 個なら、境目は範囲の始まりです。要素が 1 個なら、それが後半へ行くべきなら境目は始まり、そうでなければ終わりです。

```swift:line-numbers=465
    if n == 0 { return range.lowerBound }
    if n == 1 {
      return try belongsInSecondPartition(range.lowerBound)
        ? range.lowerBound
        : range.upperBound
    }
```
### 2. 半分に割って、それぞれを再帰で分ける

範囲を、前半と後半に半分ずつ分けます。`[a, b, c, d, e, f]` で後半へ行くのが `b, d, f` なら、前半は `[a, b, c]`、後半は `[d, e, f]` になります。それぞれを同じ関数で安定に分割します。すると、前半は `[a, c | b]` になり、後半は `[e | d, f]` になります。

```swift:line-numbers=471
    let h = n / 2, i = index(range.lowerBound, offsetBy: h)
    let j = try _indexedStablePartition(
      count: h,
      range: range.lowerBound..<i,
      by: belongsInSecondPartition)
    let k = try _indexedStablePartition(
      count: n - h,
      range: i..<range.upperBound,
      by: belongsInSecondPartition)
```
### 3. 真ん中を回転させてつなぐ

真ん中の `[b, e]` を、後半の先頭 `e` が先に来るように回転させます。その結果、全体は `[a, c, e, b, d, f]` になります。回転のあとに `b` が来る位置が、全体の境目です。

```swift:line-numbers=480
    return _rotate(in: j..<k, shiftingToStart: i)
```
## ここがすごい

- **判定を添字で行う**: 要素の値ではなく位置で判定するので、要素の型に依存しません。範囲だけを扱えばよい、というのが設計の狙いです。
- **順番が保たれる理由**: 前半と後半はそれぞれ、元の順番を保ったまま分けられています。最後に真ん中を回転させるだけなので、前後の順番は崩れません。
- **分割統治で素直に書ける**: 範囲を半分にするので、再帰の深さは対数的です。コードも、3 つの段階に素直に分けられています。

## まとめ

- 添字で判定すれば、要素の型に依存せずに分割できる。
- 範囲を半分に割って再帰し、真ん中を回転させると、前後それぞれの順番を保てる。
- 境目は回転のあとに決まるので、最後に返す。
