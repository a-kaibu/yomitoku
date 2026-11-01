---
title: "両端から歩み寄るクイックソート式の分割"
description: "双方向に進めるコレクション向けの partition。左からは「後ろに行くべき要素」、右からは「前に行くべき要素」を探して交換し、交換回数を最小にする。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2023 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/CollectionAlgorithms.swift
lines: [414, 445]
function: "MutableCollection._partitionImpl(by:)"
difficulty: 2
tags: [アルゴリズム, ソート, 標準ライブラリ]
---
## ひとことで

`partition(by:)` は、条件を満たす要素をすべて後ろへ、満たさない要素を前へ集め、その境目の位置を返すメソッドです。
`_partitionImpl` はその本体で、**左右の両端から 2 本の指を歩み寄らせ、位置が間違っている要素同士を交換する** という、クイックソートの分割（Hoare の分割）と同じ方法をとっています。
たとえば `[30, 40, 20, 30, 30, 60, 10]` を「30 より大きい」で分けると、`[30, 10, 20, 30, 30, 60, 40]` になり、境目 5 が返ります（ドキュメントコメントの例）。

## コード

```swift:line-numbers=414
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

## 前提知識

- **`extension MutableCollection where Self: BidirectionalCollection`**: 「書き換えられて、かつ前後どちらにも進めるコレクション」だけに、このメソッドを追加しています。`where` で条件を付けた拡張です。
- **`startIndex` / `endIndex`**: 最初の要素の位置と、最後の要素の「次」の位置です。
- **`formIndex(after:)` / `formIndex(before:)`**: 添字を 1 つ進める・戻す。
- **`while true { ... }`**: 無限ループです。中の `return` や `break` で抜けます。
- **`guard lo < hi else { return lo }`**: 2 本の指が出会ったら、境目として `lo` を返します。
- **`fatalError()`**: 呼ばれるとプログラムを止める関数です。ここは決して到達しない場所ですが、コンパイラに「戻り値なしで関数を抜けることはない」と示すために書かれています。

## 何をしているか

`[30, 40, 20, 30, 30, 60, 10]` を「30 より大きい」で分ける例を追います。`lo = 0`、`hi = 7`（末尾の次）から始めます。

### 1 周目

- 左の指（この部分）: 位置 0 の `30` は前半でよいので進む。位置 1 の `40` は後ろへ行くべきなので止まる（`lo = 1`）。
- 右の指（この部分）: 先に 1 つ戻して位置 6 の `10` を見る。前半に行くべきなので止まる（`hi = 6`）。
-この部分交換 → `[30, 10, 20, 30, 30, 60, 40]`。`lo = 2` に進む。

### 2 周目

- 左の指: `20`, `30`, `30` は前半でよいので進み、位置 5 の `60` で止まる（`lo = 5`）。
- 右の指: 1 つ戻して `hi = 5`。`lo < hi` が偽なので、`5` を返して終わり。

### 不変条件（この部分）

コメントに、ループの各周の始めで成り立つ条件が書かれています。「`lo` より左はすべて前半」「`hi` 以降はすべて後半」。この 2 つが崩れないように指を動かすので、指が出会った時点で全体が分割済みになります。

## ここがすごい

- **交換が最小限**: 交換するのは「左にあるのに後半」「右にあるのに前半」という、どちらも間違った場所にいる要素の組だけです。1 回の交換で 2 つの要素が正しい側に移ります。一方向にしか進めない版（`_halfStablePartition`）よりも交換回数が少なくなります。
- **不変条件をコメントに書く**: ループの意味を「何が成り立っているか」で説明しています。こう書いておくと、正しさを確かめるのも、後で変更するのも楽になります。
- **配列ならさらに速い道へ**: 公開メソッド `partition(by:)`（この部分）は、まず `withContiguousMutableStorageIfAvailable` で「連続したメモリに要素が並んでいるか」を確かめます。配列のようにそうなっていれば、生のバッファに対して同じ `_partitionImpl` を呼びます。添字の計算が単純なポインタ演算になるので速くなります。

## まとめ

- 両端から歩み寄り、間違った側にいる要素同士を交換するのが、効率のよい分割の基本形。
- ループの不変条件をコメントで書くと、アルゴリズムの正しさが読み取りやすくなる。
- 到達しない場所には `fatalError()` を置き、コンパイラに意図を伝える。
