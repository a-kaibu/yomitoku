---
title: "64 ビット同士の積の上位 64 ビットを求める"
description: "Java 標準の Math.multiplyHigh。2 つの long の積は 128 ビットになるが、その上位 64 ビットを、32 ビットずつに分けた部分積と繰り上がりの計算で求める。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Math.java
lines: [1403, 1418]
function: "Math.multiplyHigh"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, アルゴリズム]
---

## ひとことで

`Math.multiplyHigh(x, y)` は、2 つの `long` を掛けたときの結果の、上位 64 ビットを返します。`long` 同士の積は、128 ビットに達することがあります。Java には 128 ビットの整数型がないため、この関数で上半分だけを取り出せます。

たとえば、乗算の結果が大きくなって溢れたかどうかを調べたり、固定小数点の計算や、乱数の範囲変換（掛け算で区間に写す方法）で使われたりします。

## コード

::: code-group

```java:line-numbers=1403 [日本語訳]
    public static long multiplyHigh(long x, long y) {
        // Hacker's Delight（第 2 版）の 8-2 節の手法を使う（Henry S. Warren, Jr. 著）
        // Hacker's Delight (2nd ed.) (Addison Wesley, 2013), 173-174 ページ
        long x1 = x >> 32;
        long x2 = x & 0xFFFFFFFFL;
        long y1 = y >> 32;
        long y2 = y & 0xFFFFFFFFL;

        long z2 = x2 * y2;
        long t = x1 * y2 + (z2 >>> 32);
        long z1 = t & 0xFFFFFFFFL;
        long z0 = t >> 32;
        z1 += x2 * y1;

        return x1 * y1 + z0 + (z1 >> 32);
    }
```

```java:line-numbers=1403 [原文]
    public static long multiplyHigh(long x, long y) {
        // Use technique from section 8-2 of Henry S. Warren, Jr.,
        // Hacker's Delight (2nd ed.) (Addison Wesley, 2013), 173-174.
        long x1 = x >> 32;
        long x2 = x & 0xFFFFFFFFL;
        long y1 = y >> 32;
        long y2 = y & 0xFFFFFFFFL;

        long z2 = x2 * y2;
        long t = x1 * y2 + (z2 >>> 32);
        long z1 = t & 0xFFFFFFFFL;
        long z0 = t >> 32;
        z1 += x2 * y1;

        return x1 * y1 + z0 + (z1 >> 32);
    }
```

:::

## 前提知識

- **`long`**: 64 ビットの符号付き整数です。範囲は約 ±9.2 × 10^18 です。
- **128 ビットの積**: 64 ビット同士を掛けると、結果は最大 128 ビットになります。`long` の掛け算は、下位 64 ビットだけを返します。
- **上位と下位**: 128 ビットの値は、上位 64 ビットと下位 64 ビットに分けて考えられます。
- **`>>`（符号付き右シフト）と `>>>`（符号なし右シフト）**: 右へずらすビットの動きが違います。`>>` は符号ビットを複製し、`>>>` は 0 で埋めます。
- **32 ビットの部分積**: 大きな数を 32 ビットずつに分けると、その積は 64 ビットに収まります。部分積を組み合わせて、全体を組み立てます。

## 何をしているか

### 1. 各数を上下 32 ビットに分ける

```java:line-numbers=1406
        long x1 = x >> 32;
        long x2 = x & 0xFFFFFFFFL;
        long y1 = y >> 32;
        long y2 = y & 0xFFFFFFFFL;
```

`x1` と `y1` は上位 32 ビット、`x2` と `y2` は下位 32 ビットです。上位は `>>` で符号を保って取り出し、下位は `& 0xFFFFFFFFL` で 32 ビットだけを残します。

### 2. 下位同士の積を求める

```java:line-numbers=1411
        long z2 = x2 * y2;
```

`z2 = x2 * y2` は、下位同士の積です。どちらも 32 ビットなので、積は 64 ビットに収まります。

### 3. 中間の桁を足す

```java:line-numbers=1412
        long t = x1 * y2 + (z2 >>> 32);
```

`x1 * y2` は、中間の桁の一つです。そこに `z2` の上位 32 ビット（`z2 >>> 32`）を足して、繰り上がりを取り込みます。結果は `t` に入ります。

### 4. 中間の桁の残りを分ける

```java:line-numbers=1413
        long z1 = t & 0xFFFFFFFFL;
        long z0 = t >> 32;
```

`t` の下位 32 ビットを `z1`、上位部分を `z0` に分けます。`z1` は結果の中間桁として使い、`z0` は上位の結果に足す値です。

### 5. もう一つの中間の積を足す

```java:line-numbers=1415
        z1 += x2 * y1;
```

`x2 * y1` を `z1` に足します。これで、中間の桁がすべて揃います。

### 6. 上位の結果を組み立てる

```java:line-numbers=1417
        return x1 * y1 + z0 + (z1 >> 32);
```

`x1 * y1 + z0 + (z1 >> 32)` が、上位 64 ビットの結果です。`z1 >> 32` は、中間の繰り上がりを上位へ送るための値です。

## ここがすごい

- **128 ビットの型なしで求める**: Java には 128 ビットの整数がありません。32 ビットずつに分けて、部分積だけで上位を組み立てています。
- **繰り上がりを忘れずに扱う**: 中間の値を `t` や `z1` に足すとき、上位へ送るべき繰り上がりを、シフトで取り出して足しています。この丁寧な扱いが正しい結果の鍵です。
- **符号付きの計算で正しい**: `x1` と `y1` は符号を保って取り出されるので、負の数の積も正しい上位 64 ビットになります。符号なし版は `unsignedMultiplyHigh` として別に用意されています。
- **速さを支える**: 多くの CPU には、128 ビットの積の上位を一度に返す命令があります。JDK ではこれを `@IntrinsicCandidate` で示し、対応する環境では専用の命令に置き換えられます。

## まとめ

- 2 つの `long` の積の上位 64 ビットは、32 ビットずつの部分積で組み立てられる。
- 繰り上がりを、シフトと加算で丁寧に上位へ送る。
- 符号付きの積として正しく、対応する CPU では専用の命令でも計算できる。
