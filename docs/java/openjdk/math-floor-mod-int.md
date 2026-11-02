---
title: "負の数の余りを、割る数と同じ符号にそろえる"
description: "Java 標準の Math.floorMod(int, int)。Java の % は被除数の符号の余りを返すが、符号が違い余りが 0 でないとき、割る数を足して符号をそろえる。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Math.java
lines: [1586, 1593]
function: "Math.floorMod"
difficulty: 2
format: 2
tags: [数値計算, アルゴリズム]
---

## ひとことで

Java の `%`（剰余）は、余りの符号を、割られる数（左側の数）と同じにします。たとえば `-7 % 3` は `-1` です。

しかし、時計の時刻や配列の循環の添字のように、「0 から割る数の手前までに収めたい」場面では、`-1` ではなく `2` が欲しくなります。`Math.floorMod` は、そのような「床（floor）の余り」を返します。

## コード

::: code-group

```java:line-numbers=1586 [日本語訳]
    public static int floorMod(int x, int y) {
        final int r = x % y;
        //         // 符号が違い、余りが 0 でないときは、余りを調整する
        if ((x ^ y) < 0 && r != 0) {
            return r + y;
        }
        return r;
    }
```

```java:line-numbers=1586 [原文]
    public static int floorMod(int x, int y) {
        final int r = x % y;
        // if the signs are different and modulo not zero, adjust result
        if ((x ^ y) < 0 && r != 0) {
            return r + y;
        }
        return r;
    }
```

:::

## 前提知識

- **切り捨て（0 方向への丸め）の割り算**: Java の `/` は、商を 0 の方向へ丸めます。`-7 / 3` は `-2` です（`-2.33...` の 0 側）。
- **`%` と `/` の関係**: `dividend == (dividend / divisor) * divisor + (dividend % divisor)` が成り立つように、余りが決まります。そのため、余りの符号は被除数の符号になります。
- **床（floor）の余り**: 商を負の無限大の方向へ丸めたときの余りです。余りの符号は、割る数の符号と同じになります。
- **符号の違い**: 2 つの数の符号が違うと、`x ^ y` の最上位ビットは 1 になります。負の数の判定に使えます。

## 何をしているか

### 1. Java の % の結果を求める

```java:line-numbers=1587
        final int r = x % y;
```

`r = x % y` で、まず Java の余りを求めます。`-7 % 3` なら `-1` です。

### 2. 符号が違うときだけ、割る数を足す

```java:line-numbers=1589
        if ((x ^ y) < 0 && r != 0) {
            return r + y;
        }
        return r;
```

`(x ^ y) < 0` は、`x` と `y` の符号が違うことを表します。そのうえで、`r != 0` なら、余りは割る数と逆の符号になっています。このとき `r + y` を返すと、符号がそろった余りになります。`-7` と `3` なら、`-1 + 3 = 2` です。

余りが 0 のときは、符号を調整する必要がないので、そのまま返します。

## ここがすごい

- **割り算を 1 回しか使わない**: 商を別に求めず、`%` の結果に 1 回の加算を足すだけです。
- **符号の判定が XOR で済む**: `(x ^ y) < 0` は、符号が違うかどうかを 1 回の比較で判定します。
- **余りが 0 なら何もしない**: `r != 0` の確認で、割り切れたときの余計な加算を避けています。
- **ドキュメントとの対応**: 公開されている説明では、`x - (floorDiv(x, y) * y)` と同じ値だと書かれています。このコードは、その式を割り算 1 回で実現しています。

## まとめ

- `floorMod` は、Java の `%` の結果を取り、符号が違って余りが 0 でないときだけ `y` を足す。
- そのため、余りの符号は割る数と同じになる。
- 循環する添字や時刻の計算で、負の数を正しく扱える。
