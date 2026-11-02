---
title: "符号なし long の割り算の余りを、半分ずつ割って求める"
description: "Apache Commons Collections の BitMaps.mod。符号なしの 64 ビット値を、符号付きの割り算だけで余りにする。値を半分にしてから割り、商を 2 倍に戻す手法。"
language: java
project: Apache Commons Collections
repo: https://github.com/apache/commons-collections
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "9e14d468e850e4175187023557b0735ad9bb19ea"
file: src/main/java/org/apache/commons/collections4/bloomfilter/BitMaps.java
lines: [106, 114]
function: "BitMaps.mod"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 最適化]
---

## ひとことで

`BitMaps.mod(dividend, divisor)` は、符号なしの 64 ビット値 `dividend` を、正の `int` の `divisor` で割ったときの余りを返します。

Java の `long` は符号付きなので、最上位ビットが 1 の値は負の数として扱われます。そのため、普通の `%` 演算では正しい余りが出ません。この関数は、符号付きの割り算だけを使って、正しい符号なしの余りを求めます。

## コード

::: code-group

```java:line-numbers=106 [日本語訳]
    public static int mod(final long dividend, final int divisor) {
        // Hacker's Delight（第 2 版）の 9.3 節を参照
        // 除数は正であると仮定する
        // 符号なしの数を半分にしてから割り、その商を 2 倍する
        final long quotient = (dividend >>> 1) / divisor << 1;
        final long remainder = dividend - quotient * divisor;
        // 余りは [0, 2 * divisor) の範囲にある
        return (int) (remainder >= divisor ? remainder - divisor : remainder);
    }
```

```java:line-numbers=106 [原文]
    public static int mod(final long dividend, final int divisor) {
        // See Hacker's Delight (2nd ed), section 9.3.
        // Assume divisor is positive.
        // Divide half the unsigned number and then double the quotient result.
        final long quotient = (dividend >>> 1) / divisor << 1;
        final long remainder = dividend - quotient * divisor;
        // remainder in [0, 2 * divisor)
        return (int) (remainder >= divisor ? remainder - divisor : remainder);
    }
```

:::

## 前提知識

- **符号なし整数**: 負の数を持たず、ビットをそのまま大きな正の数として扱う整数です。`long` で最上位ビットが 1 のとき、符号付きでは負の数に見えますが、符号なしでは大きな正の数です。
- **剰余（余り）**: 割り算の余りです。`a = q * b + r` の `r` にあたります。
- **`>>>`（符号なし右シフト）**: 1 ビット右へずらし、最上位に 0 を入れます。値を半分にし、負の数にならないようにします。
- **`<<`（左シフト）**: 1 ビット左へずらすと、値は 2 倍になります。
- **`divisor` の正**: 除数は正の数である必要があります。この関数はその前提のもとに書かれています。

## 何をしているか

### 1. 値を半分にしてから割る

```java:line-numbers=110
        final long quotient = (dividend >>> 1) / divisor << 1;
```

`(dividend >>> 1) / divisor` で、値を半分にしてから割ります。`>>> 1` によって最上位ビットが消えるので、結果は必ず負にならず、符号付きの割り算で安全に計算できます。その商を `<< 1` で 2 倍に戻します。

### 2. 余りを求める

```java:line-numbers=111
        final long remainder = dividend - quotient * divisor;
```

`dividend - quotient * divisor` で、余りを求めます。割り算の基本の関係式 `dividend = quotient * divisor + remainder` を変形しています。

### 3. 余りを 1 回だけ調整する

```java:line-numbers=112
        // 余りは [0, 2 * divisor) の範囲にある
        return (int) (remainder >= divisor ? remainder - divisor : remainder);
```

`remainder` は `[0, 2 * divisor)` の範囲にあります。商を半分の値から求めているため、余りが `divisor` の 2 倍未満に収まります。`divisor` 以上なら、もう一度 `divisor` を引けば、正しい余りになります。

## ここがすごい

- **符号なしの割り算を符号付きで代用**: Java には符号なし `long` の割り算演算子がありません。半分にして割る方法で、符号付きの割り算を使って同じ結果を得ています。
- **補正は 1 回だけ**: 余りが大きくなりすぎないことが分かっているので、`if` 1 回の調整で済みます。ループは要りません。
- **負の値を作らない**: `>>> 1` で最上位を消す仕組みがあるので、割り算の途中で符号の問題が起きません。
- **Hacker's Delight の定番**: この手法は、ビット演算の本に載っている定番の書き方です。コメントにも出典が示されています。

## まとめ

- 符号なし 64 ビット値の余りは、半分にしてから割り、商を 2 倍に戻して求める。
- 余りは `[0, 2 * divisor)` に収まるので、1 回の調整で正しい値になる。
- 符号付きの割り算しか使えない環境で、符号なしの余りを正しく計算できる。
