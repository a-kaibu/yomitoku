---
title: "全件を読みながら k 個を一様に選ぶ貯水池サンプリング"
description: "Spark の reservoirSampleAndCount。データを 1 回だけ読みながら、最大 k 個の標本を、すべての要素が同じ確率で残るように選ぶ。件数も同時に数える。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "Copyright 2014 and onwards The Apache Software Foundation."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/random/SamplingUtils.scala"
lines: [33, 70]
format: 2
function: "SamplingUtils.reservoirSampleAndCount"
difficulty: 3
tags: [乱数, アルゴリズム, 数値計算]
---

## ひとことで

Apache Spark の `SamplingUtils` にある `reservoirSampleAndCount` です。データの総数がわからない列を 1 回だけ読みながら、k 個の標本を選びます。読み終わったときには、すべての要素が同じ確率で標本に残っていて、同時に総数も返します。

## コード

::: code-group

```scala:line-numbers=33 [日本語訳]
  def reservoirSampleAndCount[T: ClassTag](
      input: Iterator[T],
      k: Int,
      seed: Long = Random.nextLong())
    : (Array[T], Long) = {
    val reservoir = new Array[T](k)
    // 最初の k 個の要素を貯水池に入れます。
    var i = 0
    while (i < k && input.hasNext) {
      val item = input.next()
      reservoir(i) = item
      i += 1
    }

    // 全要素を読み終えていれば、それらを返します。そうでなければ入れ替えを行います。
    if (i < k) {
      // 入力サイズが k より小さければ、配列を入力サイズまで切り詰めて返します。
      val trimReservoir = new Array[T](i)
      System.arraycopy(reservoir, 0, trimReservoir, 0, i)
      (trimReservoir, i)
    } else {
      // 入力サイズが k より大きければ、サンプリングを続けます。
      var l = i.toLong
      val rand = new XORShiftRandom(seed)
      while (input.hasNext) {
        val item = input.next()
        l += 1
        // 貯水池には k 個の要素があり、l 番目の要素を読み込みました。
        // この要素は確率 k/l で選ばれるべきです。次の式は
        // 0 以上 l 未満の範囲から一様に選んだ乱数です。
        val replacementIndex = (rand.nextDouble() * l).toLong
        if (replacementIndex < k) {
          reservoir(replacementIndex.toInt) = item
        }
      }
      (reservoir, l)
    }
  }
```

```scala:line-numbers=33 [原文]
  def reservoirSampleAndCount[T: ClassTag](
      input: Iterator[T],
      k: Int,
      seed: Long = Random.nextLong())
    : (Array[T], Long) = {
    val reservoir = new Array[T](k)
    // Put the first k elements in the reservoir.
    var i = 0
    while (i < k && input.hasNext) {
      val item = input.next()
      reservoir(i) = item
      i += 1
    }

    // If we have consumed all the elements, return them. Otherwise do the replacement.
    if (i < k) {
      // If input size < k, trim the array to return only an array of input size.
      val trimReservoir = new Array[T](i)
      System.arraycopy(reservoir, 0, trimReservoir, 0, i)
      (trimReservoir, i)
    } else {
      // If input size > k, continue the sampling process.
      var l = i.toLong
      val rand = new XORShiftRandom(seed)
      while (input.hasNext) {
        val item = input.next()
        l += 1
        // There are k elements in the reservoir, and the l-th element has been
        // consumed. It should be chosen with probability k/l. The expression
        // below is a random long chosen uniformly from [0,l)
        val replacementIndex = (rand.nextDouble() * l).toLong
        if (replacementIndex < k) {
          reservoir(replacementIndex.toInt) = item
        }
      }
      (reservoir, l)
    }
  }
```

:::

## 前提知識

- 標本（サンプル）は、全体から一部を取り出した集まりです。全体を偏りなく代表させるには、どの要素も同じ確率で選ばれる必要があります。
- 貯水池サンプリング（reservoir sampling）は、要素数がわからない列から、一様な標本を 1 回の走査で選ぶ方法です。
- `Iterator` は、要素を 1 つずつ順に取り出す仕組みです。`hasNext` で続きがあるか、`next()` で次の要素を取ります。
- `ClassTag[T]` は、ジェネリクスの配列を作るために必要な、実行時の型情報です。
- `Array[T](k)` は長さ k の配列を作ります。

## 何をしているか

### 1. 最初の k 個は、そのまま貯水池に入れる

最初の `while` で、先頭から最大 k 個の要素を配列 `reservoir` に入れます。入力が k 個より少なければ、後で配列を切り詰めて返します。

### 2. l 番目の要素を、確率 k/l で入れ替える

k 個を超えたら、残りの要素を 1 つずつ読みます。`l` は今までに読んだ要素の数です。新しい要素を入れるかどうかは、乱数で決めます。

```scala:line-numbers=63
        val replacementIndex = (rand.nextDouble() * l).toLong
        if (replacementIndex < k) {
          reservoir(replacementIndex.toInt) = item
        }
```

`rand.nextDouble() * l` は、0 以上 l 未満の実数を作ります。その整数部分が k より小さければ、ランダムな位置の要素をこの新しい要素で置き換えます。これで、l 番目の要素が選ばれる確率は k/l になります。

### 3. 読み終わったら、貯水池と件数を返す

入力を読み終えたら、貯水池と総数 `l` を組にして返します。どの要素も、最終的に残る確率は k/n で、同じになります。

## ここがすごい

- 全件を配列に入れてから標本を選ぶと、大きなデータではメモリが足りなくなります。この方法は、k 個分のメモリだけで済みます。
- 乱数の値を `rand.nextDouble() * l` と計算し、確率 k/l を 1 回の比較で実現しています。要素ごとに余計な計算をしないので、1 回の走査で終わります。
- 件数を同時に数えるので、「標本を取る」と「全体の大きさを知る」を 1 回の読み取りでまとめられます。
- 乱数には、Spark が使う XORShiftRandom を `seed` から作って使っています。乱数源が同じなら、同じ `seed` の結果は再現できます。

## まとめ

- 件数がわからないデータからも、1 回の走査で一様な標本を取れます。
- 残す確率を「今まで読んだ数」に合わせて、乱数で入れ替えを決めます。
- 標本と件数を同時に返すと、統計の処理を 1 回の読み取りで終えられます。
