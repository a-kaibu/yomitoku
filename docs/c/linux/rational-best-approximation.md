---
title: "連分数で「桁数の限られた分数」の最良近似を探す"
description: "与えられた比に最も近い分数を、分子・分母の上限つきで求める関数。ユークリッドの互除法で連分数を展開し、上限を超える直前で「半収束子」と比べて選ぶ。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) 2009 emlix GmbH, Oskar Schirmer <oskar@scara.com>"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/math/rational.c
lines: [35, 107]
function: "rational_best_approximation"
difficulty: 3
format: 2
tags: [アルゴリズム, 数値計算]
---

## ひとことで

`rational_best_approximation` は、ある比（たとえば 3.1415）を、**分子と分母の大きさに上限がある分数**でできるだけ正確に表す関数です。
関数の直前のコメントの例では、分子が 8 ビット（255 まで）、分母が 5 ビット（31 まで）しか入らないハードウェアのレジスタに、周波数の比 3.1415 を設定する場面が挙げられています。
答えは 22/7 になります。連分数（分数の中に分数が入れ子になった表し方）という数学の道具を使い、短いループで最良の候補を見つけます。

## コード

::: code-group

```c:line-numbers=35 [日本語訳]
void rational_best_approximation(
	unsigned long given_numerator, unsigned long given_denominator,
	unsigned long max_numerator, unsigned long max_denominator,
	unsigned long *best_numerator, unsigned long *best_denominator)
{
	/* n/d は出発点の有理数で、反復のたびにユークリッドの
	 * 互除法で小さくなっていく。
	 *
	 * dp は 1 つ前の反復での d の値。
	 *
	 * n2/d2、n1/d1、n0/d0 は、だんだん正確になっていく
	 * 有理数の近似。それぞれ、
	 * 現在、1 つ前、2 つ前の反復のもの。
	 *
	 * a は連分数の現在の項。
	 */
	unsigned long n, d, n0, d0, n1, d1, n2, d2;
	n = given_numerator;
	d = given_denominator;
	n0 = d1 = 0;
	n1 = d0 = 1;

	for (;;) {
		unsigned long dp, a;

		if (d == 0)
			break;
		/* 連分数の次の項 'a' を、
		 * ユークリッドの互除法で求める。
		 */
		dp = d;
		a = n / d;
		d = n % d;
		n = dp;

		/* 今見つけた項と 2 つ前までの近似を使って、
		 * 現在の有理数近似（収束子とも言う）n2/d2 を
		 * 計算する。
		 */
		n2 = n0 + a * n1;
		d2 = d0 + a * d1;

		/* 現在の収束子が上限を超えたら、
		 * 1 つ前の収束子か、
		 * 最大の半収束子（その最後の項は
		 * 下で 't' として求める）を返す。
		 */
		if ((n2 > max_numerator) || (d2 > max_denominator)) {
			unsigned long t = ULONG_MAX;

			if (d1)
				t = (max_denominator - d0) / d1;
			if (n1)
				t = min(t, (max_numerator - n0) / n1);

			/* 半収束子が 1 つ前の収束子より近いかを調べる。
			 * d1 が 0 なら、これは 1 回目の反復なので 1 つ前の収束子はなく、
			 * 常に半収束子を選ぶ。
			 */
			if (!d1 || 2u * t > a || (2u * t == a && d0 * dp > d1 * d)) {
				n1 = n0 + t * n1;
				d1 = d0 + t * d1;
			}
			break;
		}
		n0 = n1;
		n1 = n2;
		d0 = d1;
		d1 = d2;
	}
	*best_numerator = n1;
	*best_denominator = d1;
}
```

```c:line-numbers=35 [原文]
void rational_best_approximation(
	unsigned long given_numerator, unsigned long given_denominator,
	unsigned long max_numerator, unsigned long max_denominator,
	unsigned long *best_numerator, unsigned long *best_denominator)
{
	/* n/d is the starting rational, which is continually
	 * decreased each iteration using the Euclidean algorithm.
	 *
	 * dp is the value of d from the prior iteration.
	 *
	 * n2/d2, n1/d1, and n0/d0 are our successively more accurate
	 * approximations of the rational.  They are, respectively,
	 * the current, previous, and two prior iterations of it.
	 *
	 * a is current term of the continued fraction.
	 */
	unsigned long n, d, n0, d0, n1, d1, n2, d2;
	n = given_numerator;
	d = given_denominator;
	n0 = d1 = 0;
	n1 = d0 = 1;

	for (;;) {
		unsigned long dp, a;

		if (d == 0)
			break;
		/* Find next term in continued fraction, 'a', via
		 * Euclidean algorithm.
		 */
		dp = d;
		a = n / d;
		d = n % d;
		n = dp;

		/* Calculate the current rational approximation (aka
		 * convergent), n2/d2, using the term just found and
		 * the two prior approximations.
		 */
		n2 = n0 + a * n1;
		d2 = d0 + a * d1;

		/* If the current convergent exceeds the maxes, then
		 * return either the previous convergent or the
		 * largest semi-convergent, the final term of which is
		 * found below as 't'.
		 */
		if ((n2 > max_numerator) || (d2 > max_denominator)) {
			unsigned long t = ULONG_MAX;

			if (d1)
				t = (max_denominator - d0) / d1;
			if (n1)
				t = min(t, (max_numerator - n0) / n1);

			/* This tests if the semi-convergent is closer than the previous
			 * convergent.  If d1 is zero there is no previous convergent as this
			 * is the 1st iteration, so always choose the semi-convergent.
			 */
			if (!d1 || 2u * t > a || (2u * t == a && d0 * dp > d1 * d)) {
				n1 = n0 + t * n1;
				d1 = d0 + t * d1;
			}
			break;
		}
		n0 = n1;
		n1 = n2;
		d0 = d1;
		d1 = d2;
	}
	*best_numerator = n1;
	*best_denominator = d1;
}
```

:::

## 前提知識

- **`unsigned long`**: 0 以上の整数の型です。
- **`/` と `%`**: 整数どうしの `/` は切り捨ての割り算、`%` は割った余りです。`31415 / 10000` は `3`、`31415 % 10000` は `1415` です。
- **ポインタ引数 `unsigned long *best_numerator`**: 結果を書き込んでもらう場所を、呼び出し側が渡します。`*best_numerator = n1;` でその場所に答えを書きます。C の関数は値を 1 つしか返せないので、2 つの答えを返すのによく使う方法です。
- **`ULONG_MAX`**: `unsigned long` の最大値です。
- **`min(a, b)`**: 小さいほうを返すカーネルのマクロです。
- **連分数**: 3.1415 を `3 + 1/(7 + 1/(14 + ...))` のように表したものです。途中で打ち切ると 3、22/7、311/99 … と、だんだん正確な分数（収束子）が得られます。

## 何をしているか

### 初期値

```c:line-numbers=52
	n = given_numerator;
	d = given_denominator;
	n0 = d1 = 0;
	n1 = d0 = 1;
```

`n/d` が今の比です。`n0/d0 = 0/1`、`n1/d1 = 1/0` は、収束子を作る漸化式（前の 2 つから次を作る式）を始めるための決まった初期値です。

### 次の項 `a` を求める

```c:line-numbers=65
		dp = d;
		a = n / d;
		d = n % d;
		n = dp;
```

`a = n / d` が連分数の次の項です。続いて `n, d` を `d, n % d` に置き換えます。これはユークリッドの互除法（最大公約数を求める古典的な手順）の 1 ステップそのものです。`dp` には置き換える前の `d` を残しておきます。

### 新しい収束子

```c:line-numbers=74
		n2 = n0 + a * n1;
		d2 = d0 + a * d1;
```

`n2 = n0 + a * n1`、`d2 = d0 + a * d1` が、連分数の性質から決まる次の収束子です。

### 上限を超えたら、半収束子と比べる

```c:line-numbers=82
		if ((n2 > max_numerator) || (d2 > max_denominator)) {
			unsigned long t = ULONG_MAX;

			if (d1)
				t = (max_denominator - d0) / d1;
			if (n1)
				t = min(t, (max_numerator - n0) / n1);

			/* This tests if the semi-convergent is closer than the previous
			 * convergent.  If d1 is zero there is no previous convergent as this
			 * is the 1st iteration, so always choose the semi-convergent.
			 */
			if (!d1 || 2u * t > a || (2u * t == a && d0 * dp > d1 * d)) {
				n1 = n0 + t * n1;
				d1 = d0 + t * d1;
			}
			break;
```

新しい収束子が上限を超えたら、ループを終えます。そのとき、「1 つ前の収束子 `n1/d1`」と、「`a` の代わりにもっと小さい `t` を使った分数」（半収束子）のどちらがよいかを比べます。
`t` は `if (d1)` と `if (n1)` の 2 つの計算で、上限に収まる範囲での最大値として求めます。`if (!d1 || 2u * t > a || (2u * t == a && d0 * dp > d1 * d)) {`は、半収束子が 1 つ前の収束子より近いかを判定します。`2t > a` なら近い、`2t == a` なら境目なので、さらに細かい比較をします。

### 1 段ずらす

```c:line-numbers=100
		n0 = n1;
		n1 = n2;
		d0 = d1;
		d1 = d2;
```

上限に収まっていれば、`n0/d0 ← n1/d1 ← n2/d2` とずらし、次の項へ進みます。

### 具体例: 31415/10000、分子 255 まで、分母 31 まで

- 1 周目: `a = 3`、収束子 `3/1`。
- 2 周目: `a = 7`、収束子 `22/7`。
- 3 周目: `a = 14`、収束子 `311/99`。分母 99 が 31 を超えます。
- `t = (31 - 1) / 7 = 4` と `(255 - 3) / 22 = 11` の小さいほうで `t = 4`。半収束子は `91/29` です。
- `2 * 4 = 8` は `14` より小さいので、半収束子は採用せず、`22/7` を返します。

## ここがすごい

- **全探索しない**: 分母 1〜31 を全部試して一番近いものを探すこともできますが、上限が大きいと時間がかかります。連分数なら、ループは互除法と同じ回数（数の桁数に比例する程度）で終わります。
- **「最良」をきちんと扱う**: 収束子だけを見ると、上限ぎりぎりのもっと良い分数（半収束子）を見逃すことがあります。この関数は最後に半収束子とも比べ、上限内で本当に近いほうを選びます。境目のケースまで判定しているのが丁寧です。
- **整数だけで計算**: カーネルでは浮動小数点を気軽に使えません。比較も `2u * t > a` や掛け算の大小比較など、整数の演算だけで済ませています。
- **0 割りへの備え**: 1 周目は `d1` が 0 なので、`t = (max_denominator - d0) / d1;`の割り算を `if (d1)` で避け、その下のコメントのとおり、その場合は必ず半収束子を選びます。

## まとめ

- 比を少ない桁の分数で近似するには、連分数の収束子を順に作るのが効率的。
- 連分数の項は、ユークリッドの互除法の商として得られる。
- 上限で打ち切るときは、1 つ前の収束子と半収束子を比べると最良の近似になる。
- 結果を 2 つ返したいときは、書き込み先のポインタを引数で受け取る。
