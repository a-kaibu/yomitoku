---
title: "溢れない平均を、ビットの AND と XOR で求める"
description: "Guava の IntMath.mean。2 つの int の算術平均を、(x + y) / 2 のように溢れる足し算を使わず、AND と XOR と右シフトで求める。負の数でも正しく動く。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/IntMath.java
lines: [708, 713]
function: "IntMath.mean"
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 防御的プログラミング]
---

## ひとことで

`IntMath.mean(x, y)` は、2 つの `int` の平均を返します。たとえば `mean(3, 8)` は 5、`mean(-3, 8)` は 2 です。

平均は `(x + y) / 2` で求めたくなりますが、`x` と `y` が大きいと、足す時点で `int` の範囲を超えて溢れてしまいます。この関数は、溢れない形で、同じ結果を求めます。

## コード

::: code-group

```java:line-numbers=708 [日本語訳]
  public static int mean(int x, int y) {
    // 算術平均を計算する効率のよい方法
    // 別の方法 (x + y) / 2 は、大きな値で失敗する（溢れる）
    // 別の方法 (x + y) >>> 1 は、負の値で失敗する
    return (x & y) + ((x ^ y) >> 1);
  }
```

```java:line-numbers=708 [原文]
  public static int mean(int x, int y) {
    // Efficient method for computing the arithmetic mean.
    // The alternative (x + y) / 2 fails for large values.
    // The alternative (x + y) >>> 1 fails for negative values.
    return (x & y) + ((x ^ y) >> 1);
  }
```

:::

## 前提知識

- **`int` の溢れ**: `int` の足し算は範囲を超えると、値が折り返されます。`Integer.MAX_VALUE + 1` は負の数になります。
- **`&`（AND）**: 両方が 1 の桁だけを 1 にします。`x & y` は、2 つの数に共通して立っているビットを表します。
- **`^`（XOR）**: 違う桁だけを 1 にします。`x ^ y` は、2 つの数で違うビットを表します。
- **`>>`（符号付き右シフト）**: 1 ビット右へずらし、左端は符号ビットで埋めます。負の数でも、結果は切り捨ての方向に丸められます。
- **切り捨て（床）**: 割り切れないとき、負の無限大の方向に丸めることです。`-7 / 2` の床は `-4` です。

## 何をしているか

### 1. 共通のビットと違うビットに分ける

```java:line-numbers=712
    return (x & y) + ((x ^ y) >> 1);
```

`x + y` は、`x & y` と `x ^ y` に分けられます。`x & y` は、両方に立っているビットで、足したときに桁上がりを生む部分です。`x ^ y` は、片方だけに立っているビットです。

### 2. 半分にして足し直す

ここで、`x + y = (x ^ y) + 2 * (x & y)` が成り立ちます。両辺を 2 で割ると、`(x + y) / 2 = (x & y) + (x ^ y) / 2` です。`(x ^ y) / 2` を `>> 1` で求めれば、和を直接作らずに、平均が得られます。

### 3. 溢れない理由

和を作らないので、途中で `int` の範囲を超えることがありません。`x & y` も `x ^ y` も、それぞれ `int` の範囲に収まります。そのため、どんな `int` の組み合わせでも正しく動きます。

## ここがすごい

- **溢れを避けた式**: 平均の定義を、和を作らずに書き換えています。`Integer.MAX_VALUE` 同士の平均でも、正しい値が出ます。
- **負の数も正しく扱える**: `(x + y) >>> 1` は、負の数で誤った値になります。この式は算術シフトを使うので、負の数でも正しく切り捨てられます。
- **ビット演算 3 つだけ**: AND、XOR、右シフト、足し算だけです。割り算を使わずに、速く計算できます。
- **コメントに失敗例がある**: 2 つの代替案がなぜ誤るのか、コメントで示しています。よくある誤りを避ける考え方が、そのまま読み取れます。

## まとめ

- 平均は、共通のビット `x & y` と違うビット `x ^ y` の半分の和で表せる。
- `(x ^ y) >> 1` で半分を求めれば、和を作らずに溢れを避けられる。
- 負の数でも、算術シフトによって床の方向に正しく丸められる。
