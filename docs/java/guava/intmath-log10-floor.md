---
title: "先頭の 0 の数から、10 進の桁数を 2 択に絞る"
description: "Guava の IntMath.log10Floor。先頭の 0 の数から底 10 の対数の候補を 2 つに絞り、比較 1 回で確定させる。Hacker's Delight の表引きの手法。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/IntMath.java
lines: [178, 191]
function: "IntMath.log10Floor"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 最適化]
---

## ひとことで

`IntMath.log10Floor(x)` は、正の整数 `x` の桁数から 1 を引いた値、つまり `floor(log10(x))` を返します。たとえば 999 なら 2、1000 なら 3 です。

10 で何回割れるかを数える方法と違い、ループを使わずに、ほぼ一瞬で答えを出します。Guava の数値ユーティリティの中で、速さを重視して書かれた実装の一例です。

## コード

::: code-group

```java:line-numbers=178 [日本語訳]
  private static int log10Floor(int x) {
    /*
     * Hacker's Delight の図 11-5 に基づく、表を 2 つ使う分岐なしの実装
     *
     * 先頭の 0 の数（つまり floor(log2(x))）から、floor(log10(x)) の候補を 2 つに絞れる
     * floor(log10(x)) の候補を 2 つに絞れる。たとえば floor(log2(x)) が 6 の場合
     * つまり 64 <= x < 128 なので、floor(log10(x)) は 1 か 2 のどちらかになる
     */
    int y = maxLog10ForLeadingZeros[Integer.numberOfLeadingZeros(x)];
    /*
     * y は floor(log10(x)) の 2 つの候補のうち、大きい方である
     * x < 10^y なら小さい方の y - 1 を、そうでなければ y を取りたい
     */
    return y - lessThanBranchFree(x, powersOf10[y]);
```

```java:line-numbers=178 [原文]
  private static int log10Floor(int x) {
    /*
     * Based on Hacker's Delight Fig. 11-5, the two-table-lookup, branch-free implementation.
     *
     * The key idea is that based on the number of leading zeros (equivalently, floor(log2(x))), we
     * can narrow the possible floor(log10(x)) values to two. For example, if floor(log2(x)) is 6,
     * then 64 <= x < 128, so floor(log10(x)) is either 1 or 2.
     */
    int y = maxLog10ForLeadingZeros[Integer.numberOfLeadingZeros(x)];
    /*
     * y is the higher of the two possible values of floor(log10(x)). If x < 10^y, then we want the
     * lower of the two possible values, or y - 1, otherwise, we want y.
     */
    return y - lessThanBranchFree(x, powersOf10[y]);
```

:::

このコードが使う 2 つの表は、同じクラスの中で次のように定義されています。

```java:line-numbers=194
  // maxLog10ForLeadingZeros[i] == floor(log10(2^(Long.SIZE - i)))
  @VisibleForTesting
  static final byte[] maxLog10ForLeadingZeros = {
    9, 9, 9, 8, 8, 8, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0,
    0
  };
```

```java:line-numbers=201
  @VisibleForTesting
  static final int[] powersOf10 = {
    1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000
  };
```

## 前提知識

- **対数（log）**: `10^n = x` となる `n` を求める計算です。`log10(1000) = 3` です。
- **`floor`（床）**: 小数点以下を切り捨てた整数です。`floor(log10(999)) = 2` です。
- **先頭の 0 の数**: `Integer.numberOfLeadingZeros(x)` で得られる、最上位の 1 より上にある 0 の個数です。2 を底とする対数の整数部分と結びついています。
- **表引き（テーブルルックアップ）**: 計算の代わりに、あらかじめ作った配列から値を読み出す手法です。
- **`lessThanBranchFree`**: 分岐を使わずに、「小さければ 1、そうでなければ 0」を返す関数です。結果に応じて 1 を引くために使われます。

## 何をしているか

### 1. 先頭の 0 の数から候補の上限を得る

```java:line-numbers=186
    int y = maxLog10ForLeadingZeros[Integer.numberOfLeadingZeros(x)];
```

`Integer.numberOfLeadingZeros(x)` で、2 を底とする対数の整数部分が分かります。それを添字にして、`maxLog10ForLeadingZeros` から `floor(log10(x))` の上の候補 `y` を読み出します。

2 進数の桁数が決まると、10 進の桁数は 2 つのどちらかに絞られます。たとえば 2 進で 7 桁（64 以上 128 未満）の数は、10 進で 2 桁か 3 桁です。

### 2. 上の候補と比べる

```java:line-numbers=191
    return y - lessThanBranchFree(x, powersOf10[y]);
```

`x` が `10^y` より小さければ、答えは 1 小さい `y - 1` です。そうでなければ `y` が答えです。`lessThanBranchFree(x, powersOf10[y])` は、その判定を分岐なしで行い、1 か 0 を返します。結果を `y` から引くだけで、正しい値になります。

## ここがすごい

- **分岐がない**: 「小さいなら 1 を引く」を `if` で書かず、比較の結果を数として引いています。結果が予測しにくい入力でも、CPU の分岐予測の失敗が起きません。
- **候補を 2 つに絞る**: 2 進の桁数から、10 進の桁数は必ず 2 つに絞られるという性質を使っています。残るのは比較 1 回だけです。
- **表は小さい**: `maxLog10ForLeadingZeros` は 33 個の値、`powersOf10` は 10 個の値です。どちらもメモリを少ししか使わず、キャッシュにも収まりやすい大きさです。
- **仕組みをコメントで説明している**: 表の意味と、2 択になる理由が、コードのすぐ近くに書かれています。Hacker's Delight の図番号も示されており、出典をたどれます。

## まとめ

- 先頭の 0 の数から、10 進の桁数の候補は 2 つに絞られる。
- 候補のうち大きい方と比べ、小さければ 1 を引くだけで答えが出る。
- 分岐をなくし、小さな表で、ループなしに底 10 の整数部分を求める。
