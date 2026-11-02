---
title: "2 つの集合のうち、どちらか片方だけにある要素を残す"
description: "Apache Spark の BitSet.^。対称差と呼ばれる演算で、両方に入っている要素は取り除き、片方だけにある要素を残す。語ごとに XOR を取り、長い方の余った語はそのままコピーする。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/BitSet.scala"
lines: [114, 129]
format: 2
function: "BitSet.^"
difficulty: 3
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

Spark の `BitSet` の `^` は、対称差を作ります。2 つの集合のうち、片方だけに入っている要素を残し、両方に入っている要素は取り除きます。たとえば `{1, 2}` と `{2, 3}` の対称差は `{1, 3}` です。

## コード

```scala:line-numbers=114
  def ^(other: BitSet): BitSet = {
    val newBS = new BitSet(math.max(capacity, other.capacity))
    val smaller = math.min(numWords, other.numWords)
    var ind = 0
    while (ind < smaller) {
      newBS.words(ind) = words(ind) ^ other.words(ind)
      ind += 1
    }
    if (ind < numWords) {
      Array.copy( words, ind, newBS.words, ind, numWords - ind )
    }
    if (ind < other.numWords) {
      Array.copy( other.words, ind, newBS.words, ind, other.numWords - ind )
    }
    newBS
  }
```

## 前提知識

- 対称差は、「どちらか一方にだけ入っている要素」の集まりです。集合の論理で言う排他的な和にあたります。
- `^`（XOR）は、同じ桁が違うとき 1、同じとき 0 になる演算です。ビットの集合では、片方だけが 1 の位置が 1 になります。
- 語の数が違う場合、長い方の余った語は、もう片方には無いので、そのまま結果に写せば足ります。
- `Array.copy` は、配列の一部をまとめてコピーする関数です。
- `math.max` は、2 つの容量のうち大きい方を取ります。

## 何をしているか

### 1. 結果の容量を大きい方に合わせ、共通の範囲の語を計算する

結果は、大きい方の容量で作ります。2 つの語の数の小さい方までを、語ごとに XOR します。両方が 1 なら 0 に、片方だけが 1 なら 1 になります。

```scala:line-numbers=115
    val newBS = new BitSet(math.max(capacity, other.capacity))
    val smaller = math.min(numWords, other.numWords)
    var ind = 0
    while (ind < smaller) {
      newBS.words(ind) = words(ind) ^ other.words(ind)
      ind += 1
    }
```

### 2. 片方の余った語は、そのままコピーする

自分の方が語が多ければ、余った語を結果にコピーします。相手の方が多ければ、相手の余った語をコピーします。どちらの場合も、もう片方には対応する語が無いので、そのまま残ります。

```scala:line-numbers=122
    if (ind < numWords) {
      Array.copy( words, ind, newBS.words, ind, numWords - ind )
    }
    if (ind < other.numWords) {
      Array.copy( other.words, ind, newBS.words, ind, other.numWords - ind )
    }
```

### 3. 結果を返す

すべての語を作り終えたら、結果の集合を返します。

```scala:line-numbers=128
    newBS
  }
```

## ここがすごい

- XOR 1 回で、両方にある要素を消し、片方だけにある要素を残せます。集合の論理を、ビット演算がそのまま表しています。
- 余った語をコピーするだけなので、無駄な計算がありません。
- 語の単位で処理するので、要素が多い集合でも、語の数の回数で終わります。
- 元の集合は変えず、新しい集合を返すので、結果を別の計算に使えます。

## まとめ

- 対称差は、ビットの XOR で語ごとに計算できます。
- 語の数が違うときは、余った部分をコピーして結果に含めます。
- 集合の演算を 1 つのビット演算に置き換えると、コードが短く速くなります。
