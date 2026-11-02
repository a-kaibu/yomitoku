---
title: "数列を足すのに、ループを回さず公式を使う"
description: "Scala の Range.sum は、Int の連続した範囲を等差数列の公式で一度に計算する。要素が 10 億個あっても、ループは 1 回も回らない。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/immutable/Range.scala"
lines: [441, 461]
format: 2
function: "Range.sum"
difficulty: 2
tags: [最適化, 標準ライブラリ, ジェネリクス]
---

## ひとことで

Scala の `Range`（`1 to 10` のような連続した整数の範囲）の合計を求める `sum` です。`Int` の標準的な加算のときは、ループを使わず等差数列の公式で一発計算します。利用者が独自の `Numeric` を渡したときだけ、1 要素ずつ足します。

## コード

::: code-group

```scala:line-numbers=441 [日本語訳]
  final override def sum[B >: Int](implicit num: Numeric[B]): Int = {
    if (num eq scala.math.Numeric.IntIsIntegral) {
      // 普通の Int の範囲なので、通常の足し算で等差数列の公式が使えます。
      if (isEmpty) 0
      else if (size == 1) head
      else ((size * (head.toLong + last)) / 2).toInt
    } else {
      // 利用者が独自の Numeric を渡したときは、等差数列の公式は使えません。
      if (isEmpty) num.toInt(num.zero)
      else {
        var acc = num.zero
        var i = head
        while (true) {
          acc = num.plus(acc, i)
          if (i == lastElement) return num.toInt(acc)
          i = i + step
        }
        0 // ここには到達しません。コンパイラは while(true) の型を知らないので、型を合わせるためだけに書いています。
      }
    }
  }
```

```scala:line-numbers=441 [原文]
  final override def sum[B >: Int](implicit num: Numeric[B]): Int = {
    if (num eq scala.math.Numeric.IntIsIntegral) {
      // this is normal integer range with usual addition. arithmetic series formula can be used
      if (isEmpty) 0
      else if (size == 1) head
      else ((size * (head.toLong + last)) / 2).toInt
    } else {
      // user provided custom Numeric, we cannot rely on arithmetic series formula
      if (isEmpty) num.toInt(num.zero)
      else {
        var acc = num.zero
        var i = head
        while (true) {
          acc = num.plus(acc, i)
          if (i == lastElement) return num.toInt(acc)
          i = i + step
        }
        0 // Never hit this--just to satisfy compiler since it doesn't know while(true) has type Nothing
      }
    }
  }
```

:::

## 前提知識

- `Range` は `start`、`end`、`step` で決まる整数の並びです。`1 to 10` は 1 から 10 まで、`1 until 10` は 1 から 9 までです。
- `Numeric` は「足し算などができる数値型」を表す型クラスです。`Int` や `Long` や `Double` が対応しています。
- 等差数列は、差が一定の数列です。1 から n までの和は、`n * (1 + n) / 2` で求められます。
- `final override def` は、親のメソッドを上書きし、子で変えられないようにする宣言です。
- `eq` は 2 つの参照が同じオブジェクトかを調べる演算子です。

## 何をしているか

### 1. 普通の Int なら公式で計算する

先頭の分岐で、`Numeric` が標準の `Int` 用のものかを `eq` で調べます。そのときは、空、要素が 1 つ、それ以外の 3 通りに分けて計算します。

```scala:line-numbers=444
      if (isEmpty) 0
      else if (size == 1) head
      else ((size * (head.toLong + last)) / 2).toInt
```

要素が 1 つなら、その値がそのまま合計です。それ以外は、個数 `size` と先頭と末尾の和を掛けて 2 で割ります。

### 2. オーバーフローを防ぐため Long で計算する

公式の中では `head.toLong + last` と書いています。`Int` の範囲で掛け算をすると、大きな範囲でオーバーフローして値が壊れます。先に `Long` に変換してから掛けることで、途中の値を安全に保っています。

### 3. 独自の Numeric はループで足す

`Numeric` が標準の `Int` と違うときは、公式が使えません。その場合は、`num.plus` で 1 要素ずつ足します。

ループ自体は `while (true)` で書かれていて、`i == lastElement` になったら `return` で抜けます。ループの後ろの `0` は、コンパイラに型を合わせるためだけの書き方です。

## ここがすごい

- 1 から 10 億までを `sum` するのに、公式なら 1 回の掛け算と割り算で済みます。素直にループすると 10 億回の加算が必要です。
- 特別な場合を `eq` で判定しているので、同じ `sum` という名前のまま、標準の型では速く、独自の型では正しく動きます。
- 公式の中で `Long` に変換する一手間が、範囲が大きいときの正しさを支えています。
- 「速く計算できる場合だけ特別扱いし、それ以外は汎用の方法を使う」という作りは、標準ライブラリでよく見られる工夫です。

## まとめ

- 連続した整数の和は、等差数列の公式で一度に求められます。
- 掛け算の前に `Long` へ変換すると、大きな範囲でもオーバーフローを防げます。
- 型ごとに速い道と汎用の道を分けると、速さと正しさを両立できます。
