---
title: "ログを汚す文字を \\xXX に置き換える、最悪 4 倍を見込んだ確保"
description: "文字列の中の制御文字や ASCII 以外のバイトを \"\\x1b\" のような 4 文字の表記に置き換えた新しい文字列を作る関数。結果の最大長を先に見積もってから一度だけメモリを確保する。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/common/string.c
lines: [69, 133]
function: "pg_clean_ascii"
difficulty: 2
format: 2
tags: [文字列処理, セキュリティ, メモリ管理, 防御的プログラミング]
---

## ひとことで

`pg_clean_ascii` は、文字列のうち **表示できる ASCII 文字（空白〜`~`）以外のバイト** を、`\x1b` のような 16 進数の表記に置き換えた **新しい文字列** を返します。
たとえば `"ab<ESC>c"`（ESC は 0x1B の制御文字）なら `"ab\x1bc"` になります。
関数の前のコメントによれば、クライアントから送られるほぼ任意の文字列がログに書かれるとき、制御文字のせいで管理者の端末表示が乱れるのを防ぐための関数です。

## コード

::: code-group

```c:line-numbers=69 [日本語訳]
/*
 * pg_clean_ascii -- ASCII 以外の文字を "\xXX" という文字列に置き換える
 *
 * 渡された文字列の新しく確保したコピーを作る。文字列は
 * '\0' で終わっていなければならない。バックエンドでは追加の alloc_flags を渡せて、
 * それはそのまま palloc_extended() に渡される。フロントエンドでは alloc_flags は
 * 無視され、コピーは malloc で確保される。
 *
 * この関数は、クライアントがほぼ任意の文字列を渡せる（そして正しい
 * ユーザ名やデータベース名などであることが確かめられていない）いくつかの場所で
 * ASCII 以外の文字を取り除くためだけに存在する。制御文字などが
 * ログファイルに入り込み、サーバ管理者がそれを見たときに
 * 端末の表示が崩れてしまうことを
 * 避けたい。
 *
 * 一般には、この関数は使うべきではない。代わりに、ASCII 以外の文字を
 * 取り除かずに文字列を扱う方法を考えること。
 *
 * 最終的には、ASCII 以外をすべて置き換えるのではなく、UTF などを
 * 許すもっと賢いフィルタリングができるよう改善したいが、何を許すべきかが
 * はっきりしないので、今のところは ASCII だけに
 * とどめている。
 */
char *
pg_clean_ascii(const char *str, int alloc_flags)
{
	size_t		dstlen;
	char	   *dst;
	const char *p;
	size_t		i = 0;

	/* 最悪の場合、各バイトは 4 バイトになり、さらに終端の 0 が要る。 */
	dstlen = strlen(str) * 4 + 1;

#ifdef FRONTEND
	dst = malloc(dstlen);
#else
	dst = palloc_extended(dstlen, alloc_flags);
#endif

	if (!dst)
		return NULL;

	for (p = str; *p != '\0'; p++)
	{

		/* 文字列にはきれいな ASCII 文字だけを許す */
		if (*p < 32 || *p > 126)
		{
			Assert(i < (dstlen - 3));
			snprintf(&dst[i], dstlen - i, "\\x%02x", (unsigned char) *p);
			i += 4;
		}
		else
		{
			Assert(i < dstlen);
			dst[i] = *p;
			i++;
		}
	}

	Assert(i < dstlen);
	dst[i] = '\0';
	return dst;
}
```

```c:line-numbers=69 [原文]
/*
 * pg_clean_ascii -- Replace any non-ASCII chars with a "\xXX" string
 *
 * Makes a newly allocated copy of the string passed in, which must be
 * '\0'-terminated. In the backend, additional alloc_flags may be provided and
 * will be passed as-is to palloc_extended(); in the frontend, alloc_flags is
 * ignored and the copy is malloc'd.
 *
 * This function exists specifically to deal with filtering out
 * non-ASCII characters in a few places where the client can provide an almost
 * arbitrary string (and it isn't checked to ensure it's a valid username or
 * database name or similar) and we don't want to have control characters or other
 * things ending up in the log file where server admins might end up with a
 * messed up terminal when looking at them.
 *
 * In general, this function should NOT be used- instead, consider how to handle
 * the string without needing to filter out the non-ASCII characters.
 *
 * Ultimately, we'd like to improve the situation to not require replacing all
 * non-ASCII but perform more intelligent filtering which would allow UTF or
 * similar, but it's unclear exactly what we should allow, so stick to ASCII only
 * for now.
 */
char *
pg_clean_ascii(const char *str, int alloc_flags)
{
	size_t		dstlen;
	char	   *dst;
	const char *p;
	size_t		i = 0;

	/* Worst case, each byte can become four bytes, plus a null terminator. */
	dstlen = strlen(str) * 4 + 1;

#ifdef FRONTEND
	dst = malloc(dstlen);
#else
	dst = palloc_extended(dstlen, alloc_flags);
#endif

	if (!dst)
		return NULL;

	for (p = str; *p != '\0'; p++)
	{

		/* Only allow clean ASCII chars in the string */
		if (*p < 32 || *p > 126)
		{
			Assert(i < (dstlen - 3));
			snprintf(&dst[i], dstlen - i, "\\x%02x", (unsigned char) *p);
			i += 4;
		}
		else
		{
			Assert(i < dstlen);
			dst[i] = *p;
			i++;
		}
	}

	Assert(i < dstlen);
	dst[i] = '\0';
	return dst;
}
```

:::

## 前提知識

- **ASCII**: 0〜127 の値に英数字や記号を割り当てた文字コードです。32（空白）から 126（`~`）までが表示できる文字で、0〜31 と 127 は改行やエスケープなどの **制御文字** です。128 以上は ASCII の外です（日本語の UTF-8 などはここを使います）。
- **`char` の符号**: C の `char` は、環境によって符号付き（-128〜127）か符号なし（0〜255）かが違います。符号付きの環境では 128 以上のバイトが負の数として読まれます。
- **ポインタと配列**: `const char *p` は文字の場所を指し、`*p` でその文字を読み、`p++` で次へ進みます。`dst[i]` は `dst` から `i` 個目の文字です。`&dst[i]` はその文字の場所（アドレス）です。
- **メモリの確保**: `malloc(n)` は n バイトの領域を確保して、その先頭のポインタを返します。失敗すると `NULL` を返します。PostgreSQL のサーバ内では `palloc_extended` という独自の確保関数を使います。
- **`#ifdef FRONTEND`**: クライアント側のプログラム（FRONTEND）とサーバ側で、コンパイルするコードを切り替えます。
- **`snprintf(buf, n, 書式, ...)`**: 書式に従って文字列を作り、`buf` に最大 n バイト書き込む標準関数です。`"\\x%02x"` は「`\x` に続けて、2 桁の 16 進数（足りなければ 0 埋め）」という書式です。C の文字列中の `\\` は 1 文字の `\` を表します。
- **`Assert`**: 開発用ビルドで「必ず成り立つはず」の条件を確かめるマクロです。

## 何をしているか

### 1. 最悪の長さを見積もる

```c:line-numbers=101
	dstlen = strlen(str) * 4 + 1;
```

1 バイトは最大で `\xXX` の 4 文字になるので、元の長さの 4 倍に、最後の 0 の 1 バイトを足した大きさを確保します。`"ab<ESC>c"`（4 バイト）なら 17 バイトです。

### 2. 確保する

```c:line-numbers=103
#ifdef FRONTEND
	dst = malloc(dstlen);
#else
	dst = palloc_extended(dstlen, alloc_flags);
#endif

	if (!dst)
		return NULL;
```

クライアント側なら `malloc`、サーバ側なら `palloc_extended` を使います。確保に失敗したら `NULL` を返します。

### 3. 1 バイトずつ調べる

```c:line-numbers=112
	for (p = str; *p != '\0'; p++)
	{

		/* 文字列にはきれいな ASCII 文字だけを許す */
		if (*p < 32 || *p > 126)
		{
			Assert(i < (dstlen - 3));
			snprintf(&dst[i], dstlen - i, "\\x%02x", (unsigned char) *p);
			i += 4;
		}
		else
		{
			Assert(i < dstlen);
			dst[i] = *p;
			i++;
		}
	}
```

`p` を先頭から 0 の手前まで進めながら、各バイトを調べます。

- 32 未満か 126 より大きい場合は、`snprintf` で `\xXX` の 4 文字を書き、`i` を 4 進めます。ESC（27）なら `\x1b` です。
- それ以外は、そのまま 1 文字コピーして `i` を 1 進めます。

`(unsigned char) *p` としているのは、符号付き `char` で負になっているバイトも 0〜255 の値として 16 進表記にするためです。たとえばバイト 0xE3 は `-29` ではなく `\xe3` と書かれます。

### 4. 終端を置く

```c:line-numbers=130
	Assert(i < dstlen);
	dst[i] = '\0';
	return dst;
```

最後に 0 を書いて文字列として完成させ、返します。

## ここがすごい

- **`char` の符号の違いを 1 つの条件でさばく**: `*p < 32 || *p > 126` は、`char` が符号付きの環境では 128 以上のバイトが負の数になり `< 32` に引っかかり、符号なしの環境では `> 126` に引っかかります。どちらの環境でも ASCII 外のバイトを漏らさず捕まえられます。
- **確保は 1 回だけ**: 結果がどれだけ長くなるかは走査するまでわかりませんが、最悪の場合（全バイトが置き換え）を先に計算して一度に確保しています。素直に書くと「足りなくなったら広げる」処理が必要になり、コードもメモリのコピーも増えます。ログ用の短い文字列なので、多少の無駄より単純さを優先した判断です。
- **`Assert` で見積もりの正しさを確かめる**: `Assert(i < (dstlen - 3))` は「4 文字ぶんの空きがある」こと、`Assert(i < dstlen)` は「1 文字ぶんの空きがある」ことの確認です。見積もりの計算を誤ったら、開発中にすぐ気づけます。さらに `snprintf` に残りの大きさ `dstlen - i` を渡しているので、二重に守られています。
- **使いすぎを戒めるコメント**: 関数の前のコメントでは「一般にはこの関数を使うべきではない」と書かれています。UTF-8 の正しい文字まで潰してしまう粗い対策であることを自覚し、使いどころを限定しているのは、良いライブラリ設計の姿勢です。

## まとめ

- 外から来た文字列をログに出すときは、制御文字を目に見える表記に置き換えると安全。
- `char` の符号は環境で違う。比較の書き方次第で両方に対応できる。
- 結果の最大長が計算できるなら、先に一度だけ確保すると処理が単純になる。
- 見積もりの前提は `Assert` で確かめ、書き込みは長さ付きの関数で守る。
