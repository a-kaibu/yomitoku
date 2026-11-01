---
title: "3 バイトを 24 ビットの箱に詰め、6 ビットずつ切り出す Base64"
description: "バイト列を Base64 の文字列に変換する関数。3 バイトを 1 つの 32 ビット変数に詰めてから 6 ビットずつ表を引き、端数は = で埋める。あふれたら出力を 0 で消して -1 を返す。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2001-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/common/base64.c
lines: [41, 106]
function: "pg_b64_encode"
difficulty: 2
format: 2
tags: [ビット演算, 文字列処理, エラー処理, セキュリティ]
---

## ひとことで

`pg_b64_encode` は、任意のバイト列を **Base64**（英数字と `+` `/` だけで書く表記）に変換します。
たとえば `"Man"` の 3 バイトは `"TWFu"` の 4 文字に、`"Ma"` の 2 バイトは `"TWE="` になります。
PostgreSQL では SCRAM 認証などで、バイナリデータを文字として送るために使われています。結果の文字数を返し、出力先が足りなければ `-1` を返します。

## コード

::: code-group

```c:line-numbers=41 [日本語訳]
/*
 * pg_b64_encode
 *
 * 'src' のバイト配列を base64 にエンコードする。エンコードした文字列の
 * 長さを返す。エラーのときは -1 を返し、安全のため結果のバッファは
 * 0 で埋める。
 */
int
pg_b64_encode(const uint8 *src, int len, char *dst, int dstlen)
{
	char	   *p;
	const uint8 *s,
			   *end = src + len;
	int			pos = 2;
	uint32		buf = 0;

	s = src;
	p = dst;

	while (s < end)
	{
		buf |= *s << (pos << 3);
		pos--;
		s++;

		/* 書き出す */
		if (pos < 0)
		{
			/*
			 * エンコードした文字列のために確保した領域があふれるなら
			 * 抜ける。
			 */
			if ((p - dst + 4) > dstlen)
				goto error;

			*p++ = _base64[(buf >> 18) & 0x3f];
			*p++ = _base64[(buf >> 12) & 0x3f];
			*p++ = _base64[(buf >> 6) & 0x3f];
			*p++ = _base64[buf & 0x3f];

			pos = 2;
			buf = 0;
		}
	}
	if (pos != 2)
	{
		/*
		 * エンコードした文字列のために確保した領域があふれるなら
		 * 抜ける。
		 */
		if ((p - dst + 4) > dstlen)
			goto error;

		*p++ = _base64[(buf >> 18) & 0x3f];
		*p++ = _base64[(buf >> 12) & 0x3f];
		*p++ = (pos == 0) ? _base64[(buf >> 6) & 0x3f] : '=';
		*p++ = '=';
	}

	Assert((p - dst) <= dstlen);
	return p - dst;

error:
	memset(dst, 0, dstlen);
	return -1;
}
```

```c:line-numbers=41 [原文]
/*
 * pg_b64_encode
 *
 * Encode the 'src' byte array into base64.  Returns the length of the encoded
 * string, and -1 in the event of an error with the result buffer zeroed for
 * safety.
 */
int
pg_b64_encode(const uint8 *src, int len, char *dst, int dstlen)
{
	char	   *p;
	const uint8 *s,
			   *end = src + len;
	int			pos = 2;
	uint32		buf = 0;

	s = src;
	p = dst;

	while (s < end)
	{
		buf |= *s << (pos << 3);
		pos--;
		s++;

		/* write it out */
		if (pos < 0)
		{
			/*
			 * Leave if there is an overflow in the area allocated for the
			 * encoded string.
			 */
			if ((p - dst + 4) > dstlen)
				goto error;

			*p++ = _base64[(buf >> 18) & 0x3f];
			*p++ = _base64[(buf >> 12) & 0x3f];
			*p++ = _base64[(buf >> 6) & 0x3f];
			*p++ = _base64[buf & 0x3f];

			pos = 2;
			buf = 0;
		}
	}
	if (pos != 2)
	{
		/*
		 * Leave if there is an overflow in the area allocated for the encoded
		 * string.
		 */
		if ((p - dst + 4) > dstlen)
			goto error;

		*p++ = _base64[(buf >> 18) & 0x3f];
		*p++ = _base64[(buf >> 12) & 0x3f];
		*p++ = (pos == 0) ? _base64[(buf >> 6) & 0x3f] : '=';
		*p++ = '=';
	}

	Assert((p - dst) <= dstlen);
	return p - dst;

error:
	memset(dst, 0, dstlen);
	return -1;
}
```

:::

## 前提知識

- **Base64**: 3 バイト（24 ビット）を 6 ビットずつ 4 つに分け、それぞれを 64 種類の文字のどれかで表す方式です。6 ビットは 0〜63 の値なので、`_base64` という 64 文字の表（`A`〜`Z`, `a`〜`z`, `0`〜`9`, `+`, `/`）の何番目かで文字が決まります。入力が 3 の倍数でないときは、足りない分を `=` で埋めて 4 文字にそろえます。
- **ポインタ**: `const uint8 *src` は入力のバイト列の先頭、`char *dst` は出力先の先頭です。`*s` で 1 バイト読み、`s++` で次へ進みます。`*p++ = x` は「`p` の場所に `x` を書いて 1 つ進む」です。`p - dst` は書いた文字数になります。
- **ビット演算**: `<<` は左シフト、`>>` は右シフト、`|=` は OR を取って代入、`& 0x3f` は下位 6 ビット（0x3f は 2 進数で `111111`）だけを取り出す操作です。
- **`pos << 3`**: 左に 3 つずらすと 8 倍なので、`pos * 8` と同じです。
- **`goto error`**: 関数の後ろにある `error:` という印（ラベル）へ飛びます。C では、エラー時の後始末を 1 か所にまとめるためによく使われます。
- **`memset(dst, 0, dstlen)`**: 出力先全体を 0 で埋める標準関数です。

## 何をしているか

### 1. 3 バイトを 24 ビットに詰める

```c:line-numbers=60
	while (s < end)
	{
		buf |= *s << (pos << 3);
		pos--;
		s++;
```

`buf` は 32 ビットの変数で、`pos` は「次のバイトを何バイト目の位置に置くか」です。最初は `pos = 2` なので、1 バイト目は `<< 16`、2 バイト目は `<< 8`、3 バイト目は `<< 0` の位置に入ります。
`"Man"` なら `M`(0x4D), `a`(0x61), `n`(0x6E) が入り、`buf = 0x4D616E` になります。

### 2. 6 ビットずつ文字にする

```c:line-numbers=67
		if (pos < 0)
		{
			/*
			 * エンコードした文字列のために確保した領域があふれるなら
			 * 抜ける。
			 */
			if ((p - dst + 4) > dstlen)
				goto error;

			*p++ = _base64[(buf >> 18) & 0x3f];
			*p++ = _base64[(buf >> 12) & 0x3f];
			*p++ = _base64[(buf >> 6) & 0x3f];
			*p++ = _base64[buf & 0x3f];

			pos = 2;
			buf = 0;
		}
```

3 バイトそろう（`pos` が負になる）と、`buf` を 18, 12, 6, 0 ビット右にずらしてそれぞれ下位 6 ビットを取り出し、表で文字にします。
`0x4D616E` は 2 進数で `010011 010110 000101 101110`、つまり 19, 22, 5, 46 で、表を引くと `T`, `W`, `F`, `u` です。書いたら `pos` と `buf` を元に戻します。
書く前に、`(p - dst + 4) > dstlen` で出力先に 4 文字ぶんの空きがあるかを確かめています。

### 3. 端数を処理する

```c:line-numbers=85
	if (pos != 2)
	{
		/*
		 * エンコードした文字列のために確保した領域があふれるなら
		 * 抜ける。
		 */
		if ((p - dst + 4) > dstlen)
			goto error;

		*p++ = _base64[(buf >> 18) & 0x3f];
		*p++ = _base64[(buf >> 12) & 0x3f];
		*p++ = (pos == 0) ? _base64[(buf >> 6) & 0x3f] : '=';
		*p++ = '=';
	}
```

ループのあとで `pos` が 2 でなければ、1 バイトか 2 バイトが残っています。

- 2 バイト残り（`pos == 0`）: 3 文字を書き、最後を `=` にします。`"Ma"` → `TWE=`。
- 1 バイト残り（`pos == 1`）: 2 文字を書き、`==` を付けます。`"M"` → `TQ==`。

### 4. 成功とエラー

```c:line-numbers=100
	Assert((p - dst) <= dstlen);
	return p - dst;

error:
	memset(dst, 0, dstlen);
	return -1;
```

成功なら書いた文字数を返します。空きが足りなかった場合は `error:` に飛び、出力先をすべて 0 で消してから `-1` を返します。

## ここがすごい

- **1 つの変数を「24 ビットの箱」として使う**: 3 バイトを別々に扱って、ビットをまたいで切り出すのは面倒です。いったん 1 つの整数に詰めてしまえば、6 ビットの切り出しはシフトと AND だけで済み、4 行がきれいにそろいます。
- **端数処理を同じ形で書く**: 残りの 1〜2 バイトも同じ `buf` の上位に詰まっているので、ループ内と同じシフト量で文字を取り出せます。足りない位置だけを `=` に置き換えればよく、場合分けが `(pos == 0) ? ... : '='` の 1 行で済んでいます。
- **書く前に空きを確かめる**: 4 文字書くたびに、事前に空きを確かめます。出力先からはみ出して書く（バッファオーバーフロー）と、近くのメモリを壊してセキュリティ上の問題になります。
- **失敗したら途中結果を消す**: エラー時に `memset` で出力先を 0 で埋めるのは、関数の前のコメントにある通り「安全のため」です。認証に使うデータの書きかけが残ると、呼び出し側が誤って使ったり、情報が漏れたりするおそれがあります。`goto` で後始末を 1 か所にまとめているので、2 か所のエラー検出から同じ処理に合流できます。

## まとめ

- Base64 は 3 バイトを 6 ビット × 4 に分け、表で文字に変える。
- 複数バイトを 1 つの整数に詰めると、ビット単位の切り出しがシフトと AND で書ける。
- 出力先の大きさは書く前に確かめ、失敗時は書きかけを消して返す。
- C では `goto` でエラー処理の出口を 1 か所にまとめるのが定番。
