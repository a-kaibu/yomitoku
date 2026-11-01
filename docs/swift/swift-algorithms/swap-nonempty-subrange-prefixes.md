---
title: "2 つの範囲の先頭どうしを、短いほうが終わるまで交換する"
description: "2 つの範囲を、先頭から 1 つずつ入れ替えていく内部関数。片方の範囲が終わった時点で止まり、そこまでの位置を返す。反転の途中経過の計算に使われる。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Rotate.swift
lines: [103, 118]
function: "MutableCollection._swapNonemptySubrangePrefixes(_:_:)"
difficulty: 2
tags: [アルゴリズム, ソート, 標準ライブラリ]
format: 2
---
## ひとことで

コレクションの中の 2 つの範囲を、先頭から順に入れ替えていく関数です。たとえば `[1, 2, 3, 4, 5, 6]` の `1..<3` と `3..<5` なら、`1` と `3`、`2` と `4` が入れ替わります。
どちらかの範囲が終わったら止まります。その時点の 2 つの位置を返すので、呼び出し側は続きをどこから始めればよいかがわかります。

## コード

```swift:line-numbers=103
  internal mutating func _swapNonemptySubrangePrefixes(
    _ lhs: Range<Index>,
    _ rhs: Range<Index>
  ) -> (Index, Index) {
    assert(!lhs.isEmpty)
    assert(!rhs.isEmpty)

    var p = lhs.lowerBound
    var q = rhs.lowerBound
    repeat {
      swapAt(p, q)
      formIndex(after: &p)
      formIndex(after: &q)
    } while p != lhs.upperBound && q != rhs.upperBound
    return (p, q)
  }
```

## 前提知識

- **`Range<Index>`**: 範囲です。`lowerBound` が始まり、`upperBound` が終わり（含まない）です。
- **`assert`**: デバッグビルドでだけ条件を確かめる関数です。
- **`repeat { ... } while 条件`**: 少なくとも 1 回は本体を実行してから、条件を調べるループです。
- **`swapAt(p, q)`**: 2 つの位置の要素を入れ替えます。
- **タプル `(Index, Index)`**: 2 つの値を組で返します。

## 何をしているか

`[1, 2, 3, 4, 5, 6]` で、`lhs = 0..<2`（1, 2）、`rhs = 4..<6`（5, 6）を入れ替える例で追います。

### 1. 先頭どうしを入れ替える

`p` は左の範囲、`q` は右の範囲の先頭を指します。`swapAt(p, q)` で、1 と 5 が入れ替わります。その後、両方を 1 つずつ進めます。

```swift:line-numbers=112
    repeat {
      swapAt(p, q)
      formIndex(after: &p)
      formIndex(after: &q)
```
### 2. どちらかが終わったら止まる

`p` が左の範囲の終わりに届くか、`q` が右の範囲の終わりに届いたら、ループを抜けます。今回は 2 回の入れ替えで、両方の範囲がそろって終わります。

```swift:line-numbers=116
    } while p != lhs.upperBound && q != rhs.upperBound
```
### 3. 位置を返す

最後の `p` と `q` は、交換が終わった次の位置です。呼び出し側は、この位置から続きを処理できます。

```swift:line-numbers=117
    return (p, q)
```
## ここがすごい

- **短いほうに合わせて止まる**: 2 つの範囲の長さが違うと、先に終わったほうで止まります。長さの差を計算しなくても、同じ条件で止められます。
- **`repeat-while` で空でない前提を活かす**: 冒頭で範囲が空でないことを `assert` しているので、最初の 1 回は必ず入れ替えられます。そのため、ループの先頭で条件を調べる必要がありません。
- **終わりの位置を返す**: 途中の状態を呼び出し側に伝えられるので、反転や回転を組み合わせるときに、位置の計算が不要になります。

## まとめ

- 2 つの範囲の入れ替えは、先頭どうしを 1 組ずつ交換すると、短いほうに合わせて終わる。
- 空でないと分かっているなら、`repeat-while` で 1 回目を確実に実行できる。
- 途中の位置を返すと、組み合わせた処理が続けやすくなる。
