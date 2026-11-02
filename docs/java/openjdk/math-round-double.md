---
title: "浮動小数点の誤差を避けて、ビットで四捨五入する"
description: "Java 標準の Math.round(double)。値の生のビットから仮数と指数を取り出し、整数演算だけで floor(a + 1/2) を求める。素朴な floor(a + 0.5) が誤る値も正しく扱う。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Math.java
lines: [828, 856]
function: "Math.round"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 低レイヤ]
---

## ひとことで

`Math.round(a)` は、`double` を最も近い整数に丸めて `long` で返します。0.5 は切り上げて 1、-0.5 は 0 になります。Java の規則では、`floor(a + 1/2)` が結果になります。

素朴に `Math.floor(a + 0.5)` と書くと、`0.49999999999999994` のような値で誤ります。`a + 0.5` が計算の中で `1.0` に丸められてしまうからです。この関数は、浮動小数点の加算を使わず、ビットの整数演算で正確に求めます。

## コード

::: code-group

```java:line-numbers=828 [日本語訳]
    @IntrinsicCandidate
    public static long round(double a) {
        long longBits = Double.doubleToRawLongBits(a);
        long biasedExp = (longBits & DoubleConsts.EXP_BIT_MASK)
                >> (DoubleConsts.SIGNIFICAND_WIDTH - 1);
        long shift = (DoubleConsts.SIGNIFICAND_WIDTH - 2
                + DoubleConsts.EXP_BIAS) - biasedExp;
        if ((shift & -64) == 0) { // shift >= 0 かつ shift < 64
            // a は有限の数で、pow(2,-64) <= ulp(a) < 1 を満たす
            long r = ((longBits & DoubleConsts.SIGNIF_BIT_MASK)
                    | (DoubleConsts.SIGNIF_BIT_MASK + 1));
            if (longBits < 0) {
                r = -r;
            }
            // 以下のコメントでは、それぞれの Java の式が、対応する数学の式の値を表す
            // （式と数学の対応を示す）
            // (r) は a / ulp(a) の値になる
            // (r >> shift) は floor(a * 2) の値になる
            // ((r >> shift) + 1) は floor((a + 1/2) * 2) の値になる
            // (((r >> shift) + 1) >> 1) は floor(a + 1/2) の値になる
            return ((r >> shift) + 1) >> 1;
        } else {
            // a は次のいずれか
            // - abs(a) < exp(2, DoubleConsts.SIGNIFICAND_WIDTH-64) < 1/2 を満たす有限の数
            // - ulp(a) >= 1 で、したがって整数である有限の数
            // - 無限大または NaN
            return (long) a;
        }
    }
```

```java:line-numbers=828 [原文]
    @IntrinsicCandidate
    public static long round(double a) {
        long longBits = Double.doubleToRawLongBits(a);
        long biasedExp = (longBits & DoubleConsts.EXP_BIT_MASK)
                >> (DoubleConsts.SIGNIFICAND_WIDTH - 1);
        long shift = (DoubleConsts.SIGNIFICAND_WIDTH - 2
                + DoubleConsts.EXP_BIAS) - biasedExp;
        if ((shift & -64) == 0) { // shift >= 0 && shift < 64
            // a is a finite number such that pow(2,-64) <= ulp(a) < 1
            long r = ((longBits & DoubleConsts.SIGNIF_BIT_MASK)
                    | (DoubleConsts.SIGNIF_BIT_MASK + 1));
            if (longBits < 0) {
                r = -r;
            }
            // In the comments below each Java expression evaluates to the value
            // the corresponding mathematical expression:
            // (r) evaluates to a / ulp(a)
            // (r >> shift) evaluates to floor(a * 2)
            // ((r >> shift) + 1) evaluates to floor((a + 1/2) * 2)
            // (((r >> shift) + 1) >> 1) evaluates to floor(a + 1/2)
            return ((r >> shift) + 1) >> 1;
        } else {
            // a is either
            // - a finite number with abs(a) < exp(2,DoubleConsts.SIGNIFICAND_WIDTH-64) < 1/2
            // - a finite number with ulp(a) >= 1 and hence a is a mathematical integer
            // - an infinity or NaN
            return (long) a;
        }
    }
```

:::

## 前提知識

- **IEEE 754 の構造**: `double` は、符号・指数（exponent）・仮数（significand）の 3 つで値を表します。
- **ulp**: 隣り合う浮動小数点数の間隔です。ulp が 1 より小さければ、小数部分を表せます。
- **仮数に隠れた 1**: 正規化された数では、仮数の先頭に 1 があると仮定します。コードでは `SIGNIF_BIT_MASK + 1` でその 1 を補っています。
- **`floor`（床）**: 負の無限大の方向への切り捨てです。`floor(a + 1/2)` は、0.5 の端で切り上げる丸めになります。
- **シフト量**: 指数から決まる、仮数の桁をどれだけずらすかの値です。整数の範囲に収まるように、符号付きで計算します。

## 何をしているか

### 1. 指数からシフト量を求める

```java:line-numbers=830
        long longBits = Double.doubleToRawLongBits(a);
        long biasedExp = (longBits & DoubleConsts.EXP_BIT_MASK)
                >> (DoubleConsts.SIGNIFICAND_WIDTH - 1);
        long shift = (DoubleConsts.SIGNIFICAND_WIDTH - 2
                + DoubleConsts.EXP_BIAS) - biasedExp;
```

生のビットから指数部分を取り出し、仮数をいくつずらせば「整数の部分と、0.5 の位」が分かるかを `shift` として求めます。値の大きさによって、この `shift` が決まります。

### 2. 整数の範囲に収まる値を処理する

```java:line-numbers=835
        if ((shift & -64) == 0) { // shift >= 0 かつ shift < 64
            // a は有限の数で、pow(2,-64) <= ulp(a) < 1 を満たす
            long r = ((longBits & DoubleConsts.SIGNIF_BIT_MASK)
                    | (DoubleConsts.SIGNIF_BIT_MASK + 1));
            if (longBits < 0) {
                r = -r;
            }
```

`shift` が 0 以上 64 未満なら、値は 2 進数の固定小数点の形で扱えます。仮数に隠れた 1 を補って `r` を作り、負の数なら符号を付けます。`r` は、`a` を `ulp(a)` で割った値に相当します。

### 3. ずらして 1 を足し、1 ビット右へ

```java:line-numbers=842
            // 以下のコメントでは、それぞれの Java の式が、対応する数学の式の値を表す
            // （式と数学の対応を示す）
            // (r) は a / ulp(a) の値になる
            // (r >> shift) は floor(a * 2) の値になる
            // ((r >> shift) + 1) は floor((a + 1/2) * 2) の値になる
            // (((r >> shift) + 1) >> 1) は floor(a + 1/2) の値になる
```

`r >> shift` は `floor(a * 2)` に相当します。そこに 1 を足して 1 ビット右へずらすと、`floor(a + 1/2)` が得られます。ここで、0.5 を足す計算を浮動小数点で行わないので、誤差が入りません。

### 4. それ以外の場合

```java:line-numbers=849
        } else {
            // a は次のいずれか
            // - abs(a) < exp(2, DoubleConsts.SIGNIFICAND_WIDTH-64) < 1/2 を満たす有限の数
            // - ulp(a) >= 1 で、したがって整数である有限の数
            // - 無限大または NaN
            return (long) a;
        }
```

値が非常に小さいか、もともと整数になっている大きい値、無限大か NaN の場合は、`(long) a` のキャストを使います。非常に小さい値は 0 になり、大きい整数はそのまま値になります。

## ここがすごい

- **誤差のない丸め**: 浮動小数点で `a + 0.5` を計算しないので、`0.49999999999999994` も正しく 0 になります。素朴な書き方の弱点を、根本から避けています。
- **指数で場合分け**: 値の大きさに応じて、ビットの扱い方を変えます。整数として直接扱える場合は、最初から変換しません。
- **コメントで式を対応させる**: `r`、`r >> shift`、`(r >> shift) + 1` が、数学の式のどれに当たるかを、丁寧に書いています。読み手が検証できます。
- **分岐は 1 つ**: 大きさによる分岐と、符号による処理だけです。計算そのものは、シフトと加算で完結しています。

## まとめ

- `floor(a + 1/2)` を、浮動小数点の加算を使わずに、仮数の整数表現で求める。
- 指数からシフト量を求め、範囲内の値はシフトと加算で、範囲外は `(long) a` で扱う。
- 0.5 の端の誤差を避けるため、加算の前に丸めの判断をビットで行う。
