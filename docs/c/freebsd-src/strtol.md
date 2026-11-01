---
title: "あふれる前に気づく：割り算で上限を先に求める strtol"
description: "文字列を整数に変える strtol の数字を読む部分。毎回かけ算してからあふれを調べるのではなく、上限を基数で割った cutoff と余り cutlim を先に計算し、かけ算の前に「次の 1 桁であふれるか」を判定している。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-3-Clause
copyright: "Copyright (c) 1990, 1993 The Regents of the University of California.  All rights reserved.; Copyright (c) 2011 The FreeBSD Foundation"
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/stdlib/strtol.c
lines: [95, 150]
function: "strtol_l"
difficulty: 2
format: 2
tags: [パース, エラー処理, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`strtol` は、`"12345"` や `"-0x1F"` のような文字列を `long` 型の整数に変換する C 標準の関数です。
数字を 1 桁読むたびに「今までの値 × 基数 + 新しい桁」と計算しますが、ここで問題になるのが **オーバーフロー**（値が型の上限を超えてあふれること）です。
FreeBSD の実装は、上限を基数で割った値を先に求めておき、**かけ算する前に** あふれるかどうかを判定しています。

## コード

::: code-group

```c:line-numbers=95 [日本語訳]
	acc = any = 0;
	if (base < 2 || base > 36)
		goto noconv;

	/*
	 * 正しい数と正しくない数の境目になる cutoff の値を計算する。
	 * これは正しい値の最大値を基数で
	 * 割ったものである。入力の数がこの値より大きく、さらに
	 * 正しい入力文字が続くなら、大きすぎる。この値と等しい数は
	 * 正しいこともそうでないこともある。正しい数とそうでない数の
	 * 境目は、最後の桁で決まる。
	 * たとえば long の範囲が
	 * [-2147483648..2147483647] で入力の基数が 10 なら、
	 * cutoff は 214748364 になり、cutlim は
	 * 7（neg==0）か 8（neg==1）になる。つまり、たまった値が
	 * 214748364 より大きいか、等しくて次の桁が 7（または 8）より大きければ、
	 * 数は大きすぎるので、範囲エラーを返す。
	 *
	 * 数字を 1 つでも読んだら 'any' を立てる。あふれたことを示すには
	 * 負にする。
	 */
	cutoff = neg ? (unsigned long)-(LONG_MIN + LONG_MAX) + LONG_MAX
	    : LONG_MAX;
	cutlim = cutoff % base;
	cutoff /= base;
	for ( ; ; c = *s++) {
		if (c >= '0' && c <= '9')
			c -= '0';
		else if (c >= 'A' && c <= 'Z')
			c -= 'A' - 10;
		else if (c >= 'a' && c <= 'z')
			c -= 'a' - 10;
		else
			break;
		if (c >= base)
			break;
		if (any < 0 || acc > cutoff || (acc == cutoff && c > cutlim))
			any = -1;
		else {
			any = 1;
			acc *= base;
			acc += c;
		}
	}
	if (any < 0) {
		acc = neg ? LONG_MIN : LONG_MAX;
		errno = ERANGE;
	} else if (!any) {
noconv:
		errno = EINVAL;
	} else if (neg)
		acc = -acc;
	if (endptr != NULL)
		*endptr = (char *)(any ? s - 1 : nptr);
	return (acc);
}
```

```c:line-numbers=95 [原文]
	acc = any = 0;
	if (base < 2 || base > 36)
		goto noconv;

	/*
	 * Compute the cutoff value between legal numbers and illegal
	 * numbers.  That is the largest legal value, divided by the
	 * base.  An input number that is greater than this value, if
	 * followed by a legal input character, is too big.  One that
	 * is equal to this value may be valid or not; the limit
	 * between valid and invalid numbers is then based on the last
	 * digit.  For instance, if the range for longs is
	 * [-2147483648..2147483647] and the input base is 10,
	 * cutoff will be set to 214748364 and cutlim to either
	 * 7 (neg==0) or 8 (neg==1), meaning that if we have accumulated
	 * a value > 214748364, or equal but the next digit is > 7 (or 8),
	 * the number is too big, and we will return a range error.
	 *
	 * Set 'any' if any `digits' consumed; make it negative to indicate
	 * overflow.
	 */
	cutoff = neg ? (unsigned long)-(LONG_MIN + LONG_MAX) + LONG_MAX
	    : LONG_MAX;
	cutlim = cutoff % base;
	cutoff /= base;
	for ( ; ; c = *s++) {
		if (c >= '0' && c <= '9')
			c -= '0';
		else if (c >= 'A' && c <= 'Z')
			c -= 'A' - 10;
		else if (c >= 'a' && c <= 'z')
			c -= 'a' - 10;
		else
			break;
		if (c >= base)
			break;
		if (any < 0 || acc > cutoff || (acc == cutoff && c > cutlim))
			any = -1;
		else {
			any = 1;
			acc *= base;
			acc += c;
		}
	}
	if (any < 0) {
		acc = neg ? LONG_MIN : LONG_MAX;
		errno = ERANGE;
	} else if (!any) {
noconv:
		errno = EINVAL;
	} else if (neg)
		acc = -acc;
	if (endptr != NULL)
		*endptr = (char *)(any ? s - 1 : nptr);
	return (acc);
}
```

:::

## 前提知識

- **`long` と `unsigned long`**: どちらも整数型です。`long` は負の数も持てますが、`unsigned long` は 0 以上だけを扱います。64 ビット環境では `long` の範囲はおよそ ±922 京です。`LONG_MAX` は最大値、`LONG_MIN` は最小値を表す定数です。
- **基数（base）**: 何進数で読むかです。10 なら 10 進数、16 なら 16 進数です。この関数は 2〜36 進数まで扱えます（36 は数字 10 個と英字 26 個）。
- **`char` の引き算**: C の文字は内部では数値です。`'7' - '0'` は 7 になり、`'c' - ('a' - 10)` は 12 になります。
- **ポインタと `*s++`**: `s` は文字列中の現在位置を指すポインタです。`c = *s++` は「今の文字を `c` に読み、`s` を 1 つ進める」という意味です。
- **`errno`**: 失敗の理由を入れておく共通の変数です。`ERANGE` は「範囲外」、`EINVAL` は「不正な入力」を表します。
- **`goto noconv`**: 後半にある目印 `noconv:` へ飛ぶ命令です。
- **`endptr`**: 呼び出し側に「どこまで読んだか」を返すためのポインタのポインタです。`*endptr = ...` で呼び出し側の変数を書き換えます。

## 何をしているか

この抜粋の前では、空白を飛ばし、`-` や `+` の符号、`0x` や `0b` の前置きを読み取って、基数 `base` と最初の文字 `c` を決めています。

### 1. 基数を確かめる

```c:line-numbers=95
	acc = any = 0;
	if (base < 2 || base > 36)
		goto noconv;
```
`acc`（今までの値）と `any`（1 桁でも読めたか）を 0 にします。基数が 2〜36 の範囲外なら、変換せずに `noconv` へ飛びます。

### 2. 上限を先に割っておく

```c:line-numbers=116
	cutoff = neg ? (unsigned long)-(LONG_MIN + LONG_MAX) + LONG_MAX
	    : LONG_MAX;
	cutlim = cutoff % base;
	cutoff /= base;
```
正の数の上限は `LONG_MAX`、負の数は `LONG_MIN` の絶対値です。負のほうは `-(LONG_MIN + LONG_MAX) + LONG_MAX` という回りくどい式で求めています。
`LONG_MIN` の絶対値は `LONG_MAX` より 1 大きく、そのまま `-LONG_MIN` と書くと `long` の範囲を超えてしまうためです。`LONG_MIN + LONG_MAX`（= -1）なら安全に計算でき、それを符号なしにしてから足し合わせています。
次に `cutlim = cutoff % base` と `cutoff /= base` で、上限を基数で割った商と余りを求めます。
コメントの例（32 ビットの `long` で 10 進数）では、正の数なら `cutoff = 214748364`、`cutlim = 7` です。

### 3. 1 桁ずつ読む

```c:line-numbers=120
	for ( ; ; c = *s++) {
		if (c >= '0' && c <= '9')
			c -= '0';
		else if (c >= 'A' && c <= 'Z')
			c -= 'A' - 10;
		else if (c >= 'a' && c <= 'z')
			c -= 'a' - 10;
		else
			break;
		if (c >= base)
			break;
		if (any < 0 || acc > cutoff || (acc == cutoff && c > cutlim))
			any = -1;
		else {
			any = 1;
			acc *= base;
			acc += c;
		}
	}
```
文字を 0〜35 の値に直し、基数以上の値や数字でない文字が来たら終わります。
`if (any < 0 || acc > cutoff || (acc == cutoff && c > cutlim))` が核心です。`acc > cutoff` なら、`acc * base` の時点で上限を超えます。`acc == cutoff` のときは、次の桁 `c` が `cutlim` を超えると上限を超えます。
どちらかなら `any = -1` にして、以後は計算をやめます（ただし数字は最後まで読み進めます）。

### 4. 結果をまとめる

```c:line-numbers=139
	if (any < 0) {
		acc = neg ? LONG_MIN : LONG_MAX;
		errno = ERANGE;
	} else if (!any) {
noconv:
		errno = EINVAL;
	} else if (neg)
		acc = -acc;
	if (endptr != NULL)
		*endptr = (char *)(any ? s - 1 : nptr);
	return (acc);
```
あふれていたら上限か下限の値を返して `errno = ERANGE`。1 桁も読めなければ `EINVAL`。負の数なら符号を反転します。
`endptr` には、読み終えた位置（数字がなければ文字列の先頭）を書き込みます。

## ここがすごい

- **あふれてから気づくのでは遅い**: C では符号付き整数のオーバーフローは「未定義動作」で、何が起きても文句が言えません。かけ算したあとに「値が負になったか」で調べる書き方は正しくありません。この実装は、比較だけであふれを予測するので、一度もあふれる計算をしません。
- **割り算はループの外で 1 回だけ**: 判定に使う `cutoff` と `cutlim` はループの前に 1 回計算するだけです。ループの中は比較 2 つで済みます。
- **正と負の非対称を正しく扱う**: 2 の補数（ほとんどの CPU が使う負の数の表し方）では、負の側が 1 つ多く表せます。`cutlim` が正では 7、負では 8 になるのはそのためです。`-2147483648` は正しく読めるのに `2147483648` はあふれる、という境界を正確に処理しています。
- **あふれても読み進める**: `any = -1` にしたあとも数字の終わりまで進むので、`endptr` は「数字の並びの終わり」を正しく指します。呼び出し側は、どこまでが数だったかを常に知ることができます。

## まとめ

- オーバーフローは「起きてから調べる」のではなく「起きる前に比較で予測する」。
- 上限を基数で割った商と余りを先に求めると、ループ内は比較だけで判定できる。
- 2 の補数では負の側が 1 つ広い。`-LONG_MIN` を直接書かない工夫が要る。
- 読んだ位置と失敗の理由を `endptr` と `errno` で返すと、呼び出し側が正しく扱える。
