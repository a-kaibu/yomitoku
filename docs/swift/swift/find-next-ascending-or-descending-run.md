---
title: "並んでいる連なりを、昇順か降順かを見分けて末尾を探す"
description: "並べ替えで、先頭から続く昇順または降順の連なりの末尾を見つける標準ライブラリの _findNextRun。降順の連なりは後で反転できるよう、厳密な降順だけを扱う。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Sort.swift
lines: [481, 511]
function: "_findNextRun(in:from:by:)"
difficulty: 3
tags: [ソート, アルゴリズム]
format: 2
---
## ひとことで

列の先頭から、順番に並んでいる部分の終わりを探します。並びが昇順か降順かは、最初の 2 要素で決めます。並びのパターンが崩れた位置が、連なりの終わりです。

## コード

::: code-group

```swift:line-numbers=481 [日本語訳]
internal func _findNextRun<C: RandomAccessCollection>(
  in elements: C,
  from start: C.Index,
  by areInIncreasingOrder: (C.Element, C.Element) throws -> Bool
) rethrows -> (end: C.Index, descending: Bool) {
  _internalInvariant(start < elements.endIndex)

  var previous = start
  var current = elements.index(after: start)
  guard current < elements.endIndex else {
    // 要素が 1 つだけの連なりは、昇順として扱います。
    // そうすれば、無駄な reverse() の呼び出しを省けます。
    return (current, false)
  }

  // 先頭から始まる連なりが、昇順か降順かを調べます。
  // 昇順の連なりには、同じ値が連続していてもかまいません。
  // 降順の連なりは後で反転するので、厳密に降順である必要があります。
  let isDescending =
    try areInIncreasingOrder(elements[current], elements[previous])
  
  // 昇順と降順のパターンが崩れる場所まで、current を進めます。
  // 崩れる場所を見つけるまで、この処理を続けます。
  repeat {
    previous = current
    elements.formIndex(after: &current)
  } while try current < elements.endIndex &&
    isDescending == areInIncreasingOrder(elements[current], elements[previous])
    
  return(current, isDescending)
}
```

```swift:line-numbers=481 [原文]
internal func _findNextRun<C: RandomAccessCollection>(
  in elements: C,
  from start: C.Index,
  by areInIncreasingOrder: (C.Element, C.Element) throws -> Bool
) rethrows -> (end: C.Index, descending: Bool) {
  _internalInvariant(start < elements.endIndex)

  var previous = start
  var current = elements.index(after: start)
  guard current < elements.endIndex else {
    // This is a one-element run, so treating it as ascending saves a
    // meaningless call to `reverse()`.
    return (current, false)
  }

  // Check whether the run beginning at `start` is ascending or descending.
  // An ascending run can include consecutive equal elements, but because a
  // descending run will be reversed, it must be strictly descending.
  let isDescending =
    try areInIncreasingOrder(elements[current], elements[previous])
  
  // Advance `current` until there's a break in the ascending / descending
  // pattern.
  repeat {
    previous = current
    elements.formIndex(after: &current)
  } while try current < elements.endIndex &&
    isDescending == areInIncreasingOrder(elements[current], elements[previous])
    
  return(current, isDescending)
}
```

:::

## 前提知識

- **連なり（run）**: 並べ替えの途中で、すでに昇順または降順に並んでいる部分です。
- **`areInIncreasingOrder`**: 2 つの要素を受け取り、前が後ろより小さいなら `true` を返す関数です。並べ方のルールを表します。
- **降順を反転する理由**: 降順の連なりは、後で反転すると昇順になります。反転したときに順番が変わらないよう、同じ値の並びは降順に含めません。
- **`repeat ... while`**: 先に 1 回処理を行い、そのあとで条件を調べて、続けるかを決める繰り返しです。

## 何をしているか

### 1. 要素が 1 つだけなら、昇順として終わる

先頭の次がなければ、連なりは 1 要素だけです。反転する必要もないので、昇順として返します。

```swift:line-numbers=489
  var current = elements.index(after: start)
  guard current < elements.endIndex else {
    // 要素が 1 つだけの連なりは、昇順として扱います。
    // そうすれば、無駄な reverse() の呼び出しを省けます。
    return (current, false)
  }
```
### 2. 最初の 2 要素で、昇順か降順かを決める

`current` と `previous` を比べて、後ろが前より小さければ降順です。

```swift:line-numbers=496
  // 先頭から始まる連なりが、昇順か降順かを調べます。
  // 昇順の連なりには、同じ値が連続していてもかまいません。
  // 降順の連なりは後で反転するので、厳密に降順である必要があります。
  let isDescending =
    try areInIncreasingOrder(elements[current], elements[previous])
```
### 3. パターンが崩れるまで、末尾を進める

`repeat` の中で、位置を 1 つ進めます。その後、同じ方向が続いているかを確かめます。方向が変わるか、列の終わりに着いたら止まります。

```swift:line-numbers=502
  // 昇順と降順のパターンが崩れる場所まで、current を進めます。
  // 崩れる場所を見つけるまで、この処理を続けます。
  repeat {
    previous = current
    elements.formIndex(after: &current)
  } while try current < elements.endIndex &&
    isDescending == areInIncreasingOrder(elements[current], elements[previous])
```
### 4. 連なりの終わりと、方向を返す

止まった位置が連なりの終わりです。方向の情報と一緒に返します。

```swift:line-numbers=510
  return(current, isDescending)
```
## ここがすごい

- **1 回の走査で済む**: 先頭から一度なめるだけで、連なりの終わりと方向が分かります。
- **方向で分けて、降順だけは厳密に**: 降順の連なりは反転するので、同じ値が並ぶと、反転後に安定性が崩れます。そのため、降順の判定は厳密な順序にしています。
- **1 要素の特別扱い**: 反転の呼び出しを、無駄に行わないようにしています。

## まとめ

- 先頭 2 要素で、昇順か降順かを決める。
- 同じ方向が続くかぎり、末尾を進める。
- 連なりの終わりと方向をまとめて返す。
