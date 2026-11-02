---
title: "全部を覚えずに、平均と分散を 1 つずつ更新する"
description: "Spark の StatCounter.merge(value)。1 つ値を足すたびに平均と二乗和を更新する Welford の方法で、データを保存せずに分散を正確に求める。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "Copyright 2014 and onwards The Apache Software Foundation."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/StatCounter.scala"
lines: [43, 51]
format: 2
function: "StatCounter.merge"
difficulty: 3
tags: [数値計算, アルゴリズム, 最適化]
---

## ひとことで

Apache Spark の `StatCounter` は、数の列の個数、平均、分散、最大、最小を集計する部品です。`merge(value)` は、1 つの値を足すたびに、それまでの平均と二乗和を更新します。すべての値を覚えておく必要がないので、大量のデータを流しながら統計を取れます。

## コード

```scala:line-numbers=43
  def merge(value: Double): StatCounter = {
    val delta = value - mu
    n += 1
    mu += delta / n
    m2 += delta * (value - mu)
    maxValue = math.max(maxValue, value)
    minValue = math.min(minValue, value)
    this
  }
```

## 前提知識

- 平均は、値の合計を個数で割ったものです。分散は、平均からのずれの二乗の平均です。
- 分散を素直に求めるには、全部の値の合計と二乗の合計を持つ方法があります。しかし、大きな数どうしを引くと、桁落ちで誤差が出やすくなります。
- `n` は今までに足した値の個数、`mu` は今の平均、`m2` は平均からのずれの二乗の合計です。
- Welford の方法は、平均と `m2` を 1 つずつ更新することで、この誤差を抑える方法として知られています。
- `math.max` と `math.min` は、2 つの値の大きい方と小さい方を返します。

## 何をしているか

### 1. 平均からのずれを求める

新しい値 `value` と今の平均 `mu` の差 `delta` を求めます。個数 `n` を 1 増やしたあと、平均を `delta / n` だけ動かします。

```scala:line-numbers=44
    val delta = value - mu
    n += 1
    mu += delta / n
```

平均を少しずつ動かすので、全部の値を保存しなくても平均が正しく求まります。

### 2. 二乗和を、新しい平均で更新する

`m2` の更新では、古い平均からのずれ `delta` と、新しい平均からのずれ `value - mu` を掛けます。この 2 つの組み合わせが、分散を正しく保つための鍵です。

```scala:line-numbers=47
    m2 += delta * (value - mu)
```

### 3. 最大と最小も一緒に更新する

最後の 2 行で、最大と最小を比べて更新します。値を 1 つ足すだけで、5 つの統計がすべて最新になります。

```scala:line-numbers=48
    maxValue = math.max(maxValue, value)
    minValue = math.min(minValue, value)
```

## ここがすごい

- 全部の値を保存せず、定数個の変数だけで分散が求まります。大量のデータを 1 回だけ読むような場面で役立ちます。
- 平均を先に更新してから、新しい平均との差を使うのが、この方法の特徴です。合計の二乗を引く方法より、大きな値の桁落ちに強くなります。
- 関数 `merge` は、値を 1 つ受け取って `this` を返します。同じ形のまま、次の `merge` へ続けて呼べます。
- 分散の計算を 1 つの関数に閉じ込めているので、ほかの統計量と同じ更新の流れで扱えます。

## まとめ

- 平均と分散は、値を 1 つずつ足しながら更新できます。
- 平均からのずれを使うと、大きな数の引き算による誤差を抑えられます。
- 一度に 1 つずつ処理すると、データを保存せずに統計を取れます。
