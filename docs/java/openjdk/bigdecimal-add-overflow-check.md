---
title: "例外を使わずに、足し算の溢れを符号ビットで見抜く"
description: "Java 標準の BigDecimal の内部 add(long, long)。2 つの long を足したとき溢れたかどうかを、符号ビットの XOR と AND だけで判定する。溢れなければ値を返し、溢れたら INFLATED を返す。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1996, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/math/BigDecimal.java
lines: [5325, 5333]
function: "BigDecimal.add"
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, ビット演算]
---

## ひとことで

`BigDecimal` は、小さな値を `long` のまま持つ、高速な内部表現を使っています。2 つの `long` を足して溢れなければ、その結果をそのまま使い、溢れたら任意精度の `BigInteger` に切り替えます。

この関数 `add(xs, ys)` は、その溢れを判定する部分です。溢れたときに例外を投げず、`INFLATED`（`Long.MIN_VALUE`）という目印を返します。

## コード

::: code-group

```java:line-numbers=5325 [日本語訳]
    private static long add(long xs, long ys){
        long sum = xs + ys;
        // オーバーフローの判定の説明は「Hacker's Delight」の 2-12 節を参照
        // オーバーフロー判定の説明（続き）
        if ( (((sum ^ xs) & (sum ^ ys))) >= 0L) { // オーバーフローしていない
            return sum;
        }
        return INFLATED;
    }
```

```java:line-numbers=5325 [原文]
    private static long add(long xs, long ys){
        long sum = xs + ys;
        // See "Hacker's Delight" section 2-12 for explanation of
        // the overflow test.
        if ( (((sum ^ xs) & (sum ^ ys))) >= 0L) { // not overflowed
            return sum;
        }
        return INFLATED;
    }
```

:::

## 前提知識

- **`long` の溢れ（オーバーフロー）**: `long` の範囲を超えた足し算は、例外を投げずに値が折り返されます。たとえば `Long.MAX_VALUE + 1` は負の数になります。
- **符号ビット**: 最上位のビットです。負の数では 1、正の数では 0 になります。
- **`^`（XOR）と `&`（AND）**: XOR は違う桁を 1 にし、AND は両方 1 の桁だけを 1 にします。符号ビットの関係を調べるのに使います。
- **`INFLATED`**: 「この値は `long` に収まらないので、別の表現（`BigInteger`）で持つ」ことを示す目印です。値としては `Long.MIN_VALUE` と同じです。
- **Hacker's Delight**: ビット演算のテクニックを集めた本です。コメントはこの本の 2-12 節を参照しています。

## 何をしているか

### 1. 普通に足す

```java:line-numbers=5326
        long sum = xs + ys;
```

まず `xs + ys` を計算します。溢れていても、この段階では折り返された結果が得られるだけです。その結果を `sum` とします。

### 2. 符号の関係で溢れを見抜く

```java:line-numbers=5329
        if ( (((sum ^ xs) & (sum ^ ys))) >= 0L) { // オーバーフローしていない
```

`sum ^ xs` と `sum ^ ys` は、それぞれ `sum` と `xs`、`sum` と `ys` の符号が違えば、符号ビットが 1 になります。両方とも符号が違うときだけ、2 つの AND の符号ビットが 1 になります。その場合、`xs` と `ys` が同じ符号で、結果だけ逆の符号になったことを意味します。これが溢れの印です。

### 3. 溢れなければ結果を返す

```java:line-numbers=5330
            return sum;
```

符号ビットが 0 なら溢れていないので、`sum` を返します。

### 4. 溢れたら目印を返す

```java:line-numbers=5332
        return INFLATED;
```

溢れていたときは `INFLATED` を返します。呼び出し側は、この値を見て `BigInteger` を使う経路に移ります。

## ここがすごい

- **例外を使わない**: 溢れた場合の処理を、例外ではなく戻り値で伝えています。小さい値の足し算は、ほとんどが溢れないので、速く動くことが重要です。
- **大きな値の比較を使わない**: `Long.MAX_VALUE` と比べる方法もありますが、この方法は符号ビットの論理演算だけで判定します。分岐が少なく、速く動きます。
- **判定の理屈が単純**: 溢れは、同じ符号の 2 数を足して、結果だけ符号が逆になったときにしか起きません。その性質をそのまま式にしています。
- **小さい値を速く扱う設計**: 小さい値は `long` のまま、大きくなったら `BigInteger` へ。この切り替えを、この判定が支えています。

## まとめ

- `sum` が `xs` と `ys` のどちらとも符号が違うときだけ、溢れたと判定できる。
- 判定は `((sum ^ xs) & (sum ^ ys)) >= 0` の一行で行い、例外は使わない。
- 溢れたら `INFLATED` を返し、大きな値は `BigInteger` で扱う。
