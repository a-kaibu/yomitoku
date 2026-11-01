---
title: "前半の順番だけは崩さない「半安定」な振り分け"
description: "条件を満たす要素を後ろへ、満たさない要素を前へ集める関数。前に集まる要素は元の順番のまま、という性質を交換だけで実現している。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2023 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/CollectionAlgorithms.swift
lines: [334, 351]
function: "MutableCollection._halfStablePartition(isSuffixElement:)"
difficulty: 2
tags: [アルゴリズム, ソート, 標準ライブラリ]
---
## ひとことで

「分割（partition）」は、条件を満たす要素と満たさない要素を前後に分ける操作で、クイックソートなどの部品になります。
`_halfStablePartition` は、条件を満たす要素（`isSuffixElement` が true）を後ろへ集めます。このとき **前に残る要素の順番は元のまま** です（後ろの要素の順番は崩れることがあります）。だから「半分だけ安定（half stable）」と呼ばれます。
たとえば偶数を後ろへ送ると、`[1, 2, 3, 4, 5]` は `[1, 3, 5, 4, 2]` になり、奇数 `1, 3, 5` の順番は保たれます。

## コード

```swift:line-numbers=334
  /// Moves all elements satisfying `isSuffixElement` into a suffix of the
  /// collection, returning the start position of the resulting suffix.
  ///
  /// - Complexity: O(*n*) where n is the length of the collection.
  @inlinable
  internal mutating func _halfStablePartition(
    isSuffixElement: (Element) throws -> Bool
  ) rethrows -> Index {
    guard var i = try firstIndex(where: isSuffixElement)
    else { return endIndex }
    
    var j = index(after: i)
    while j != endIndex {
      if try !isSuffixElement(self[j]) { swapAt(i, j); formIndex(after: &i) }
      formIndex(after: &j)
    }
    return i
  }  
```

## 前提知識

- **`guard var i = try firstIndex(where: isSuffixElement) else { ... }`**: 条件を満たす最初の要素の位置を探します。見つからない（`nil`）なら `else` の中へ進んで `endIndex` を返します。見つかれば、その位置が変数 `i` に入ります。`guard let` のほかに、このように `guard var` と書くと、取り出した値を後で書き換えられます。
- **`endIndex`**: コレクションの「最後の要素の次」の位置です。
- **`swapAt(i, j)`**: 2 つの位置の要素を入れ替えます。
- **`formIndex(after: &i)`**: `i` を 1 つ進めます。
- **1 行に 2 文を書く `;`**: Swift ではふつう 1 行 1 文ですが、`;` で区切ると 1 行に複数書けます。

## 何をしているか

`[1, 2, 3, 4, 5]` で、偶数を後ろへ送る場合を追います。

### 1. 最初の「後ろ行き」を探す（この部分）

最初の偶数は位置 1 の `2` です。`i = 1`。もし偶数が 1 つもなければ、何も動かさず `endIndex` を返します。

### 2. 残りを走査する（この部分）

`i` は「次に前半の要素を置く場所」、`j` は「いま調べている場所」です。

- `j = 2`（`3`、奇数）: 位置 1 と 2 を交換 → `[1, 3, 2, 4, 5]`、`i = 2`。
- `j = 3`（`4`、偶数）: 何もしない。
- `j = 4`（`5`、奇数）: 位置 2 と 4 を交換 → `[1, 3, 5, 4, 2]`、`i = 3`。

### 3. 境目を返す（この部分）

`i = 3` を返します。`[..<3]` が奇数、`[3...]` が偶数です。

## ここがすごい

- **前半が安定する理由**: 前半の要素（奇数）は、見つけた順に `i` の位置へ 1 つずつ置かれます。`i` は前にしか進まないので、元の順番がそのまま保たれます。後ろ行きの要素（偶数）は交換で何度も押し出されるため、順番が入れ替わることがあります（`2, 4` が `4, 2` になった）。
- **前方向にしか進まない**: 必要なのは `index(after:)` だけです。つまり、後ろ向きに進めない一方向のコレクションでも使えます。双方向に進めるコレクションには、より交換回数の少ない別の実装（同じファイルのこの部分 `_partitionImpl`）が用意されていて、標準ライブラリは型に応じて使い分けています。
- **最初の探索で無駄を省く**: いきなり `i = startIndex` から始めると、先頭の前半要素を自分自身と交換する無駄が起きます。最初に `firstIndex(where:)` で「最初の後ろ行き」まで飛ばすことで、それを避けています。

## まとめ

- 「置き場所 `i`」と「調べる場所 `j`」の 2 つの添字を使うと、1 回の走査で分割できる。
- 置き場所が前にしか進まないので、前半の要素の順番は保たれる。
- 同じ機能でも、コレクションの能力（一方向か双方向か）に応じて最適な実装を選べる。
