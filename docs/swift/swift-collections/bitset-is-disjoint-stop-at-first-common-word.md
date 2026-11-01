---
title: "2 つのビット集合に共通の要素がないかを、語の積で判定する"
description: "BitSet の isDisjoint(with:) を、同じ位置の語どうしの共通部分が空かで判定する実装。共通の要素が見つかった時点で false を返す。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/BitCollections/BitSet/BitSet+SetAlgebra isDisjoint.swift
lines: [32, 43]
function: "BitSet.isDisjoint(with:)"
difficulty: 2
tags: [データ構造, ビット演算, アルゴリズム]
format: 2
---
## ひとことで

2 つの集合に共通の要素がないことを、「素の（disjoint）」と言います。この関数は、語ごとに共通部分（積集合）を求めて、空でなければ共通の要素があると判断します。

## コード

```swift:line-numbers=32
  public func isDisjoint(with other: BitSet) -> Bool {
    unsafe self._read { first in
      unsafe other._read { second in
        let w1 = unsafe first._words
        let w2 = unsafe second._words
        for i in 0 ..< Swift.min(w1.count, w2.count) {
          if unsafe !w1[i].intersection(w2[i]).isEmpty { return false }
        }
        return true
      }
    }
  }
```

## 前提知識

- **`BitSet` の語**: 64 個の要素の有無を、1 つの 64 ビット整数で表したものです。位置が同じ語どうしは、同じ範囲の整数を表します。
- **共通部分（積集合）**: `intersection` は、両方の集合にある要素だけを残した集まりです。ビットでは AND に当たります。
- **`min` による範囲**: 2 つの語の数が違うとき、両方にある語だけを比べれば十分です。片方にしかない語は、共通の要素を持てません。
- **`Swift.min`**: 2 つの値の小さい方を返す関数です。

## 何をしているか

### 1. 両方にある語の数だけ、順に比べる

2 つの語の配列の、短いほうの長さまで比べます。長いほうの残りは、相手に対応する語がないので、共通の要素は生まれません。

```swift:line-numbers=37
        for i in 0 ..< Swift.min(w1.count, w2.count) {
```
### 2. 同じ位置の語どうしで、共通部分を求める

同じ位置の語どうしの共通部分が空でなければ、共通の要素があります。その時点で `false` を返します。

```swift:line-numbers=38
          if unsafe !w1[i].intersection(w2[i]).isEmpty { return false }
```
### 3. 最後まで共通がなければ、素である

どの語にも共通部分がなければ、2 つの集合は素です。`true` を返します。

```swift:line-numbers=40
        return true
```
## ここがすごい

- **比べる範囲を限る**: 語の数が違う場合でも、重なる部分だけを見ればよいと分かっているので、無駄な比較をしません。
- **早く抜ける**: 共通の要素を 1 つ見つけた時点で終わります。大きな集合でも、重なりがあればすぐ分かります。
- **ビット演算で一括に比べる**: 語の共通部分は、AND と同じ働きで 64 要素を一度に比べます。

## まとめ

- 短いほうの語の数まで、同じ位置の語どうしを比べる。
- 語の共通部分が空でなければ、すぐに `false` を返す。
- すべての語で共通がなければ、素（`true`）である。
