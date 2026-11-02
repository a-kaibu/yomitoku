---
title: "片方の集合から、もう片方にある要素を引く"
description: "Apache Spark の BitSet.andNot。自分の集合から、相手の集合にある要素を取り除く（差集合）。語ごとに、相手のビットを反転させてから AND を取る。相手にない語は、そのままコピーする。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/BitSet.scala"
lines: [135, 147]
format: 2
function: "BitSet.andNot"
difficulty: 3
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

Spark の `BitSet` にある `andNot` は、差集合を作ります。自分の集合から、相手の集合に入っている要素を取り除いた結果を返します。たとえば `{1, 2, 3}` から `{2}` を引くと、`{1, 3}` になります。

## コード

```scala:line-numbers=135
  def andNot(other: BitSet): BitSet = {
    val newBS = new BitSet(capacity)
    val smaller = math.min(numWords, other.numWords)
    var ind = 0
    while (ind < smaller) {
      newBS.words(ind) = words(ind) & ~other.words(ind)
      ind += 1
    }
    if (ind < numWords) {
      Array.copy( words, ind, newBS.words, ind, numWords - ind )
    }
    newBS
  }
```

## 前提知識

- 差集合（A から B を引いたもの）は、A に入っていて B には入っていない要素の集まりです。
- `~` は、ビットを反転させる演算です。0 は 1 に、1 は 0 になります。
- `words(ind) & ~other.words(ind)` は、相手のビットが 1 の位置を 0 にし、相手が 0 の位置は自分のビットをそのまま残す計算です。
- 相手の語の数が自分より少ないとき、残りの語は相手には無いので、そのままコピーすれば足ります。
- `Array.copy` は、配列の一部をまとめてコピーする関数です。

## 何をしているか

### 1. 結果の集合を、自分と同じ容量で作る

差集合は、自分にある要素だけを含むので、結果の容量は自分の容量と同じで十分です。

```scala:line-numbers=136
    val newBS = new BitSet(capacity)
```

### 2. 両方がある語は、相手を反転させて AND を取る

2 つの語の数の小さい方までを、語ごとに計算します。相手の語を `~` で反転させてから AND を取ると、相手に入っている位置だけが 0 になります。

```scala:line-numbers=137
    val smaller = math.min(numWords, other.numWords)
    var ind = 0
    while (ind < smaller) {
      newBS.words(ind) = words(ind) & ~other.words(ind)
      ind += 1
    }
    if (ind < numWords) {
```

### 3. 相手にない語は、そのままコピーする

自分の語の方が多い場合、残りの語は相手にはありません。そこで、その部分は `Array.copy` で自分の語をそのまま写します。

```scala:line-numbers=144
      Array.copy( words, ind, newBS.words, ind, numWords - ind )
    }
    newBS
```

## ここがすごい

- 反転と AND を組み合わせると、差集合を 1 回の演算で語ごとに作れます。引き算の処理を、ビットの演算だけで表しています。
- 相手にない語を、計算せずにコピーするので、無駄な AND を省いています。
- 語の単位で処理するので、要素が多い集合でも、語の数の回数だけ計算すれば済みます。
- 元の集合は変わらず、新しい集合を返すので、同じ集合を別の計算にも使えます。

## まとめ

- 差集合は、相手を反転させてから AND を取ると、語ごとに計算できます。
- 相手にない部分はコピーで済ませると、無駄な計算が減ります。
- 集合の演算をビットの演算に置き換えると、要素を 1 つずつ比べる必要がなくなります。
