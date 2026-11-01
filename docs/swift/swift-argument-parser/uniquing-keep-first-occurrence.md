---
title: "重複を取り除き、最初に現れた順番を保つ"
description: "並べ替えずに重複だけを取り除くための Argument Parser の uniquing()。Set の insert が返す結果で、初めて現れた要素だけを残す。"
language: swift
project: "Swift Argument Parser"
repo: https://github.com/apple/swift-argument-parser
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "38ca4eceb349155836701b88da3e0986eb9d1e1c"
file: Sources/ArgumentParser/Utilities/SequenceExtensions.swift
lines: [15, 18]
function: "uniquing()"
difficulty: 1
tags: [データ構造, イディオム]
format: 2
---
## ひとことで

同じ値が何度も現れる列から、重複を取り除きます。結果は、各値が最初に現れた順番のままです。コマンドラインの同じオプションを整理するときなどに使われます。

## コード

```swift:line-numbers=15
  func uniquing() -> [Element] {
    var seen = Set<Element>()
    return self.filter { seen.insert($0).0 }
  }
```

## 前提知識

- **`Hashable`**: 値をハッシュ（数の印）にできる型の条件です。`Set` に入れるには、この条件が必要です。
- **`Set`**: 同じ値を 1 つだけ持つ集まりです。順番は保証されません。
- **`insert(_:)` の戻り値**: `(inserted: Bool, memberAfterInsert: Element)` の組を返します。`.0` の `inserted` は、その値が新しく入ったかどうかを表します。
- **`filter`**: 条件に合う要素だけを残した新しい配列を返すメソッドです。元の順番を保ちます。

## 何をしているか

### 1. 見た値を覚えておく集合を用意する

`seen` は、ここまでに出てきた値を入れておく `Set` です。最初は空です。

```swift:line-numbers=16
    var seen = Set<Element>()
```
### 2. 初めて現れた値だけを残す

`filter` で、要素を先頭から順に見ていきます。`seen.insert($0).0` は、その値が初めてなら `true` を返します。初めてのものだけが、結果に残ります。

```swift:line-numbers=17
    return self.filter { seen.insert($0).0 }
```
## ここがすごい

- **1 回の走査で済む**: 配列を前から 1 回なめるだけで、重複の判定と取り除きが同時に終わります。
- **順番が保たれる**: `Set` の順番は使わず、`filter` の結果の順番を使っています。そのため、最初に現れた順番が結果に残ります。
- **副作用を 1 行に閉じる**: `insert` の戻り値を見ながら、集合を育てていく処理が、クロージャの 1 行に収まっています。

## まとめ

- 初めて現れた値を覚えておき、2 回目以降を除く。
- `insert` の `inserted` で、新しい値かどうかを判定する。
- 順番を変えずに、重複だけを取り除ける。
