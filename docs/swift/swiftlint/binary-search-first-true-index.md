---
title: "並べ替え済みの配列で、条件が最初に真になる位置を二分探索する"
description: "並べ替え済みの配列に対して、述語が最初に true になる添字を O(log n) で求める SwiftLint の拡張メソッド。"
language: swift
project: "SwiftLint"
repo: https://github.com/realm/SwiftLint
license: MIT
copyright: "Copyright (c) 2025 The SwiftLint Contributors."
commit: "ec4691d9e813a1d3358e82917326b56b0a71d3c9"
file: Source/SwiftLintCore/Extensions/RandomAccessCollection+Swiftlint.swift
lines: [24, 57]
function: "firstIndexAssumingSorted(where:)"
difficulty: 2
tags: [探索, アルゴリズム, ジェネリクス]
format: 2
---
## ひとことで

「前半は偽、後半は真」になっているコレクションから、真になる最初の位置を探します。値を 1 つずつ見ずに、探す範囲を毎回半分にするので、要素が多くても速く見つかります。

## コード

::: code-group

```swift:line-numbers=24 [日本語訳]
    @inlinable
    func firstIndexAssumingSorted(where predicate: (Self.Element) throws -> Bool) rethrows -> Int? {
        // 述語は、コレクションを「偽の並び」と「真の並び」の 2 つに分けると仮定します。
        // 「悪い」値は、述語が false を返す値です。
        // 「良い」値は、述語が true を返す値です。

        // 偽 偽 偽 偽 偽 真 真 真 のように並んでいる例です。
        //                               ^
        // 目的は、述語が true になる最初の添字を探すことです。

        let lastIndex = count

        // 悪い値の側の始まりを表す添字です。最初は範囲の外の -1 です。
        var badIndex = -1

        // 良い値の側の始まりを表す添字です。最初は要素数です。
        var goodIndex = lastIndex
        var midIndex = (badIndex + goodIndex) / 2

        while badIndex + 1 < goodIndex {
            if try predicate(self[midIndex]) {
                goodIndex = midIndex
            } else {
                badIndex = midIndex
            }
            midIndex = (badIndex + goodIndex) / 2
        }

        // 範囲の外で、良い値は 1 つもありません。
        if midIndex == lastIndex {
            return nil
        }
        return goodIndex
    }
```

```swift:line-numbers=24 [原文]
    @inlinable
    func firstIndexAssumingSorted(where predicate: (Self.Element) throws -> Bool) rethrows -> Int? {
        // Predicate should divide a collection to two pairs of values
        // "bad" values for which predicate returns `false`
        // "good" values for which predicate return `true`

        // false false false false false true true true
        //                               ^
        // The idea is to get _first_ index which for which the predicate returns `true`

        let lastIndex = count

        // The index that represents where bad values start
        var badIndex = -1

        // The index that represents where good values start
        var goodIndex = lastIndex
        var midIndex = (badIndex + goodIndex) / 2

        while badIndex + 1 < goodIndex {
            if try predicate(self[midIndex]) {
                goodIndex = midIndex
            } else {
                badIndex = midIndex
            }
            midIndex = (badIndex + goodIndex) / 2
        }

        // We're out of bounds, no good items in array
        if midIndex == lastIndex {
            return nil
        }
        return goodIndex
    }
```

:::

## 前提知識

- **二分探索**: 探す範囲の真ん中を調べ、答えがどちら側にあるかで範囲を半分にする方法です。
- **述語（predicate）**: 要素を受け取り、真か偽かを返す関数です。ここでは `{ $0 > 3 }` のように渡します。
- **`RandomAccessCollection`**: 添字で任意の位置へ一度に飛べるコレクションです。`Index == Int` の条件で、整数の添字に限っています。
- **`rethrows`**: 渡された述語がエラーを投げたときだけ、エラーを投げる関数であることを示します。

## 何をしているか

### 1. 範囲の両端を決める

`badIndex` は「偽の範囲の最後」、`goodIndex` は「真の範囲の最初」を表します。最初は、偽の側が `-1`、真の側が要素数です。

```swift:line-numbers=34
        let lastIndex = count

        // 悪い値の側の始まりを表す添字です。最初は範囲の外の -1 です。
        var badIndex = -1

        // 良い値の側の始まりを表す添字です。最初は要素数です。
        var goodIndex = lastIndex
```
### 2. 真ん中を調べて、範囲を半分にする

真ん中の要素で述語を調べます。真なら答えは真ん中かそれより前にあるので `goodIndex` を動かし、偽なら答えは後ろにあるので `badIndex` を動かします。

```swift:line-numbers=41
        var midIndex = (badIndex + goodIndex) / 2

        while badIndex + 1 < goodIndex {
            if try predicate(self[midIndex]) {
                goodIndex = midIndex
            } else {
                badIndex = midIndex
            }
            midIndex = (badIndex + goodIndex) / 2
        }
```
### 3. 答えを返す

両端がくっつくと、`goodIndex` が最初に真になる位置です。両端が範囲の外（`midIndex == lastIndex`）のままなら、真の要素はないので `nil` を返します。

```swift:line-numbers=52
        // 範囲の外で、良い値は 1 つもありません。
        if midIndex == lastIndex {
            return nil
        }
        return goodIndex
```
## ここがすごい

- **1 回ごとに範囲が半分になる**: 要素が 100 万個あっても、約 20 回の述語の呼び出しで答えに届きます。
- **両端を開いたままにする**: `badIndex` を `-1`、`goodIndex` を要素数で始めることで、「すべて偽」「すべて真」の場合も同じ処理で扱えます。
- **真ん中の計算が単純**: `(badIndex + goodIndex) / 2` で、探索の範囲の真ん中を毎回求めています。

## まとめ

- 前半が偽、後半が真の並びなら、二分探索で最初の真の位置が分かる。
- 両端を範囲の外に置くと、すべて偽、すべて真の場合も扱える。
- 答えがなければ `nil` を返す。
