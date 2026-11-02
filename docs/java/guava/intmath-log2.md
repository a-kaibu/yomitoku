---
title: "丸め方向を選んで 2 を底とする対数を求める"
description: "Guava の IntMath.log2。先頭の 0 の個数から底 2 の対数を求め、切り捨て・切り上げ・四捨五入の丸め方を switch で分ける。√2 との比較をビットだけで行う工夫に注目する。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/IntMath.java
lines: [116, 141]
function: "IntMath.log2"
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, 最適化]
---

## ひとことで

`IntMath.log2(x, mode)` は、正の整数 `x` を底とする 2 の対数を、整数で求めます。たとえば 8 なら 3、9 なら 3.17... を切り捨てた 3 になります。2 進数で何桁あるかを求める、というのが本質です。

丸め方向は `RoundingMode` で指定します。切り捨て、切り上げ、四捨五入などを選べます。割り切れない値を扱う場面で、どう丸めるかを明確にできるのが特徴です。

## コード

::: code-group

```java:line-numbers=116 [日本語訳]
  public static int log2(int x, RoundingMode mode) {
    checkPositive("x", x);
    switch (mode) {
      case UNNECESSARY:
        checkRoundingUnnecessary(isPowerOfTwo(x));
      // 次の case へ続けて処理する
      case DOWN:
      case FLOOR:
        return (Integer.SIZE - 1) - Integer.numberOfLeadingZeros(x);

      case UP:
      case CEILING:
        return Integer.SIZE - Integer.numberOfLeadingZeros(x - 1);

      case HALF_DOWN:
      case HALF_UP:
      case HALF_EVEN:
        // sqrt(2) は無理数なので、log2(x) - logFloor がちょうど 0.5 になることはない
        int leadingZeros = Integer.numberOfLeadingZeros(x);
        int cmp = MAX_POWER_OF_SQRT2_UNSIGNED >>> leadingZeros;
        // 2^(logFloor + 0.5) を切り捨てた値
        int logFloor = (Integer.SIZE - 1) - leadingZeros;
        return logFloor + lessThanBranchFree(cmp, x);
    }
    throw new AssertionError();
  }
```

```java:line-numbers=116 [原文]
  public static int log2(int x, RoundingMode mode) {
    checkPositive("x", x);
    switch (mode) {
      case UNNECESSARY:
        checkRoundingUnnecessary(isPowerOfTwo(x));
      // fall through
      case DOWN:
      case FLOOR:
        return (Integer.SIZE - 1) - Integer.numberOfLeadingZeros(x);

      case UP:
      case CEILING:
        return Integer.SIZE - Integer.numberOfLeadingZeros(x - 1);

      case HALF_DOWN:
      case HALF_UP:
      case HALF_EVEN:
        // Since sqrt(2) is irrational, log2(x) - logFloor cannot be exactly 0.5
        int leadingZeros = Integer.numberOfLeadingZeros(x);
        int cmp = MAX_POWER_OF_SQRT2_UNSIGNED >>> leadingZeros;
        // floor(2^(logFloor + 0.5))
        int logFloor = (Integer.SIZE - 1) - leadingZeros;
        return logFloor + lessThanBranchFree(cmp, x);
    }
    throw new AssertionError();
  }
```

:::

このコードが使う `checkPositive` や `isPowerOfTwo` などは、同じ `IntMath` クラスの中で定義されています。このメソッドは、正の値だけを受け付けます。

## 前提知識

- **対数（log）**: `2^n = x` となる `n` を求める計算です。`log2(8) = 3` です。
- **`RoundingMode`**: 割り切れないときに、どちらへ丸めるかを表す列挙型です。`FLOOR`（切り捨て）、`CEILING`（切り上げ）、`HALF_UP`（四捨五入）などがあります。
- **`Integer.numberOfLeadingZeros(x)`**: `x` の先頭にある 0 の個数です。`int` は 32 ビットなので、`31 - numberOfLeadingZeros(x)` で、最上位の 1 の位置（0 始まり）が分かります。
- **`switch` の fallthrough**: `case` に `break` がないと、次の `case` へ続けて実行されます。ここでは `UNNECESSARY` の場合に、切り捨てと同じ処理へ進んでいます。
- **`√2`**: 約 1.414 です。2 の対数の小数部分が 0.5 かどうかを判断する境目になります。

## 何をしているか

### 1. 切り捨てと切り捨てに近い扱い

```java:line-numbers=117
    checkPositive("x", x);
    switch (mode) {
      case UNNECESSARY:
        checkRoundingUnnecessary(isPowerOfTwo(x));
      // 次の case へ続けて処理する
      case DOWN:
      case FLOOR:
        return (Integer.SIZE - 1) - Integer.numberOfLeadingZeros(x);
```

`FLOOR` と `DOWN` は、先頭の 1 の位置をそのまま返します。たとえば 9（`1001`）は最上位の 1 が 3 番目（0 始まり）なので 3 です。`UNNECESSARY` は、2 のべき乗でなければ例外を投げる `checkRoundingUnnecessary` を通ります。例外にならなかった場合、切り捨てと同じ計算を使います。

### 2. 切り上げは `x - 1` で数える

```java:line-numbers=126
      case UP:
      case CEILING:
        return Integer.SIZE - Integer.numberOfLeadingZeros(x - 1);
```

`CEILING` と `UP` では、`x - 1` の先頭の 1 の位置に 1 を足します。`x` が 2 のべき乗ちょうどのときに、余計な 1 桁を増やさないように、1 を引いてから数えています。

### 3. 四捨五入は √2 と比べる

```java:line-numbers=130
      case HALF_DOWN:
      case HALF_UP:
      case HALF_EVEN:
        // sqrt(2) は無理数なので、log2(x) - logFloor がちょうど 0.5 になることはない
        int leadingZeros = Integer.numberOfLeadingZeros(x);
        int cmp = MAX_POWER_OF_SQRT2_UNSIGNED >>> leadingZeros;
        // 2^(logFloor + 0.5) を切り捨てた値
        int logFloor = (Integer.SIZE - 1) - leadingZeros;
        return logFloor + lessThanBranchFree(cmp, x);
```

`HALF_UP` などの場合は、`log2(x)` の小数部分が 0.5 より大きいかを調べます。`2^(n + 0.5)` は、ちょうど √2 × 2^n です。`MAX_POWER_OF_SQRT2_UNSIGNED` は、その境目の値を 2 進数で表したものです。`x` をこの値と比べることで、浮動小数点を使わずに判定します。

比べる値を `leadingZeros` で右にずらして揃えることで、同じ桁で比較できます。`lessThanBranchFree` は、分岐を使わずに「小さければ 1、そうでなければ 0」を返すので、結果に 1 を足すだけで四捨五入の切り上げになります。

## ここがすごい

- **浮動小数点を使わない**: `Math.log` で求めると誤差が出る場合があります。この関数は整数のビット操作だけで、正確な結果を返します。
- **√2 の境目を整数で表す**: 0.5 の判定を、ビットを使った比較で済ませています。√2 は無理数なので、ちょうど 0.5 になることはなく、比較の境目がはっきりしています。
- **分岐を減らす**: `lessThanBranchFree` は名前のとおり、条件分岐をせずに結果を作ります。判定結果が予測しにくい場面で、CPU の分岐予測の失敗を避けられます。
- **丸め方を引数で選べる**: 同じ計算の中で、丸め方向だけを `switch` で分けています。呼び出し側は、目的に合った丸め方を一つ選ぶだけです。

## まとめ

- 2 を底とする対数は、最上位ビットの位置で求められる。
- 切り上げは `x - 1` を使い、四捨五入は √2 との比較で判定する。
- 浮動小数点を使わず、整数の範囲で正確な結果を返す。
