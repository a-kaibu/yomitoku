---
title: "二項係数を、溢れないように分数のまま掛けていく"
description: "Guava の LongMath.binomial。n 個から k 個を選ぶ組み合わせの数を、対称性・表・分子と分母の段階的な約分で、long の範囲内に収まるように求める。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/LongMath.java
lines: [811, 869]
function: "LongMath.binomial"
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, 最適化]
---

## ひとことで

`LongMath.binomial(n, k)` は、`n` 個の中から `k` 個を選ぶ組み合わせの数、つまり二項係数 C(n, k) を返します。たとえば C(5, 2) は 10 です。

この値は、大きくなると簡単に `long` の範囲を超えてしまいます。そこでこの関数は、計算の途中で溢れないように、分子と分母を管理しながら掛けていきます。結果が `long` に収まらないときは、`Long.MAX_VALUE` を返します。

## コード

::: code-group

```java:line-numbers=811 [日本語訳]
  public static long binomial(int n, int k) {
    checkNonNegative("n", n);
    checkNonNegative("k", k);
    checkArgument(k <= n, "k (%s) > n (%s)", k, n);
    if (k > (n >> 1)) {
      k = n - k;
    }
    switch (k) {
      case 0:
        return 1;
      case 1:
        return n;
      default:
        if (n < factorials.length) {
          return factorials[n] / (factorials[k] * factorials[n - k]);
        } else if (k >= biggestBinomials.length || n > biggestBinomials[k]) {
          return Long.MAX_VALUE;
        } else if (k < biggestSimpleBinomials.length && n <= biggestSimpleBinomials[k]) {
          // 溢れないことが保証されている
          long result = n--;
          for (int i = 2; i <= k; n--, i++) {
            result *= n;
            result /= i;
          }
          return result;
        } else {
          int nBits = log2(n, RoundingMode.CEILING);

          long result = 1;
          long numerator = n--;
          long denominator = 1;

          int numeratorBits = nBits;
          // log2(numerator, ceiling) の上界である

          /*
           * 速さのために long の計算で行いたいが、溢れは避けたい。BigIntegerMath で使われた手法を取り入れる
           * BigIntegerMath で使われた手法：分子と分母を別々に持ち、溢れそうなときに分数を result に掛ける
           * 分子と分母を別々に持ち、溢れそうになったら分数を result に掛ける
           */
          for (int i = 2; i <= k; i++, n--) {
            if (numeratorBits + nBits < Long.SIZE - 1) {
              // 分子と分母に掛けても、溢れないことが確実である
              numerator *= n;
              denominator *= i;
              numeratorBits += nBits;
            } else {
              // 分子と分母に掛けると、溢れるおそれがある
              // (分子 / 分母) を result に掛ける
              result = multiplyFraction(result, numerator, denominator);
              numerator = n;
              denominator = i;
              numeratorBits = nBits;
            }
          }
          return multiplyFraction(result, numerator, denominator);
        }
    }
  }
```

```java:line-numbers=811 [原文]
  public static long binomial(int n, int k) {
    checkNonNegative("n", n);
    checkNonNegative("k", k);
    checkArgument(k <= n, "k (%s) > n (%s)", k, n);
    if (k > (n >> 1)) {
      k = n - k;
    }
    switch (k) {
      case 0:
        return 1;
      case 1:
        return n;
      default:
        if (n < factorials.length) {
          return factorials[n] / (factorials[k] * factorials[n - k]);
        } else if (k >= biggestBinomials.length || n > biggestBinomials[k]) {
          return Long.MAX_VALUE;
        } else if (k < biggestSimpleBinomials.length && n <= biggestSimpleBinomials[k]) {
          // guaranteed not to overflow
          long result = n--;
          for (int i = 2; i <= k; n--, i++) {
            result *= n;
            result /= i;
          }
          return result;
        } else {
          int nBits = log2(n, RoundingMode.CEILING);

          long result = 1;
          long numerator = n--;
          long denominator = 1;

          int numeratorBits = nBits;
          // This is an upper bound on log2(numerator, ceiling).

          /*
           * We want to do this in long math for speed, but want to avoid overflow. We adapt the
           * technique previously used by BigIntegerMath: maintain separate numerator and
           * denominator accumulators, multiplying the fraction into result when near overflow.
           */
          for (int i = 2; i <= k; i++, n--) {
            if (numeratorBits + nBits < Long.SIZE - 1) {
              // It's definitely safe to multiply into numerator and denominator.
              numerator *= n;
              denominator *= i;
              numeratorBits += nBits;
            } else {
              // It might not be safe to multiply into numerator and denominator,
              // so multiply (numerator / denominator) into result.
              result = multiplyFraction(result, numerator, denominator);
              numerator = n;
              denominator = i;
              numeratorBits = nBits;
            }
          }
          return multiplyFraction(result, numerator, denominator);
        }
    }
  }
```

:::

## 前提知識

- **二項係数**: `n` 個から `k` 個を順序を気にせず選ぶ方法の数です。C(n, k) と書きます。
- **対称性**: C(n, k) = C(n, n - k) が成り立ちます。たとえば C(10, 8) は C(10, 2) と同じです。
- **階乗**: `n!` は 1 から `n` までの積です。二項係数は `n! / (k! (n - k)!)` で表せますが、階乗はすぐに大きくなります。
- **溢れ（オーバーフロー）**: `long` で表せる範囲を超えると、値が壊れてしまうことです。
- **分数の約分**: 分子と分母の割り算がちょうど割り切れるよう、途中で掛けたり割ったりする考え方です。

## 何をしているか

### 1. 小さい方の k を使う

```java:line-numbers=815
    if (k > (n >> 1)) {
      k = n - k;
    }
```

C(n, k) と C(n, n - k) は同じ値なので、`k` が半分より大きければ `n - k` に置き換えます。計算する項の数が減るので、途中の値も小さくなります。

### 2. 特別な場合を先に返す

```java:line-numbers=818
    switch (k) {
      case 0:
        return 1;
      case 1:
        return n;
```

`k` が 0 なら 1、1 なら `n` です。どちらも掛け算をせずに済みます。

### 3. 表と簡単な式で求める

```java:line-numbers=824
        if (n < factorials.length) {
          return factorials[n] / (factorials[k] * factorials[n - k]);
```

`n` が階乗の表の範囲にあれば、`n! / (k! (n - k)!)` を表から引いて割り算するだけです。

### 4. 溢れないと分かる範囲は、そのまま掛けて割る

```java:line-numbers=826
        } else if (k >= biggestBinomials.length || n > biggestBinomials[k]) {
          return Long.MAX_VALUE;
        } else if (k < biggestSimpleBinomials.length && n <= biggestSimpleBinomials[k]) {
          // 溢れないことが保証されている
          long result = n--;
          for (int i = 2; i <= k; n--, i++) {
            result *= n;
            result /= i;
          }
          return result;
```

結果が `long` に収まらないと分かっているときは、`Long.MAX_VALUE` を返します。収まることが保証された範囲では、`result = result * n / i` を `k` 回繰り返します。各段階の結果は、途中の二項係数の値にあたるので、最終結果を超えません。

### 5. それ以外は分子と分母を別々に持つ

```java:line-numbers=839
          long result = 1;
          long numerator = n--;
          long denominator = 1;

          int numeratorBits = nBits;
          // log2(numerator, ceiling) の上界である

          /*
           * 速さのために long の計算で行いたいが、溢れは避けたい。BigIntegerMath で使われた手法を取り入れる
           * BigIntegerMath で使われた手法：分子と分母を別々に持ち、溢れそうなときに分数を result に掛ける
           * 分子と分母を別々に持ち、溢れそうになったら分数を result に掛ける
           */
          for (int i = 2; i <= k; i++, n--) {
            if (numeratorBits + nBits < Long.SIZE - 1) {
              // 分子と分母に掛けても、溢れないことが確実である
              numerator *= n;
              denominator *= i;
              numeratorBits += nBits;
            } else {
              // 分子と分母に掛けると、溢れるおそれがある
              // (分子 / 分母) を result に掛ける
              result = multiplyFraction(result, numerator, denominator);
              numerator = n;
              denominator = i;
              numeratorBits = nBits;
            }
          }
          return multiplyFraction(result, numerator, denominator);
```

分子と分母を別々の変数で持ち、掛けるたびにビット数の上界を数えます。溢れそうになったら、その時点の分数を `result` に掛けてから、新しい分子と分母で続けます。最後に残りの分数を掛けて返します。

## ここがすごい

- **対称性で項を減らす**: `k` を `n - k` に置き換えるだけで、掛ける回数が減り、途中の値も小さくなります。
- **中間値を溢れさせない工夫**: 掛け算と割り算を交互に行い、結果の桁を超えないように整えています。割り切れることを前提に、順番を工夫しています。
- **溢れを隠さない**: 結果が収まらないときは、誤った値を返さずに `Long.MAX_VALUE` を返します。呼び出し側は、飽和した値として扱えます。
- **用途に合わせた 3 段階**: 小さい `n` は表、中くらいは単純な式、大きい場合だけ分数の管理を使います。速さと安全性の両方を、場面ごとに分けています。

## まとめ

- 二項係数は、対称性で `k` を小さくしてから求める。
- 溢れないと分かる範囲は掛けて割るだけで、大きい範囲は分子と分母を別に管理する。
- 収まらないときは `Long.MAX_VALUE` を返し、誤った値を出さない。
