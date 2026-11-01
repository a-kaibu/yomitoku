---
title: "31 ビットに収めたまま掛け算と剰余をこなす Park–Miller 乱数"
description: "FreeBSD の旧 rand() 互換実装 do_rand。x = 16807 × x mod (2^31 − 1) という乱数式を、途中の値が 31 ビットを超えないよう Schrage の方法で分解して計算している。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-3-Clause
copyright: "Copyright (c) 1990, 1993 The Regents of the University of California.  All rights reserved."
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/stdlib/rand.c
lines: [89, 116]
function: "do_rand"
difficulty: 2
format: 2
tags: [乱数, 数値計算, 標準ライブラリ, ハック]
---

## ひとことで

`do_rand` は、FreeBSD 12 以前の `rand()` と、現在の `rand_r()` が使っている乱数生成の関数です。
前の値 `x` から次の値を `16807 × x mod (2^31 − 1)` という式で作ります（mod は割り算の余り）。
問題は、`16807 × x` が 31 ビットに収まらないことです。この関数は、式を巧みに分解して **途中の値を一度も大きくせずに** 同じ答えを求めています。

## コード

::: code-group

```c:line-numbers=89 [日本語訳]
/*
 * FreeBSD 12 以前と互換の rand(3) の実装。
 */
static int
do_rand(unsigned long *ctx)
{
/*
 * x = (7^5 * x) mod (2^31 - 1) を
 * 31 ビットをあふれさせずに計算する:
 *      (2^31 - 1) = 127773 * (7^5) + 2836
 * 出典: "Random number generators: good ones are hard to find",
 * Park and Miller, Communications of the ACM, vol. 31, no. 10,
 * October 1988, p. 1195.
 */
	long hi, lo, x;

	/* [1, 0x7ffffffe] の範囲に変換する。 */
	x = (*ctx % 0x7ffffffe) + 1;
	hi = x / 127773;
	lo = x % 127773;
	x = 16807 * lo - 2836 * hi;
	if (x < 0)
		x += 0x7fffffff;
	/* [0, 0x7ffffffd] の範囲に変換する。 */
	x--;
	*ctx = x;
	return (x);
}
```

```c:line-numbers=89 [原文]
/*
 * FreeBSD 12 and prior compatibility implementation of rand(3).
 */
static int
do_rand(unsigned long *ctx)
{
/*
 * Compute x = (7^5 * x) mod (2^31 - 1)
 * without overflowing 31 bits:
 *      (2^31 - 1) = 127773 * (7^5) + 2836
 * From "Random number generators: good ones are hard to find",
 * Park and Miller, Communications of the ACM, vol. 31, no. 10,
 * October 1988, p. 1195.
 */
	long hi, lo, x;

	/* Transform to [1, 0x7ffffffe] range. */
	x = (*ctx % 0x7ffffffe) + 1;
	hi = x / 127773;
	lo = x % 127773;
	x = 16807 * lo - 2836 * hi;
	if (x < 0)
		x += 0x7fffffff;
	/* Transform to [0, 0x7ffffffd] range. */
	x--;
	*ctx = x;
	return (x);
}
```

:::

## 前提知識

- **疑似乱数**: 決まった計算式で「ランダムに見える」数の列を作るものです。同じ初期値（シード）からは同じ列が出ます。
- **線形合同法（の一種）**: 前の値に定数を掛けて、ある数で割った余りを次の値にする方式です。ここでは掛ける数が 16807（7 の 5 乗）、割る数が 2^31 − 1 = 2147483647 です。この組み合わせは、コード中のコメントにある Park と Miller の 1988 年の論文で「最小標準」として提案されたものです。
- **`long`**: 符号付きの整数型です。この関数は `long` が 32 ビットしかない環境も考えて書かれています。
- **`/` と `%`**: 整数どうしの `/` は切り捨ての割り算、`%` は余りです。`17 / 5` は 3、`17 % 5` は 2 です。
- **ポインタ引数 `unsigned long *ctx`**: 乱数の状態（前回の値）が置かれている場所を受け取ります。`*ctx` でその値を読み書きし、次回の呼び出しに状態を引き継ぎます。
- **`0x7fffffff`**: 16 進数で書いた 2147483647（= 2^31 − 1）です。

## 何をしているか

### 1. 状態を 1〜0x7ffffffe に収める

```c:line-numbers=106
	x = (*ctx % 0x7ffffffe) + 1;
```
`x = (*ctx % 0x7ffffffe) + 1;` で、どんな状態でも 1 以上 2^31 − 2 以下にします。
この方式は 0 から始めると永遠に 0 しか出ないので、0 を避けるために +1 しています。

### 2. Schrage の方法で掛け算を分解する

```c:line-numbers=107
	hi = x / 127773;
	lo = x % 127773;
	x = 16807 * lo - 2836 * hi;
	if (x < 0)
		x += 0x7fffffff;
```
ポイントはコメントにある `(2^31 - 1) = 127773 * (7^5) + 2836` です。つまり m = 2147483647 を a = 16807 で割ると、商 q = 127773、余り r = 2836 です。
`x` を q で割った商 `hi` と余り `lo` に分けると、`a × x mod m` は `a × lo − r × hi` に（必要なら m を足して）等しくなります。
`16807 × lo` は最大でも 16807 × 127772 で約 21 億、`2836 × hi` も同じくらいの大きさなので、どちらも 31 ビットに収まります。
引き算が負になったら m を足して正の範囲に戻します。

### 3. 具体例

`x = 200000` とします。`hi = 200000 / 127773 = 1`、`lo = 200000 % 127773 = 72227`。
`16807 × 72227 − 2836 × 1 = 1213919189 − 2836 = 1213916353`。
直接計算すると `16807 × 200000 = 3361400000`、これを 2147483647 で割った余りは `1213916353` で、一致します。

### 4. 範囲を戻して返す

```c:line-numbers=113
	x--;
	*ctx = x;
	return (x);
```
結果は 1〜2^31 − 2 なので、1 を引いて 0 始まりにし、状態として保存してから返します。

## ここがすごい

- **64 ビット整数がなくても正しく計算できる**: 素直に書くなら `(16807 * x) % 2147483647` ですが、`16807 × x` は最大で約 3.6 × 10^13 になり、32 ビットの `long` ではあふれます。64 ビットの型を使えば済みますが、昔の C にはそれが保証されていませんでした。Schrage の分解は、割り算と引き算を 1 回ずつ増やすだけで、どの環境でも正しい答えを出します。
- **分解の条件**: この方法が使えるのは、余り r が商 q より小さいとき（2836 < 127773）です。そのおかげで `r × hi` が m を超えないことが保証されます。数字を選んだ時点で、計算があふれないことが決まっているのです。
- **品質の限界も正直に書いてある**: 同じファイルの `rand_r` の上のコメントは `rand_r` について「状態が小さすぎて直せない」と書いています。状態が `unsigned` 1 個しかないので、より良い方式に変えられないのです。一方 `rand()` 本体は、ファイル冒頭のコメントにあるとおり今は `random(3)` の大きな状態を使う方式に切り替えられています。古い互換用の関数として、この `do_rand` が残されています。

## まとめ

- `a × x mod m` は、m = a × q + r と分解すると途中の値を大きくせずに計算できる（Schrage の方法）。
- 乗算型の乱数は 0 を避ける必要があるので、範囲を 1 始まりに直してから計算する。
- 数学的な性質（r < q）を使うと、「この計算はあふれない」と保証できる。
- 互換性のために古い関数を残しつつ、新しい API はより良い実装に置き換える、という保守のしかたもわかる。
