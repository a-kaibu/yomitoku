---
title: "小さい数なら割り算を省く、long の掛け算あふれ検査"
description: "long 同士の掛け算があふれたら例外を投げる関数。両方が 2^31 未満なら絶対にあふれないことを使い、ほとんどの場合に重い割り算をスキップする。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Math.java
lines: [1025, 1040]
function: "Math.multiplyExact(long, long)"
difficulty: 3
tags: [数値計算, 最適化, エラー処理]
---

## ひとことで

`Math.multiplyExact(x, y)` は、`long`（64 ビット整数）同士を掛け、結果が `long` に収まらない（オーバーフローした）ときは例外を投げるメソッドです。

掛け算のあふれは足し算より判定が難しく、確実な方法は「割り算で元に戻るか確かめる」ことです。でも割り算は遅い演算です。この実装は **「どちらも小さい数ならあふれるはずがない」** と先に判定して、ほとんどの場合に割り算を省いています。

## コード

```java:line-numbers=1025
    @IntrinsicCandidate
    public static long multiplyExact(long x, long y) {
        long r = x * y;
        long ax = Math.abs(x);
        long ay = Math.abs(y);
        if (((ax | ay) >>> 31 != 0)) {
            // Some bits greater than 2^31 that might cause overflow
            // Check the result using the divide operator
            // and check for the special case of Long.MIN_VALUE * -1
           if (((y != 0) && (r / y != x)) ||
               (x == Long.MIN_VALUE && y == -1)) {
                throw new ArithmeticException("long overflow");
            }
        }
        return r;
    }
```

## 前提知識

- **`long`**: 64 ビットの符号付き整数です。範囲は約 ±9.2×10^18 です。あふれてもエラーにならず、回り込みます。
- **`Math.abs(x)`**: 絶対値です。ただし `Long.MIN_VALUE`（最小値）だけは、正の値が表せないので `MIN_VALUE` のまま（負）を返します。
- **`|`（OR）と `>>>`**: `(ax | ay) >>> 31` は「`ax` と `ay` のどちらかに、31 ビット目以上の 1 があるか」を調べます。0 なら両方とも 2^31 未満です。
- **`&&` と `||`**: 「かつ」「または」です。左から評価し、結果が決まった時点で残りは評価しません（短絡評価）。`y != 0 && r / y != x` は、`y` が 0 なら割り算をしません。
- **例外 `ArithmeticException`**: 計算上の異常を知らせる例外です。

## 何をしているか

### 1. とりあえず掛ける（1027 行目）

まず `r = x * y` を計算します。あふれていれば、回り込んだ間違った値が入っています。

### 2. 小さい数ならすぐ合格（1028〜1030 行目）

`ax` と `ay` がどちらも 2^31 未満なら、積は 2^62 未満で、`long` の上限（2^63 − 1）に必ず収まります。`(ax | ay) >>> 31 != 0` が偽なら、そのまま `r` を返します。

2 つの値の上位ビットを OR でまとめて **1 回のシフトと比較で両方を同時に検査** しているのがポイントです。`ax >>> 31 != 0 || ay >>> 31 != 0` と書くより比較が 1 つ少なくなります。

### 3. 大きいときは割り算で確かめる（1034〜1037 行目）

どちらかが大きいときだけ、`r / y` が `x` に戻るかを確かめます。あふれていなければ `r / y == x` です。戻らなければあふれています。

### 4. ただ 1 つの落とし穴

`x = Long.MIN_VALUE`、`y = -1` のとき、正しい答え 2^63 は `long` に収まりません。ところが回り込んだ `r` は `MIN_VALUE` で、`r / y` も同じくあふれて `MIN_VALUE` になり、`x` と一致してしまいます。割り算の検査をすり抜けるこの組み合わせだけを、1035 行目で個別にはじいています。

なお `Math.abs(Long.MIN_VALUE)` は負のままですが、`>>> 31` で上位ビットが残るので、2 の検査では「大きい側」に正しく振り分けられます。

## ここがすごい

- **よくある場合を速く**: 実際のプログラムで掛ける数の多くは小さい値です。その場合はシフトと比較だけで終わり、遅い割り算を通りません。「めったに起きない場合だけ重い処理をする」という最適化の基本形です。
- **割り算による検査の弱点を把握している**: 「割って戻るか」は一般には正しい検査ですが、`MIN_VALUE * -1` だけは例外です。その 1 ケースをコメントで説明し、明示的に処理しています。
- **`y != 0` で 0 除算を防ぐ**: `y = 0` なら積は 0 で、あふれません。短絡評価の `&&` で割り算そのものを避けています。
- **JIT による置き換え**: `@IntrinsicCandidate` がついているので、対応 CPU では掛け算命令とオーバーフローフラグを使う、より速いコードに置き換わります。

## まとめ

- 両方の数が 2^31 未満なら、64 ビットの積は決してあふれない。
- `(a | b) >>> k` で、2 つの値の上位ビットを同時に検査できる。
- 「割って戻るか」の検査には、`MIN_VALUE × -1` という唯一の抜け道がある。
