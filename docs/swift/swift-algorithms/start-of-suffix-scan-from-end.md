---
title: "末尾から、条件を満たすあいだの始まりの位置を探す"
description: "末尾から逆向きに条件が真のあいだ戻り、最初に偽になる位置の直後を返す swift-algorithms の startOfSuffix(while:)。双方向のコレクションだけで使える。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Suffix.swift
lines: [81, 94]
function: "startOfSuffix(while:)"
difficulty: 2
tags: [アルゴリズム, イテレータ]
format: 2
---
## ひとことで

`[1, 2, 3, 8, 9]` の末尾から、条件「3 より大きい」を満たすあいだ戻ると、3 の直後の 8 の位置で止まります。この関数は、条件を満たす末尾の連続部分（この例では `[8, 9]`）の、始まりの位置を返します。

## コード

```swift:line-numbers=81
  @inlinable
  public func startOfSuffix(
    while predicate: (Element) throws -> Bool
  ) rethrows -> Index {
    var index = endIndex
    while index != startIndex {
      let after = index
      formIndex(before: &index)
      if try !predicate(self[index]) {
        return after
      }
    }
    return index
  }
```

## 前提知識

- **双方向コレクション（`BidirectionalCollection`）**: 添字を前にも後ろにも進められるコレクションです。`formIndex(before:)` で、1 つ手前へ戻れます。
- **`startIndex` と `endIndex`**: 先頭の添字と、末尾の 1 つ後ろの添字です。
- **述語**: 要素を受け取り、条件を満たすかを真偽で返す関数です。
- **末尾の連続部分（suffix）**: 列の末尾から続く、条件を満たす要素の並びです。

## 何をしているか

### 1. 末尾の位置から見始める

`index` を `endIndex` に置きます。まだ 1 つも要素を見ていない状態です。

```swift:line-numbers=85
    var index = endIndex
```
### 2. 1 つ手前へ戻り、要素を調べる

先頭でないあいだ、直前の位置を `after` に覚えておき、`index` を 1 つ手前へ戻します。その要素が条件を満たすかを調べます。

```swift:line-numbers=86
    while index != startIndex {
      let after = index
      formIndex(before: &index)
```
### 3. 条件を満たさなければ、直前の位置が始まり

条件が偽になった要素の、1 つ後ろの位置が、末尾の連続部分の始まりです。その位置を返します。

```swift:line-numbers=89
      if try !predicate(self[index]) {
        return after
      }
```
### 4. 先頭まで条件が真なら、先頭を返す

すべての要素が条件を満たしたときは、先頭の位置が始まりになります。

```swift:line-numbers=92
    }
    return index
```
## ここがすごい

- **戻り方で結果を覚えておく**: 偽になった要素の 1 つ後ろを `after` で覚えておくので、余分な変数や後処理がいりません。
- **列の終わりから読む**: 末尾の連続部分だけを見るので、列全体を先頭から読む必要がありません。
- **双方向の性質を生かす**: 前へ戻れる性質を使うため、`BidirectionalCollection` の条件だけで書けます。

## まとめ

- 末尾から 1 つずつ戻りながら、条件を調べる。
- 条件が偽になった要素の直後が、末尾の連続部分の始まり。
- 全部満たしたなら、先頭が始まりになる。
