---
title: "小数の和で落ちる誤差を、次の足し算で取り戻す"
description: "Java 標準の DoubleSummaryStatistics.sumWithCompensation。Kahan 法（補償つき和）で、double の足し算で失われる下位の誤差を別の変数に残し、次の値に加える。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2012, 2019, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/DoubleSummaryStatistics.java
lines: [170, 175]
function: "DoubleSummaryStatistics.sumWithCompensation"
difficulty: 2
format: 2
tags: [数値計算, アルゴリズム, 低レイヤ]
---

## ひとことで

`double` は、小数を有限の桁で近似して持つので、大きさの違う値を足すと、小さい方の一部の桁が消えることがあります。何万回も足し続けると、その誤差が目立ちます。

`DoubleSummaryStatistics` は、値の合計を、この誤差を減らす方法で計算します。`sumWithCompensation` は、1 つの値を足すたびに、前回までに消えた誤差を補正として使います。この方法を Kahan 法（補償つき和）と呼びます。

## コード

::: code-group

```java:line-numbers=170 [日本語訳]
    private void sumWithCompensation(double value) {
        double tmp = value - sumCompensation;
        double velvel = sum + tmp; //         double velvel = sum + tmp; // 丸め誤差の小さな狼（原文のコメント）
        sumCompensation = (velvel - sum) - tmp;
        sum = velvel;
    }
```

```java:line-numbers=170 [原文]
    private void sumWithCompensation(double value) {
        double tmp = value - sumCompensation;
        double velvel = sum + tmp; // Little wolf of rounding error
        sumCompensation = (velvel - sum) - tmp;
        sum = velvel;
    }
```

:::

## 前提知識

- **浮動小数点の丸め誤差**: `double` で `大きい値 + 小さい値` を計算すると、小さい値の下位の桁が結果に入らないことがあります。その消えた分が誤差です。
- **Kahan 法**: 消えた誤差を別の変数に覚えておき、次の足し算でその分を取り戻す方法です。合計を、精度を保ったまま求められます。
- **`sum`**: これまでの値の合計です。
- **`sumCompensation`**: 直前の足し算で消えた誤差を、覚えておく変数です。フィールドの宣言で「下位のビット」と説明されています。

## 何をしているか

### 1. 補正を値に加えてから、和を取る

```java:line-numbers=171
        double tmp = value - sumCompensation;
        double velvel = sum + tmp; //         double velvel = sum + tmp; // 丸め誤差の小さな狼（原文のコメント）
```

`tmp` は、新しい値から、前回の誤差を引いたものです。次に、`sum + tmp` を計算して、新しい合計 `velvel` を作ります。ここで、`tmp` の下位の桁の一部は、また消えます。

### 2. 今回消えた誤差を覚える

```java:line-numbers=173
        sumCompensation = (velvel - sum) - tmp;
```

`(velvel - sum) - tmp` は、`velvel` が実際に取り込んだ量と、`tmp` との差です。`velvel - sum` が、`sum` に実際に加わった分になります。そこから `tmp` を引くと、今回消えた量（負の符号つき）が残ります。これを次の補正に使います。

### 3. 合計を更新する

```java:line-numbers=174
        sum = velvel;
```

`sum` を `velvel` に置き換えます。以上で、1 つの値の処理が終わります。

## ここがすごい

- **単純な和より誤差が小さい**: 誤差を捨てずに次へ回すので、多くの値を足しても、全体の誤差が積み重なりにくくなります。
- **消えた分を正確に測る**: `(velvel - sum) - tmp` は、浮動小数点の計算で、消えた分をそのまま取り出せる式です。推測ではなく、計算結果から差を求めています。
- **メソッドを合併にも使う**: `combine` は、別の統計の `sum` と `sumCompensation` を、同じ方法で加えます。補正の値も一緒に引き継ぐので、並列に集計した結果を合わせても誤差が保たれます。
- **状態は 2 つの変数だけ**: 誤差の補正を、配列やリストを使わずに、2 つの `double` で持っています。

## まとめ

- `sumWithCompensation` は、前回の誤差を新しい値から引いてから、合計に足す。
- 合計に足したあと、実際に取り込まれなかった量を `sumCompensation` に残す。
- 単純な和より、足す回数が多くても誤差が小さく保たれる。
