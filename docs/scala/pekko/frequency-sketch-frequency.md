---
title: "複数の表の中で最も小さい数を、出現回数の見積もりにする"
description: "Apache Pekko の FrequencySketch.frequency。各行の表で値の出現回数を数え、その中の最小値を返す。どの行も衝突で数が多めになるので、最小を取ると誤差が小さくなる。Count-Min sketch と呼ばれる考え方。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2021-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/FrequencySketch.scala"
lines: [171, 182]
format: 2
function: "FrequencySketch.frequency"
difficulty: 3
tags: [ハッシュ, データ構造, キャッシュ]
---

## ひとことで

Apache Pekko の `FrequencySketch` は、どの値が何回ぐらい使われたかを、少ないメモリで見積もる仕組みです。キャッシュに入れるかどうかを決めるために使われます。`frequency` は、ある値の出現回数の見積もりを返します。複数の表を使い、そこで数えた値のうち、いちばん小さいものを答えにします。

## コード

```scala:line-numbers=171
  def frequency(value: A): Int = {
    val hash1 = hasher.hash(value)
    val hash2 = rehash(hash1)
    var minCount = Int.MaxValue
    var row = 0
    while (row < depth) {
      val hash = hash1 + row * hash2
      minCount = Math.min(minCount, getCounter(row, hash))
      row += 1
    }
    minCount
  }
```

## 前提知識

- 正確な回数を、値ごとにすべて覚えると、メモリが大量に必要になります。そこで、回数を小さな表に、ハッシュで振り分けて数えます。
- 「ハッシュ」は、値から整数を作る関数です。違う値が同じ位置に当たる「衝突」が起こることがあります。
- 衝突があると、別の値の回数も一緒に数えられるため、見積もりは実際より多くなりがちです。
- `Math.min` は、2 つの値のうち小さい方を返します。`minCount` は、ここまでで見た最小値です。
- `hash1 + row * hash2` は、2 つのハッシュを組み合わせて、行ごとに違う位置を作る方法（二重ハッシュ）です。

## 何をしているか

### 1. 値から、最初のハッシュと次のハッシュを作る

`hash1` は値のハッシュ、`hash2` は `rehash` で作ったもう 1 つのハッシュです。この 2 つから、行ごとに違う位置を作ります。

```scala:line-numbers=172
    val hash1 = hasher.hash(value)
    val hash2 = rehash(hash1)
    var minCount = Int.MaxValue
```

### 2. 各行で、位置を決めて数を読む

`row` 番目の行の位置は `hash1 + row * hash2` です。`getCounter` でその位置の数を読み、今までの最小値と比べて小さい方を残します。

```scala:line-numbers=175
    var row = 0
    while (row < depth) {
      val hash = hash1 + row * hash2
      minCount = Math.min(minCount, getCounter(row, hash))
      row += 1
    }
```

### 3. 最小の数を、見積もりとして返す

すべての行を読み終わったら、最小値を返します。衝突で増えた数は、どの行でも同じように大きくなるとは限らないので、最小を取ると誤差が減ります。

```scala:line-numbers=181
    minCount
```

## ここがすごい

- 表の大きさは固定なので、値が増えてもメモリは増えません。少ないメモリで、大量の値を扱えます。
- 行ごとに衝突の場所が違うので、ある行で数が増えすぎても、別の行の小さい数で打ち消せます。
- 最小を取るという 1 つの規則で、誤差を大きく減らしています。考え方は、Count-Min sketch と呼ばれる定番の手法です。
- 読むだけで値は変えないので、見積もりを何度呼んでも表の状態が変わりません。

## まとめ

- 正確な数を持てないときは、小さな表と複数のハッシュで見積もる方法が使えます。
- 衝突で増える誤差は、行ごとに違う位置を使い、最小を取ることで抑えられます。
- 見積もりは、実際より多めに出るのが普通だと理解しておくと、使い方を誤りません。
