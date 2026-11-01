---
title: "次の並び順を、その場で一度だけ作る"
description: "配列の要素を辞書順に並べ替えて、次の並び順へ進める関数。全部の並び順を作ってから探すのではなく、後ろから少しずつ見て、入れ替えと反転だけで次の並びを作る。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Permutations.swift
lines: [31, 71]
function: "MutableCollection.nextPermutation(upperBound:)"
difficulty: 3
tags: [アルゴリズム, データ構造, イテレータ]
format: 2
---
## ひとことで

`nextPermutation` は、並び替えの **次の並び** を、今の配列の中で作る関数です。たとえば `[1, 2, 3]` の次は `[1, 3, 2]`、その次は `[2, 1, 3]` です。
この関数を繰り返し呼ぶと、要素の並び替えを全部、辞書順に一度ずつ作れます。全部の並びを先にメモリに作る必要はありません。

## コード

::: code-group

```swift:line-numbers=31 [日本語訳]
  internal mutating func nextPermutation(upperBound: Index? = nil) -> Bool {
    // 要素が 1 つより多いことを確かめます。
    guard !isEmpty else { return false }
    var i = index(before: endIndex)
    if i == startIndex { return false }

    let upperBound = upperBound ?? endIndex

    while true {
      let ip1 = i
      formIndex(before: &i)

      // 最後の昇順のペア（つまり ..., a, b, ... で a < b となるもの）を探します。
      if self[i] < self[ip1] {
        // self[i] より大きい最後の要素を探します。
        // swift-format の NeverForceUnwrap の警告を、この行だけ無効にする指定です。
        // 上の if 文のため、これは必ず `ip1` 以下の位置になります。
        let j = lastIndex(where: { self[i] < $0 })!

        // この時点で、次のような状態になっています:
        //    0, 1, 4, 3, 2
        //       ^        ^
        //       i        j
        swapAt(i, j)
        self.reverse(subrange: ip1..<endIndex)

        // 変更が ..<upperBound の範囲内で行われた場合にだけ返します。
        if i < upperBound {
          return true
        } else {
          i = index(before: endIndex)
          continue
        }
      }

      if i == startIndex {
        self.reverse()
        return false
      }
    }
  }
```

```swift:line-numbers=31 [原文]
  internal mutating func nextPermutation(upperBound: Index? = nil) -> Bool {
    // Ensure we have > 1 element in the collection.
    guard !isEmpty else { return false }
    var i = index(before: endIndex)
    if i == startIndex { return false }

    let upperBound = upperBound ?? endIndex

    while true {
      let ip1 = i
      formIndex(before: &i)

      // Find the last ascending pair (ie. ..., a, b, ... where a < b)
      if self[i] < self[ip1] {
        // Find the last element greater than self[i]
        // swift-format-ignore: NeverForceUnwrap
        // This is _always_ at most `ip1` due to if statement above
        let j = lastIndex(where: { self[i] < $0 })!

        // At this point we have something like this:
        //    0, 1, 4, 3, 2
        //       ^        ^
        //       i        j
        swapAt(i, j)
        self.reverse(subrange: ip1..<endIndex)

        // Only return if we've made a change within ..<upperBound region
        if i < upperBound {
          return true
        } else {
          i = index(before: endIndex)
          continue
        }
      }

      if i == startIndex {
        self.reverse()
        return false
      }
    }
  }
```

:::

## 前提知識

- **辞書順**: 単語を辞書で並べるのと同じ順番です。先頭の要素が小さいものが先に来て、先頭が同じなら次の要素で比べます。
- **`MutableCollection`**: 要素を書き換えられるコレクションです。`swapAt` で 2 つの位置の要素を入れ替えられます。
- **`BidirectionalCollection`**: 後ろから前へも進めるコレクションです。この関数は末尾から先頭へ向かって調べます。
- **`reverse(subrange:)`**: 指定した範囲だけを逆順にする、このライブラリ内の関数です。

## 何をしているか

### 1. 末尾から見て、昇順の組を探す

まず末尾から先頭へ向かって、「左の要素が右の要素より小さい」組を探します。`[1, 2, 3]` なら、末尾の `2` と `3` の組が見つかります。

```swift:line-numbers=33
    guard !isEmpty else { return false }
    var i = index(before: endIndex)
    if i == startIndex { return false }

    let upperBound = upperBound ?? endIndex

    while true {
      let ip1 = i
      formIndex(before: &i)

      // 最後の昇順のペア（つまり ..., a, b, ... で a < b となるもの）を探します。
      if self[i] < self[ip1] {
```
### 2. 組の左の要素より大きい、最後の要素と入れ替える

見つけた左の要素 `self[i]` より大きい要素のうち、一番後ろのものを `j` で探します。そして `i` と `j` を入れ替えます。`[1, 2, 3]` では `i = 1`、`j = 2` で、入れ替えると `[1, 3, 2]` になります。

```swift:line-numbers=45
        // self[i] より大きい最後の要素を探します。
        // swift-format の NeverForceUnwrap の警告を、この行だけ無効にする指定です。
        // 上の if 文のため、これは必ず `ip1` 以下の位置になります。
        let j = lastIndex(where: { self[i] < $0 })!

        // この時点で、次のような状態になっています:
        //    0, 1, 4, 3, 2
        //       ^        ^
        //       i        j
        swapAt(i, j)
```
### 3. 入れ替えた位置より後ろを反転させる

入れ替えの後ろの部分は、いまは降順の状態になっています。そこを逆順にすると、その部分で一番小さい並びになります。`[1, 3, 2]` では、`i` より後ろの 1 要素を反転しても変わりません。

```swift:line-numbers=55
        self.reverse(subrange: ip1..<endIndex)

        // 変更が ..<upperBound の範囲内で行われた場合にだけ返します。
        if i < upperBound {
          return true
        } else {
          i = index(before: endIndex)
          continue
        }
```
### 4. 全部の並びを出し切ったら、昇順に戻す

どの位置にも昇順の組がなくなったら、もう次の並びはありません。配列全体を反転して昇順に戻し、`false` を返します。`[3, 2, 1]` のときがこれに当たります。

```swift:line-numbers=65

      if i == startIndex {
        self.reverse()
        return false
      }
    }
```
## ここがすごい

- **全部を作らない**: すべての並びを一度に作ると、要素数が多いときにメモリが爆発します。この関数は今の並びから次を 1 回だけ作るので、必要な分だけ進めます。
- **同じ値があっても正しく動く**: 比べるのは `<` です。同じ値が並んでいるときは、入れ替えが起きません。そのため重複した並びを何度も出すことがありません。たとえば `[1, 1, 2]` からは、`[1, 1, 2]`、`[1, 2, 1]`、`[2, 1, 1]` の 3 つだけが出ます。
- **後ろから見るので、探す範囲が小さい**: 大半の並びは、末尾付近の入れ替えだけで次に進めます。そのため、ほとんどの呼び出しは短い範囲の処理で終わります。
- **`upperBound` で範囲を絞れる**: 引数 `upperBound` より前の位置が変わらない形で、限られた並びだけを列挙できます。`Permutations` の、部分的な並びを作る処理がこの仕組みを使っています。

## まとめ

- 次の並びは、「小さくできる位置」を末尾から探し、1 回の入れ替えと 1 回の反転で作れる。
- 辞書順の並びを全部出すと、昇順に戻って `false` が返る。
- 比べるのが `<` だけなので、同じ値の並びも自然に扱える。
