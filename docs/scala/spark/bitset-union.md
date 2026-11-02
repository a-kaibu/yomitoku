---
title: "自分の集合に、相手の要素を in-place で足す"
description: "Apache Spark の BitSet.union。相手の集合の要素を、自分の集合に足す（和集合）。新しい集合を作らず、自分の語を直接 OR で書き換える。自分の語の数は相手以下でなければならない。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/BitSet.scala"
lines: [242, 249]
format: 2
function: "BitSet.union"
difficulty: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

Spark の `BitSet` の `union` は、2 つの集合の和集合を作ります。ただし、新しい集合は作らず、自分自身の中身を書き換えます。相手の要素が、自分の集合にも入るようになります。

## コード

```scala:line-numbers=242
  def union(other: BitSet): Unit = {
    require(this.numWords <= other.numWords)
    var ind = 0
    while (ind < this.numWords) {
      this.words(ind) = this.words(ind) | other.words(ind)
      ind += 1
    }
  }
```

## 前提知識

- 和集合は、どちらか一方か、両方に入っている要素の集まりです。
- `|`（OR）は、同じ桁のどちらかが 1 なら 1 にする演算です。ビットの集合では、どちらかに入っている位置が 1 になります。
- 「in-place（その場で）」は、新しい値を作らずに、元の入れ物の中身を書き換えることです。
- `require` は、条件が偽のときに例外を投げる確認です。ここでは、自分の語の数が相手以下であることを求めています。
- 相手の語の数が多い場合、自分にない語の要素は足せないので、この関数は使えません。

## 何をしているか

### 1. 自分の語の数が相手以下であることを確かめる

`require(this.numWords <= other.numWords)` で、相手の方が語の数が多いか同じことを確かめます。自分の語の範囲で相手の要素を足せることを保証します。

```scala:line-numbers=243
    require(this.numWords <= other.numWords)
```

### 2. 語ごとに OR を取り、自分の語を書き換える

自分の語の数まで、語ごとに `this.words(ind) | other.words(ind)` を計算し、自分の語に入れ直します。1 つの語が 64 個のビットを一度に更新します。

```scala:line-numbers=244
    var ind = 0
    while (ind < this.numWords) {
      this.words(ind) = this.words(ind) | other.words(ind)
      ind += 1
    }
```

## ここがすごい

- 新しい集合を作らないので、メモリを追加で使いません。大きな集合を何度も足すときに効果があります。
- 語ごとの OR 1 回で、64 個のビットを一度に更新します。
- 事前の確認で、範囲の外の語を書かないようにしています。配列の外を読む心配がありません。
- 「その場で書き換える」ことは、元の値を別に持っている人に影響を与えます。使う側はそれを理解しておく必要があります。

## まとめ

- 和集合は、ビットの OR を語ごとに取ると、一度に計算できます。
- 新しい入れ物を作らずに書き換えると、メモリを節約できます。
- その場で書き換える関数は、元の値を共有していないかを意識して使います。
