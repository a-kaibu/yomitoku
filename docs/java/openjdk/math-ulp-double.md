---
title: "指数の値から、隣の数までの間隔を 2 の累乗で求める"
description: "Java 標準の Math.ulp(double)。浮動小数点数の指数を取り出し、仮数の桁数に合わせて 2 の累乗の間隔を作る。0 や非正規化数、無限大や NaN の場合も扱う。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Math.java
lines: [2550, 2572]
function: "Math.ulp"
difficulty: 3
format: 2
tags: [数値計算, 低レイヤ, ビット演算]
---

## ひとことで

`Math.ulp(d)` は、`d` と、その次に大きい（絶対値の大きい方の）浮動小数点数との間隔を返します。ulp は「unit in the last place」の略で、浮動小数点数の精度の目安です。

たとえば `ulp(1.0)` は `2^-52` です。`1.0` の次の数は `1.0 + 2^-52` だからです。大きな数ほど間隔が広くなるので、この値を見れば、その大きさでどれだけ細かく表せるかが分かります。

## コード

::: code-group

```java:line-numbers=2550 [日本語訳]
    public static double ulp(double d) {
        int exp = getExponent(d);

        return switch(exp) {
            case Double.MAX_EXPONENT + 1 -> Math.abs(d);      // NaN または無限大
            case Double.MIN_EXPONENT - 1 -> Double.MIN_VALUE; // 0 または非正規化数
            default -> {
                assert exp <= Double.MAX_EXPONENT && exp >= Double.MIN_EXPONENT;

                // ulp(x) は通常 2^(SIGNIFICAND_WIDTH-1) * (2^ilogb(x)) である
                exp = exp - (DoubleConsts.SIGNIFICAND_WIDTH - 1);
                if (exp >= Double.MIN_EXPONENT) {
                    yield powerOfTwoD(exp);
                } else {
                    // 非正規化数の結果を返す。整数表現の Double.MIN_VALUE を、適切な桁数だけ左へずらす
                    // （その上の説明の続き）Double.MIN_VALUE の整数表現を左へずらす
                    // ずらす桁数
                    yield Double.longBitsToDouble(1L <<
                            (exp - (Double.MIN_EXPONENT - (DoubleConsts.SIGNIFICAND_WIDTH - 1))));
                }
            }
        };
    }
```

```java:line-numbers=2550 [原文]
    public static double ulp(double d) {
        int exp = getExponent(d);

        return switch(exp) {
            case Double.MAX_EXPONENT + 1 -> Math.abs(d);      // NaN or infinity
            case Double.MIN_EXPONENT - 1 -> Double.MIN_VALUE; // zero or subnormal
            default -> {
                assert exp <= Double.MAX_EXPONENT && exp >= Double.MIN_EXPONENT;

                // ulp(x) is usually 2^(SIGNIFICAND_WIDTH-1)*(2^ilogb(x))
                exp = exp - (DoubleConsts.SIGNIFICAND_WIDTH - 1);
                if (exp >= Double.MIN_EXPONENT) {
                    yield powerOfTwoD(exp);
                } else {
                    // return a subnormal result; left shift integer
                    // representation of Double.MIN_VALUE appropriate
                    // number of positions
                    yield Double.longBitsToDouble(1L <<
                            (exp - (Double.MIN_EXPONENT - (DoubleConsts.SIGNIFICAND_WIDTH - 1))));
                }
            }
        };
    }
```

:::

## 前提知識

- **指数（exponent）**: 浮動小数点数の 2 の累乗の部分です。`getExponent(d)` は、その値を返します。
- **仮数の桁数**: `double` の仮数は、隠れた 1 を含めて 53 ビットです。`SIGNIFICAND_WIDTH` はその値です。
- **非正規化数（subnormal）**: 指数が最小になったときの、特殊な小さい数です。仮数の先頭の 1 が無く、間隔は一定の `Double.MIN_VALUE` になります。
- **`Double.MIN_VALUE`**: 正の最小の非正規化数で、約 4.9 × 10^-324 です。
- **`powerOfTwoD`**: 2 の累乗の `double` を作る内部のメソッドです。

## 何をしているか

### 1. 特別な値を先に扱う

```java:line-numbers=2551
        int exp = getExponent(d);

        return switch(exp) {
            case Double.MAX_EXPONENT + 1 -> Math.abs(d);      // NaN または無限大
            case Double.MIN_EXPONENT - 1 -> Double.MIN_VALUE; // 0 または非正規化数
```

指数が最大の 1 つ上なら、無限大か NaN なので、絶対値をそのまま返します。指数が最小の 1 つ下なら、0 か非正規化数なので、`Double.MIN_VALUE` を返します。

### 2. 通常の値は 2 の累乗で求める

```java:line-numbers=2557
                assert exp <= Double.MAX_EXPONENT && exp >= Double.MIN_EXPONENT;

                // ulp(x) は通常 2^(SIGNIFICAND_WIDTH-1) * (2^ilogb(x)) である
                exp = exp - (DoubleConsts.SIGNIFICAND_WIDTH - 1);
                if (exp >= Double.MIN_EXPONENT) {
                    yield powerOfTwoD(exp);
                } else {
```

通常の値の間隔は、`2^(仮数の桁数 - 1)` に、指数の 2 の累乗を掛けたものです。指数から仮数の桁数の分を引いた値を求め、その 2 の累乗を返します。

### 3. 間隔が非正規化の範囲になる場合

```java:line-numbers=2564
                    // 非正規化数の結果を返す。整数表現の Double.MIN_VALUE を、適切な桁数だけ左へずらす
                    // （その上の説明の続き）Double.MIN_VALUE の整数表現を左へずらす
                    // ずらす桁数
                    yield Double.longBitsToDouble(1L <<
                            (exp - (Double.MIN_EXPONENT - (DoubleConsts.SIGNIFICAND_WIDTH - 1))));
                }
```

求めた指数が、通常の範囲を下回ると、間隔は非正規化数の間隔になります。`Double.MIN_VALUE` の整数表現 `1` を、必要な桁数だけ左へずらして、その値を作ります。

## ここがすごい

- **指数だけから間隔が決まる**: 通常の数では、間隔は指数だけで決まります。仮数の値は関係しません。そのため、2 の累乗の計算だけで答えが出ます。
- **非正規化数の境界まで扱う**: 小さい数では、間隔が固定になる性質を利用しています。小さな値に対しても、間違いなく正しい間隔を返します。
- **特殊値を先に分ける**: NaN、無限大、0 は、通常の計算の前に別の枝で処理します。通常の経路は、常に有効な指数を前提にできます。
- **`assert` で前提を書く**: 通常の経路の先頭には、指数が有効な範囲にあることの `assert` があります。前提が、コードの中で明示されています。

## まとめ

- ulp は、浮動小数点数の隣との間隔で、通常の値では 2 の累乗として指数から求まる。
- 0、非正規化数、無限大、NaN は、それぞれ特別な値として先に処理する。
- 非正規化数の範囲では、`Double.MIN_VALUE` を必要な桁数だけずらした値になる。
