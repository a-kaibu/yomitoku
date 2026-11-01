---
title: "XOR 2 回で足し算のあふれを見抜く addExact"
description: "足し算の結果が int に収まらなかったら例外を出す Math.addExact。符号のビットだけを見る XOR と AND の組み合わせで、あふれを 1 回の比較で判定する。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Math.java
lines: [910, 918]
function: "Math.addExact(int, int)"
difficulty: 2
format: 2
tags: [ビット演算, エラー処理, 防御的プログラミング]
---

## ひとことで

Java の `int` の足し算は、結果が範囲（約 ±21 億）を超えても **エラーにならず、黙って負の数などに回り込みます**。`Math.addExact(x, y)` は、そのような「オーバーフロー」が起きたら例外を投げ、起きなければふつうに和を返します。

判定はたった 1 行、`((x ^ r) & (y ^ r)) < 0` です。

## コード

::: code-group

```java:line-numbers=910 [日本語訳]
    @IntrinsicCandidate
    public static int addExact(int x, int y) {
        int r = x + y;
        // HD 2-12: 両方の引数の符号が結果の符号と逆のとき、かつそのときに限りオーバーフロー
        if (((x ^ r) & (y ^ r)) < 0) {
            throw new ArithmeticException("integer overflow");
        }
        return r;
    }
```

```java:line-numbers=910 [原文]
    @IntrinsicCandidate
    public static int addExact(int x, int y) {
        int r = x + y;
        // HD 2-12 Overflow iff both arguments have the opposite sign of the result
        if (((x ^ r) & (y ^ r)) < 0) {
            throw new ArithmeticException("integer overflow");
        }
        return r;
    }
```

:::

## 前提知識

- **オーバーフロー**: `int` は 32 ビットなので、`2147483647 + 1` は `-2147483648` になります。Java はこれを例外にしません。
- **2 の補数と符号ビット**: `int` の最上位ビット（31 ビット目）は符号を表し、`1` なら負、`0` なら 0 以上です。値を `< 0` と比べることは「最上位ビットが 1 か」を調べることと同じです。
- **`^`（XOR）**: 桁ごとに「違えば 1、同じなら 0」です。`x ^ r` の最上位ビットは「`x` と `r` の符号が違うか」を表します。
- **`&`（AND）**: 両方 1 の桁だけ 1 になります。
- **`throw new ArithmeticException(...)`**: 例外（エラーの知らせ）を投げます。呼び出し側はこれを捕まえて対処できます。
- **`@IntrinsicCandidate`**: JVM が CPU の機能（足し算後のオーバーフローフラグなど）を使った命令に置き換えてよい、という印です。

## 何をしているか

### あふれが起きる条件

足し算であふれるのは、**同じ符号どうしを足したのに、結果の符号が逆になったとき** だけです。

- 正 + 正 なのに結果が負 → 上にあふれた
- 負 + 負 なのに結果が正 → 下にあふれた
- 正 + 負 は、絶対値が小さくなる方向なので、決してあふれません。

これを言い換えると、「**`x` と `r` の符号が違い、しかも `y` と `r` の符号も違う**」ときにあふれた、となります（コメントの "both arguments have the opposite sign of the result"）。

### 1 行の式に落とす

```java:line-numbers=914
        if (((x ^ r) & (y ^ r)) < 0) {
```
- `x ^ r` の符号ビット: `x` と `r` の符号が違えば 1
- `y ^ r` の符号ビット: `y` と `r` の符号が違えば 1
- 両者の `&` の符号ビット: 両方違えば 1 → 値が負

### 具体例

`x = 2147483647`（最大値）、`y = 1` のとき `r = -2147483648` です。`x` も `y` も正、`r` は負なので、両方の XOR の最上位が 1、AND も最上位が 1 で負になり、例外が投げられます。

`x = 5`、`y = -3` なら `r = 2`。`y ^ r` の符号ビットは 1 ですが、`x ^ r` は 0 なので AND は 0 以上で、例外にはなりません。

## ここがすごい

- **比較 1 回で判定**: 素直に書くと「`x > 0 && y > 0 && r < 0` または `x < 0 && y < 0 && r >= 0`」と比較がたくさん必要です。XOR で「符号が違うか」をビットに変え、AND でまとめることで、最後の比較 1 回にできます。
- **計算してから調べる**: 先に足してしまい、結果を見てあふれを判定します。事前に `x > MAX - y` のように調べる方法もありますが、符号ごとに場合分けが必要です。回り込みが「決まった動き」である Java だからこそ使える方法です。
- **出典が明記されている**: コメントの `HD 2-12` は『Hacker's Delight』の 2-12 節です。こうしたビット演算の判定は、根拠を示しておくと後から読む人が検証できます。
- **ふだんの Java の安全網**: 金額や個数の計算で、黙って負の数になるのは深刻なバグです。`addExact` を使えば、あふれた瞬間に気づけます。

## まとめ

- 足し算のあふれは「同じ符号を足して、結果の符号が変わったとき」だけ起きる。
- `(x ^ r) & (y ^ r)` の符号ビットで、その条件を 1 回の比較にまとめられる。
- Java の `int` は黙って回り込むので、あふれが許されない計算では `Math.addExact` などを使う。
