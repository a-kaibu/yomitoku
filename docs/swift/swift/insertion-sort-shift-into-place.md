---
title: "並べ替え済みの列へ、要素を後ろから差し込んでいく"
description: "標準ライブラリの挿入ソート。並べ替え済みの範囲の後ろに続く要素を、比べながら後ろから前へずらし、正しい位置へ差し込む。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Sort.swift
lines: [270, 297]
function: "_insertionSort(within:sortedEnd:by:)"
difficulty: 2
tags: [ソート, アルゴリズム]
format: 2
---
## ひとことで

列の先頭から、並べ替え済みの部分を少しずつ広げていく並べ替えです。新しく加わった要素を、並んでいる部分の中の正しい位置まで、後ろから順に入れ替えて運びます。

## コード

::: code-group

```swift:line-numbers=270 [日本語訳]
  internal mutating func _insertionSort(
    within range: Range<Index>,
    sortedEnd: Index,
    by areInIncreasingOrder: (Element, Element) throws -> Bool
  ) rethrows {
    var sortedEnd = sortedEnd
    
    // まだ並んでいない要素がなくなるまで、並べ替えを続けます。
    while sortedEnd != range.upperBound {
      var i = sortedEnd
      // 後ろから順に、self[i] の正しい位置を探します。
      // 途中の要素を 1 つずつ後ろへずらして、場所を空けます。
      repeat {
        let j = index(before: i)
        
        // self[i] が self[j] より前に来るべきでなければ、位置が見つかったことになります。
        // そこで探すのを終わります。
        if try !areInIncreasingOrder(self[i], self[j]) {
          break
        }
        
        swapAt(i, j)
        i = j
      } while i != range.lowerBound
      
      formIndex(after: &sortedEnd)
    }
  }
```

```swift:line-numbers=270 [原文]
  internal mutating func _insertionSort(
    within range: Range<Index>,
    sortedEnd: Index,
    by areInIncreasingOrder: (Element, Element) throws -> Bool
  ) rethrows {
    var sortedEnd = sortedEnd
    
    // Continue sorting until the sorted elements cover the whole sequence.
    while sortedEnd != range.upperBound {
      var i = sortedEnd
      // Look backwards for `self[i]`'s position in the sorted sequence,
      // moving each element forward to make room.
      repeat {
        let j = index(before: i)
        
        // If `self[i]` doesn't belong before `self[j]`, we've found
        // its position.
        if try !areInIncreasingOrder(self[i], self[j]) {
          break
        }
        
        swapAt(i, j)
        i = j
      } while i != range.lowerBound
      
      formIndex(after: &sortedEnd)
    }
  }
```

:::

## 前提知識

- **挿入ソート**: トランプを並べるように、1 枚ずつ正しい位置へ差し込んでいく並べ替えです。要素が少ない列や、ほぼ並んでいる列では速く動きます。
- **`areInIncreasingOrder`**: 2 つの要素を受け取り、前の要素が後ろの要素より小さいかを返す関数です。並べ方のルールを表します。
- **`swapAt`**: 2 つの位置の要素を入れ替えるメソッドです。
- **`rethrows`**: 引数の関数がエラーを投げたときだけ、エラーを投げる関数であることを表します。

## 何をしているか

### 1. 並べ替え済みの範囲を、1 つずつ広げる

`sortedEnd` は、並んでいる部分の終わりです。`while` の中で、まだ並んでいない最初の要素を選びます。

```swift:line-numbers=277
    // まだ並んでいない要素がなくなるまで、並べ替えを続けます。
    while sortedEnd != range.upperBound {
      var i = sortedEnd
```
### 2. 後ろから、正しい位置を探す

選んだ要素 `self[i]` と、その前の要素 `self[j]` を比べます。

```swift:line-numbers=280
      // 後ろから順に、self[i] の正しい位置を探します。
      // 途中の要素を 1 つずつ後ろへずらして、場所を空けます。
      repeat {
        let j = index(before: i)
```
### 3. 正しい位置が見つかったら、探すのをやめる

`self[i]` を `self[j]` の前に置くべきでなければ、そこが正しい位置です。

```swift:line-numbers=285
        // self[i] が self[j] より前に来るべきでなければ、位置が見つかったことになります。
        // そこで探すのを終わります。
        if try !areInIncreasingOrder(self[i], self[j]) {
          break
        }
```
### 4. まだ前へ行くなら、入れ替えて、もう一つ前を比べる

ずれているので、2 つの要素を入れ替えます。そして `i` を `j` へ動かし、同じ比べ方を続けます。先頭に着いたら終わります。

```swift:line-numbers=291
        swapAt(i, j)
        i = j
      } while i != range.lowerBound
```
### 5. 並んでいる範囲を 1 つ広げる

並んでいる範囲の終わりを 1 つ後ろへ進めて、次の要素の処理へ移ります。

```swift:line-numbers=295
      formIndex(after: &sortedEnd)
    }
```
## ここがすごい

- **比べながら運ぶ**: 要素を見つけてから移すのではなく、比べて合わなければ入れ替えて、次の比べに進みます。ひとつの流れで位置を決められます。
- **早く終わる**: 正しい位置が見つかったら `break` で止めます。すでに並んでいる列では、1 回ずつの比べだけで終わります。
- **比べ方を外から渡す**: `areInIncreasingOrder` を引数にしているので、同じ処理で、昇順にも降順にも、任意の並べ方にも使えます。

## まとめ

- 並んでいる部分の終わりから、新しい要素を後ろへ向かって比べる。
- 正しい位置が見つかったら止め、そうでなければ入れ替えて前へ進む。
- 並んでいる範囲を 1 つずつ広げ、列全体を並べ終える。
