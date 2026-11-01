---
title: "組み合わせの総数を、二項係数の再帰と対称性で求める"
description: "要素から k 個を選ぶ組み合わせの総数を、二項係数の漸化式で計算する swift-algorithms の CombinationsSequence.count。k が大きいときは n - k に置き換えて計算を減らす。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020-2021 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Combinations.swift
lines: [62, 82]
function: "CombinationsSequence.count"
difficulty: 3
tags: [アルゴリズム, 再帰, 数値計算]
format: 2
---
## ひとことで

5 個の要素から 2 個を選ぶ組み合わせは 10 通りです。組み合わせを実際に作らなくても、その総数は計算で分かります。この `count` は、二項係数（n 個から k 個を選ぶ数）を再帰で求め、それを k の範囲について合計します。

## コード

```swift:line-numbers=62
  @inlinable
  public var count: Int {
    guard let k = self.kRange else { return 0 }
    let n = baseCount
    if k == 0..<(n + 1) {
      return 1 << n
    }

    func binomial(n: Int, k: Int) -> Int {
      switch k {
      case n, 0: return 1
      case n...: return 0
      case (n / 2 + 1)...: return binomial(n: n, k: n - k)
      default: return n * binomial(n: n - 1, k: k - 1) / k
      }
    }

    return k.map {
      binomial(n: n, k: $0)
    }.reduce(0, +)
  }
```

## 前提知識

- **二項係数**: n 個から k 個を選ぶ組み合わせの数で、`C(n, k)` と書きます。`C(5, 2) = 10` です。
- **漸化式**: `C(n, k) = n × C(n - 1, k - 1) / k` のように、小さい場合の値から大きい場合の値を作る式です。
- **対称性**: `C(n, k) = C(n, n - k)` が成り立ちます。k が大きいときは、n - k に置き換えると計算が減ります。
- **`2^n`**: 全部の要素を選ぶ（0 個から n 個まで）組み合わせの総数は、各要素を選ぶか選ばないかの 2 通りを n 回掛けた数です。

## 何をしているか

### 1. 0 個から全部までを選ぶ場合は、2 の n 乗

k が 0 から n までの全範囲なら、組み合わせの総数は `2^n` です。ビットシフトで、すぐに求めます。

```swift:line-numbers=64
    guard let k = self.kRange else { return 0 }
    let n = baseCount
    if k == 0..<(n + 1) {
      return 1 << n
    }
```
### 2. 二項係数を、再帰で求める関数

`binomial` は、`k` が 0 か `n` と同じなら 1 を返します。`k` が `n` より大きければ 0 です。

```swift:line-numbers=70
    func binomial(n: Int, k: Int) -> Int {
      switch k {
      case n, 0: return 1
      case n...: return 0
```
### 3. 半分より大きい k は、対称性で小さくする

`k` が `n` の半分より大きいときは、`n - k` を使います。結果は同じで、再帰の深さが減ります。それ以外は、漸化式で 1 段階小さい値へ進みます。

```swift:line-numbers=74
      case (n / 2 + 1)...: return binomial(n: n, k: n - k)
      default: return n * binomial(n: n - 1, k: k - 1) / k
```
### 4. 指定された k の範囲について合計する

`k` の範囲に含まれる各値について二項係数を求め、その合計を返します。

```swift:line-numbers=79
    return k.map {
      binomial(n: n, k: $0)
    }.reduce(0, +)
```
## ここがすごい

- **列挙せずに数える**: 組み合わせを 1 つずつ作る代わりに、数式で総数を求めます。要素が多くても、組み合わせを全部作る必要がありません。
- **対称性で計算を減らす**: `k` を `n - k` に置き換えることで、再帰が必要な段数が減ります。
- **範囲を一度に合計する**: `k.map` と `reduce` で、選ぶ個数の範囲を一度に足し合わせています。

## まとめ

- 二項係数の漸化式で、n 個から k 個を選ぶ数を求める。
- 対称性を使い、k を小さい側に寄せて計算を減らす。
- 組み合わせを作らずに、総数だけを数学の式で求める。
