---
title: "先頭から、条件を満たすあいだの終わりの位置を探す"
description: "先頭から条件が真のあいだ添字を進め、最初に偽になる位置を返す swift-algorithms の endOfPrefix(while:)。suffix(while:) などの土台になっている。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Suffix.swift
lines: [53, 62]
function: "endOfPrefix(while:)"
difficulty: 1
tags: [アルゴリズム, イテレータ]
format: 2
---
## ひとことで

`[2, 4, 6, 7, 8]` の先頭から、偶数であるあいだだけ進むと、止まるのは 7 の位置です。この関数は、その「止まった位置」の添字を返します。見つからなければ、末尾の位置を返します。

## コード

```swift:line-numbers=53
  @inlinable
  public func endOfPrefix(
    while predicate: (Element) throws -> Bool
  ) rethrows -> Index {
    var index = startIndex
    while try index != endIndex && predicate(self[index]) {
      formIndex(after: &index)
    }
    return index
  }
```

## 前提知識

- **`Index` と `endIndex`**: コレクションの添字の型と、要素の終わりを表す添字です。`endIndex` は、最後の要素の 1 つ後ろを指します。
- **`formIndex(after:)`**: 添字を 1 つ先へ進めるメソッドです。配列以外のコレクションでも、同じ書き方で位置を進められます。
- **述語（predicate）**: 要素を受け取り、条件を満たすかを真偽で返す関数です。
- **`rethrows`**: 述語がエラーを投げたときだけ、この関数もエラーを投げることを表します。

## 何をしているか

### 1. 先頭の位置から見始める

`index` を先頭の位置に置きます。ここから、条件が真であるあいだ進みます。

```swift:line-numbers=57
    var index = startIndex
```
### 2. 条件が真のあいだ、添字を進める

末尾に着いておらず、今の要素が条件を満たすあいだ、添字を 1 つずつ進めます。`while` の条件は、末尾の確認を先に書いているので、末尾の外の要素を読むことはありません。

```swift:line-numbers=58
    while try index != endIndex && predicate(self[index]) {
      formIndex(after: &index)
    }
```
### 3. 止まった位置を返す

条件を満たさない要素の位置、または末尾の位置を返します。戻り値は、その位置の手前までが条件を満たす、という意味になります。

```swift:line-numbers=61
    return index
```
## ここがすごい

- **末尾の確認が先**: `try index != endIndex && predicate(...)` の順で書くので、末尾を越えて要素を読むことがありません。
- **結果が範囲として使える**: 返す添字は、先頭から終わりまでの部分列の上限です。`self[..<index]` の形で、そのまま部分列を取り出せます。
- **述語の呼び出しは 1 回ずつ**: 条件が偽になった後は、述語を呼ばずに終わります。副作用のある述語でも、扱いやすい形です。

## まとめ

- 先頭から、条件を満たすあいだ添字を進める。
- 条件が偽になった位置、または末尾の位置を返す。
- 返された位置を使えば、条件を満たす先頭の部分列を取り出せる。
