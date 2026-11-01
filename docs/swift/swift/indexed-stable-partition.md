---
title: "分割統治と回転で作る「完全に安定」な振り分け"
description: "要素の順番を前後とも保ったまま、条件を満たす要素を後ろへ集める関数。半分ずつ再帰的に分割してから、真ん中の 2 つのブロックを回転で入れ替える。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2023 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/CollectionAlgorithms.swift
lines: [452, 482]
function: "MutableCollection._indexedStablePartition(count:range:by:)"
difficulty: 3
tags: [アルゴリズム, 再帰, ソート, 標準ライブラリ]
---
## ひとことで

条件を満たす要素を後ろへ集めたいけれど、**前の要素も後ろの要素も、それぞれ元の順番を保ちたい**。そんな「安定な分割」をする関数です。
たとえば位置が奇数の要素を後ろへ集めると、`[a, b, c, d, e, f]` は `[a, c, e, b, d, f]` になります。前半 `a, c, e` も後半 `b, d, f` も元の順番です。
この関数は、範囲を半分に割って再帰的に分割し、最後に真ん中を「回転」させてつなぎます。判定に使うのは要素ではなく **添字** です（関数名の `indexed`）。

## コード

```swift:line-numbers=452
extension MutableCollection {
  /// Moves all elements at the indices satisfying `belongsInSecondPartition`
  /// into a suffix of the collection, preserving their relative order, and
  /// returns the start of the resulting suffix.
  ///
  /// - Complexity: O(*n* log *n*) where *n* is the number of elements.
  /// - Precondition:
  ///   `n == distance(from: range.lowerBound, to: range.upperBound)`
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
}
```

## 前提知識

- **再帰**: 関数が自分自身を呼び出すことです。大きな問題を同じ形の小さな問題に分けて解く「分割統治法」でよく使われます。
- **`by belongsInSecondPartition: (Index) throws -> Bool`**: 添字を受け取って「後半に行くべきか」を返すクロージャです。`RangeSet` から要素を取り除く処理などで使われます。
- **`let h = n / 2, i = index(...)`**: 1 つの `let` で 2 つの定数をまとめて宣言しています。
- **三項演算子の改行**:この部分は `条件 ? A : B` を 3 行に分けて書いています。
- **`_rotate(in: j..<k, shiftingToStart: i)`**: 範囲 `j..<k` の中で、位置 `i` から始まる部分が先頭に来るように要素を回転させ、元の先頭部分がどこへ移ったかを返す関数です。`[1, 2, 3, 4, 5]` を `3` が先頭になるように回すと `[3, 4, 5, 1, 2]` になります。

## 何をしているか

### 1. 小さい場合（この部分）

- 要素 0 個: 境目は範囲の始まり。
- 要素 1 個: その要素が後半行きなら境目は始まり、そうでなければ終わり。

### 2. 半分に割って再帰（この部分）

`[a, b, c, d, e, f]`（後半行きは `b, d, f`）なら、`h = 3` で `[a, b, c]` と `[d, e, f]` に分け、それぞれを再帰で安定に分割します。

- 左: `[a, c | b]`、境目 `j` は `b` の位置。
- 右: `[e | d, f]`、境目 `k` は `d` の位置。

全体は `[a, c, b, e, d, f]` で、真ん中に「左の後半 `b`」と「右の前半 `e`」が逆の順で並んでいます。

### 3. 真ん中を回転（この部分）

範囲 `j..<k`、つまり `[b, e]` を、`i`（`e` の位置）が先頭に来るように回転します。`[e, b]` になり、全体は `[a, c, e, b, d, f]`。回転後の `b` の位置が、全体の境目として返ります。

## ここがすごい

- **追加メモリなしで安定**: 安定な分割は、別の配列を用意すれば O(n) で簡単にできます。この関数はメモリを確保せず、交換だけで安定性を実現します。代わりに計算量は O(n log n) になります（この部分コメント）。
- **回転という道具の力**: 「隣り合う 2 つのブロックを入れ替える」は、回転 1 回でできます。回転は追加メモリなしで O(長さ) でできるので、分割統治の「つなぐ」部分にぴったりです。
- **添字で判定する**: 要素ではなく添字を条件に使うので、「この位置の集合（`RangeSet`）に入る要素だけ後ろへ」という処理にそのまま使えます。`removeSubranges` のような機能の土台になっています。

## まとめ

- 「半分ずつ解いて、真ん中を回転でつなぐ」と、追加メモリなしで安定な分割ができる。
- 回転は、隣り合うブロックの入れ替えに使える便利な基本操作。
- 時間（O(n log n)）とメモリ（追加なし）のトレードオフを意識して選ぶ。
