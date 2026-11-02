---
title: "数を超えない最小の 2 の累乗を、先頭の 0 の数から求める"
description: "Apache Pekko の FrequencySketch.Bits.ceilingPowerOfTwo。指定した数以上で最も小さい 2 の累乗を、Integer.numberOfLeadingZeros と負の数のシフトだけで求める。ループや対数の計算を使わない。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2021-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/FrequencySketch.scala"
lines: [92, 92]
format: 2
function: "Bits.ceilingPowerOfTwo"
difficulty: 3
tags: [ビット演算, 数値計算, アルゴリズム]
---

## ひとことで

Apache Pekko の `FrequencySketch` の中には、2 の累乗を扱う小さな関数がまとめられています。`ceilingPowerOfTwo` は、指定した数以上で最も小さい 2 の累乗を求めます。たとえば 5 なら 8、8 なら 8、9 なら 16 を返します。配列の大きさを 2 の累乗にしたいときに使われます。

## コード

```scala:line-numbers=92
    def ceilingPowerOfTwo(i: Int): Int = 1 << -Integer.numberOfLeadingZeros(i - 1)
```

## 前提知識

- 2 の累乗は、1、2、4、8、16 のように、2 を何回かけたかで表せる数です。2 進数では、1 が 1 つだけ立っている形になります。
- `Integer.numberOfLeadingZeros(x)` は、`x` を 32 ビットで見たときの、先頭（上の桁）から続く 0 の数です。たとえば 4（`100`）なら 29 です。
- `1 << n` は、1 を `n` ビット左にずらす操作です。`1 << 3` は 8 です。
- 32 ビットの `int` のシフトは、シフト量を 32 で割った余りで扱われます。そのため、負の数のシフトも意味のある値になります。
- `i - 1` を使うのは、`i` ちょうどの 2 の累乗を、そのまま返すためです。

## 何をしているか

### 1. `i - 1` の先頭の 0 の数を数える

```scala:line-numbers=90
    def powerOfTwoExponent(i: Int): Int = 32 - Integer.numberOfLeadingZeros(i - 1)
```

`i - 1` の 2 進数で、上から続く 0 の数を `numberOfLeadingZeros` で求めます。`i - 1` の最上位の 1 の位置が分かれば、2 の累乗の大きさが決まります。

```scala:line-numbers=92
    def ceilingPowerOfTwo(i: Int): Int = 1 << -Integer.numberOfLeadingZeros(i - 1)
```

### 2. 負の値でシフトして、1 を必要な位置へ

0 の数に `-` をつけると、シフト量は 32 から先頭の 0 の数を引いた値と同じになります。`1 << -n` は、その位置の 2 の累乗を作ります。

例えば `i = 5` なら `i - 1 = 4` で、`4`（`100`）の先頭の 0 は 29 個です。`-29` を 32 で割った余り 3 で、`1 << 3 = 8` になります。

## ここがすごい

- ループを回さず、ビットの数を 1 回の命令で求めて、シフトで答えを作ります。短く速い書き方です。
- `i - 1` を使うので、`i` がちょうど 2 の累乗のときも、正しく同じ値を返します。`8` に対して `8` を返す性質が、この 1 行で保たれています。
- 負のシフトを使うことで、「32 から引く」という計算を省いています。ただし、この性質は 32 ビットの int のシフトの仕様に頼っています。
- 配列の大きさを 2 の累乗に揃えておくと、添字の計算をビットの and で済ませられます。

## まとめ

- 指定値以上の最小の 2 の累乗は、`i - 1` の先頭の 0 の数から求められます。
- 負のシフトは、32 ビット int の仕様を理解して使うと、短く書けます。
- ビット演算で大きさを揃えると、ハッシュ表などの添字計算が速くなります。
