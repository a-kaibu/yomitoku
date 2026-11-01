---
title: "二分探索を「境目探し」として一般化する"
description: "すでに分割されたコレクションで、条件が初めて true になる位置を二分探索で探す関数。長さを半分にしていく書き方で、オーバーフローや off-by-one の罠を避けている。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2023 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/CollectionAlgorithms.swift
lines: [488, 520]
function: "Collection._partitioningIndex(where:)"
difficulty: 2
tags: [探索, アルゴリズム, 標準ライブラリ]
---
## ひとことで

「前のほうは条件が false、ある位置から後ろはずっと true」という並びのコレクションで、**true になり始める位置** を探す関数です。
たとえば昇順の `[1, 3, 5, 7, 9]` で「6 以上か」を条件にすると、`[F, F, F, T, T]` なので答えは位置 3 です。これは二分探索の一般化で、C++ の `std::partition_point` と同じ働きをします。

## コード

```swift:line-numbers=488
extension Collection {
  /// Returns the index of the first element in the collection that matches
  /// the predicate.
  ///
  /// The collection must already be partitioned according to the predicate.
  /// That is, there should be an index `i` where for every element in
  /// `collection[..<i]` the predicate is `false`, and for every element
  /// in `collection[i...]` the predicate is `true`.
  ///
  /// - Parameter predicate: A predicate that partitions the collection.
  /// - Returns: The index of the first element in the collection for which
  ///   `predicate` returns `true`.
  ///
  /// - Complexity: O(log *n*), where *n* is the length of this collection if
  ///   the collection conforms to `RandomAccessCollection`, otherwise O(*n*).
  internal func _partitioningIndex(
    where predicate: (Element) throws -> Bool
  ) rethrows -> Index {
    var n = count
    var l = startIndex
    
    while n > 0 {
      let half = n / 2
      let mid = index(l, offsetBy: half)
      if try predicate(self[mid]) {
        n = half
      } else {
        l = index(after: mid)
        n -= half + 1
      }
    }
    return l
  }
```

## 前提知識

- **`extension Collection`**: すべてのコレクションにこのメソッドを追加しています。
- **`predicate: (Element) throws -> Bool`**: 要素を受け取って true / false を返すクロージャです。
- **`count`**: 要素の数です。
- **`index(l, offsetBy: half)`**: `l` から `half` 個進んだ位置です。配列なら一瞬ですが、連結リストのようなコレクションでは `half` 回たどる必要があります。
- **二分探索**: 範囲の真ん中を調べて、答えがある側の半分だけを残す、を繰り返す探索方法です。1000 要素でも約 10 回で終わります。

## 何をしているか

`[1, 3, 5, 7, 9]`、条件「6 以上」で追います。`l` は探索範囲の始まり、`n` は探索範囲の長さです。

1. `n = 5`, `l = 0`。`half = 2`、`mid = 2`（`5`）。条件は false なので、答えは `mid` より右。`l = 3`、`n = 5 - 3 = 2`。
2. `n = 2`, `l = 3`。`half = 1`、`mid = 4`（`9`）。条件は true なので、答えは `mid` 以前。`n = 1`。
3. `n = 1`, `l = 3`。`half = 0`、`mid = 3`（`7`）。条件は true。`n = 0`。
4. ループ終了。`l = 3` を返します。

### true の場合（この部分）

`mid` 自身が答えかもしれないので、範囲を `[l, mid)` の `half` 個に縮めます（`mid` は「候補」として範囲の外側の境目に残る）。

### false の場合（この部分）

`mid` は答えではないので、`mid` の次から始めます。長さは `half + 1` 個減ります。

## ここがすごい

- **「始まり」と「長さ」で管理する**: よくある二分探索は `low` と `high` の 2 つの位置で範囲を表し、`mid = (low + high) / 2` とします。この書き方は、`low + high` がオーバーフローする有名なバグの原因になります（Java の標準ライブラリでも長年見逃されていました）。この関数は「始まり `l` と長さ `n`」で範囲を表すので、足し算のオーバーフローが起きません。
- **終了条件が単純**: `n > 0` の間だけ回り、`n` は毎回少なくとも半分になります。`low <= high` か `low < high` か、`mid + 1` か `mid` か、といった off-by-one の迷いがありません。
- **どんなコレクションでも動く**: 添字が整数でなくても動きます。ランダムアクセスできるコレクションなら O(log n)、そうでなければ `index(_:offsetBy:)` が O(n) になるので全体も O(n) です（この部分コメント）。
- **「値を探す」より汎用的**: 条件をクロージャで渡すので、「ある値以上の最初の位置（lower bound）」「ある値より大きい最初の位置（upper bound）」のどちらも、同じ関数で書けます。

## まとめ

- 二分探索は「条件が切り替わる境目を探す」と考えると、汎用的な部品になる。
- 範囲を「始まり＋長さ」で持つと、オーバーフローや off-by-one のバグを避けやすい。
- 条件をクロージャで受け取ると、1 つの関数でさまざまな探索に使える。
