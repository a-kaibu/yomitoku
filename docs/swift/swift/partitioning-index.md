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
lines: [503, 520]
function: "Collection._partitioningIndex(where:)"
difficulty: 2
tags: [探索, アルゴリズム, 標準ライブラリ]
format: 2
---
## ひとことで

「前のほうは条件が false で、ある位置から後ろはずっと true」という並びのコレクションで、true になり始める位置を探す関数です。たとえば昇順の `[1, 3, 5, 7, 9]` で「6 以上か」を条件にすると、並びは `[F, F, F, T, T]` になるので、答えは位置 3 です。これは二分探索の一般化で、C++ の `std::partition_point` と同じ働きをします。

## コード

```swift:line-numbers=503
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
- **`predicate: (Element) throws -> Bool`**: 要素を受け取って true か false を返すクロージャです。
- **`count`**: 要素の数です。
- **`index(_:offsetBy:)`**: ある位置から指定した数だけ先の位置を求めます。配列なら一瞬ですが、連結リストのようなコレクションでは、その数だけたどる必要があります。
- **二分探索**: 範囲の真ん中を調べて、答えがある側の半分だけを残す、を繰り返す探索方法です。1000 要素でも約 10 回で終わります。

## 何をしているか

`[1, 3, 5, 7, 9]`、条件「6 以上」で追います。`l` は探索範囲の始まり、`n` は探索範囲の長さです。最初は `n = 5`、`l = 0` です。

### 1. 真ん中を調べ、答えの側を残す

長さの半分を `half` とし、`l` から `half` 個先の位置 `mid` の要素を調べます。条件が true なら、答えは `mid` を含む前側にあるので、長さを `half` にします。false なら、答えは `mid` より後ろにあるので、始まりを `mid` の次へ動かし、長さを `half + 1` 個減らします。

```swift:line-numbers=509
    while n > 0 {
      let half = n / 2
      let mid = index(l, offsetBy: half)
      if try predicate(self[mid]) {
        n = half
      } else {
        l = index(after: mid)
        n -= half + 1
      }
```
### 2. 探索範囲がなくなったら、始まりを返す

長さが 0 になったら、探索は終わりです。`l` は、条件が初めて true になる位置を指しています。

```swift:line-numbers=518
    }
    return l
```
### 具体例

`[1, 3, 5, 7, 9]` で追うと、最初は `mid = 2`（値 5）で false なので、`l = 3` と `n = 2` になります。次は `mid = 4`（値 9）で true なので、`n = 1` になります。最後に `mid = 3`（値 7）も true で、`n = 0` になります。`l = 3` が答えです。

## ここがすごい

- **始まりと長さで管理する**: よくある二分探索は、`low` と `high` の 2 つの位置で範囲を表し、`mid = (low + high) / 2` とします。この書き方は、`low + high` がオーバーフローする有名なバグの原因になります。この関数は、始まり `l` と長さ `n` で範囲を表すので、その心配がありません。
- **終了条件が単純**: `n > 0` の間だけ回り、長さは毎回少なくとも半分になります。`low <= high` か `low < high` か、といった off-by-one の迷いがありません。
- **どんなコレクションでも動く**: 添字が整数でなくても動きます。ランダムアクセスできるコレクションなら O(log n) で、そうでなければ `index(_:offsetBy:)` の分だけ遅くなります。
- **値より汎用的**: 条件をクロージャで渡すので、「ある値以上の最初の位置」も「ある値より大きい最初の位置」も、同じ関数で書けます。

## まとめ

- 二分探索は、条件が切り替わる境目を探すと考えると、汎用的な部品になる。
- 範囲を始まりと長さで持つと、オーバーフローや off-by-one のバグを避けやすい。
- 条件をクロージャで受け取ると、1 つの関数でさまざまな探索に使える。
