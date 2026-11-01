---
title: "指数を 2 進数で読んで掛け算の回数を減らすべき乗"
description: "Guava の IntMath.pow。指数のビットを 1 つずつ下ろしながら、底を二乗していく「繰り返し二乗法」で、掛け算を指数の桁数の回数だけに抑える。int がはみ出したときの扱いも見どころ。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/IntMath.java
lines: [221, 253]
function: "IntMath.pow"
difficulty: 2
format: 2
tags: [数値計算, アルゴリズム, 最適化]
---

## ひとことで

`IntMath.pow(b, k)` は、整数 `b` の `k` 乗を返します。たとえば `pow(3, 5)` は `243` です。

素直に書けば `k` 回掛けますが、この実装は **指数 `k` の 2 進数の桁を使い、底を二乗しながら進める** 方法で、掛け算の回数を `k` の桁数（約 `log2(k)`）に抑えます。これを繰り返し二乗法と呼びます。

## コード

::: code-group

```java:line-numbers=221 [日本語訳]
  @GwtIncompatible // GWT では使えない（テストが失敗するため）
  public static int pow(int b, int k) {
    checkNonNegative("exponent", k);
    switch (b) {
      case 0:
        return (k == 0) ? 1 : 0;
      case 1:
        return 1;
      case -1:
        return ((k & 1) == 0) ? 1 : -1;
      case 2:
        return (k < Integer.SIZE) ? (1 << k) : 0;
      case -2:
        if (k < Integer.SIZE) {
          return ((k & 1) == 0) ? (1 << k) : -(1 << k);
        } else {
          return 0;
        }
      default:
        // 一般の場合はこの下で処理する
    }
    for (int accum = 1; ; k >>= 1) {
      switch (k) {
        case 0:
          return accum;
        case 1:
          return b * accum;
        default:
          accum *= ((k & 1) == 0) ? 1 : b;
          b *= b;
      }
    }
  }
```

```java:line-numbers=221 [原文]
  @GwtIncompatible // failing tests
  public static int pow(int b, int k) {
    checkNonNegative("exponent", k);
    switch (b) {
      case 0:
        return (k == 0) ? 1 : 0;
      case 1:
        return 1;
      case -1:
        return ((k & 1) == 0) ? 1 : -1;
      case 2:
        return (k < Integer.SIZE) ? (1 << k) : 0;
      case -2:
        if (k < Integer.SIZE) {
          return ((k & 1) == 0) ? (1 << k) : -(1 << k);
        } else {
          return 0;
        }
      default:
        // continue below to handle the general case
    }
    for (int accum = 1; ; k >>= 1) {
      switch (k) {
        case 0:
          return accum;
        case 1:
          return b * accum;
        default:
          accum *= ((k & 1) == 0) ? 1 : b;
          b *= b;
      }
    }
  }
```

:::

## 前提知識

- **べき乗**: `b` を `k` 個掛け合わせた値です。`k = 0` なら `1` です。
- **2 進数の桁**: `k = 5` は `101` と書けます。下から 1 桁目は `1`、2 桁目は `0`、3 桁目は `1` です。`k & 1` で最下位の桁を取り出せます。
- **`k >>= 1`**: `k` を 1 ビット右にずらします。2 進数で 1 桁下ろすことと同じで、2 で割ることと同じです。
- **`switch` と `case`**: 値ごとに処理を分けます。`case 0:` などの後に `return` があると、そこで関数を抜けます。
- **`@GwtIncompatible`**: GWT（Java を JavaScript に変換する環境）では使えない、という印です。

## 何をしているか

### 1. 底が特別な値なら答えを直接返す

```java:line-numbers=224
    switch (b) {
      case 0:
        return (k == 0) ? 1 : 0;
      case 1:
        return 1;
      case -1:
        return ((k & 1) == 0) ? 1 : -1;
      case 2:
        return (k < Integer.SIZE) ? (1 << k) : 0;
      case -2:
        if (k < Integer.SIZE) {
          return ((k & 1) == 0) ? (1 << k) : -(1 << k);
        } else {
          return 0;
        }
```

底が `0`、`1`、`-1`、`2`、`-2` のときは、結果が簡単にわかります。たとえば `2^k` は `1 << k` で求まります。`k` が 32 以上なら `int` からはみ出すので `0` を返します。

### 2. 指数の 2 進数に従って掛ける

```java:line-numbers=242
    for (int accum = 1; ; k >>= 1) {
      switch (k) {
        case 0:
          return accum;
        case 1:
          return b * accum;
        default:
          accum *= ((k & 1) == 0) ? 1 : b;
          b *= b;
      }
```

`accum` は答えを少しずつ作る変数で、最初は `1` です。`k` の最下位ビットが `1` なら、現在の `b` を `accum` に掛けます。その後 `b` を二乗し、`k` を 1 ビット右にずらします。

### 3. 具体的な値で追う

`b = 3`、`k = 5`（`101`）で進めます。

- `k = 5`（`101`）: 最下位が `1` なので `accum = 1 * 3 = 3`。`b` を二乗して `9`。`k` は `2`。
- `k = 2`（`10`）: 最下位が `0` なので `accum` はそのまま `3`。`b` を二乗して `81`。`k` は `1`。
- `k = 1`: `case 1` に入り、`b * accum = 81 * 3 = 243` を返します。

掛け算は 3 回で済みました。`3` を 5 回掛けるより少ない回数です。

## ここがすごい

- **桁数に比例する**: 指数が 10 億でも、2 進数で 30 桁ほどなので、掛け算は数十回で終わります。素直な方法なら 10 億回です。
- **二乗の再利用**: `b`、`b²`、`b⁴`、`b⁸`… と二乗を 1 回ずつ作れば、指数の 1 のビットに対応するものだけを掛けられます。途中の結果を捨てずに組み合わせる点がポイントです。
- **最後の 1 回を特別扱い**: `case 1` で `b * accum` を直接返すことで、`b` をもう一度二乗する無駄を省いています。
- **底の特別扱い**: `2` のような底は、シフトで一瞬に答えが出ます。よく使う場合を素早く処理する設計です。
- **はみ出しの扱い**: `int` の範囲を超えた値は、Java の回り込み（オーバーフロー）でそのまま返されます。例外を出すかどうかは、呼び出し側が `Math.multiplyExact` などを使って決める設計になっています。

## まとめ

- べき乗は、指数の 2 進数の桁に従って二乗と掛け算を組み合わせれば、掛け算の回数を大きく減らせる（繰り返し二乗法）。
- よく使う底（0, 1, -1, 2）は、答えを直接計算できる。
- 最後の桁を特別扱いすると、無駄な二乗を省ける。
