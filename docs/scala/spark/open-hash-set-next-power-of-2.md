---
title: "次の 2 のべき乗を、最上位ビットから求める"
description: "Spark の OpenHashSet.nextPowerOf2。Integer.highestOneBit で最上位の 1 ビットを取り、必要なら 1 つ左にずらして、以上で最小の 2 のべき乗を得る。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "Copyright 2014 and onwards The Apache Software Foundation."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/OpenHashSet.scala"
lines: [272, 279]
format: 2
function: "OpenHashSet.nextPowerOf2"
difficulty: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

Apache Spark の `OpenHashSet` で使われる `nextPowerOf2` は、与えられた数 `n` 以上の、最小の 2 のべき乗を返します。たとえば 5 なら 8、8 なら 8 です。ハッシュ表の大きさを 2 のべき乗にすると、添字の計算をビット演算で済ませられるので、この関数が表の大きさを決めるために使われます。

## コード

```scala:line-numbers=272
  private def nextPowerOf2(n: Int): Int = {
    if (n == 0) {
      1
    } else {
      val highBit = Integer.highestOneBit(n)
      if (highBit == n) n else highBit << 1
    }
  }
```

## 前提知識

- 2 のべき乗は、1, 2, 4, 8, 16 のように、2 進数で 1 つだけ 1 が立っている数です。
- `Integer.highestOneBit(n)` は、n の中で一番上（最上位）にある 1 のビットだけを残した値を返します。たとえば 10 は 1010 なので、結果は 8 です。
- `<< 1` は 1 ビット左にずらすことで、値を 2 倍にします。
- ハッシュ表は、大きさが 2 のべき乗だと、`hash & (size - 1)` のようにビット演算で添字を決められます。
- `if ... else` は式として値を返せるので、関数の戻り値として直接使えます。

## 何をしているか

### 1. 0 の特別扱い

`n` が 0 のときは、最上位ビットが存在しないので、1 を返します。0 以上の最小の 2 のべき乗は 1 だからです。

### 2. 最上位の 1 ビットを取り出す

そのほかの場合は、`highestOneBit` で最上位の 1 ビットを取り出します。この値は、`n` 以下で最大の 2 のべき乗です。

```scala:line-numbers=276
      val highBit = Integer.highestOneBit(n)
```

### 3. ちょうどなら n、足りなければ 2 倍

`highestOneBit` の結果が `n` と同じなら、`n` はすでに 2 のべき乗なので、そのまま返します。そうでなければ、`highBit << 1` で 1 つ大きい 2 のべき乗にします。

```scala:line-numbers=277
      if (highBit == n) n else highBit << 1
```

## ここがすごい

- 2 のべき乗を求めるのに、ループで 1 ずつ倍にする必要がありません。`highestOneBit` の 1 命令で、最上位ビットが見つかります。
- 「すでに 2 のべき乗かどうか」を、結果と `n` を比べるだけで判定しています。特別な検査の関数を別に用意していません。
- 0 の場合を先に分けるのは、`highestOneBit(0)` が 0 を返して、2 倍しても 0 のままになってしまうからです。小さなケースの罠を避けています。
- ハッシュ表の大きさを 2 のべき乗に揃えると、剰余の代わりに `&` で添字を求められます。割り算より速く、この設計の大きな利点です。

## まとめ

- 最小の 2 のべき乗は、最上位ビットを使うと 1 回の計算で求められます。
- 2 のべき乗のまま返す場合と、倍にする場合を、比べるだけで判定できます。
- 0 のような境界の値は、先に分けて考えます。
