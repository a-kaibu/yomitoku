---
title: "2 の因子を外して、奇数どうしを引き算で縮める最大公約数"
description: "Lucene の MathUtil.gcd。割り算を使わず、2 の因子を numberOfTrailingZeros で取り除き、奇数どうしの差を繰り返す二進法の最大公約数。共通の 2 の因子は最後にまとめて戻す。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/MathUtil.java
lines: [63, 88]
function: "MathUtil.gcd"
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, ビット演算]
---

## ひとことで

`MathUtil.gcd(a, b)` は、2 つの `long` の **最大公約数** を返します。たとえば `gcd(12, 18)` は `6` です。負の数は絶対値で計算し、どちらかが 0 なら、もう一方の絶対値を返します。

割り算を使わず、**2 で割り切れる回数を数えて取り除き、残りの奇数どうしを引き算で縮める** 二進法の最大公約数の方法です。

## コード

::: code-group

```java:line-numbers=63 [日本語訳]
  public static long gcd(long a, long b) {
    a = Math.abs(a);
    b = Math.abs(b);
    if (a == 0) {
      return b;
    } else if (b == 0) {
      return a;
    }
    final int commonTrailingZeros = Long.numberOfTrailingZeros(a | b);
    a >>>= Long.numberOfTrailingZeros(a);
    while (true) {
      b >>>= Long.numberOfTrailingZeros(b);
      if (a == b) {
        break;
      } else if (a > b || a == Long.MIN_VALUE) { // MIN_VALUE は 2^64 として扱う
        final long tmp = a;
        a = b;
        b = tmp;
      }
      if (a == 1) {
        break;
      }
      b -= a;
    }
    return a << commonTrailingZeros;
  }
```

```java:line-numbers=63 [原文]
  public static long gcd(long a, long b) {
    a = Math.abs(a);
    b = Math.abs(b);
    if (a == 0) {
      return b;
    } else if (b == 0) {
      return a;
    }
    final int commonTrailingZeros = Long.numberOfTrailingZeros(a | b);
    a >>>= Long.numberOfTrailingZeros(a);
    while (true) {
      b >>>= Long.numberOfTrailingZeros(b);
      if (a == b) {
        break;
      } else if (a > b || a == Long.MIN_VALUE) { // MIN_VALUE is treated as 2^64
        final long tmp = a;
        a = b;
        b = tmp;
      }
      if (a == 1) {
        break;
      }
      b -= a;
    }
    return a << commonTrailingZeros;
  }
```

:::

## 前提知識

- **最大公約数（GCD）**: 2 つの数をどちらも割り切れる数のうち、最大のものです。
- **`Math.abs`**: 絶対値です。負の数を正にします。`Long.MIN_VALUE` だけは、正の値として表せない点に注意が必要です。
- **`Long.numberOfTrailingZeros(x)`**: `x` の下位から 0 が何個続くかを返します。`12`（`1100`）なら `2` です。
- **`>>>=`**: 右に 0 を入れながらずらして、その結果を代入します。
- **`a | b`**: 両方のビットの OR です。どちらかに 1 があれば 1 になります。

## 何をしているか

### 1. 0 の場合と、絶対値を先に処理する

```java:line-numbers=64
    a = Math.abs(a);
    b = Math.abs(b);
    if (a == 0) {
      return b;
    } else if (b == 0) {
      return a;
    }
```

絶対値にそろえ、どちらかが 0 なら、もう一方が答えです。0 はどんな数でも割り切れるからです。

### 2. 共通の 2 の因子を覚えておく

```java:line-numbers=71
    final int commonTrailingZeros = Long.numberOfTrailingZeros(a | b);
    a >>>= Long.numberOfTrailingZeros(a);
```

`a | b` の下位の 0 の数は、`a` と `b` の両方に共通の 2 の因子の数です。`commonTrailingZeros` に覚えておき、最後にまとめて戻します。`a` は、2 の因子を取り除いて奇数にします。

### 3. 奇数どうしを引き算で縮める

```java:line-numbers=73
    while (true) {
      b >>>= Long.numberOfTrailingZeros(b);
      if (a == b) {
        break;
      } else if (a > b || a == Long.MIN_VALUE) { // MIN_VALUE は 2^64 として扱う
        final long tmp = a;
        a = b;
        b = tmp;
      }
      if (a == 1) {
        break;
      }
      b -= a;
    }
```

ループの中で、`b` の 2 の因子も取り除きます。そのあと、`a` と `b` が等しければ終わりです。`a > b` なら入れ替えて、常に `a < b` の形にします。`b -= a` は、奇数どうしの差なので偶数になりますが、次のループで 2 の因子を取り除きます。

### 4. 具体的な値で追う

`a = 12`、`b = 18` で進めます。

- 共通の 2 の因子: `12 | 18 = 30`（`11110`）の下位の 0 は 1 個。`commonTrailingZeros = 1`。
- `a` を 2 で割り切れるだけ割る: `12 → 3`。
- `b` を 2 で割り切れるだけ割る: `18 → 9`。
- `a < b` なので、`b -= a` で `b = 6`。
- `b` を割り切れるだけ割る: `6 → 3`。
- `a == b == 3` で終わり。
- 結果は `3 << 1 = 6`。

## ここがすごい

- **割り算を使わない**: 割り算は遅い命令です。2 の因子は `numberOfTrailingZeros` で数え、奇数どうしは引き算で縮めるので、割り算が一度も要りません。
- **共通の 2 の因子を別に覚える**: 2 の因子は、最大公約数に共通でかかっている分だけ残す必要があります。`a | b` の下位の 0 を数えるという 1 行で、それを正しく求めています。
- **`a == 1` で早く抜ける**: 奇数どうしで `a` が 1 になったら、それ以上は小さくならないので、すぐに答えが決まります。無駄なループを減らす工夫です。
- **`Long.MIN_VALUE` の扱い**: 絶対値が正として表せないので、コメントに「2^64 として扱う」と書かれています。`a > b` の比較を、この値に限って特別に処理しています。

## まとめ

- 最大公約数は、割り算なしで、2 の因子の取り除きと引き算だけで求められる。
- 共通の 2 の因子は、最初に数えて最後に戻す。
- 境界の値（`Long.MIN_VALUE`）は、コメントで扱いを明示する。
