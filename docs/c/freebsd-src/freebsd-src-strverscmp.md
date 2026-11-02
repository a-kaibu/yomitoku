---
title: "「file9」より「file10」を後ろに並べる、数字を数として比べる文字列比較"
description: "GNU 由来の strverscmp を FreeBSD が独自に実装したもの。文字列の中の数字の並びを見つけたら、桁数を先に比べてから 1 桁ずつ比べ、先頭の 0 は小数点の後ろのように扱うことで、人間が期待する順に並べる。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-2-Clause
copyright: "Copyright (c) 2022 Aymeric Wibo <obiwac@gmail.com>"
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/string/strverscmp.c
lines: [18, 91]
function: "strverscmp"
difficulty: 2
format: 2
tags: [文字列処理, ソート, 標準ライブラリ, アルゴリズム]
---

## ひとことで

`strverscmp` は、2 つの文字列を「バージョン番号として自然な順」で比べる関数です。
ふつうの `strcmp` は 1 文字ずつ文字コードで比べるので、`"file10"` が `"file9"` より前になってしまいます（`'1'` < `'9'` だから）。
`strverscmp` は数字の並びを **数として** 比べるので、`file9` → `file10` の順になります。`ls -v` のような「バージョン順の並べ替え」に使われます。

## コード

::: code-group

```c:line-numbers=18 [日本語訳]
	/*
	 * ポインタが同じなら、わざわざ比較の処理を
	 * 通す必要はない。
	 */
	if (s1 == s2)
		return (0);

	while (*u1 != '\0' && *u2 != '\0') {
		/* どちらかの文字が数字でなければ、strcmp(3) のようにふるまう。 */

		if (!isdigit(*u1) || !isdigit(*u2)) {
			if (*u1 != *u2)
				return (*u1 - *u2);
			u1++;
			u2++;
			continue;
		}
		if (*u1 == '0' || *u2 == '0') {
			/*
			 * 先頭の 0 を、数の小数部分のように扱う。つまり、
			 * 前に小数点があるかのように扱う。まず
			 * 先頭の 0 を数える（0 が多いほど
			 * 小さい数）。
			 */
			zeros_count_1 = 0;
			zeros_count_2 = 0;
			for (; *u1 == '0'; u1++)
				zeros_count_1++;
			for (; *u2 == '0'; u2++)
				zeros_count_2++;
			if (zeros_count_1 != zeros_count_2)
				return (zeros_count_2 - zeros_count_1);

			/* 0 < 09 となる場合を処理する。 */
			if (!isdigit(*u1) && isdigit(*u2))
				return (1);
			if (!isdigit(*u2) && isdigit(*u1))
				return (-1);
		} else {
			/*
			 * 先頭に 0 がない。単に 2 つの数を比べる。
			 * 1 桁ずつ比べに戻る前に、まず何桁あるかを
			 * 数える必要がある。そうしないと、たとえば
			 * 7 が 60 より大きいとみなされてしまう。
			 */
			num_1 = u1;
			num_2 = u2;

			/* 桁数を数える（桁が多いほど大きい数）。 */
			for (; isdigit(*u1); u1++)
				;
			for (; isdigit(*u2); u2++)
				;
			digit_count_1 = u1 - num_1;
			digit_count_2 = u2 - num_2;
			if (digit_count_1 != digit_count_2)
				return (digit_count_1 - digit_count_2);

			/*
			 * 桁数が同じなら、数の先頭に
			 * 戻る。
			 */
			u1 = num_1;
			u2 = num_2;
		}

		/* 残りがなくなるまで 1 桁ずつ比べる。 */
		for (; isdigit(*u1) && isdigit(*u2); u1++, u2++) {
			if (*u1 != *u2)
				return (*u1 - *u2);
		}
	}
	return (*u1 - *u2);
}
```

```c:line-numbers=18 [原文]
	/*
	 * If pointers are the same, no need to go through to process of
	 * comparing them.
	 */
	if (s1 == s2)
		return (0);

	while (*u1 != '\0' && *u2 != '\0') {
		/* If either character is not a digit, act like strcmp(3). */

		if (!isdigit(*u1) || !isdigit(*u2)) {
			if (*u1 != *u2)
				return (*u1 - *u2);
			u1++;
			u2++;
			continue;
		}
		if (*u1 == '0' || *u2 == '0') {
			/*
			 * Treat leading zeros as if they were the fractional
			 * part of a number, i.e. as if they had a decimal point
			 * in front. First, count the leading zeros (more zeros
			 * == smaller number).
			 */
			zeros_count_1 = 0;
			zeros_count_2 = 0;
			for (; *u1 == '0'; u1++)
				zeros_count_1++;
			for (; *u2 == '0'; u2++)
				zeros_count_2++;
			if (zeros_count_1 != zeros_count_2)
				return (zeros_count_2 - zeros_count_1);

			/* Handle the case where 0 < 09. */
			if (!isdigit(*u1) && isdigit(*u2))
				return (1);
			if (!isdigit(*u2) && isdigit(*u1))
				return (-1);
		} else {
			/*
			 * No leading zeros; we're simply comparing two numbers.
			 * It is necessary to first count how many digits there
			 * are before going back to compare each digit, so that
			 * e.g. 7 is not considered larger than 60.
			 */
			num_1 = u1;
			num_2 = u2;

			/* Count digits (more digits == larger number). */
			for (; isdigit(*u1); u1++)
				;
			for (; isdigit(*u2); u2++)
				;
			digit_count_1 = u1 - num_1;
			digit_count_2 = u2 - num_2;
			if (digit_count_1 != digit_count_2)
				return (digit_count_1 - digit_count_2);

			/*
			 * If there are the same number of digits, go back to
			 * the start of the number.
			 */
			u1 = num_1;
			u2 = num_2;
		}

		/* Compare each digit until there are none left. */
		for (; isdigit(*u1) && isdigit(*u2); u1++, u2++) {
			if (*u1 != *u2)
				return (*u1 - *u2);
		}
	}
	return (*u1 - *u2);
}
```

:::

## 前提知識

- **C の文字列**: `char` の並びの最後に 0 のバイト（`'\0'`）が置かれたものです。
- **比較関数の戻り値**: 負なら 1 つ目が前、0 なら等しい、正なら 1 つ目が後、という決まりです。`*u1 - *u2` のように文字コードの差をそのまま返すことが多いです。
- **`unsigned char *`**: 文字を 0〜255 の値として読むためのポインタです。`char` が負の値になる環境でも、`isdigit` に正しく渡せます。`__DECONST` は、ポインタの型を変換するための FreeBSD のマクロです。
- **`isdigit(c)`**: `c` が `'0'`〜`'9'` なら真を返す関数です。
- **ポインタの引き算**: `u1 - num_1` は、2 つの位置の間の文字数です。数字が何桁あるかを数えるのに使います。
- **`size_t`**: 個数を表す符号なしの整数型です。

## 何をしているか

### 1. 同じ文字列ならすぐ 0

```c:line-numbers=18
	/*
	 * If pointers are the same, no need to go through to process of
	 * comparing them.
	 */
	if (s1 == s2)
		return (0);
```
2 つのポインタが同じ場所を指していれば、中身を見るまでもなく等しいので 0 を返します。

### 2. 数字でないところは strcmp と同じ

```c:line-numbers=28
		if (!isdigit(*u1) || !isdigit(*u2)) {
			if (*u1 != *u2)
				return (*u1 - *u2);
			u1++;
			u2++;
			continue;
		}
```
どちらかが数字でなければ、文字コードを比べます。違えば差を返し、同じなら次の文字へ進みます。

### 3. 先頭に 0 がある数

```c:line-numbers=35
		if (*u1 == '0' || *u2 == '0') {
			/*
			 * Treat leading zeros as if they were the fractional
			 * part of a number, i.e. as if they had a decimal point
			 * in front. First, count the leading zeros (more zeros
			 * == smaller number).
			 */
			zeros_count_1 = 0;
			zeros_count_2 = 0;
			for (; *u1 == '0'; u1++)
				zeros_count_1++;
			for (; *u2 == '0'; u2++)
				zeros_count_2++;
			if (zeros_count_1 != zeros_count_2)
				return (zeros_count_2 - zeros_count_1);

			/* Handle the case where 0 < 09. */
			if (!isdigit(*u1) && isdigit(*u2))
				return (1);
			if (!isdigit(*u2) && isdigit(*u1))
				return (-1);
```
`"1.05"` と `"1.5"` のように、数字が `0` で始まる場合、コメントにあるとおり **小数点の後ろの数** のように扱います。
まず先頭の 0 の個数を数え、多いほうを小さいとみなします（0.05 は 0.5 より小さい）。
0 の数が同じなら、続く 2 つの `if` で「片方だけ数字が続く」場合を処理します（`0` < `09`）。そのあと最後の `for` ループで 1 桁ずつ比べます。

### 4. 0 で始まらない数

```c:line-numbers=56
		} else {
			/*
			 * No leading zeros; we're simply comparing two numbers.
			 * It is necessary to first count how many digits there
			 * are before going back to compare each digit, so that
			 * e.g. 7 is not considered larger than 60.
			 */
			num_1 = u1;
			num_2 = u2;

			/* Count digits (more digits == larger number). */
			for (; isdigit(*u1); u1++)
				;
			for (; isdigit(*u2); u2++)
				;
			digit_count_1 = u1 - num_1;
			digit_count_2 = u2 - num_2;
			if (digit_count_1 != digit_count_2)
				return (digit_count_1 - digit_count_2);

			/*
			 * If there are the same number of digits, go back to
			 * the start of the number.
			 */
			u1 = num_1;
			u2 = num_2;
		}
```
ここが核心です。数字が何桁続くかを先に数えます。**桁数が多いほうが大きい数** なので、桁数が違えばその差を返します。
桁数が同じなら、数の先頭に戻り、最後の `for` ループで 1 桁ずつ比べます。同じ桁数なら、文字コードの比較と数の大小が一致するからです。

### 5. 具体例

`"file9"` と `"file10"`:

- `f i l e` は同じなので進みます。
- `9` と `1` はどちらも数字で、0 で始まらないので桁数を数えます。`9` は 1 桁、`10` は 2 桁。
- `1 - 2 = -1` を返すので、`file9` が前になります。

`"v2.10"` と `"v2.9"` も同じように、`10`（2 桁）が `9`（1 桁）より大きいと判定されます。

## ここがすごい

- **数に変換しない**: 数字の並びを `strtol` などで数に変えて比べる方法もありますが、それだと 100 桁の数字はあふれてしまいます。この実装は「桁数を比べ、同じなら 1 桁ずつ比べる」ので、どんなに長い数字でも正しく比べられます。
- **2 回読む代わりに位置を覚える**: 桁数を数えるとき、`num_1` と `num_2` に数の先頭を覚えておき、数え終わったら戻ってきます。追加のメモリは要りません。
- **先頭の 0 の意味づけ**: `007` と `7` をどう並べるかは、仕様として決めないとあいまいです。コメントにあるとおり、先頭の 0 を「小数点の後ろ」とみなす規則を採用することで、`1.01 < 1.1 < 1.2` のようなバージョン番号を自然に並べられます。
- **短いループの組み合わせ**: 全体は 1 つの `while` の中に、役割のはっきりした小さな `for` が並ぶ構造です。それぞれが「0 を数える」「桁を数える」「1 桁ずつ比べる」だけをしているので、読みやすく確かめやすい形です。

## まとめ

- 文字列の中の数は、桁数を先に比べ、同じなら 1 桁ずつ比べれば、数に変換せずに大小がわかる。
- 位置を覚えておいて戻れば、2 回読む処理もメモリなしで書ける。
- 先頭の 0 のような「あいまいな場合」は、規則を決めてコメントに書いておく。
- `strcmp` との違いは数字の部分だけ。それ以外は同じ比較をそのまま使う。
