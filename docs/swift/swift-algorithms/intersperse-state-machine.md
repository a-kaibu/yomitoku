---
title: "要素と要素の間に、区切りを 1 つずつ挟む"
description: "数列の要素と要素の間に、同じ区切りの値を 1 つずつ挟むイテレータ。次の要素があるかを先に確かめるため、区切りは最後には付かない。状態を 3 つに分けて、1 回の next() ごとに 1 つだけ返す。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Intersperse.swift
lines: [58, 75]
function: "InterspersedSequence.Iterator.next()"
difficulty: 2
tags: [イテレータ, アルゴリズム, 設計パターン]
format: 2
---
## ひとことで

`interspersed(with:)` は、数列の要素と要素の間に、区切りの値を挟みます。たとえば `[1, 2, 3]` を区切り `0` で挟むと、`[1, 0, 2, 0, 3]` になります。
先頭や末尾には、区切りを付けません。この関数の `next()` は、要素を 1 回に 1 つずつ返すイテレータで、区切りを返すべきかを、状態で決めています。

## コード

::: code-group

```swift:line-numbers=58 [日本語訳]
    public mutating func next() -> Base.Element? {
      // 最初の後は、状態が「要素」と「区切り」の間で切り替わります。
      // 区切りを返す前に、次の要素があるかを確かめます。
      // 区切りは、2 つの要素の間にだけ返すからです。次の要素は、
      // 次の呼び出しで返せるように、保存しておきます。
      switch state {
      case .start:
        state = .separator
        return iterator.next()
      case .separator:
        guard let next = iterator.next() else { return nil }
        state = .element(next)
        return separator
      case .element(let element):
        state = .separator
        return element
      }
    }
```

```swift:line-numbers=58 [原文]
    public mutating func next() -> Base.Element? {
      // After the start, the state flips between element and separator. Before
      // returning a separator, a check is made for the next element as a
      // separator is only returned between two elements. The next element is
      // stored to allow it to be returned in the next iteration.
      switch state {
      case .start:
        state = .separator
        return iterator.next()
      case .separator:
        guard let next = iterator.next() else { return nil }
        state = .element(next)
        return separator
      case .element(let element):
        state = .separator
        return element
      }
    }
```

:::

## 前提知識

- **`IteratorProtocol`**: `next()` を呼ぶたびに、次の値を 1 つ返す仕組みです。値がなくなると `nil` を返します。
- **`enum` の関連値**: `case element(Base.Element)` のように、値を持つ列挙型です。状態に、次の要素を覚えておけます。
- **状態機械**: 今の状態と入力から、次の状態と出力を決める考え方です。

## 何をしているか

### 1. 最初は、要素をそのまま返す

状態が `start` のときは、次の状態を `separator` にして、元の列の最初の要素を返します。先頭に区切りは付きません。

```swift:line-numbers=63
      switch state {
      case .start:
        state = .separator
        return iterator.next()
```
### 2. 区切りの前に、次の要素があるか確かめる

状態が `separator` のときは、先に次の要素を取り出します。それがなければ `nil` を返して終わります。あれば、その要素を `element` の状態に保存して、区切りを返します。区切りは、要素と要素の間にだけ付きます。

```swift:line-numbers=67
      case .separator:
        guard let next = iterator.next() else { return nil }
        state = .element(next)
        return separator
```
### 3. 保存しておいた要素を返す

状態が `element` のときは、保存していた要素を返します。次の状態は `separator` です。

```swift:line-numbers=71
      case .element(let element):
        state = .separator
        return element
```
例として `[1, 2]` を区切り `0` で挟みます。`start` で `1` を返し、`separator` で次の `2` を見つけて `0` を返し、`element(2)` で `2` を返します。最後の `separator` で要素がなくなり、`nil` で終わります。結果は `[1, 0, 2]` です。

## ここがすごい

- **末尾の区切りを、先読みで防ぐ**: 区切りを返す前に次の要素を見るので、最後に余分な区切りを返しません。
- **1 回の `next()` で、1 つだけ返す**: 配列を作らずに、必要な分だけ返します。大きな数列でも、メモリを使いません。
- **状態を列挙型で表す**: 3 つの状態が、`switch` で網羅されます。新しい状態を足したときに、扱い忘れがあるとコンパイラが知らせます。

## まとめ

- 区切りは、2 つの要素の間にだけ入れる。そのために、次の要素を先に確かめる。
- 状態の 3 つ（開始、区切り、要素）を切り替えれば、1 回に 1 つだけ返せる。
- 配列を作らないので、大きな数列にも使える。
