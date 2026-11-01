---
title: "空のトークンも取りこぼさない、区切り文字で文字列を切る strsep"
description: "BSD 由来の strsep。区切り文字を見つけるたびにその場所を 0 に書き換えて文字列を切り出し、次の開始位置を呼び出し側の変数に書き戻す。終端の 0 も区切りの一つとして扱う二重ループが短くて巧み。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-3-Clause
copyright: "Copyright (c) 1990, 1993 The Regents of the University of California.  All rights reserved."
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/string/strsep.c
lines: [35, 71]
function: "strsep"
difficulty: 1
format: 2
tags: [文字列処理, パース, 標準ライブラリ, イディオム]
---

## ひとことで

`strsep` は、文字列を区切り文字で切り分ける関数です。たとえば `"a,b,,c"` を `","` で切ると、呼ぶたびに `"a"`、`"b"`、`""`（空）、`"c"` が順に返ってきます。
よく似た標準関数 `strtok` と違い、**連続した区切りの間の空のトークン** もきちんと返し、内部に状態を隠し持ちません。
ループの中にループがあるだけの短いコードですが、文字列の終わりの `0` も区切り文字の一つとして扱うことで、場合分けを最小にしています。

## コード

::: code-group

```c:line-numbers=35 [日本語訳]
/*
 * 文字列 *stringp から次のトークンを取り出す。トークンは delim の文字で
 * 区切られた文字列で、空のこともある。
 *
 * トークンを終わらせるために、*stringp の文字列に NUL を書き込む。
 * delim は呼び出しごとに同じでなくてよい。
 * 戻るとき、*stringp は最後に書いた NUL の次を指す（まだトークンが
 * あるかもしれない場合）か、NULL になる（もうトークンが確実にない場合）。
 *
 * *stringp が NULL なら、strsep は NULL を返す。
 */
char *
strsep(char **stringp, const char *delim)
{
	char *s;
	const char *spanp;
	int c, sc;
	char *tok;

	if ((s = *stringp) == NULL)
		return (NULL);
	for (tok = s;;) {
		c = *s++;
		spanp = delim;
		do {
			if ((sc = *spanp++) == c) {
				if (c == 0)
					s = NULL;
				else
					s[-1] = 0;
				*stringp = s;
				return (tok);
			}
		} while (sc != 0);
	}
	/* ここには到達しない */
}
```

```c:line-numbers=35 [原文]
/*
 * Get next token from string *stringp, where tokens are possibly-empty
 * strings separated by characters from delim.
 *
 * Writes NULs into the string at *stringp to end tokens.
 * delim need not remain constant from call to call.
 * On return, *stringp points past the last NUL written (if there might
 * be further tokens), or is NULL (if there are definitely no more tokens).
 *
 * If *stringp is NULL, strsep returns NULL.
 */
char *
strsep(char **stringp, const char *delim)
{
	char *s;
	const char *spanp;
	int c, sc;
	char *tok;

	if ((s = *stringp) == NULL)
		return (NULL);
	for (tok = s;;) {
		c = *s++;
		spanp = delim;
		do {
			if ((sc = *spanp++) == c) {
				if (c == 0)
					s = NULL;
				else
					s[-1] = 0;
				*stringp = s;
				return (tok);
			}
		} while (sc != 0);
	}
	/* NOTREACHED */
}
```

:::

## 前提知識

- **C の文字列**: 文字（`char`）が並び、最後に値 0 のバイト（`'\0'`）が置かれたものです。`"ab"` はメモリ上では `a b \0` の 3 バイトです。途中に 0 を書き込むと、文字列はそこで終わったことになります。
- **ポインタ**: メモリ上の場所を指す値です。`*s` でその場所の文字を読み、`s++` で次の文字へ進みます。`c = *s++` は「今の文字を読んでから 1 つ進む」です。
- **ポインタのポインタ `char **stringp`**: 「文字列を指すポインタ」が置かれた場所を受け取ります。`*stringp = s;` と書くと、呼び出し側の変数そのものを書き換えられます。こうして「次はどこから読むか」を呼び出し側に返します。
- **`s[-1]`**: `s` の 1 つ前の文字です。`*(s - 1)` と同じ意味です。
- **`do { ... } while (条件);`**: 本体を先に 1 回実行してから条件を調べるループです。
- **`NULL`**: どこも指さないポインタです。

## 何をしているか

### 1. もう残りがなければ終わる

```c:line-numbers=54
	if ((s = *stringp) == NULL)
		return (NULL);
```
`*stringp` が `NULL` なら、前回の呼び出しで最後のトークンを返し終えています。`NULL` を返します。

### 2. 1 文字ずつ、区切り文字の一覧と比べる

```c:line-numbers=56
	for (tok = s;;) {
		c = *s++;
		spanp = delim;
		do {
			if ((sc = *spanp++) == c) {
				if (c == 0)
					s = NULL;
				else
					s[-1] = 0;
				*stringp = s;
				return (tok);
			}
		} while (sc != 0);
```
`tok` に今回のトークンの先頭を覚えておきます。外側のループで 1 文字 `c` を読み、内側のループで区切り文字の一覧 `delim` を 1 文字ずつ `sc` と比べます。
内側のループは `sc` が 0 になるまで、つまり **`delim` の終端の 0 まで** 比べます。ここが要点で、`c` が文字列の終わり（0）なら、`delim` の終端の 0 と一致します。

### 3. 一致したとき

```c:line-numbers=60
			if ((sc = *spanp++) == c) {
				if (c == 0)
					s = NULL;
				else
					s[-1] = 0;
				*stringp = s;
				return (tok);
```
- `c` が 0（文字列の終わり）なら、もう続きはないので `s = NULL` にします。
- それ以外（区切り文字）なら、`s[-1] = 0` でその区切り文字を 0 に書き換えます。`s` はすでに区切りの次を指しているので、次回はそこから始まります。

最後に `*stringp = s` で次の開始位置を書き戻し、`tok` を返します。

### 4. 具体例

`char buf[] = "a,,b"; char *p = buf;` で `strsep(&p, ",")` を繰り返します。

1. `a` は区切りでない。次の `,` が一致し、それを 0 にする。`"a"` を返し、`p` は 2 文字目の `,` を指す。
2. いきなり `,` が一致。0 にして `""`（空文字列）を返し、`p` は `b` を指す。
3. `b` の次の終端 0 が `delim` の終端 0 と一致。`p = NULL` にして `"b"` を返す。
4. `p` が `NULL` なので `NULL` を返す。

## ここがすごい

- **終端の 0 を区切り扱いにして場合分けを減らす**: 内側の `do-while` は `delim` の 0 まで比べるので、「文字列が終わったか」を別に調べる必要がありません。文字列の終わりも区切りも同じ `if` で処理され、違いは `s` を `NULL` にするかどうかだけです。
- **状態を呼び出し側に持たせる**: `strtok` は「どこまで読んだか」を関数の中の隠れた変数に覚えます。そのため、2 つの文字列を交互に切ったり、複数のスレッドから使ったりできません。`strsep` は位置を `*stringp` として呼び出し側に返すので、そうした問題がありません。
- **空のトークンを返す**: `strtok` は連続した区切りを 1 つとみなすので、CSV の空欄のような「空の値」を区別できません。`strsep` は区切りごとに必ず 1 つのトークンを返すので、`"a,,b"` を 3 つの値として扱えます。
- **元の文字列を書き換える**: コピーを作らず、区切りを 0 に置き換えるだけで切り分けます。メモリを確保しないので速い反面、渡す文字列は書き換え可能でなければなりません（文字列リテラルを直接渡してはいけません）。

## まとめ

- 文字列の途中に 0 を書けば、そこで文字列を「切る」ことができる。
- 区切りの一覧の終端 0 まで比べると、文字列の終わりも区切りとして同じ処理にできる。
- 読み進めた位置をポインタのポインタで返すと、関数が隠れた状態を持たずに済む。
- `strtok` と違い、空のトークンも 1 つの値として返す。
