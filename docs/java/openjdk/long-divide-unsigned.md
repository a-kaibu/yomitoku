---
title: "符号なし 64 ビットの割り算を符号付きの演算で行う"
description: "Java 標準の Long.divideUnsigned(long, long)。符号のない 64 ビットの割り算を、符号付きの long の演算だけで行う。Hacker's Delight の方法で、商の推定と 1 の補正を行う。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Long.java
lines: [1455, 1463]
function: "Long.divideUnsigned"
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, 低レイヤ]
---

## ひとことで

Java の `long` は符号付きの 64 ビットです。`Long.divideUnsigned(a, b)` は、`a` と `b` を符号のない値とみなして割り算をし、その商を返します。

Java には符号なしの `long` の型がないので、符号付きの `long` の演算だけで、符号なしの割り算の答えを作っています。

## コード

::: code-group

```java:line-numbers=1455 [日本語訳]
    public static long divideUnsigned(long dividend, long divisor) {
        /* Hacker's Delight（第 2 版）の 9.3 節を参照 */
        if (divisor >= 0) {
            final long q = (dividend >>> 1) / divisor << 1;
            final long r = dividend - q * divisor;
            return q + ((r | ~(r - divisor)) >>> (Long.SIZE - 1));
        }
        return (dividend & ~(dividend - divisor)) >>> (Long.SIZE - 1);
    }
```

```java:line-numbers=1455 [原文]
    public static long divideUnsigned(long dividend, long divisor) {
        /* See Hacker's Delight (2nd ed), section 9.3 */
        if (divisor >= 0) {
            final long q = (dividend >>> 1) / divisor << 1;
            final long r = dividend - q * divisor;
            return q + ((r | ~(r - divisor)) >>> (Long.SIZE - 1));
        }
        return (dividend & ~(dividend - divisor)) >>> (Long.SIZE - 1);
    }
```

:::

## 前提知識

- **符号なしの値**: 同じ 64 ビットでも、最上位ビットを符号ではなく値の一部として数える見方です。`-1L` を符号なしで読むと、`2^64 - 1` になります。
- **`>>>`**: 符号を無視して、上位から 0 を入れながら右へずらす演算です。
- **商と余り**: 割り算の結果を、商と余りに分けたものです。`a = 商 * b + 余り` の関係が成り立ちます。
- **Hacker's Delight**: ビット演算の技法をまとめた本です。このコードは、その本の 9.3 節の方法に基づいています。

## 何をしているか

### 1. 除数が正の場合は、商をまず推定する

```java:line-numbers=1457
        if (divisor >= 0) {
            final long q = (dividend >>> 1) / divisor << 1;
            final long r = dividend - q * divisor;
```

`dividend` の値を 1 ビット右へずらしてから、`divisor` で割ります。符号付きの割り算でも、この値は負にならないので、正しく割れます。結果を 1 ビット左へ戻すと、商の推定値 `q` になります。`r` は、そのときの余りです。

### 2. 余りが除数以上なら、商に 1 を足す

```java:line-numbers=1460
            return q + ((r | ~(r - divisor)) >>> (Long.SIZE - 1));
```

推定した `q` は、少し小さいことがあります。`r` が `divisor` 以上かどうかを、符号ビットで判定して、必要なら 1 を足します。`r - divisor` の符号ビットを反転して `r` と合わせることで、判定を分岐なしで行っています。

### 3. 除数が負の場合は、結果が 0 か 1 になる

```java:line-numbers=1462
        return (dividend & ~(dividend - divisor)) >>> (Long.SIZE - 1);
```

`divisor` が負のとき、符号なしの値としては非常に大きな数です。この場合の商は 0 か 1 しかありません。`dividend` が `divisor` 以上なら 1、そうでなければ 0 です。判定は、符号ビットを使った式で行っています。

## ここがすごい

- **符号なしの割り算を作る**: Java に符号なしの型はありませんが、符号付きの演算だけで、符号なしの割り算の正しい答えを出しています。
- **分岐を減らす**: 補正のための `if` を使わず、符号ビットをマスクとして使うので、処理が一定の流れになります。
- **大きい数の割り算を安全にする**: 1 ビット右へずらしてから割るので、計算の途中で値が符号の範囲を超えにくくなっています。
- **除数が負の場合を別に書く**: 大きい値を割る場合は、結果が 0 か 1 だけになるので、特別な式で済ませています。

## まとめ

- `divideUnsigned` は、符号なしの 64 ビット割り算を、符号付きの演算だけで行う。
- 正の除数では、商を推定してから、符号ビットで 1 の補正をする。
- 負の除数では、結果が 0 か 1 になるので、別の式で求める。
