---
title: "円の中の点から、正規分布の乱数を 2 つ作る"
description: "Java 標準の Random.nextGaussian。-1 から 1 の正方形から円の内側の点を採用し、対数と平方根で正規分布の値に変換する極座標法。2 つ目の値を次回用に保存する。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1995, 2024, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/Random.java
lines: [745, 762]
function: "Random.nextGaussian"
difficulty: 3
format: 2
tags: [乱数, 数値計算, アルゴリズム]
---

## ひとことで

`Random.nextGaussian()` は、平均 0、標準偏差 1 の正規分布（ガウス分布）にしたがう乱数を返します。ほとんどの値は 0 の近くに集まり、遠くの値はまれに出ます。

身長やテストの点数のような、自然に現れる誤差のモデルとして使われます。Java の標準の乱数生成器から、この分布の値を作るための方法です。

## コード

::: code-group

```java:line-numbers=745 [日本語訳]
    public synchronized double nextGaussian() {
        // Knuth, TAOCP, 第 2 巻, 第 3 版, 3.4.1 節のアルゴリズム C を参照
        if (haveNextNextGaussian) {
            haveNextNextGaussian = false;
            return nextNextGaussian;
        } else {
            double v1, v2, s;
            do {
                v1 = 2 * nextDouble() - 1; // -1 から 1 の間
                v2 = 2 * nextDouble() - 1; // -1 から 1 の間
                s = v1 * v1 + v2 * v2;
            } while (s >= 1 || s == 0);
            double multiplier = StrictMath.sqrt(-2 * StrictMath.log(s)/s);
            nextNextGaussian = v2 * multiplier;
            haveNextNextGaussian = true;
            return v1 * multiplier;
        }
    }
```

```java:line-numbers=745 [原文]
    public synchronized double nextGaussian() {
        // See Knuth, TAOCP, Vol. 2, 3rd edition, Section 3.4.1 Algorithm C.
        if (haveNextNextGaussian) {
            haveNextNextGaussian = false;
            return nextNextGaussian;
        } else {
            double v1, v2, s;
            do {
                v1 = 2 * nextDouble() - 1; // between -1 and 1
                v2 = 2 * nextDouble() - 1; // between -1 and 1
                s = v1 * v1 + v2 * v2;
            } while (s >= 1 || s == 0);
            double multiplier = StrictMath.sqrt(-2 * StrictMath.log(s)/s);
            nextNextGaussian = v2 * multiplier;
            haveNextNextGaussian = true;
            return v1 * multiplier;
        }
    }
```

:::

## 前提知識

- **正規分布**: 平均の周りに値が集まる、左右対称の釣り鐘型の分布です。標準正規分布は平均 0、標準偏差 1 です。
- **一様乱数**: 一定の範囲で、どの値も同じ確からしさで出る乱数です。`nextDouble()` は 0 以上 1 未満の一様乱数を返します。
- **極座標法（Marsaglia の極法）**: 正方形の中から円の内側の点を選び、その点の座標から正規分布の値を作る方法です。
- **対数と平方根**: `StrictMath.log` と `StrictMath.sqrt` で、点の位置を正規分布の値へ変換します。
- **`haveNextNextGaussian`**: 2 つ目の値を次の呼び出しのために保存しておく、フラグと変数です。

## 何をしているか

### 1. 保存された値があればそれを返す

```java:line-numbers=747
        if (haveNextNextGaussian) {
            haveNextNextGaussian = false;
            return nextNextGaussian;
```

前回の呼び出しで、2 つ目の値を作って保存していれば、それを返して終わります。計算を半分の回数で済ませられます。

### 2. 円の内側の点を選ぶ

```java:line-numbers=751
            double v1, v2, s;
            do {
                v1 = 2 * nextDouble() - 1; // -1 から 1 の間
                v2 = 2 * nextDouble() - 1; // -1 から 1 の間
                s = v1 * v1 + v2 * v2;
            } while (s >= 1 || s == 0);
```

`v1` と `v2` を、-1 から 1 の一様乱数にします。`s = v1² + v2²` が 1 未満で、かつ 0 でなければ、その点は単位円の内側にあります。円の外の点は捨てて、やり直します。

### 3. 正規分布の値に変換する

```java:line-numbers=757
            double multiplier = StrictMath.sqrt(-2 * StrictMath.log(s)/s);
            nextNextGaussian = v2 * multiplier;
            haveNextNextGaussian = true;
            return v1 * multiplier;
```

円の内側の点について、`sqrt(-2 log(s) / s)` を掛けると、`v1` と `v2` がそれぞれ標準正規分布にしたがう値になります。1 つは今回の戻り値、もう 1 つは保存して次回に返します。

## ここがすごい

- **2 つ同時に作る**: 1 回の計算で正規分布の値が 2 つ得られます。2 つ目を保存しておくので、無駄がありません。
- **三角関数を使わない**: ボックス＝ミュラー法は `sin` と `cos` を使いますが、極法は円の内側の点を選ぶことで、それらを使わずに済みます。
- **棄却で条件を満たす**: 正方形の一様な点のうち、円の内側だけが残るので、残った点は円の中で一様に分布します。捨てられる割合は約 21 パーセントです（円と正方形の面積の比による）。
- **Knuth の方法に基づく**: コメントの出典は、『The Art of Computer Programming』（TAOCP）の 3.4.1 節にあたります。アルゴリズムの根拠を辿れます。

## まとめ

- 正規分布の乱数は、単位円の内側の一様な点から、対数と平方根で作る。
- 2 つの値を同時に得て、片方を次回に保存して無駄を減らす。
- 円の外の点は捨てて選び直し、三角関数を使わずに値を作る。
