---
title: "階乗の 2 の因数を先に抜き、最後に左シフトで戻す"
description: "Guava の BigIntegerMath.factorial の中核。long に収まる範囲で 2 の因数を抜いた積をまとめ、抜いた 2 の数は数えておいて、最後に左シフトで戻す。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/BigIntegerMath.java
lines: [394, 434]
function: "BigIntegerMath.factorial"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, アルゴリズム]
---

## ひとことで

階乗 `n!` は、1 から n までの積です。n が大きくなると、すぐに `long` に入らなくなり、`BigInteger` で計算する必要があります。

`BigIntegerMath.factorial` は、この積を速く求めます。途中の積を `long` の中でできるだけ大きくまとめ、入らなくなったら `BigInteger` として保存します。また、積の中の 2 の因数は、数えておくだけにして、最後に左シフトで戻します。

## コード

::: code-group

```java:line-numbers=394 [日本語訳]
    // LongMath の、事前に計算しておいた最大の long の階乗から始める
    int startingNumber = LongMath.factorials.length;
    long product = LongMath.factorials[startingNumber - 1];
    // この値から 2 の因数を取り除く
    int shift = Long.numberOfTrailingZeros(product);
    product >>= shift;

    // オーバーフローを防ぐため、floor(log2(num)) + 1 を使う
    int productBits = LongMath.log2(product, FLOOR) + 1;
    int bits = LongMath.log2(startingNumber, FLOOR) + 1;
    // 次の 2 の累乗の境目を確かめる。CLZ（先頭の 0 を数える命令）を省くため
    int nextPowerOfTwo = 1 << (bits - 1);

    // long に入る限り、何度も掛け合わせる
    for (long num = startingNumber; num <= n; num++) {
      // floor(log2(num)) + 1 が変わったかどうかを確かめる
      if ((num & nextPowerOfTwo) != 0) {
        nextPowerOfTwo <<= 1;
        bits++;
      }
      // num の中の 2 の因数を取り除く
      int tz = Long.numberOfTrailingZeros(num);
      long normalizedNum = num >> tz;
      shift += tz;
      // floor(log2(num)) + 1 を調整する
      int normalizedBits = bits - tz;
      // long に入らなくなったら、途中の積を保存する
      if (normalizedBits + productBits >= Long.SIZE) {
        bignums.add(BigInteger.valueOf(product));
        product = 1;
        productBits = 0;
      }
      product *= normalizedNum;
      productBits = LongMath.log2(product, FLOOR) + 1;
    }
    // 残りを確かめる
    if (product > 1) {
      bignums.add(BigInteger.valueOf(product));
    }
    // 途中の積を、まとめて掛け合わせる
    return listProduct(bignums).shiftLeft(shift);
```

```java:line-numbers=394 [原文]
    // Start from the pre-computed maximum long factorial.
    int startingNumber = LongMath.factorials.length;
    long product = LongMath.factorials[startingNumber - 1];
    // Strip off 2s from this value.
    int shift = Long.numberOfTrailingZeros(product);
    product >>= shift;

    // Use floor(log2(num)) + 1 to prevent overflow of multiplication.
    int productBits = LongMath.log2(product, FLOOR) + 1;
    int bits = LongMath.log2(startingNumber, FLOOR) + 1;
    // Check for the next power of two boundary, to save us a CLZ operation.
    int nextPowerOfTwo = 1 << (bits - 1);

    // Iteratively multiply the longs as big as they can go.
    for (long num = startingNumber; num <= n; num++) {
      // Check to see if the floor(log2(num)) + 1 has changed.
      if ((num & nextPowerOfTwo) != 0) {
        nextPowerOfTwo <<= 1;
        bits++;
      }
      // Get rid of the 2s in num.
      int tz = Long.numberOfTrailingZeros(num);
      long normalizedNum = num >> tz;
      shift += tz;
      // Adjust floor(log2(num)) + 1.
      int normalizedBits = bits - tz;
      // If it won't fit in a long, then we store off the intermediate product.
      if (normalizedBits + productBits >= Long.SIZE) {
        bignums.add(BigInteger.valueOf(product));
        product = 1;
        productBits = 0;
      }
      product *= normalizedNum;
      productBits = LongMath.log2(product, FLOOR) + 1;
    }
    // Check for leftovers.
    if (product > 1) {
      bignums.add(BigInteger.valueOf(product));
    }
    // Efficiently multiply all the intermediate products together.
    return listProduct(bignums).shiftLeft(shift);
```

:::

## 前提知識

- **2 の因数**: 偶数の数を、2 で割れる回数です。`Long.numberOfTrailingZeros` は、その回数（下の 0 の数）を返します。
- **`shift`**: これまでに抜いた 2 の因数の合計です。最後に、積を `shift` ビット左へずらすと、抜いた分の 2 が戻ります。
- **`productBits`**: いまの積のビットの長さです。`LongMath.log2(product, FLOOR) + 1` で求めます。
- **`bits` と `normalizedBits`**: `bits` は `num` のビットの長さです。`normalizedBits` は、2 の因数を抜いた `num` のビットの長さで、`bits - tz` で求まります。

## 何をしているか

### 1. 開始の値を用意し、2 の因数を抜く

```java:line-numbers=394
    // LongMath の、事前に計算しておいた最大の long の階乗から始める
    int startingNumber = LongMath.factorials.length;
    long product = LongMath.factorials[startingNumber - 1];
    // この値から 2 の因数を取り除く
    int shift = Long.numberOfTrailingZeros(product);
    product >>= shift;
```

`LongMath.factorials` は、`long` に収まる階乗の表です。その最後の値から始めて、2 の因数を抜きます。抜いた数は `shift` に記録します。

### 2. 数を掛け合わせる。入らなくなったら保存する

```java:line-numbers=407
    // long に入る限り、何度も掛け合わせる
    for (long num = startingNumber; num <= n; num++) {
      // floor(log2(num)) + 1 が変わったかどうかを確かめる
      if ((num & nextPowerOfTwo) != 0) {
        nextPowerOfTwo <<= 1;
        bits++;
      }
      // num の中の 2 の因数を取り除く
      int tz = Long.numberOfTrailingZeros(num);
      long normalizedNum = num >> tz;
      shift += tz;
      // floor(log2(num)) + 1 を調整する
      int normalizedBits = bits - tz;
      // long に入らなくなったら、途中の積を保存する
```

`num` を 1 つずつ増やしながら、2 の因数を抜いて `product` に掛けます。`normalizedBits + productBits` が 64 以上になりそうなら、今の `product` を `bignums` に保存して、積を 1 からやり直します。

`(num & nextPowerOfTwo) != 0` は、`num` が次の 2 の累乗に達したかを確かめる方法です。達したら `bits` を 1 増やすので、`CLZ` を毎回計算しなくて済みます。

### 3. 残りをまとめ、最後にシフトで戻す

```java:line-numbers=429
    // 残りを確かめる
    if (product > 1) {
      bignums.add(BigInteger.valueOf(product));
    }
    // 途中の積を、まとめて掛け合わせる
    return listProduct(bignums).shiftLeft(shift);
```

残った積を保存してから、`listProduct` で全部を掛け合わせ、最後に `shiftLeft(shift)` で、抜いた 2 の因数を戻します。

## ここがすごい

- **long を限界まで使う**: 1 つずつ `BigInteger` で掛けるより、`long` の中で掛けられるだけ掛けてから保存します。`BigInteger` の掛け算の回数が減ります。
- **2 の因数を後回しにする**: 2 の因数は、掛け算の途中ではビットの位置を変えるだけなので、数えておいて最後にシフトすれば済みます。`long` の中の積が、無駄に大きくならずに済みます。
- **ビットの長さで溢れを防ぐ**: 積の正確な値を求めずに、ビットの長さの和だけで、溢れるおそれがあるかを判断しています。和が 64 以上なら、安全側に保存します。
- **分割してから掛け合わせる**: 保存した途中の積は、`listProduct` で、木構造のように掛け合わせます。

## まとめ

- 階乗は、`long` に入る範囲で 2 の因数を抜いた積をまとめ、入らなくなったら `BigInteger` に保存する。
- 抜いた 2 の因数の数は `shift` に数えておき、最後に `shiftLeft` で戻す。
- ビットの長さの和で溢れを判断し、`CLZ` を避けるために次の 2 の累乗の境目を追跡する。
