---
title: "交換だけで書いた、安定な挿入ソート"
description: "Swift 標準ライブラリの小さな区間向けの挿入ソート。「並んでいる部分の終わり」を引数で受け取れるようにして、Timsort のラン延長にも使い回している。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Sort.swift
lines: [269, 297]
function: "MutableCollection._insertionSort(within:sortedEnd:by:)"
difficulty: 1
tags: [ソート, アルゴリズム, 標準ライブラリ]
---
## ひとことで

挿入ソートは、トランプの手札を並べるときのように「並んでいる部分に、次の 1 枚を正しい位置へ差し込む」を繰り返すソートです。要素が少ないときはとても速く、Swift の `sort()` も短い区間ではこれを使います。
この関数のおもしろいところは、**どこまでがすでに並んでいるか（`sortedEnd`）** を引数で受け取れることです。たとえば `[2, 5, 9, 1, 7]` で先頭 3 つが並んでいると分かっていれば、`1` と `7` だけを差し込めば済みます。

## コード

```swift:line-numbers=269
  @inlinable
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

## 前提知識

- **`extension` の中のメソッド**: この関数は `MutableCollection`（要素を書き換えられるコレクション）に対する拡張として定義されています。配列なら `array._insertionSort(...)` のように呼べます。
- **`mutating`**: Swift の構造体（値型）で「自分自身を書き換えるメソッド」には `mutating` を付けます。
- **`Range<Index>`**: `a..<b` の形の範囲です。`lowerBound` が始まり、`upperBound` が終わり（含まない）です。
- **`index(before:)` / `formIndex(after:)`**: 添字を 1 つ戻す・進めるメソッドです。Swift のコレクションは添字が整数とは限らないので、`i - 1` ではなくこれらを使います。
- **`swapAt(i, j)`**: 2 つの位置の要素を入れ替えます。
- **引数ラベル**: `within range:` の `within` は呼び出し時の名前、`range` は関数内で使う名前です。Swift は呼び出し側が英文のように読めることを重視します。
- **シャドーイング `var sortedEnd = sortedEnd`**: 引数は定数なので、書き換えたいときは同名の変数にコピーします。

## 何をしているか

`[2, 5, 9, 1, 7]`、`sortedEnd = 3`（先頭 3 つは整列済み）で追います。

### 外側のループ（278〜296 行目）

`sortedEnd` が範囲の終わりに届くまで、「次の 1 要素を並んでいる部分に差し込む」を繰り返します。295 行目で並んでいる部分を 1 つ広げます。

### 内側のループ（282〜293 行目）

`i = 3`（値は `1`）から始めて後ろ向きに見ていきます。

- `j = 2`（値 `9`）: `1 < 9` なので交換 → `[2, 5, 1, 9, 7]`、`i = 2`
- `j = 1`（値 `5`）: `1 < 5` なので交換 → `[2, 1, 5, 9, 7]`、`i = 1`
- `j = 0`（値 `2`）: `1 < 2` なので交換 → `[1, 2, 5, 9, 7]`、`i = 0`
- `i` が範囲の始まりに着いたので終了。

次は `7` です。`7 < 9` なので交換、`7 < 5` は偽なので 287〜289 行目の `break` で止まります。結果は `[1, 2, 5, 7, 9]` です。

### 安定性

287 行目は「`self[i]` が `self[j]` より **真に小さい** ときだけ」交換します。等しい場合は止まるので、等しい要素どうしの順番は入れ替わりません。これで安定ソートになります。

## ここがすごい

- **`sortedEnd` という 1 つの引数で用途が広がる**: 通常の挿入ソートは先頭 1 要素を整列済みとして始めます（その版は同じファイルの 302 行目にあり、`sortedEnd` に 2 番目の位置を渡すだけです）。Timsort では、見つけたランが短すぎるとき、後ろの要素を足してランを最小長まで伸ばします。このとき「すでに並んでいる部分」はラン全体なので、この関数をそのまま使えます。同じコードを 2 つの用途で共有しているわけです。
- **どんな添字でも動く**: `i - 1` ではなく `index(before:)` を使っているので、整数以外の添字を持つコレクションでも動きます。Swift の標準ライブラリらしい、プロトコル中心の書き方です。
- **`repeat-while` で無駄な比較を省く**: 内側のループに入るとき `i` は必ず範囲の先頭より後ろにあるので、最初の境界チェックは要りません。`while` ではなく `repeat-while` にしてチェックを後ろに回しています。

## まとめ

- 挿入ソートは小さな区間では最速クラス。Timsort の部品としても使われる。
- 「どこまで整列済みか」を引数にすると、同じ関数を別の用途に流用できる。
- 安定ソートにするには「真に小さいときだけ動かす」比較にする。
