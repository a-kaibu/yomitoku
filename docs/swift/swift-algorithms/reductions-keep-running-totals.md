---
title: "畳み込みの途中の結果を、すべて配列で返す"
description: "数列を先頭から順に畳み込み、途中の結果を全部配列で返す関数。reduce と同じ計算をしながら、累積の値を取り出せる。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Reductions.swift
lines: [158, 175]
function: "Sequence.reductions(into:_:)"
difficulty: 1
tags: [アルゴリズム, イテレータ, 関数型]
format: 2
---
## ひとことで

`reduce` は、数列を 1 つの値にまとめます。`reductions` は、同じ計算をしながら、**途中の結果をすべて** 配列で返します。
たとえば `[1, 2, 3, 4]` を、初期値 `0` から足していくと、`[0, 1, 3, 6, 10]` になります。部分和を一度に得たいときに便利です。

## コード

```swift:line-numbers=158
  @inlinable
  public func reductions<Result>(
    into initial: Result,
    _ transform: (inout Result, Element) throws -> Void
  ) rethrows -> [Result] {

    var output: [Result] = []
    output.reserveCapacity(underestimatedCount + 1)
    output.append(initial)

    var initial = initial
    for element in self {
      try transform(&initial, element)
      output.append(initial)
    }

    return output
  }
```

## 前提知識

- **`reduce`**: 数列を、初期値から順に 1 つの値へまとめる関数です。
- **`into:` と `inout`**: 引数の値を、関数の中で直接書き換えられる書き方です。値のコピーを減らせます。
- **`underestimatedCount`**: 数列の要素数の、下限の見積もりです。配列の確保に使います。

## 何をしているか

### 1. 初期値を、最初の結果として入れる

結果の配列を、要素数の見積もりに 1 を足した大きさで用意します。初期値は、最初の結果として入れます。

```swift:line-numbers=164
    var output: [Result] = []
    output.reserveCapacity(underestimatedCount + 1)
    output.append(initial)
```
### 2. 要素を 1 つずつ畳み込み、結果を入れる

初期値の複製 `initial` に、要素を 1 つずつ `transform` で加えていきます。加えるたびに、その時点の値を配列に入れます。

```swift:line-numbers=168
    var initial = initial
    for element in self {
      try transform(&initial, element)
      output.append(initial)
    }
```
### 3. 途中の結果の配列を返す

すべての要素を処理したら、配列を返します。`[初期値, 1 つ目の結果, …, 最後の結果]` の形になります。

```swift:line-numbers=174
    return output
```
## ここがすごい

- **`inout` で値を書き換える**: 結果の値を `transform` に `inout` で渡すので、大きな値（配列や辞書など）も、コピーせずに更新できます。
- **配列の大きさを先に確保する**: 要素数が分かれば、配列の再確保を減らせます。`+ 1` は、初期値の分です。
- **遅延版もある**: 同じファイルに、結果を必要になったときだけ作る `ExclusiveReductionsSequence` があります。大きな数列でも、全部を配列にしなくて済みます。

## まとめ

- `reductions` は、畳み込みの途中経過を、初期値を含めてすべて配列で返す。
- 値を `inout` で書き換えるので、大きな値でもコピーが少ない。
- 結果を全部持たなくてよいときは、遅延版を使える。
