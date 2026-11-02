---
title: "中央で二つに割って混ぜる、マージソート"
description: "Scala の Sorting.mergeSort。範囲が小さいときは挿入ソートに切り替え、大きいときは中央で二分して再帰的に並べ、最後に 2 つの並びを混ぜる。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/util/Sorting.scala"
lines: [180, 189]
format: 2
function: "Sorting.mergeSort"
difficulty: 3
tags: [ソート, アルゴリズム, 再帰, 最適化]
---

## ひとことで

Scala の標準ライブラリにある配列のソートのうち、マージソートの本体です。配列を中央で左右に分けて、それぞれを再帰的にソートしてから、2 つの並びを 1 つにまぜます。範囲が小さいときは、速い挿入ソートに切り替えています。

## コード

::: code-group

```scala:line-numbers=180 [日本語訳]
  private def mergeSort[@specialized T: ClassTag](a: Array[T], i0: Int, iN: Int, ord: Ordering[T], scratch: Array[T] = null): Unit = {
    if (iN - i0 < mergeThreshold) insertionSort(a, i0, iN, ord)
    else {
      val iK = (i0 + iN) >>> 1   // 符号なしの計算と同じ結果になるビットシフトです。オーバーフローしません。
      val sc = if (scratch eq null) new Array[T](iK - i0) else scratch
      mergeSort(a, i0, iK, ord, sc)
      mergeSort(a, iK, iN, ord, sc)
      mergeSorted(a, i0, iK, iN, ord, sc)
    }
  }
```

```scala:line-numbers=180 [原文]
  private def mergeSort[@specialized T: ClassTag](a: Array[T], i0: Int, iN: Int, ord: Ordering[T], scratch: Array[T] = null): Unit = {
    if (iN - i0 < mergeThreshold) insertionSort(a, i0, iN, ord)
    else {
      val iK = (i0 + iN) >>> 1   // Bit shift equivalent to unsigned math, no overflow
      val sc = if (scratch eq null) new Array[T](iK - i0) else scratch
      mergeSort(a, i0, iK, ord, sc)
      mergeSort(a, iK, iN, ord, sc)
      mergeSorted(a, i0, iK, iN, ord, sc)
    }
  }
```

:::

## 前提知識

- マージソートは、分割して並べてから混ぜる、分割統治のソートです。要素数が n のとき、比較の回数は `O(n log n)` になります。
- 「混ぜる（merge）」は、2 つのソート済みの並びを先頭から比べながら、小さい方を 1 つずつ取り出して 1 つにすることです。
- `iN - i0` は、範囲に含まれる要素の数です。`i0` は含み、`iN` は含みません。
- `>>> 1` は、符号なしで 2 で割る操作です。
- `scratch` は、混ぜるときに使う作業用の配列です。

## 何をしているか

### 1. 小さい範囲は挿入ソートに任せる

範囲が `mergeThreshold` より小さいときは、再帰せずに `insertionSort` で並べます。小さな範囲では、再帰の呼び出しや作業配列の用意が、かえって重くなるためです。

```scala:line-numbers=181
    if (iN - i0 < mergeThreshold) insertionSort(a, i0, iN, ord)
```

### 2. 中央の位置を求める

それ以外のときは、範囲を中央で 2 つに分けます。中央の位置は `(i0 + iN) >>> 1` で求めます。

コメントにあるように、`>>>` を使うと、値の合計が `Int` の最大値を超えても、符号なしとして正しい中央を得られます。

### 3. 左右をソートしてから混ぜる

左半分と右半分をそれぞれ再帰でソートし、最後に `mergeSorted` で 2 つを 1 つにまとめます。作業配列 `sc` は、左側の並びを一時的に置くために使い回されます。

## ここがすごい

- 小さな範囲で挿入ソートに切り替えるのは、よく使われる工夫です。小さい範囲では、挿入ソートの定数倍が小さく、速く終わります。
- 作業配列 `scratch` を再帰の呼び出しの間で共有しているので、混ぜるたびに配列を新しく作らずに済みます。
- `@specialized` と組み合わせると、`Int` や `Double` などの配列に対して、箱に入れない専用の版が作られます。数値のソートが速くなります。
- 同じ値のとき左側の要素を先に出すように作られていれば、安定ソートになります。

## まとめ

- マージソートは、中央で割って再帰的に並べ、最後に混ぜるソートです。
- 小さい範囲は挿入ソートに任せると、全体が速くなります。
- 中央の位置は、`>>> 1` で求めると溢れにくくなります。
