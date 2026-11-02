---
title: "挿入位置を二分探索で探すソート"
description: "Scala の Sorting に入っている小さな配列向けの挿入ソート。前の要素との比較を二分探索に置き換え、比較回数を減らしている。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/util/Sorting.scala"
lines: [147, 177]
format: 2
function: "Sorting.insertionSort"
difficulty: 3
tags: [ソート, アルゴリズム, 最適化, 標準ライブラリ]
---

## ひとことで

Scala の標準ライブラリにある小さな配列向けのソートで、内部で使われる `insertionSort` です。要素を 1 つずつ、すでに並んでいる部分のどこに入れるかを二分探索で探してから、後ろの要素を 1 つずつずらして差し込みます。

## コード

::: code-group

```scala:line-numbers=147 [日本語訳]
  private def insertionSort[@specialized T](a: Array[T], i0: Int, iN: Int, ord: Ordering[T]): Unit = {
    val n = iN - i0
    if (n < 2) return
    if (ord.compare(a(i0), a(i0+1)) > 0) {
      val temp = a(i0)
      a(i0) = a(i0+1)
      a(i0+1) = temp
    }
    var m = 2
    while (m < n) {
      // 並びが既に整っている場合を速くするため、直前の要素を先に調べます。
      val next = a(i0 + m)
      if (ord.compare(next, a(i0+m-1)) < 0) {
        var iA = i0
        var iB = i0 + m - 1
        while (iB - iA > 1) {
          val ix = (iA + iB) >>> 1    // ビットシフトで、符号なしの 2 で割る計算をします。
          if (ord.compare(next, a(ix)) < 0) iB = ix
          else iA = ix
        }
        val ix = iA + (if (ord.compare(next, a(iA)) < 0) 0 else 1)
        var i = i0 + m
        while (i > ix) {
          a(i) = a(i-1)
          i -= 1
        }
        a(ix) = next
      }
      m += 1
    }
  }
```

```scala:line-numbers=147 [原文]
  private def insertionSort[@specialized T](a: Array[T], i0: Int, iN: Int, ord: Ordering[T]): Unit = {
    val n = iN - i0
    if (n < 2) return
    if (ord.compare(a(i0), a(i0+1)) > 0) {
      val temp = a(i0)
      a(i0) = a(i0+1)
      a(i0+1) = temp
    }
    var m = 2
    while (m < n) {
      // Speed up already-sorted case by checking last element first
      val next = a(i0 + m)
      if (ord.compare(next, a(i0+m-1)) < 0) {
        var iA = i0
        var iB = i0 + m - 1
        while (iB - iA > 1) {
          val ix = (iA + iB) >>> 1    // Use bit shift to get unsigned div by 2
          if (ord.compare(next, a(ix)) < 0) iB = ix
          else iA = ix
        }
        val ix = iA + (if (ord.compare(next, a(iA)) < 0) 0 else 1)
        var i = i0 + m
        while (i > ix) {
          a(i) = a(i-1)
          i -= 1
        }
        a(ix) = next
      }
      m += 1
    }
  }
```

:::

## 前提知識

- 挿入ソートは、先頭から順に 1 つずつ要素を取り、並んでいる部分の正しい場所に差し込むソートです。
- 二分探索は、並んだ配列の中央と比べて、探す範囲を半分ずつ狭める探し方です。
- `ord.compare(a, b)` は、`a` が `b` より小さいなら負の数、等しいなら 0、大きいなら正の数を返します。
- `>>> 1` は符号なしの右シフトで、2 で割った整数部分を求める計算です。
- `@specialized` は、`Int` や `Double` などの型に対して、型ごとに特別な版を作らせる指定です。配列の箱を使わずに済むので速くなります。

## 何をしているか

### 1. 直前の要素と比べて、並び順が正しいかを見る

外側の `while` は、`m` 番目の要素を並んだ部分に入れる処理です。まず、今の要素が直前の要素より小さいかを比べます。小さくなければ、もう並んでいるので何もしません。

### 2. 二分探索で挿入位置を探す

小さいときは、`iA` から `iB` までの範囲で二分探索をします。

```scala:line-numbers=162
        while (iB - iA > 1) {
          val ix = (iA + iB) >>> 1    // Use bit shift to get unsigned div by 2
          if (ord.compare(next, a(ix)) < 0) iB = ix
          else iA = ix
        }
```

範囲の中央 `ix` と比べて、新しい要素が小さければ `iB` を動かし、大きければ `iA` を動かします。ループが終わると、差し込む位置は `iA` の少し後ろに決まります。

### 3. 後ろの要素を 1 つずつずらして差し込む

挿入位置 `ix` が決まったら、そこより後ろにある要素を 1 つ後ろへずらします。

```scala:line-numbers=169
        while (i > ix) {
          a(i) = a(i-1)
          i -= 1
        }
        a(ix) = next
```

ずらし終わったら、空いた場所に新しい要素を入れます。

## ここがすごい

- 挿入ソートは、比較回数だけ見ると並んだ部分の長さに比例して増えます。二分探索にすると、比較の回数は対数に比例して減ります。
- 既にソート済みの配列では、直前の要素と比べるだけで済みます。コード中のコメントが言うように、この先頭の確認で「もう並んでいる」場合をすぐ抜けられます。
- 要素を入れ替えるのではなく、後ろへずらすだけなので、1 回の挿入で書き込みは「ずらした分 + 1」だけです。入れ替えの 3 回の書き込みより軽くなります。
- 大きな配列には使わず、小さい配列の仕上げに使う、という割り切りが速さにつながっています。

## まとめ

- 挿入ソートは、既に並んだ部分へ 1 要素ずつ差し込むソートです。
- 挿入位置の探索を二分探索にすると、比較の回数を減らせます。
- 小さい配列や、ほぼ並んだ配列に向いた方法です。
