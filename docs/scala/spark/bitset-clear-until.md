---
title: "先頭から指定の位置の手前まで、ビットをまとめて 0 にする"
description: "Apache Spark の BitSet.clearUntil。先頭から指定の位置の手前までのビットを 0 にする。完全に含まれる語は 0 で埋め、途中の語だけマスクで必要な桁を消す。setUntil の対になる関数。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/BitSet.scala"
lines: [58, 66]
format: 2
function: "BitSet.clearUntil"
difficulty: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

Spark の `BitSet` で、先頭から指定の位置の手前までのビットを、まとめて 0 にする関数が `clearUntil` です。`clearUntil(10)` は、0 から 9 までのビットを 0 にします。`setUntil` を 0 にする側から見た対の関数です。

## コード

::: code-group

```scala:line-numbers=58 [日本語訳]
  def clearUntil(bitIndex: Int): Unit = {
    val wordIndex = bitIndex >> 6 // 64 で割ります。
    Arrays.fill(words, 0, wordIndex, 0)
    if (wordIndex < words.length) {
      // 残りのビットを 0 にします。
      val mask = -1L << (bitIndex & 0x3f)
      words(wordIndex) &= mask
    }
  }
```

```scala:line-numbers=58 [原文]
  def clearUntil(bitIndex: Int): Unit = {
    val wordIndex = bitIndex >> 6 // divide by 64
    Arrays.fill(words, 0, wordIndex, 0)
    if (wordIndex < words.length) {
      // Clear the remaining bits
      val mask = -1L << (bitIndex & 0x3f)
      words(wordIndex) &= mask
    }
  }
```

:::

## 前提知識

- `BitSet` は、64 ビットずつの `Long` の配列で、0 と 1 の並びを持ちます。
- `Arrays.fill(words, 0, wordIndex, 0)` は、配列の一部を指定の値で埋める Java の関数です。ここでは、完全に範囲に入る語を 0 にします。
- `-1L << n` は、下から `n` 桁を 0 にして、残りを 1 にした値です。`&=` でかけると、下から `n` 桁を 0 にできます。
- `bitIndex & 0x3f` は、64 で割った余りで、語の中の位置を表します。
- `bitIndex >> 6` は、64 で割った商で、どの語にあるかを表します。

## 何をしているか

### 1. 完全に範囲に入る語は、まとめて 0 にする

`wordIndex` より前の語は、すべてのビットが範囲に入っています。そこで `Arrays.fill` で 0 を入れて、一度に消します。

```scala:line-numbers=59
    val wordIndex = bitIndex >> 6 // divide by 64
    Arrays.fill(words, 0, wordIndex, 0)
```

### 2. 途中の語は、マスクで下の桁だけ消す

範囲の境目にある語は、一部だけ消します。`-1L << (bitIndex & 0x3f)` は、下の桁を 0、上の桁を 1 にしたマスクです。`&=` でかけると、下の桁だけが 0 になります。

```scala:line-numbers=61
    if (wordIndex < words.length) {
      // Clear the remaining bits
      val mask = -1L << (bitIndex & 0x3f)
      words(wordIndex) &= mask
```

## ここがすごい

- 1 ビットずつ消すのではなく、語の単位でまとめて消すので、範囲が大きくても語の数だけの計算で済みます。
- 途中の語だけをマスクで扱うので、範囲の端の処理が 1 か所に限られます。
- 範囲の外に出る場合にも、`wordIndex < words.length` の確認で、配列の外を書かないようにしています。
- `setUntil` と並べて読むと、同じ形で 1 と 0 を切り替えていることが分かります。対称な設計です。

## まとめ

- 範囲のビットをまとめて 0 にするには、完全な語は 0 で埋め、端の語だけマスクを使います。
- 1 を立てる関数と 0 にする関数を対で持つと、集合の操作がそろいます。
- マスクは、ビットの位置を指定して作れると、端の処理が簡単になります。
