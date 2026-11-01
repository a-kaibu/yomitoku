---
title: "1 バイトをシフトで 8 個に増やしてワード単位で埋める memset"
description: "メモリを同じ値で埋める memset の移植用実装。短いときは 1 バイトずつ、長いときは書き込む値を (c << 8) | c の繰り返しで整数いっぱいに複製し、端数をそろえてから 8 バイトずつ書き込む。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-3-Clause
copyright: "Copyright (c) 1990, 1993 The Regents of the University of California.  All rights reserved."
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/string/memset.c
lines: [62, 131]
function: "memset"
difficulty: 2
format: 2
tags: [ビット演算, メモリ管理, 最適化, 標準ライブラリ]
---

## ひとことで

`memset(dst, c, length)` は、`dst` から `length` バイトを値 `c` で埋める C 標準の関数です。配列を 0 で初期化するときなどによく使われます。
FreeBSD の移植用実装は、1 バイトの値 `c` を **シフトと OR で整数 1 個ぶんに複製** し、8 バイト（64 ビット環境）ずつまとめて書き込みます。同じファイルから、0 で埋める `bzero` も作られます。

## コード

::: code-group

```c:line-numbers=62 [日本語訳]
void *
memset(void *dst0, int c0, size_t length)
#endif
{
	size_t t;
#ifndef BZERO
	u_long c;
#endif
	u_char *dst;

	dst = dst0;
	/*
	 * ワード数が足りなければ、バイト単位で埋めるだけにする。長さが 2 ワード以上あれば、
	 * 必要な位置合わせのあとでも少なくとも 1 つは「完全な」ワードが
	 * 残ることが保証される。たとえば:
	 *
	 *	|-----------|-----------|-----------|
	 *	|00|01|02|03|04|05|06|07|08|09|0A|00|
	 *	          ^---------------------^
	 *		 dst		 dst+length-1
	 *
	 * ただしワード単位で書くコードの手間はかなり大きいので、ここでは
	 * 最小値として 3 を使う。
	 *
	 * TODO: この閾値は 64 ビットの u_long では適切でないかもしれない。
	 * 性能を測って、この判断を見直すべきである。
	 */
	if (length < 3 * wsize) {
		while (length != 0) {
			*dst++ = VAL;
			--length;
		}
		RETURN;
	}

#ifndef BZERO
	if ((c = (u_char)c0) != 0) {	/* ワードを埋める。 */
		c = (c << 8) | c;	/* u_long が 16 ビットの場合。 */
#if ULONG_MAX > 0xffff
		c = (c << 16) | c;	/* u_long が 32 ビットの場合。 */
#endif
#if ULONG_MAX > 0xffffffff
		c = (c << 32) | c;	/* u_long が 64 ビットの場合。 */
#endif
	}
#endif
	/* 書き込み先の位置を、バイト単位で埋めてそろえる。 */
	if ((t = (long)dst & wmask) != 0) {
		t = wsize - t;
		length -= t;
		do {
			*dst++ = VAL;
		} while (--t != 0);
	}

	/* ワード単位で埋める。長さは 2 ワード以上だったので、ここで t >= 1 とわかっている。 */
	t = length / wsize;
	do {
		*(u_long *)(void *)dst = WIDEVAL;
		dst += wsize;
	} while (--t != 0);

	/* 端数のバイトがあれば片付ける。 */
	t = length & wmask;
	if (t != 0)
		do {
			*dst++ = VAL;
		} while (--t != 0);
	RETURN;
}
```

```c:line-numbers=62 [原文]
void *
memset(void *dst0, int c0, size_t length)
#endif
{
	size_t t;
#ifndef BZERO
	u_long c;
#endif
	u_char *dst;

	dst = dst0;
	/*
	 * If not enough words, just fill bytes.  A length >= 2 words
	 * guarantees that at least one of them is `complete' after
	 * any necessary alignment.  For instance:
	 *
	 *	|-----------|-----------|-----------|
	 *	|00|01|02|03|04|05|06|07|08|09|0A|00|
	 *	          ^---------------------^
	 *		 dst		 dst+length-1
	 *
	 * but we use a minimum of 3 here since the overhead of the code
	 * to do word writes is substantial.
	 *
	 * TODO: This threshold might not be sensible for 64-bit u_long.
	 * We should benchmark and revisit this decision.
	 */
	if (length < 3 * wsize) {
		while (length != 0) {
			*dst++ = VAL;
			--length;
		}
		RETURN;
	}

#ifndef BZERO
	if ((c = (u_char)c0) != 0) {	/* Fill the word. */
		c = (c << 8) | c;	/* u_long is 16 bits. */
#if ULONG_MAX > 0xffff
		c = (c << 16) | c;	/* u_long is 32 bits. */
#endif
#if ULONG_MAX > 0xffffffff
		c = (c << 32) | c;	/* u_long is 64 bits. */
#endif
	}
#endif
	/* Align destination by filling in bytes. */
	if ((t = (long)dst & wmask) != 0) {
		t = wsize - t;
		length -= t;
		do {
			*dst++ = VAL;
		} while (--t != 0);
	}

	/* Fill words.  Length was >= 2*words so we know t >= 1 here. */
	t = length / wsize;
	do {
		*(u_long *)(void *)dst = WIDEVAL;
		dst += wsize;
	} while (--t != 0);

	/* Mop up trailing bytes, if any. */
	t = length & wmask;
	if (t != 0)
		do {
			*dst++ = VAL;
		} while (--t != 0);
	RETURN;
}
```

:::

## 前提知識

- **ポインタ**: メモリ上の場所を指す値です。`*dst++ = VAL` は「`dst` の場所に値を書き、1 つ進める」です。
- **`u_char` / `u_long`**: `unsigned char`（0〜255 の 1 バイト）と `unsigned long`（符号なしの整数、64 ビット環境では 8 バイト）の別名です。
- **`wsize` / `wmask`**: ファイル先頭のマクロで、`wsize` は `u_long` の大きさ（8）、`wmask` は 7 です。`アドレス & wmask` が 0 なら 8 の倍数の位置です。
- **シフト `<<` と OR `|`**: `c << 8` は `c` を 8 ビット（1 バイト）左へずらします。`(c << 8) | c` は、`c` を 2 バイトぶん並べた値になります。
- **`#ifdef BZERO` とマクロ `VAL` / `WIDEVAL` / `RETURN`**: 関数の頭の部分で、`bzero` として作るときは書き込む値を 0、戻り値なしに、`memset` のときは `c0` と `dst0` を返すように切り替えています。抜粋は `memset` の頭から始まります。
- **`#if ULONG_MAX > 0xffff`**: コンパイル時の条件です。`u_long` の最大値が 16 ビットを超えるなら、という意味です。
- **`do { } while (--t != 0)`**: 本体を先に実行し、`t` を 1 減らして 0 でなければ繰り返します。

## 何をしているか

### 1. 短ければ 1 バイトずつ

```c:line-numbers=89
	if (length < 3 * wsize) {
		while (length != 0) {
			*dst++ = VAL;
			--length;
		}
		RETURN;
	}
```
長さが `3 * wsize`（24 バイト）未満なら、凝ったことはせず 1 バイトずつ埋めて返します。
関数冒頭のコメントは、2 ワード以上あれば、位置をそろえた後に少なくとも 1 つは完全なワードが残ることを図で示し、それでも準備の手間を考えて 3 にしていると説明しています。

### 2. 値を複製する

```c:line-numbers=97
#ifndef BZERO
	if ((c = (u_char)c0) != 0) {	/* Fill the word. */
		c = (c << 8) | c;	/* u_long is 16 bits. */
#if ULONG_MAX > 0xffff
		c = (c << 16) | c;	/* u_long is 32 bits. */
#endif
#if ULONG_MAX > 0xffffffff
		c = (c << 32) | c;	/* u_long is 64 bits. */
#endif
	}
```
`c = 0xAB` なら、

- 1 回目: `(0xAB << 8) | 0xAB` = `0xABAB`
- 2 回目: `(0xABAB << 16) | 0xABAB` = `0xABABABAB`
- 3 回目: さらに 32 ビットずらして = `0xABABABABABABABAB`

と、3 回の操作で 8 バイトすべてが `0xAB` の値になります。`u_long` が 32 ビットの環境では、`#if` によって 3 回目のシフトが消えます。`c` が 0 なら、そもそも複製の必要がないので飛ばします。

### 3. 書き込み先の位置をそろえる

```c:line-numbers=108
	/* Align destination by filling in bytes. */
	if ((t = (long)dst & wmask) != 0) {
		t = wsize - t;
		length -= t;
		do {
			*dst++ = VAL;
		} while (--t != 0);
	}
```
`dst` が 8 の倍数の位置にないなら、そこまで 1 バイトずつ埋めます。アドレスの端数が 5 なら、`8 - 5 = 3` バイトです。

### 4. ワード単位で埋めて、残りを片付ける

```c:line-numbers=117
	/* Fill words.  Length was >= 2*words so we know t >= 1 here. */
	t = length / wsize;
	do {
		*(u_long *)(void *)dst = WIDEVAL;
		dst += wsize;
	} while (--t != 0);

	/* Mop up trailing bytes, if any. */
	t = length & wmask;
	if (t != 0)
		do {
			*dst++ = VAL;
		} while (--t != 0);
	RETURN;
```
`length / wsize` 回、8 バイトずつ書きます。コメントのとおり、ここでは少なくとも 1 回は書くことが保証されているので `do-while` が使えます。最後に端数 `length & wmask` バイトを 1 バイトずつ埋めます。

## ここがすごい

- **3 回の操作で 8 バイトに複製**: 1 バイトずつ 8 回ずらして足すのではなく、「2 倍、さらに 2 倍、さらに 2 倍」と倍々にしていくので、64 ビットでも 3 行で済みます。`c * 0x0101010101010101` という掛け算で作る方法もありますが、こちらは `u_long` の大きさに合わせて `#if` で段数を変えられるのが利点です。
- **小さいときは素直に**: 位置をそろえる準備にも手間がかかるので、短いデータでは 1 バイトずつのほうが速くなります。閾値を設けて 2 つの方法を使い分けるのは、高速化の定番です。冒頭のコメントには「64 ビットでこの閾値が適切かは測り直すべき」という TODO も正直に残されています。
- **`bzero` と共有**: `#ifdef` と 3 つのマクロだけで、`memset` と `bzero` を同じコードから作っています。`bzero` では値の複製部分がまるごと消えるので、無駄がありません。
- **書き込み先だけをそろえればよい**: `bcopy` のようなコピーと違い、読み込み元がないので、書き込み先の位置だけそろえれば必ずワード単位にできます。

## まとめ

- `(c << 8) | c` を倍々に繰り返すと、1 バイトの値を整数いっぱいに複製できる。
- 書き込み先を 8 の倍数にそろえてから 8 バイトずつ書き、端数だけ 1 バイトずつ書く。
- 短いデータは素直な方法のほうが速いので、閾値で使い分ける。
- マクロと `#ifdef` で、よく似た関数を 1 つのソースから作れる。
