---
title: "元の順番を保ったまま、条件に合うものを後ろへ寄せる"
description: "配列を、条件を満たす要素と満たさない要素に分ける関数。同じグループの中の並び順を変えない。半分ずつ再帰的に分けてから、真ん中を回転させて 2 つをつなぐ。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020-2021 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Partition.swift
lines: [25, 48]
function: "MutableCollection.stablePartition(count:subrange:by:)"
difficulty: 3
tags: [アルゴリズム, 再帰, イテレータ]
format: 2
---
## ひとことで

`stablePartition` は、配列の要素を「条件を満たさないもの」と「満たすもの」の 2 つのグループに分けます。ふつうの分割と違い、**それぞれのグループの中の元の順番を変えません**（安定、stable）。
たとえば `[2, 1, 4, 3]` の偶数を後ろへ寄せると、`[1, 3, 2, 4]` になります。奇数は `1, 3` の順、偶数は `2, 4` の順のまま残ります。

## コード

```swift:line-numbers=25
  internal mutating func stablePartition(
    count n: Int,
    subrange: Range<Index>,
    by belongsInSecondPartition: (Element) throws -> Bool
  ) rethrows -> Index {
    if n == 0 { return subrange.lowerBound }
    if n == 1 {
      return try belongsInSecondPartition(self[subrange.lowerBound])
        ? subrange.lowerBound
        : subrange.upperBound
    }

    let h = n / 2
    let i = index(subrange.lowerBound, offsetBy: h)
    let j = try stablePartition(
      count: h,
      subrange: subrange.lowerBound..<i,
      by: belongsInSecondPartition)
    let k = try stablePartition(
      count: n - h,
      subrange: i..<subrange.upperBound,
      by: belongsInSecondPartition)
    return rotate(subrange: j..<k, toStartAt: i)
  }
```

## 前提知識

- **安定な分割**: 同じグループの要素どうしの元の順番が、分割の後も変わらない性質です。
- **`belongsInSecondPartition`**: 要素を受け取って、後ろのグループに入るなら `true` を返す判定です。
- **`rotate(subrange:toStartAt:)`**: 範囲の中で、指定した位置の要素が先頭に来るように、2 つの部分を入れ替える関数です。新しい先頭の位置を返します。
- **分割統治**: 問題を半分に分けて、それぞれを同じ方法で解き、最後に結び合わせる考え方です。

## 何をしているか

### 1. 要素が 0 個か 1 個なら、そこで止める

要素が 0 個なら、境界は範囲の先頭です。1 個なら、その 1 つを判定して、後ろのグループに入るなら先頭、入らないなら末尾が境界になります。

```swift:line-numbers=30
    if n == 0 { return subrange.lowerBound }
    if n == 1 {
      return try belongsInSecondPartition(self[subrange.lowerBound])
        ? subrange.lowerBound
        : subrange.upperBound
    }
```
### 2. 半分ずつ、再帰的に分ける

要素数 `n` を半分 `h` にして、真ん中の位置 `i` で範囲を 2 つに割ります。左右それぞれに、同じ関数を呼び出します。左は `j`、右は `k` を返します。ここで返る値は、それぞれの部分で後ろのグループが始まる位置です。

```swift:line-numbers=37
    let h = n / 2
    let i = index(subrange.lowerBound, offsetBy: h)
    let j = try stablePartition(
      count: h,
      subrange: subrange.lowerBound..<i,
      by: belongsInSecondPartition)
    let k = try stablePartition(
      count: n - h,
      subrange: i..<subrange.upperBound,
      by: belongsInSecondPartition)
```
### 3. 真ん中を回転させて、2 つをつなぐ

左の後ろのグループと、右の前のグループが、真ん中で隣り合っています。`rotate` で、その 2 つの塊を入れ替えます。すると、前のグループ（左、右の順）が先に並び、そのあとに後ろのグループ（左、右の順）が続きます。どちらも元の順番のままです。

```swift:line-numbers=47
    return rotate(subrange: j..<k, toStartAt: i)
```
例として `[2, 1, 4, 3]` で、偶数を後ろへ寄せると、途中で `[1, 2, 3, 4]` を経て、最後に `[1, 3, 2, 4]` になります。

## ここがすごい

- **順番を保ったまま分けられる**: 単純な入れ替えで分けると、元の順番が崩れます。分割統治で塊ごとに回転させるので、順番を保てます。
- **再帰の深さが log n**: 半分ずつに分けるので、呼び出しの深さは `log n` です。ただし、回転の分だけ全体の処理量は `n log n` ほどになります。
- **ふつうの分割と使い分ける**: 順番が関係ないときは、もっと速い分割で十分です。順番が大事なとき（表示順を保つ、など）にこの関数を使います。

## まとめ

- 安定分割は、条件を満たすものとそうでないものを、元の順番のまま分けられる。
- 半分に分けて再帰し、真ん中の塊を回転させてつなぐ。
- 戻り値は、後ろのグループが始まる境界の位置になる。
