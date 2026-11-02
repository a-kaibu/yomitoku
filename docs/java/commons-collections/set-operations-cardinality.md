---
title: "2 つのビットマップの演算結果を、1 の個数で数える"
description: "Apache Commons Collections の bloomfilter の SetOperations。2 つのビット配列を語ごとに AND・OR・XOR し、結果の 1 の個数を Long.bitCount で足し合わせる。"
language: java
project: Apache Commons Collections
repo: https://github.com/apache/commons-collections
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "9e14d468e850e4175187023557b0735ad9bb19ea"
file: src/main/java/org/apache/commons/collections4/bloomfilter/SetOperations.java
lines: [62, 70]
function: "SetOperations.cardinality"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, アルゴリズム]
---

## ひとことで

ブルームフィルタは、「ある要素を入れたかもしれない」を、ビットの配列で少ないメモリに覚えておくデータ構造です。2 つのフィルタを比べると、どのくらいの要素を共有しているかが見えます。

`SetOperations` は、その比べ方の一つとして、2 つのビット配列の AND や OR、XOR を取ったときに、立っているビットの数（カーディナリティ）を求めます。このメソッドは、その計算の本体です。

## コード

```java:line-numbers=62
    private static int cardinality(final BitMapExtractor first, final BitMapExtractor second, final LongBinaryOperator op) {
        final int[] cardinality = new int[1];

        first.processBitMapPairs(second, (x, y) -> {
            cardinality[0] += Long.bitCount(op.applyAsLong(x, y));
            return true;
        });
        return cardinality[0];
    }
```

## 前提知識

- **ブルームフィルタ**: ビットの配列と、複数のハッシュ関数を使う集合の近似表現です。要素を入れると、対応するビットを立てます。
- **カーディナリティ**: 立っているビットの個数です。集合の大きさの目安になります。
- **`Long.bitCount(x)`**: `long` の中の 1 の個数を数えるメソッドです。
- **`LongBinaryOperator`**: 2 つの `long` を受け取って 1 つの `long` を返す演算です。ここでは `(x, y) -> x & y` のように、AND や OR、XOR を渡します。
- **`processBitMapPairs`**: 2 つのビット配列を、同じ位置の語どうしで順に渡していく処理です。

## 何をしているか

### 1. 2 つのビット配列を、語ごとに組み合わせる

```java:line-numbers=65
        first.processBitMapPairs(second, (x, y) -> {
            cardinality[0] += Long.bitCount(op.applyAsLong(x, y));
```

`first.processBitMapPairs(second, ...)` は、2 つのフィルタのビット配列を、同じ位置の 64 ビットの語の組として順に渡します。`op.applyAsLong(x, y)` で、その組に対して AND、OR、XOR のどれかを取ります。

### 2. 結果の 1 の個数を足し合わせる

```java:line-numbers=66
            cardinality[0] += Long.bitCount(op.applyAsLong(x, y));
```

`Long.bitCount(...)` で、演算結果の 64 ビットの中の 1 の個数を数え、`cardinality[0]` に足します。すべての語を回り終えると、全体の 1 の個数が求まります。

### 3. 結果を返す

```java:line-numbers=69
        return cardinality[0];
```

足し合わせた値を返します。`andCardinality` では `op` が AND、`orCardinality` では OR、`xorCardinality` では XOR になります。

## ここがすごい

- **演算の種類をラムダで差し替える**: AND、OR、XOR の計算は、同じ関数に `LongBinaryOperator` として渡すだけです。同じ骨組みを 3 回書く必要がありません。
- **中間のビット配列を作らない**: 演算結果を新しい配列に保存せず、語ごとに「演算して数える」を繰り返します。メモリの割り当てが減ります。
- **1 語ずつの処理が速い**: 64 ビットを 1 回の命令で数えられるので、ビット単位で数えるより、ずっと少ない回数の処理で済みます。
- **カウンタは配列 1 要素**: ラムダの中から値を書き換えるために、`int[1]` を使っています。Java でラムダの外の変数を書き換えられない制約への、単純な対処です。

## まとめ

- 2 つのビット配列を語ごとに `op` で組み合わせ、結果の 1 の個数を `Long.bitCount` で足し合わせる。
- AND、OR、XOR の違いは、渡す `LongBinaryOperator` だけである。
- 中間配列を作らず、語ごとの「演算して数える」で、2 つのフィルタの重なりの大きさを求める。
