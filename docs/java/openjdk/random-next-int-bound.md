---
title: "偏りのない乱数を作るための「捨てる」ループ"
description: "0 以上 bound 未満の乱数を返す Random.nextInt。単純に余りを取ると偏るので、偏りの原因になる値を捨ててやり直す。2 のべき乗なら上位ビットを使う近道もある。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1995, 2024, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/Random.java
lines: [548, 563]
function: "Random.nextInt(int)"
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`random.nextInt(6)` は、`0` から `5` までの整数を **同じ確率で** 1 つ返します。サイコロを作るときなどに使います。

乱数の素から `r % 6` を計算するだけでよさそうですが、それでは小さい数がわずかに出やすくなります。この実装は **偏りの原因になる値を見つけたら捨てて引き直す** ことで、完全に公平な結果を作っています。

## コード

::: code-group

```java:line-numbers=548 [日本語訳]
    @Override
    public int nextInt(int bound) {
        if (bound <= 0)
            throw new IllegalArgumentException(BAD_BOUND);
        int r = next(31);
        int m = bound - 1;
        if ((bound & m) == 0)  // つまり bound が 2 のべき乗のとき
            r = (int)((bound * (long)r) >> 31);
        else { // 出やすすぎる候補を捨てる
            for (int u = r;
                 u - (r = u % bound) + m < 0;
                 u = next(31))
                ;
        }
        return r;
    }
```

```java:line-numbers=548 [原文]
    @Override
    public int nextInt(int bound) {
        if (bound <= 0)
            throw new IllegalArgumentException(BAD_BOUND);
        int r = next(31);
        int m = bound - 1;
        if ((bound & m) == 0)  // i.e., bound is a power of 2
            r = (int)((bound * (long)r) >> 31);
        else { // reject over-represented candidates
            for (int u = r;
                 u - (r = u % bound) + m < 0;
                 u = next(31))
                ;
        }
        return r;
    }
```

:::

## 前提知識

- **`next(31)`**: `Random` の内部関数で、0 以上 2^31 未満（0〜2147483647）の乱数を返します。`Random` は線形合同法という計算で乱数を作り、その **上位ビット** を返します。
- **`(long)r`**: `int` を `long`（64 ビット）に変換します。掛け算があふれないようにするためです。
- **`>> 31`**: 右に 31 ビットずらす、つまり 2^31 で割ることです。
- **`for (初期化; 条件; 更新) ;`**: 本体が空（`;` だけ）の `for` 文です。条件と更新だけで仕事をしています。
- **オーバーフローして負になる**: `int` の足し算が上限を超えると負の数になります。この性質をわざと使っています。

## 何をしているか

### 1. 2 のべき乗のとき

```java:line-numbers=553
        int m = bound - 1;
        if ((bound & m) == 0)  // つまり bound が 2 のべき乗のとき
```
`bound` が 2 のべき乗かは `(bound & (bound - 1)) == 0` でわかります。`bound = 8` なら、`r * 8 / 2^31` で、31 ビットの乱数の **上位 3 ビット** を取り出すのと同じです。

ここで下位 3 ビット（`r % 8`）を使わないのは、線形合同法の乱数は下位ビットほど周期が短く、規則的になりやすいからです。上位ビットを使えば質のよい乱数になります。

### 2. それ以外のとき

```java:line-numbers=555
            r = (int)((bound * (long)r) >> 31);
        else { // 出やすすぎる候補を捨てる
            for (int u = r;
                 u - (r = u % bound) + m < 0;
                 u = next(31))
                ;
```
`r` は 0〜2147483647 の 2147483648 通りです。これを 6 で割った余りにすると、2147483648 は 6 で割り切れないので、**最後の中途半端なブロック** の分だけ、一部の余りが 1 回多く出ます。

```
0〜5, 6〜11, …, 2147483640〜2147483645 | 2147483646, 2147483647
                                       ↑ 余り 0, 1 にしかならない半端な部分
```

`u - (r = u % bound) + m < 0` は、この半端な部分に入ったかを調べています。

- `u - (u % bound)` は「`u` が属するブロックの先頭」
- `+ m`（`bound - 1`）は「そのブロックの最後」
- ブロックの最後が `int` の上限を超える、つまり **ブロックが途中で切れている** なら、足し算があふれて負になります。

負になったら `u = next(31)` で引き直します。ふつうに収まれば、`r` にはすでに余りが入っているので、それを返します。

### 捨てる確率

`bound = 6` なら、捨てられるのは 2147483648 通りのうち 2 通りだけです。ほとんど 1 回で終わります。最悪の `bound` は 2^30 より少し大きい値で、そのときでも捨てる確率は半分未満なので、平均 2 回以内に終わります。

## ここがすごい

- **完全に公平**: 「ほぼ公平」で妥協せず、偏りの原因を正確に取り除いています。シミュレーションやゲームでは、わずかな偏りでも積み重なると結果が歪みます。
- **あふれを判定に使う**: 「ブロックの最後が上限を超えるか」を比較で書くと長くなりますが、`int` があふれると負になる性質を使い、`< 0` の 1 回で判定しています。
- **乱数の性質に合わせた近道**: 2 のべき乗では割り算を使わず、しかも質のよい上位ビットを使う方法を選んでいます。乱数生成器の弱点（下位ビットの周期が短い）を知った上での設計です。
- **空の `for` 文**: 条件の中で余りを計算し、更新部で引き直す、という書き方で、ループ本体なしにアルゴリズム全体を表現しています。

## まとめ

- 乱数の余りを取るだけでは、範囲が割り切れないとき小さい値が出やすくなる。
- 偏りの原因になる値を捨てて引き直すと、完全に公平な乱数になる（棄却法）。
- 線形合同法の乱数は上位ビットの方が質がよい。
