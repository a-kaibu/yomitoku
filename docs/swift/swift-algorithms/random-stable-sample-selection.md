---
title: "元の順番のまま、無作為に k 件を 1 回の走査で選ぶ"
description: "コレクションから、元の順番を保ったまま k 件を無作為に選ぶ関数。要素を先頭から 1 回ずつ見て、残りの件数に応じた確率で選ぶ。全体を並べ替えたり、コピーを作ったりしない。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/RandomSample.swift
lines: [58, 84]
function: "Collection.randomStableSample(count:using:)"
difficulty: 2
tags: [乱数, アルゴリズム, イテレータ]
format: 2
---
## ひとことで

`randomStableSample(count:)` は、コレクションの中から、無作為に `k` 件を選びます。選んだ要素は、**元の並び順のまま** 返されます。
たとえば 10 件から 2 件を選ぶと、`[3, 7]` のように、元の順番どおりの 2 件になります。どの 2 件の組み合わせも、同じ確率で選ばれます。

## コード

```swift:line-numbers=58
  public func randomStableSample<G: RandomNumberGenerator>(
    count k: Int,
    using rng: inout G
  ) -> [Element] {
    guard k > 0 else { return [] }

    var remainingCount = count
    guard k < remainingCount else { return Array(self) }

    var result: [Element] = []
    result.reserveCapacity(k)

    var i = startIndex
    var countToSelect = k
    while countToSelect > 0 {
      let r = Int.random(in: 0..<remainingCount, using: &rng)
      if r < countToSelect {
        result.append(self[i])
        countToSelect -= 1
      }

      formIndex(after: &i)
      remainingCount -= 1
    }

    return result
  }
```

## 前提知識

- **無作為（ランダム）**: 乱数生成器が出す値で、選ばれ方に偏りがないことを目指します。
- **`RandomNumberGenerator`**: 乱数を出す型のプロトコルです。`inout` で渡すと、その状態が進みます。
- **`Int.random(in:using:)`**: 指定した範囲の中から、乱数を 1 つ選ぶ関数です。
- **選択サンプリング**: 全体を先頭から順に見て、残りの件数に応じた確率で選ぶ方法です。

## 何をしているか

### 1. 件数の確認と、特別な場合

`k` が 0 以下なら空の配列を返します。`k` が全体の件数以上なら、全部をそのまま返します。

```swift:line-numbers=62
    guard k > 0 else { return [] }

    var remainingCount = count
    guard k < remainingCount else { return Array(self) }
```
### 2. 残りの件数と、まだ選ぶ数を持つ

`remainingCount` は、まだ見ていない要素の数です。`countToSelect` は、まだ選ぶべき数です。最初は、それぞれ全体の件数と `k` です。

```swift:line-numbers=67
    var result: [Element] = []
    result.reserveCapacity(k)

    var i = startIndex
    var countToSelect = k
```
### 3. 1 件ずつ、確率で選ぶ

乱数 `r` を、残りの件数の範囲から選びます。`r < countToSelect` なら、その要素を選びます。つまり、確率は `countToSelect / remainingCount` です。選んだら `countToSelect` を 1 減らします。どちらの場合も、次の要素へ進み、`remainingCount` を 1 減らします。

```swift:line-numbers=72
    while countToSelect > 0 {
      let r = Int.random(in: 0..<remainingCount, using: &rng)
      if r < countToSelect {
        result.append(self[i])
        countToSelect -= 1
      }

      formIndex(after: &i)
      remainingCount -= 1
    }
```
例として、10 件から 2 件を選ぶ場合を見ます。最初の要素は、確率 `2 / 10` で選ばれます。もし選ばれなければ、次は `2 / 9` です。選ばれた数が増えるにつれ、確率も上がっていきます。

### 4. 選んだ結果を返す

`countToSelect` が 0 になったら、選ぶべき数に達しています。残りの要素は見ないで、結果を返します。

```swift:line-numbers=83
    return result
```
## ここがすごい

- **全体を並べ替えない**: 先頭から 1 回ずつ見るだけです。並べ替えや、添字の配列を作る必要がありません。
- **結果の順番が保たれる**: 選んだ要素は、見た順に並ぶので、元の並び順のままです。ランダムに並べ直す処理は要りません。
- **どの組み合わせも同じ確率**: 各要素の選ばれる確率を、残りの件数と残りの選ぶ数から決めています。その結果、k 件のどの組み合わせも、同じ確率で選ばれます。
- **必要なのは乱数だけ**: 作る配列は結果の `k` 件だけです。元のコレクションは、読むだけで変えません。

## まとめ

- 元の順番を保ったまま無作為に k 件を選ぶには、先頭から確率つきで選ぶと 1 回の走査で済む。
- 確率は、残りの件数と残りの選ぶ数から決まる。
- 選ぶべき数に達したら、残りを見ずに終えられる。
