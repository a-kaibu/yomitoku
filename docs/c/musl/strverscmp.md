---
title: "\"file9 < file10\" を正しく並べるバージョン比較 strverscmp"
description: "文字列の中の数字を「数」として比べる比較関数。共通部分を 1 回だけなめながら、数字の始まり位置と「ゼロばかりか」を覚えておき、桁数で大小を決める。"
language: c
project: musl
repo: https://github.com/ifduyue/musl
license: MIT
copyright: "Copyright © 2005-2020 Rich Felker, et al."
commit: "7813e9119eb5fe681b6750b8a033a0490bca0941"
file: src/string/strverscmp.c
lines: [5, 34]
function: "strverscmp"
difficulty: 2
format: 2
tags: [文字列処理, ソート, アルゴリズム]
---

## ひとことで

`strverscmp(a, b)` は、2 つの文字列を「バージョン番号らしく」比べる関数です。結果は負（`a` が小さい）、0（等しい）、正（`a` が大きい）で返ります。
ふつうの `strcmp` だと `"file10"` は `"file9"` より小さくなります（`'1'` < `'9'` だから）。`strverscmp` は数字の並びを数として扱うので、`"file9" < "file10"` と人間の感覚どおりに並びます。
`ls -v` のような「自然な並べ替え」に使われる関数です。

## コード

::: code-group

```c:line-numbers=5 [日本語訳]
int strverscmp(const char *l0, const char *r0)
{
	const unsigned char *l = (const void *)l0;
	const unsigned char *r = (const void *)r0;
	size_t i, dp, j;
	int z = 1;

	/* 一致する最長の接頭辞を見つけ、その末尾にある最長の数字列と、
	 * その数字がすべてゼロかどうかを記録する。 */
	for (dp=i=0; l[i]==r[i]; i++) {
		int c = l[i];
		if (!c) return 0;
		if (!isdigit(c)) dp=i+1, z=1;
		else if (c!='0') z=0;
	}

	if (l[dp]-'1'<9U && r[dp]-'1'<9U) {
		/* 0 以外の数字で始まる、縮退していない数字列どうしを
		 * 見ているなら、長い数字列のほうが大きい。 */
		for (j=i; isdigit(l[j]); j++)
			if (!isdigit(r[j])) return 1;
		if (isdigit(r[j])) return -1;
	} else if (z && dp<i && (isdigit(l[i]) || isdigit(r[i]))) {
		/* そうでなく、数字列の共通部分が
		 * すべてゼロなら、数字は数字以外より小さいとみなす。 */
		return (unsigned char)(l[i]-'0') - (unsigned char)(r[i]-'0');
	}

	return l[i] - r[i];
}
```

```c:line-numbers=5 [原文]
int strverscmp(const char *l0, const char *r0)
{
	const unsigned char *l = (const void *)l0;
	const unsigned char *r = (const void *)r0;
	size_t i, dp, j;
	int z = 1;

	/* Find maximal matching prefix and track its maximal digit
	 * suffix and whether those digits are all zeros. */
	for (dp=i=0; l[i]==r[i]; i++) {
		int c = l[i];
		if (!c) return 0;
		if (!isdigit(c)) dp=i+1, z=1;
		else if (c!='0') z=0;
	}

	if (l[dp]-'1'<9U && r[dp]-'1'<9U) {
		/* If we're looking at non-degenerate digit sequences starting
		 * with nonzero digits, longest digit string is greater. */
		for (j=i; isdigit(l[j]); j++)
			if (!isdigit(r[j])) return 1;
		if (isdigit(r[j])) return -1;
	} else if (z && dp<i && (isdigit(l[i]) || isdigit(r[i]))) {
		/* Otherwise, if common prefix of digit sequence is
		 * all zeros, digits order less than non-digits. */
		return (unsigned char)(l[i]-'0') - (unsigned char)(r[i]-'0');
	}

	return l[i] - r[i];
}
```

:::

## 前提知識

- **C の文字列**: 文字の並びの最後に値 0 のバイトを置いたものです。`l[i]` は `i` 番目の文字です。
- **`unsigned char` で読む**: 文字を 0〜255 の数として扱うために、`const unsigned char *` に変換しています。文字どうしを引き算して大小を返すときに、負の文字コードで結果がおかしくならないようにするためです。
- **`isdigit(c)`**: `c` が `'0'`〜`'9'` なら真になる関数です。
- **`l[dp]-'1'<9U`**: `9U` は符号なしの 9 です。符号なしで比べると、`'1'` 未満の文字は引き算が一周して巨大な数になるので、この式は「`'1'`〜`'9'` のどれか」を 1 回の比較で判定します。
- **カンマ演算子**: `dp=i+1, z=1` は 2 つの代入を順に行う 1 つの式です。
- **戻り値の符号**: 比較関数は差の符号だけが意味を持ちます。`l[i] - r[i]` は、その文字の大小を表します。

## 何をしているか

### 1. 共通部分をなめる

```c:line-numbers=14
	for (dp=i=0; l[i]==r[i]; i++) {
		int c = l[i];
		if (!c) return 0;
		if (!isdigit(c)) dp=i+1, z=1;
		else if (c!='0') z=0;
	}
```

`l[i]==r[i]` の間、`i` を進めます。そのあいだに 2 つのことを覚えます。

- `dp`: 共通部分の中で、**今の数字の並びが始まった位置**。数字でない文字を見るたびに `i+1` に更新されます。
- `z`: その数字の並びが **すべて `'0'`** なら 1。

両方が同時に終端に来たら、まったく同じ文字列なので 0 を返します。

### 2. 0 以外で始まる数字どうしなら桁数で勝負

```c:line-numbers=21
	if (l[dp]-'1'<9U && r[dp]-'1'<9U) {
		/* If we're looking at non-degenerate digit sequences starting
		 * with nonzero digits, longest digit string is greater. */
		for (j=i; isdigit(l[j]); j++)
			if (!isdigit(r[j])) return 1;
		if (isdigit(r[j])) return -1;
```

`"file9"` と `"file10"` で考えます。共通部分は `"file"` で、`i = 4`、`dp = 4` です。`l[4] = '9'`、`r[4] = '1'` はどちらも `'1'`〜`'9'` なので、桁数を比べます。

`j` を進め、左の数字がまだ続くのに右が終わったら左が大きい（1）。そのあと、左が終わったのに右がまだ続けば右が大きい（-1）です。`"9"` は 1 桁、`"10"` は 2 桁なので、`-1` が返ります。

桁数が同じなら、最後の `l[i] - r[i]` で最初に違う数字を比べれば十分です。

### 3. ゼロで始まる場合

```c:line-numbers=27
	} else if (z && dp<i && (isdigit(l[i]) || isdigit(r[i]))) {
		/* Otherwise, if common prefix of digit sequence is
		 * all zeros, digits order less than non-digits. */
		return (unsigned char)(l[i]-'0') - (unsigned char)(r[i]-'0');
	}
```

共通の数字部分がゼロだけ（`z`）で、違いが数字の中で生じた場合は、「数字のほうが数字以外より小さい」として比べます。`(unsigned char)(c - '0')` は、数字なら 0〜9、それ以外は一周して大きな数になるので、数字が必ず小さくなります。
たとえば `"0"` と `"01"` では、`"01"` のほうが小さいと判定されます。小数点以下のように、ゼロが多いほど小さく並ぶ扱いです。

### 4. それ以外はふつうの比較

```c:line-numbers=33
	return l[i] - r[i];
```

数字の比較にならない場合は、最初に違った文字の差を返します。

## ここがすごい

- **文字列を 1 回なめるだけ**: 素直に書くと、数字の部分を切り出して整数に変換し、比べ直すことになります。それでは桁数の多い数字があふれますし、手間もかかります。この実装は共通部分を走査するついでに必要な情報（`dp` と `z`）を集め、違いが出た地点から少しだけ先を見て結論を出します。
- **数に変換しない**: 「先頭がゼロでない数字どうしなら、桁が多いほうが大きい」という性質を使うので、何百桁の数字でもあふれません。
- **範囲判定のイディオム**: `c - '1' < 9U` や `(unsigned char)(c - '0')` のように、符号なしの「一周」を利用して、範囲チェックや並び順の調整を比較 1 回で行っています。
- **共通部分の途中から始まる数字も正しく扱う**: `"v1.9"` と `"v1.10"` のように、違いが数字の途中で生じても、`dp` がその数字の先頭を覚えているので、正しく桁数を比べられます。

## まとめ

- 自然な並べ替えでは、数字の並びを「桁数 → 各桁」の順に比べればよい。
- 走査しながら「今の数字の始まり」などの状態を覚えておくと、やり直しが要らない。
- 符号なしの比較は、範囲判定を 1 回の比較にまとめる定番の技。
