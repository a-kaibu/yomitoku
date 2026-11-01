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
lines: [338, 351]
function: "MutableCollection._halfStablePartition(isSuffixElement:)"
difficulty: 2
tags: [アルゴリズム, ソート, 標準ライブラリ]
format: 2
---
## ひとことで

「分割（partition）」は、条件を満たす要素と満たさない要素を前後に分ける操作で、クイックソートなどの部品になります。`_halfStablePartition` は、条件を満たす要素（`isSuffixElement` が true）を後ろへ集めます。このとき、前に残る要素の順番は元のままです。後ろの要素の順番は崩れることがあります。だから「半分だけ安定（half stable）」と呼ばれます。たとえば偶数を後ろへ送ると、`[1, 2, 3, 4, 5]` は `[1, 3, 5, 4, 2]` になり、奇数の `1, 3, 5` の順番は保たれます。

## コード

```swift:line-numbers=338
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

- **`guard var i = try firstIndex(where:) else`**: 条件を満たす最初の要素の位置を探します。見つからなければ `else` へ進んで `endIndex` を返します。`guard var` と書くと、取り出した値を後で書き換えられます。
- **`endIndex`**: コレクションの「最後の要素の次」の位置です。
- **`swapAt(_:_:)`**: 2 つの位置の要素を入れ替えます。
- **`formIndex(after:)`**: 位置を 1 つ進めます。
- **`;`**: 1 行に複数の文を書くための区切りです。

## 何をしているか

ここでは、`[1, 2, 3, 4, 5]` で偶数を後ろへ送る場合を追います。

### 1. 最初の「後ろ行き」の要素を探す

最初の偶数は、位置 1 の `2` です。`i` をそこに置きます。偶数が 1 つもなければ、何も動かさずに `endIndex` を返します。

```swift:line-numbers=342
    guard var i = try firstIndex(where: isSuffixElement)
    else { return endIndex }
```
### 2. 残りの要素を順に調べる

`i` は「次に前半の要素を置く場所」で、`j` は「いま調べている場所」です。`j` が奇数を指していたら、`i` の位置と交換して、`i` を 1 つ進めます。偶数なら何もしません。たとえば `j = 2`（`3`、奇数）では、位置 1 と 2 を交換して `[1, 3, 2, 4, 5]` になります。`j = 4`（`5`、奇数）では、位置 2 と 4 を交換して `[1, 3, 5, 4, 2]` になります。

```swift:line-numbers=345
    var j = index(after: i)
    while j != endIndex {
      if try !isSuffixElement(self[j]) { swapAt(i, j); formIndex(after: &i) }
      formIndex(after: &j)
    }
```
### 3. 境目を返す

`i` は、後ろの部分の先頭を指しています。`[..<i]` が奇数、`[i...]` が偶数になります。

```swift:line-numbers=350
    return i
```
## ここがすごい

- **前半が安定する理由**: 前半の要素は、見つけた順に `i` の位置へ 1 つずつ置かれます。`i` は前にしか進まないので、元の順番がそのまま保たれます。後ろへ送る要素は交換で何度も押し出されるため、順番が入れ替わることがあります。`2` と `4` が `4` と `2` になったのが、その例です。
- **前方向にしか進まない**: 必要なのは `index(after:)` だけです。後ろ向きに進めないコレクションでも使えます。
- **最初の探索で無駄を省く**: 最初から `i = startIndex` で始めると、先頭の前半の要素を自分自身と交換する無駄が起きます。最初に `firstIndex(where:)` で最初の後ろ行きまで飛ばすことで、それを避けています。

## まとめ

- 置き場所 `i` と調べる場所 `j` の 2 つの位置を使うと、1 回の走査で分割できる。
- 置き場所は前にしか進まないので、前半の要素の順番は保たれる。
- 最初の後ろ行きまで飛ばすことで、無駄な交換を省ける。
