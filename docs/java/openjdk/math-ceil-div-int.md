---
title: "割り算を切り上げる、符号を見る一行の判定"
description: "Java 標準の Math.ceilDiv(int, int)。整数の割り算は 0 に向かって切り捨てられるため、符号が同じで余りがあるときだけ 1 を足して切り上げる。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Math.java
lines: [1689, 1696]
function: "Math.ceilDiv"
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 最適化]
---

## ひとことで

`Math.ceilDiv(x, y)` は、整数の割り算を「切り上げ」の結果で返します。たとえば `7 / 2` は普通の割り算では 3 ですが、`ceilDiv(7, 2)` は 4 になります。

データを一定のまとまりに分けるときに、「何個のまとまりが必要か」を求める場面でよく使われます。

## コード

::: code-group

```java:line-numbers=1689 [日本語訳]
    public static int ceilDiv(int x, int y) {
        final int q = x / y;
        // 符号が同じで余りが 0 でなければ切り上げる
        if ((x ^ y) >= 0 && (q * y != x)) {
            return q + 1;
        }
        return q;
    }
```

```java:line-numbers=1689 [原文]
    public static int ceilDiv(int x, int y) {
        final int q = x / y;
        // if the signs are the same and modulo not zero, round up
        if ((x ^ y) >= 0 && (q * y != x)) {
            return q + 1;
        }
        return q;
    }
```

:::

## 前提知識

- **整数の割り算**: Java の `/` は、小数点以下を捨てます。正の数同士なら切り捨て（床）になりますが、負の数では 0 に向かって丸めます。
- **切り上げ（ceiling）**: 割り切れないとき、次の整数へ繰り上げた値です。`7 / 2 = 3.5` は 4 になります。
- **`%`（剰余）**: 割り算の余りです。`q * y != x` は、割り切れなかったかどうかを確かめるために使われます。
- **`^`（XOR）**: 同じ桁が違えば 1 になります。ここでは符号ビットを比べるために使われています。
- **符号**: 負の数は、最上位ビットが 1 です。`x ^ y` の最上位が 0 なら、2 つは同じ符号です。

## 何をしているか

### 1. まず普通に割る

```java:line-numbers=1690
        final int q = x / y;
```

`q = x / y` で、0 に向かって切り捨てた商を求めます。この段階では、切り上げが必要かどうかはまだ分かりません。

### 2. 符号が同じか調べる

```java:line-numbers=1692
        if ((x ^ y) >= 0 && (q * y != x)) {
```

`(x ^ y) >= 0` は、`x` と `y` の符号が同じであることを表します。符号が同じなら、商は正の数になり、切り捨てでは小さい方へ丸められます。

### 3. 割り切れないなら 1 を足す

同じ条件の `q * y != x` で、割り切れなかったかどうかを確かめます。両方が成り立つとき、商に 1 を足して切り上げます。

### 4. 符号が違うとき

符号が違うと、商は負の数になります。負の数は 0 に向かって丸められるので、それがそのまま切り上げの結果になります。そのため、特別な調整は要りません。

- `ceilDiv(7, 2)`: 同符号、余りあり → `3 + 1 = 4`。
- `ceilDiv(-7, 2)`: 符号が違う → `-3`（これはそのまま切り上げの値）。
- `ceilDiv(6, 2)`: 同符号、余りなし → `3`。

## ここがすごい

- **浮動小数点を使わない**: `Math.ceil(x / (double) y)` と書くと、大きな値で誤差が出ることがあります。この関数は整数のまま正しい答えを返します。
- **符号の性質を使う**: 符号が違うときは切り捨てが切り上げと同じになるという性質を使って、判定を 1 つの条件にまとめています。
- **割り切れたかを 1 回の乗算で確かめる**: `q * y != x` で余りの有無を判定するので、剰余の計算を別に書く必要がありません。
- **最小値だけは例外**: `Integer.MIN_VALUE` を `-1` で割ると、結果は `int` に収まらず `Integer.MIN_VALUE` のまま返ります。例外は投げられません。

## まとめ

- 整数の切り上げは、商を求めたあと、同符号かつ割り切れないときだけ 1 を足す。
- 符号が違えば、切り捨てがそのまま切り上げの結果になる。
- 浮動小数点を使わず、正確に切り上げを求められる。
