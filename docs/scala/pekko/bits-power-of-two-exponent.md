---
title: "2 の累乗の指数を、先頭の 0 の数から求める"
description: "Apache Pekko の FrequencySketch.Bits.powerOfTwoExponent。指定した数を覆う 2 の累乗の指数を求める。Integer.numberOfLeadingZeros で先頭の 0 の数を数えて、32 から引く。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2021-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/FrequencySketch.scala"
lines: [90, 90]
format: 2
function: "Bits.powerOfTwoExponent"
difficulty: 2
tags: [ビット演算, 数値計算, アルゴリズム]
---

## ひとことで

Apache Pekko の `FrequencySketch` にある `powerOfTwoExponent` は、指定した数を覆うのに必要な 2 の指数を求めます。たとえば 5 なら 3 を返します。2 の 3 乗は 8 で、5 を覆えるからです。ビットを何個使えばよいかを求めるときに役立ちます。

## コード

```scala:line-numbers=90
    def powerOfTwoExponent(i: Int): Int = 32 - Integer.numberOfLeadingZeros(i - 1)
```

## 前提知識

- 指数は、2 を何回かけるかを表す数です。`2^3 = 8` のように書きます。
- `Integer.numberOfLeadingZeros(x)` は、`x` を 32 ビットで見たときの、先頭から続く 0 の数です。`1`（`1`）なら 31、`4`（`100`）なら 29 です。
- `32 - n` は、ビットの数（32）から先頭の 0 の数を引いた値で、`x` の最上位の 1 の位置（1 から数えた場所）と同じです。
- 「覆う」とは、指定の数以上の 2 の累乗を作れることを指します。
- ここでは、`i - 1` を使っているので、`i` ちょうどの 2 の累乗では、指数がその値に一致します。

## 何をしているか

### 1. `i - 1` の先頭の 0 の数を数える

`i - 1` の先頭から続く 0 の数を求めます。その数が少ないほど、`i - 1` は大きいということです。

### 2. 32 から引いて、ビットの位置を求める

```scala:line-numbers=90
    def powerOfTwoExponent(i: Int): Int = 32 - Integer.numberOfLeadingZeros(i - 1)
```

`32 - 先頭の 0 の数` は、`i - 1` の最上位の 1 の位置です。この値が、`i` を覆うのに必要な指数になります。

たとえば `i = 5` なら、`i - 1 = 4`（`100`）で、先頭の 0 は 29 個です。`32 - 29 = 3` になり、`2^3 = 8` が 5 を覆う最小の 2 の累乗だと分かります。

## ここがすごい

- 対数の関数を使わず、整数のビット演算だけで指数を求めます。小数の誤差が起きない点も利点です。
- `i - 1` を使うので、`i = 8` のような 2 の累乗では、指数が 3 と正しく返ります。境界の値で 1 つ大きくなる誤りを防いでいます。
- `ceilingPowerOfTwo` と組み合わせると、大きさを 2 の累乗にする処理を、指数と 1 シフトに分けて書けます。
- 1 行の式で、目的の計算がそのまま読める書き方です。

## まとめ

- 2 の指数は、先頭の 0 の数を 32 から引くと、整数だけで求められます。
- `i - 1` を使うと、2 の累乗ちょうどの値でも正しい指数を返します。
- 対数を使わないことで、速さと正確さを両立できます。
