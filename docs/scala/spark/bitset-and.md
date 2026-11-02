---
title: "2 つの集合の共通部分を、語ごとの AND で作る"
description: "Apache Spark の BitSet.&。2 つのビット集合の両方に入っている要素だけを残す。64 ビットの語ごとに AND を取り、短い方の語の数まで計算する。結果の大きさは、大きい方に合わせる。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/BitSet.scala"
lines: [72, 83]
format: 2
function: "BitSet.&"
difficulty: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

Spark の `BitSet` は、0 と 1 の並びで集合を表します。`&` は、2 つの集合の共通部分を作ります。両方の集合に入っている要素の位置だけが 1 になります。計算は 64 ビットの語ごとに行うので、速く済みます。

## コード

```scala:line-numbers=72
  def &(other: BitSet): BitSet = {
    val newBS = new BitSet(math.max(capacity, other.capacity))
    val smaller = math.min(numWords, other.numWords)
    assert(newBS.numWords >= numWords)
    assert(newBS.numWords >= other.numWords)
    var ind = 0
    while (ind < smaller) {
      newBS.words(ind) = words(ind) & other.words(ind)
      ind += 1
    }
    newBS
  }
```

## 前提知識

- 集合の共通部分（積集合）は、両方に入っている要素だけを集めたものです。
- `BitSet` では、ビットが 1 なら要素が入っていることを表します。そのため、ビットごとの AND を取ると、両方が 1 の位置だけが 1 になります。
- `words` は、64 ビットの `Long` の配列です。語ごとに AND を取れば、64 個のビットを一度に計算できます。
- `math.min` と `math.max` は、2 つの値の小さい方、大きい方を返します。
- `assert` は、条件が偽のときに例外を投げる確認の命令です。

## 何をしているか

### 1. 結果の大きさを、大きい方に合わせて用意する

結果の `BitSet` は、2 つの集合のうち大きい方の容量で作ります。どちらの要素も、入る場所を確保しておくためです。

```scala:line-numbers=73
    val newBS = new BitSet(math.max(capacity, other.capacity))
    val smaller = math.min(numWords, other.numWords)
```

### 2. 両方がある語までの AND を取る

2 つの語の数のうち、小さい方までを `smaller` とします。その範囲で、語ごとに `words(ind) & other.words(ind)` を計算して、結果に入れます。

```scala:line-numbers=75
    assert(newBS.numWords >= numWords)
    assert(newBS.numWords >= other.numWords)
    var ind = 0
    while (ind < smaller) {
      newBS.words(ind) = words(ind) & other.words(ind)
      ind += 1
    }
```

### 3. 結果を返す

語を最後まで計算したら、結果の集合を返します。大きい方にだけあった語は、もともと 0 なので、結果も 0 のままです。

```scala:line-numbers=82
    newBS
  }
```

## ここがすごい

- 64 個のビットを 1 回の AND で計算します。要素を 1 つずつ比べるより、ずっと少ない回数で済みます。
- 短い方の語の数までしか計算しないので、余分な範囲を読みません。
- 大きい方にだけある語は、AND の結果が 0 になることが分かっているので、計算を省けます。
- `assert` で、結果の大きさが両方を入れられることを確かめています。

## まとめ

- 集合の共通部分は、ビットの AND で、語ごとにまとめて計算できます。
- 語の数の小さい方までを計算すると、無駄な範囲を読まずに済みます。
- 集合を配列のビットで表すと、集合どうしの計算が速くなります。
