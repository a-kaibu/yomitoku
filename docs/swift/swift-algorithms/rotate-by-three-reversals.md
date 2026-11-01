---
title: "3 回の反転だけで、部分範囲を回転させる"
description: "コレクションの一部分を回転させる関数。2 つの部分を個別に反転し、全体をもう一度反転させる。追加の配列を使わず、要素の入れ替えだけで済む。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Rotate.swift
lines: [249, 260]
function: "MutableCollection.rotate(subrange:toStartAt:)"
difficulty: 3
tags: [アルゴリズム, ソート, 標準ライブラリ]
format: 2
---
## ひとことで

`rotate(subrange:toStartAt:)` は、コレクションのある範囲の中で、要素を円のように回します。たとえば `[1, 2, 3, 4, 5]` の全体を 3 の位置から始まるように回すと、`[3, 4, 5, 1, 2]` になります。
この関数は、3 回の反転だけでそれを実現しています。反転とは、範囲の両端から入れ替えていく操作です。

## コード

```swift:line-numbers=249
  @inlinable
  @discardableResult
  public mutating func rotate(
    subrange: Range<Index>,
    toStartAt newStart: Index
  ) -> Index {
    reverse(subrange: subrange.lowerBound..<newStart)
    reverse(subrange: newStart..<subrange.upperBound)
    let (p, q) = _reverse(subrange: subrange, until: newStart)
    reverse(subrange: p..<q)
    return newStart == p ? q : p
  }
```

## 前提知識

- **反転（reverse）**: 範囲の要素の並びを逆向きにします。`[1, 2, 3]` を反転すると `[3, 2, 1]` です。
- **`Range<Index>`**: 範囲を表す型です。`a..<b` と書きます。
- **`newStart`**: 回したあとに先頭になる位置です。
- **`_reverse(subrange:until:)`**: 反転しながら、途中の境界の位置を返す内部の関数です。

## 何をしているか

ここでは、`[1, 2, 3, 4, 5]` の範囲を `newStart = 2`（要素 3）から始めるように回す例で考えます。

### 1. 前半と後半をそれぞれ反転する

最初の 2 行で、「回したあとに先頭になる手前」と「それ以降」を、それぞれ反転します。

```swift:line-numbers=255
    reverse(subrange: subrange.lowerBound..<newStart)
    reverse(subrange: newStart..<subrange.upperBound)
```
`[1, 2 | 3, 4, 5]` が `[2, 1 | 5, 4, 3]` になります。

### 2. 全体を反転する

今度は、範囲全体を反転するための準備として、`_reverse` で反転を進めます。その後、残りの部分を反転します。

```swift:line-numbers=257
    let (p, q) = _reverse(subrange: subrange, until: newStart)
    reverse(subrange: p..<q)
```
### 3. 境界を返す

最後に、回したあとの「元の末尾の位置」を計算して返します。`newStart` と `p` が一致するかどうかで、返す位置を選びます。

```swift:line-numbers=259
    return newStart == p ? q : p
```
## ここがすごい

- **追加の配列が要らない**: 回転を配列のコピーで表すと、余分なメモリが必要です。反転は要素を入れ替えるだけなので、メモリは一定量で済みます。
- **同じ部品の組み合わせ**: 回転のためにわざわざ新しいアルゴリズムを用意していません。反転という 1 つの部品を何度か使うだけです。
- **反転の回数が少ない**: 3 回の反転で、要素ごとに 1 回ずつ動くので、全体の作業量は範囲の長さに比例します。

## まとめ

- 回転は、2 つの部分の反転と全体の反転の組み合わせで作れる。
- 反転という単純な部品を組み合わせると、追加のメモリなしで複雑な操作ができる。
- 作業量は範囲の長さに比例する。
