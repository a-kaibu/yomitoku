---
title: "割り算をやめて引き算とシフトだけで最大公約数を求める"
description: "Guava の IntMath.gcd。ユークリッドの互除法の代わりに、2 の因子を取り除きながら引き算を繰り返すバイナリ GCD 法を使い、分岐もほとんど使わずに最大公約数を求める。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/IntMath.java
lines: [402, 445]
function: "IntMath.gcd"
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, ビット演算]
---

## ひとことで

`IntMath.gcd(a, b)` は、2 つの非負の `int` の **最大公約数**（両方を割り切れる最大の数）を返します。たとえば `gcd(12, 18)` は `6` です。

最大公約数を求める有名な方法はユークリッドの互除法で、割り算（余りの計算）を繰り返します。この実装は **割り算を使わず**、2 で割り切れる回数を数えることと、引き算と右シフトだけで答えを求めます。これがバイナリ GCD 法（二進法 GCD）です。

## コード

::: code-group

```java:line-numbers=402 [日本語訳]
  public static int gcd(int a, int b) {
    /*
     * 両方の引数を 0 以上に限るのは、そうしないと gcd(0, Integer.MIN_VALUE) の答えを
     * どう返すかが問題になるからだ。BigInteger.gcd は正の 2^31 を返すが、
     * 正の 2^31 は int では表せない。
     */
    checkNonNegative("a", a);
    checkNonNegative("b", b);
    if (a == 0) {
      // 0 % b == 0 なので b は a を割り切るが、その逆は成り立たない。
      // BigInteger.gcd もこの扱いに合わせている。
      return b;
    } else if (b == 0) {
      return a; // 同じ考え方。
    }
    /*
     * バイナリ GCD 法を使う。en.wikipedia.org/wiki/Binary_GCD_algorithm を参照。これは
     * ベンチマークでユークリッドの互除法より 40% 以上速い。
     */
    int aTwos = Integer.numberOfTrailingZeros(a);
    a >>= aTwos; // 2 の因子をすべて取り除く
    int bTwos = Integer.numberOfTrailingZeros(b);
    b >>= bTwos; // 2 の因子をすべて取り除く
    while (a != b) { // a と b はどちらも奇数
      // バイナリ GCD 法のかぎは次のとおり。
      // a と b はどちらも奇数。a > b とすると gcd(a - b, b) = gcd(a, b)。
      // gcd(a - b, b) では a - b は偶数、b は奇数なので、2 の因子を取り除ける。

      // 分岐を避けるために工夫している。bithacks の技法を応用したもの。
      // http://graphics.stanford.edu/~seander/bithacks.html#IntegerMinOrMax （Sean Anderson の bithacks）

      int delta = a - b; // a と b は負でないので、差 delta があふれることはない

      int minDeltaOrZero = delta & (delta >> (Integer.SIZE - 1));
      // Math.min(delta, 0) と同じ

      a = delta - minDeltaOrZero - minDeltaOrZero; // a を |a - b| に設定する
      // a は今や負でなく偶数

      b += minDeltaOrZero; // b を min(元の a, b) に設定する
      a >>= Integer.numberOfTrailingZeros(a); // b を奇数に保つため、a の 2 の因子をすべて取り除く
    }
    return a << min(aTwos, bTwos);
  }
```

```java:line-numbers=402 [原文]
  public static int gcd(int a, int b) {
    /*
     * The reason we require both arguments to be >= 0 is because otherwise, what do you return on
     * gcd(0, Integer.MIN_VALUE)? BigInteger.gcd would return positive 2^31, but positive 2^31 isn't
     * an int.
     */
    checkNonNegative("a", a);
    checkNonNegative("b", b);
    if (a == 0) {
      // 0 % b == 0, so b divides a, but the converse doesn't hold.
      // BigInteger.gcd is consistent with this decision.
      return b;
    } else if (b == 0) {
      return a; // similar logic
    }
    /*
     * Uses the binary GCD algorithm; see http://en.wikipedia.org/wiki/Binary_GCD_algorithm. This is
     * >40% faster than the Euclidean algorithm in benchmarks.
     */
    int aTwos = Integer.numberOfTrailingZeros(a);
    a >>= aTwos; // divide out all 2s
    int bTwos = Integer.numberOfTrailingZeros(b);
    b >>= bTwos; // divide out all 2s
    while (a != b) { // both a, b are odd
      // The key to the binary GCD algorithm is as follows:
      // Both a and b are odd. Assume a > b; then gcd(a - b, b) = gcd(a, b).
      // But in gcd(a - b, b), a - b is even and b is odd, so we can divide out powers of two.

      // We bend over backwards to avoid branching, adapting a technique from
      // http://graphics.stanford.edu/~seander/bithacks.html#IntegerMinOrMax

      int delta = a - b; // can't overflow, since a and b are nonnegative

      int minDeltaOrZero = delta & (delta >> (Integer.SIZE - 1));
      // equivalent to Math.min(delta, 0)

      a = delta - minDeltaOrZero - minDeltaOrZero; // sets a to Math.abs(a - b)
      // a is now nonnegative and even

      b += minDeltaOrZero; // sets b to min(old a, b)
      a >>= Integer.numberOfTrailingZeros(a); // divide out all 2s, since 2 doesn't divide b
    }
    return a << min(aTwos, bTwos);
  }
```

:::

## 前提知識

- **最大公約数（GCD）**: 2 つの数をどちらも割り切れる数のうち最大のものです。`gcd(12, 18) = 6` です。
- **非負の制約**: 引数は 0 以上だけを受け付けます。負の数は `checkNonNegative` で例外になります。
- **`Integer.numberOfTrailingZeros(x)`**: `x` の下位から 0 が何個続くかを返します。`12`（`1100`）なら `2` で、「2 の何乗で割り切れるか」と同じです。
- **`>>=`**: `a >>= k` は `a` を `k` ビット右にずらします。2 の `k` 乗で割ることと同じです（正の数の場合）。
- **`delta >> (Integer.SIZE - 1)`**: 符号ビットを全体に広げます。負なら `-1`（全ビット 1）、0 以上なら `0` になります。
- **`min(aTwos, bTwos)`**: 2 つの値の小さい方を返します。`Math.min` と同じ意味です。

## 何をしているか

### 1. 2 の因子を先に取り除く

```java:line-numbers=421
    int aTwos = Integer.numberOfTrailingZeros(a);
    a >>= aTwos; // 2 の因子をすべて取り除く
    int bTwos = Integer.numberOfTrailingZeros(b);
    b >>= bTwos; // 2 の因子をすべて取り除く
```

`a = 12`（`1100`）、`b = 18`（`10010`）で追います。

- `aTwos = 2`、`a = 3`（12 の 2 の因子を取り除いた）
- `bTwos = 1`、`b = 9`（18 の 2 の因子を取り除いた）

ここで `a` と `b` は両方とも奇数になりました。最大公約数の 2 の因子は、最後に `min(aTwos, bTwos)` を戻して掛けます。今回は `min(2, 1) = 1` です。

### 2. 奇数どうしの差を使う

```java:line-numbers=427
      // a と b はどちらも奇数。a > b とすると gcd(a - b, b) = gcd(a, b)。
      // gcd(a - b, b) では a - b は偶数、b は奇数なので、2 の因子を取り除ける。
```

「`a > b` なら `gcd(a, b) = gcd(a - b, b)`」という性質を使います。`a - b` は偶数になるので、また 2 の因子を取り除けます。

### 3. 分岐を使わずに絶対値を作る

```java:line-numbers=433
      int delta = a - b; // a と b は負でないので、差 delta があふれることはない

      int minDeltaOrZero = delta & (delta >> (Integer.SIZE - 1));
      // Math.min(delta, 0) と同じ

      a = delta - minDeltaOrZero - minDeltaOrZero; // a を |a - b| に設定する
```

`delta = a - b` の符号に応じて、`a` を `|a - b|` にします。`minDeltaOrZero` は `delta` が負なら `delta`、0 以上なら `0` です。`a = delta - m - m` は、負なら `delta - 2·delta = -delta`（正の値）、0 以上なら `delta` になります。

### 4. 具体的な値で追う

`a = 3`、`b = 9` で続けます。

- `delta = -6`、`minDeltaOrZero = -6`
- `a = -6 - (-6) - (-6) = 6`（`|3 - 9|`）
- `b = 9 + (-6) = 3`（`min(3, 9)`）
- `a >>= 1` で `a = 3`

`a = 3`、`b = 3` になったので、ループを抜けます。結果は `3 << min(2, 1) = 6` で、正しい答えです。

## ここがすごい

- **割り算を使わない**: 割り算は、加減算やシフトより時間がかかる命令です。このアルゴリズムは、2 の因子を数える `numberOfTrailingZeros` と、引き算とシフトだけで進むので、ベンチマークで 40% 以上速いと書かれています。
- **分岐を消す工夫**: `if (a > b)` の代わりに、符号ビットを使った `minDeltaOrZero` で最小値と絶対値を作っています。コメントにも「分岐を避けるために大きな努力をしている」と書かれていて、CPU の分岐予測の失敗を避ける意図が明確です。
- **あふれを防ぐ前提**: 引数を非負に限ることで、`a - b` が `int` の範囲を超えないことが保証されています。`gcd(0, Integer.MIN_VALUE)` の問題も、この制約で最初から排除されています。
- **0 の扱いを明示**: `gcd(0, b) = b` は、「0 は任意の数で割り切れる」という数学の約束に従っています。コメントで、`BigInteger.gcd` と同じ判断だと書かれています。

## まとめ

- 2 の因子は `numberOfTrailingZeros` で数えて、最後に戻せばよい。
- 割り算の代わりに引き算とシフトで進める方法は、速くて安定した処理になる。
- 符号ビットを使えば、最小値や絶対値を分岐なしで作れる。
