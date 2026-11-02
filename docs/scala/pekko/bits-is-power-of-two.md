---
title: "2 の累乗かどうかを、1 を引いて AND を取るだけで判定する"
description: "Apache Pekko の FrequencySketch.Bits.isPowerOfTwo。i と i − 1 の AND が 0 なら、i は 2 の累乗である。1 つだけ立っているビットを、1 を引くと下に広げて消す性質を使う。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2021-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/FrequencySketch.scala"
lines: [88, 88]
format: 2
function: "Bits.isPowerOfTwo"
difficulty: 2
tags: [ビット演算, 数値計算, アルゴリズム]
---

## ひとことで

Apache Pekko の `FrequencySketch` の内部にある `isPowerOfTwo` は、ある整数が 2 の累乗（1、2、4、8 など）かどうかを、1 行の式で判定します。ループも割り算も使いません。

## コード

```scala:line-numbers=88
    def isPowerOfTwo(i: Int): Boolean = (i & (i - 1)) == 0
```

## 前提知識

- 2 の累乗は、2 進数で 1 が 1 つだけ立っている数です。`8` は `1000`、`6` は `110` です。
- `&`（AND）は、2 つの数の同じ桁がどちらも 1 のときだけ 1 にする演算です。
- `i - 1` は、一番下で立っている 1 を 0 にして、その下の桁を全部 1 にします。たとえば `8`（`1000`）から 1 を引くと `7`（`0111`）になります。
- 0 は 2 の累乗ではありませんが、この式は `0 & -1 = 0` で真を返します。そのため、0 の扱いは注意が必要です。

## 何をしているか

### 1. 1 を引いて、最下位の 1 を消す

```scala:line-numbers=88
    def isPowerOfTwo(i: Int): Boolean = (i & (i - 1)) == 0
```

`i - 1` は、`i` の一番下にある 1 を 0 にして、その下の桁をすべて 1 にします。2 の累乗では、1 が 1 つだけなので、この操作で残りの桁がすべて 0 になるものはありません。

### 2. AND を取って、0 になるかを見る

```scala:line-numbers=88
    def isPowerOfTwo(i: Int): Boolean = (i & (i - 1)) == 0
```

`i & (i - 1)` は、`i` と `i - 1` の同じ桁の 1 を調べます。2 の累乗なら、`i` の 1 は `i - 1` で必ず 0 になっているので、AND は 0 になります。

例えば `8 & 7` は `1000 & 0111 = 0000` で、0 になります。`6 & 5` は `110 & 101 = 100` で、0 になりません。

### 3. 0 と比べて、真偽を返す

```scala:line-numbers=88
    def isPowerOfTwo(i: Int): Boolean = (i & (i - 1)) == 0
```

結果が 0 なら真、そうでなければ偽を返します。これで 2 の累乗かどうかの判定ができます。

## ここがすごい

- 割り算や対数を使わず、引き算と AND の 2 回の演算だけで判定できます。とても速い計算です。
- 1 がいくつ立っているかを数えなくても、「1 が 1 つだけ」という性質を、AND の結果が 0 になるかで表しています。
- 1 行の式なので、ほかの 2 の累乗の関数と並べて書いても読みやすい形です。
- 0 の場合は注意が必要です。この式は 0 でも真になるので、0 を 2 の累乗として扱うかどうかは、呼び出し側で決めておく必要があります。

## まとめ

- 2 の累乗の判定は、`i & (i - 1) == 0` で 1 行にできます。
- 1 を引くと、最下位の 1 より下の桁がすべて 1 になる、という性質を覚えておくと、この式の仕組みが分かります。
- 0 のような特別な値は、判定の前に扱いを決めておくと安全です。
