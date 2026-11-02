---
title: "小さい数はビットマスクで、大きい数は Miller–Rabin で判定"
description: "Guava の LongMath.isPrime。66 未満は素数のビットマスクで一度に引き、それ以上は 30 を法とするふるいと小さな割り算のあと、決まった基底の Miller–Rabin 判定を行う。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/LongMath.java
lines: [1005, 1056]
function: "LongMath.isPrime"
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, ビット演算]
---

## ひとことで

`LongMath.isPrime(n)` は、`long` の値 `n` が素数かどうかを `true` / `false` で返します。小さい数は表を引くように即座に答えが出て、大きい数は計算量の少ない判定法で確かめます。

素数の判定は、暗号や乱数の分野で大切です。ここでは、速さと正確さの両方を保つために、数の大きさによって手法を分けています。

## コード

::: code-group

```java:line-numbers=1005 [日本語訳]
  public static boolean isPrime(long n) {
    if (n < 2) {
      checkNonNegative("n", n);
      return false;
    }
    if (n < 66) {
      // 66 未満のすべての素数を、0 と 1 を除いてマスクに符号化する
      long mask =
          (1L << (2 - 2))
              | (1L << (3 - 2))
              | (1L << (5 - 2))
              | (1L << (7 - 2))
              | (1L << (11 - 2))
              | (1L << (13 - 2))
              | (1L << (17 - 2))
              | (1L << (19 - 2))
              | (1L << (23 - 2))
              | (1L << (29 - 2))
              | (1L << (31 - 2))
              | (1L << (37 - 2))
              | (1L << (41 - 2))
              | (1L << (43 - 2))
              | (1L << (47 - 2))
              | (1L << (53 - 2))
              | (1L << (59 - 2))
              | (1L << (61 - 2));
      // マスクの中で n を探す
      return ((mask >> ((int) n - 2)) & 1) != 0;
    }

    if ((SIEVE_30 & (1 << (n % 30))) != 0) {
      return false;
    }
    if (n % 7 == 0 || n % 11 == 0 || n % 13 == 0) {
      return false;
    }
    if (n < 17 * 17) {
      return true;
    }

    for (long[] baseSet : millerRabinBaseSets) {
      if (n <= baseSet[0]) {
        for (int i = 1; i < baseSet.length; i++) {
          if (!MillerRabinTester.test(baseSet[i], n)) {
            return false;
          }
        }
        return true;
      }
    }
    throw new AssertionError();
  }
```

```java:line-numbers=1005 [原文]
  public static boolean isPrime(long n) {
    if (n < 2) {
      checkNonNegative("n", n);
      return false;
    }
    if (n < 66) {
      // Encode all primes less than 66 into mask without 0 and 1.
      long mask =
          (1L << (2 - 2))
              | (1L << (3 - 2))
              | (1L << (5 - 2))
              | (1L << (7 - 2))
              | (1L << (11 - 2))
              | (1L << (13 - 2))
              | (1L << (17 - 2))
              | (1L << (19 - 2))
              | (1L << (23 - 2))
              | (1L << (29 - 2))
              | (1L << (31 - 2))
              | (1L << (37 - 2))
              | (1L << (41 - 2))
              | (1L << (43 - 2))
              | (1L << (47 - 2))
              | (1L << (53 - 2))
              | (1L << (59 - 2))
              | (1L << (61 - 2));
      // Look up n within the mask.
      return ((mask >> ((int) n - 2)) & 1) != 0;
    }

    if ((SIEVE_30 & (1 << (n % 30))) != 0) {
      return false;
    }
    if (n % 7 == 0 || n % 11 == 0 || n % 13 == 0) {
      return false;
    }
    if (n < 17 * 17) {
      return true;
    }

    for (long[] baseSet : millerRabinBaseSets) {
      if (n <= baseSet[0]) {
        for (int i = 1; i < baseSet.length; i++) {
          if (!MillerRabinTester.test(baseSet[i], n)) {
            return false;
          }
        }
        return true;
      }
    }
    throw new AssertionError();
  }
```

:::

このメソッドが使う定数は、同じクラスで次のように定義されています。まず、30 を法とするふるいの定数です。

```java:line-numbers=988
  private static final int SIEVE_30 =
      ~((1 << 1) | (1 << 7) | (1 << 11) | (1 << 13) | (1 << 17) | (1 << 19) | (1 << 23)
          | (1 << 29));
```

次に、大きな数で使う Miller–Rabin の基底の表の、先頭です。

```java:line-numbers=1065
  private static final long[][] millerRabinBaseSets = {
    {291830, 126401071349994536L},
    {885594168, 725270293939359937L, 3569819667048198375L},
```

## 前提知識

- **素数**: 1 と自分自身以外に約数を持たない、2 以上の整数です。2, 3, 5, 7 は素数です。
- **剰余**: 割った余りです。`n % 30` は、30 で割ったときの余りになります。
- **ビットマスク**: 1 ビットずつに意味を持たせた整数です。`1L << k` は、ビット `k` だけが 1 の値です。
- **Miller–Rabin 判定**: 合成数はほとんどの「基底」で素数でないと見抜かれる、という性質を使う判定法です。基底を十分に選べば、扱う範囲で結果が確定します。
- **`checkNonNegative`**: 負の数を入力したときに、例外を投げて知らせるための検査です。

## 何をしているか

### 1. 小さい数は表で即答する

```java:line-numbers=1010
    if (n < 66) {
      // 66 未満のすべての素数を、0 と 1 を除いてマスクに符号化する
      long mask =
          (1L << (2 - 2))
              | (1L << (3 - 2))
              | (1L << (5 - 2))
              | (1L << (7 - 2))
              | (1L << (11 - 2))
              | (1L << (13 - 2))
              | (1L << (17 - 2))
              | (1L << (19 - 2))
              | (1L << (23 - 2))
              | (1L << (29 - 2))
              | (1L << (31 - 2))
              | (1L << (37 - 2))
              | (1L << (41 - 2))
              | (1L << (43 - 2))
              | (1L << (47 - 2))
              | (1L << (53 - 2))
              | (1L << (59 - 2))
              | (1L << (61 - 2));
      // マスクの中で n を探す
      return ((mask >> ((int) n - 2)) & 1) != 0;
```

66 未満の数は、素数だけに 1 が立ったビットマスクを用意しておき、`n - 2` の位置のビットを見るだけで答えを出します。2 から 61 までの素数が、すべてこの 64 ビットに収まります。

### 2. 30 を法とするふるいで候補を減らす

```java:line-numbers=1035
    if ((SIEVE_30 & (1 << (n % 30))) != 0) {
      return false;
    }
```

30 は 2・3・5 の積です。30 で割った余りが 1, 7, 11, 13, 17, 19, 23, 29 以外なら、2・3・5 のどれかで割り切れます。`SIEVE_30` は、そのような余りを表すビットを 1 にしたもので、一度の判定で合成数を取り除きます。

### 3. 小さい素因数を確かめる

```java:line-numbers=1038
    if (n % 7 == 0 || n % 11 == 0 || n % 13 == 0) {
      return false;
    }
    if (n < 17 * 17) {
      return true;
    }
```

7、11、13 で割り切れるなら合成数です。残った数が 17 の 2 乗（289）より小さければ、もう小さな素因数を持てないので、素数だと確定します。

### 4. 大きい数は Miller–Rabin で判定する

```java:line-numbers=1045
    for (long[] baseSet : millerRabinBaseSets) {
      if (n <= baseSet[0]) {
        for (int i = 1; i < baseSet.length; i++) {
          if (!MillerRabinTester.test(baseSet[i], n)) {
            return false;
          }
        }
        return true;
      }
    }
```

それ以上の数は、大きさに応じた基底の組を選び、その組に入っているすべての基底で Miller–Rabin の判定を行います。どれかが合成数だと示せば `false` で、すべてに通れば `true` です。

## ここがすごい

- **表を 1 つの整数に詰める**: 18 個の素数を、1 つの `long` のビットで表しています。配列も条件分岐の連続も要りません。
- **30 の性質を使う**: 2・3・5 で割り切れる数を、余りのビットひとつで捨てられます。以降の割り算が、大きく減ります。
- **確定する範囲を使い分ける**: 289 未満は、ここまでの処理で素数と確定できます。大きい数だけ、重い判定に進みます。
- **決定的な基底の組**: 数の範囲ごとに、確定的な結果を出せる基底の組を選んでいます。乱数を使わないので、同じ入力には毎回同じ答えが返ります。

## まとめ

- 66 未満はビットマスクの表引き、それ以上は小さな素因数の除去から始める。
- 289 未満は、小さな素因数を除けば素数と確定する。
- 大きい数は、範囲に応じた基底の組による Miller–Rabin で判定する。
