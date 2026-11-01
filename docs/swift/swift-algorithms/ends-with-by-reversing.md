---
title: "末尾の一致を、逆順にして先頭の一致として調べる"
description: "コレクションが指定した並びで終わるかを判定する関数。両方を逆順にして、先頭が一致するかを調べる。比べるのは接尾辞の長さだけで、全体を調べない。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/EndsWith.swift
lines: [75, 82]
function: "BidirectionalCollection.ends(with:by:)"
difficulty: 1
tags: [文字列処理, アルゴリズム, イテレータ]
format: 2
---
## ひとことで

`ends(with:)` は、コレクションが、指定した並びで **終わっているか** を判定します。たとえば `"abcde"` は `"cde"` で終わるので `true` です。
この関数は、両方を逆順にして、先頭が一致するかを調べます。末尾を先頭に持ってくると、「末尾の一致」が「先頭の一致」として扱えるからです。

## コード

```swift:line-numbers=75
  public func ends<PossibleSuffix: BidirectionalCollection>(
    with possibleSuffix: PossibleSuffix,
    by areEquivalent: (Element, PossibleSuffix.Element) throws -> Bool
  ) rethrows -> Bool {
    try self
      .reversed()
      .starts(with: possibleSuffix.reversed(), by: areEquivalent)
  }
```

## 前提知識

- **`BidirectionalCollection`**: 前にも後ろにも進めるコレクションです。`reversed()` が使えます。
- **`reversed()`**: 逆順に並べたものを返します。ほとんどの場合、要素をコピーせずに、読む順番だけを変えます。
- **`starts(with:by:)`**: 2 つの並びの先頭が一致するかを判定する関数です。一致しない場所か、接頭辞の末尾まで読んだところで止まります。

## 何をしているか

### 1. 等しさだけで比べる版は、一般の版へ委ねる

要素が `Equatable` のときは、比べ方を `==` にして、一般の版を呼びます。

```swift:line-numbers=42
  @inlinable
  public func ends<PossibleSuffix: BidirectionalCollection>(
    with possibleSuffix: PossibleSuffix
  ) -> Bool where PossibleSuffix.Element == Element {
    self.ends(with: possibleSuffix, by: ==)
```
### 2. 両方を逆順にして、先頭から比べる

`self` と `possibleSuffix` を、両方とも `reversed()` で逆順にします。そのうえで、`starts(with:)` で先頭が一致するかを調べます。

```swift:line-numbers=79
    try self
      .reversed()
      .starts(with: possibleSuffix.reversed(), by: areEquivalent)
```
例として `"abcde"` が `"cde"` で終わるかを見ます。逆順にすると `e d c b a` と `e d c` になります。先頭の `e d c` が一致するので、`true` です。

## ここがすごい

- **比べるのは接尾辞の長さだけ**: `starts(with:)` は、接尾辞の長さまで読めば止まります。元のコレクションの全体を調べる必要はありません。
- **逆順を、コピーせずに作る**: `reversed()` は、読む向きを変えるだけなので、大きなコレクションもコピーしません。
- **一般の版から、特別な版を作る**: `==` を渡すだけの版と、比べ方を自由に渡せる版を分けています。比べ方を変える処理を、1 つにまとめられます。

## まとめ

- 末尾の一致は、両方を逆順にして先頭の一致として調べられる。
- 比べるのは接尾辞の長さだけなので、長い入力でも速い。
- 逆順は読む向きを変えるだけなので、コピーの心配がない。
