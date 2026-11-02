---
title: "等差数列の並びは、range と同じハッシュになる"
description: "Scala の MurmurHash3.orderedHash。要素の差が一定の並びを検出し、Range と同じ値になるように計算する。配列やリストの並びを、ハッシュで区別しやすくする工夫。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/util/hashing/MurmurHash3.scala"
lines: [141, 172]
format: 2
function: "MurmurHash3.orderedHash"
difficulty: 3
tags: [ハッシュ, アルゴリズム, 標準ライブラリ]
---

## ひとことで

Scala の `MurmurHash3.orderedHash` は、順番のあるコレクションのハッシュを計算する関数です。要素がずっと同じ差で並んでいる（たとえば 1, 3, 5, 7 のような等差数列）場合は、`Range` のハッシュと同じ値になるように特別に計算します。普通の並びは、1 つずつ混ぜ込んで計算します。

## コード

```scala:line-numbers=141
  final def orderedHash(xs: IterableOnce[Any], seed: Int): Int = {
    val it = xs.iterator
    var h = seed
    if(!it.hasNext) return finalizeHash(h, 0)
    val x0 = it.next()
    if(!it.hasNext) return finalizeHash(mix(h, x0.##), 1)
    val x1 = it.next()

    val initial = x0.##
    h = mix(h, initial)
    val h0 = h
    var prev = x1.##
    val rangeDiff = prev - initial
    var i = 2
    while (it.hasNext) {
      h = mix(h, prev)
      val hash = it.next().##
      if(rangeDiff != hash - prev || rangeDiff == 0) {
        h = mix(h, hash)
        i += 1
        while (it.hasNext) {
          h = mix(h, it.next().##)
          i += 1
        }
        return finalizeHash(h, i)
      }
      prev = hash
      i += 1
    }
    avalanche(mix(mix(h0, rangeDiff), prev))

  }
```

## 前提知識

- 順序のあるコレクションは、`List` や `Vector` のように、要素の並びに意味があるものです。`[1, 2]` と `[2, 1]` は違うと考えます。
- `Range` は、1 から 10 まで、のように等差数列を省メモリで表す型です。
- `it.hasNext` と `it.next()` は、イテレータで要素を 1 つずつ取り出す書き方です。
- `return` は、関数から途中で値を返す書き方です。
- `x.##` は、ハッシュ値を計算する Scala の演算子です。

## 何をしているか

### 1. 最初の 2 要素で差を決める

まず、先頭の要素 `initial` と 2 番目の要素 `prev` を読み、その差 `rangeDiff` を求めます。

```scala:line-numbers=152
    var prev = x1.##
    val rangeDiff = prev - initial
```

この差が、等差数列の公差になります。以降の要素がこの差と同じ間隔で並べば、等差数列だとわかります。

### 2. 差が崩れたら、普通に混ぜ直す

ループの中で、次の要素との差が `rangeDiff` と違うときは、等差数列ではなくなっています。そのときは、残りの要素をすべて `mix` で混ぜて、結果を返します。

```scala:line-numbers=158
      if(rangeDiff != hash - prev || rangeDiff == 0) {
```

### 3. 最後まで等差数列なら、Range と同じ計算で仕上げる

最後まで差が一定だった場合は、`mix` で初期値と差を混ぜ、`avalanche` で仕上げます。この計算方法は、`Range` のハッシュ `rangeHash` と互換になるように設計されています。

## ここがすごい

- 等差数列を見分けて、`Range` と同じ値を返すように作るのは、ハッシュの「等しいものは同じ値になる」という約束を守るための工夫です。`(1 to 3) == List(1, 2, 3)` のように、同じ並びなら同じハッシュになる必要があるからです。
- 等差数列のときは、先頭と差だけで表せるので、途中の要素ごとの計算を省けます。
- 差が崩れたときに、今まで混ぜた値を引き継いで続けるので、途中まで等差数列だった並びも、正しく区別されます。
- 要素を 1 回ずつ読むだけで、余分な配列を作らずに判定しています。

## まとめ

- 順序のあるデータのハッシュは、要素を順に混ぜ込む方法が基本です。
- 等差数列を特別扱いすると、`Range` と同じ値になるように揃えられます。
- 検出と通常の計算を 1 回の走査で行うと、効率よく判定できます。
