---
title: "256 ビットの表を作って 1 文字 1 回の参照で判定する strspn"
description: "文字列の先頭から「指定した文字だけ」が何文字続くかを数える strspn。文字の集合を unsigned long 4 個ぶんのビット表にしておき、各文字が集合に入っているかをビット 1 つの AND で判定している。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-2-Clause
copyright: "Copyright (c) 2005 David Schultz <das@FreeBSD.ORG>"
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/string/strspn.c
lines: [33, 70]
function: "strspn"
difficulty: 2
format: 2
tags: [ビット演算, 文字列処理, 標準ライブラリ, 最適化]
---

## ひとことで

`strspn(s, charset)` は、文字列 `s` の先頭から、`charset` に含まれる文字だけが何文字続くかを返す C 標準の関数です。
たとえば `strspn("2024-11-01", "0123456789")` は、先頭の `2024` が数字なので `4` を返します。
素直に書くと、`s` の 1 文字ごとに `charset` を最初から探すことになります。FreeBSD の実装は、先に **256 ビットの表** を作っておき、1 文字につき 1 回の表引きで判定します。

## コード

::: code-group

```c:line-numbers=33 [日本語訳]
#define	IDX(c)	((u_char)(c) / LONG_BIT)
#define	BIT(c)	((u_long)1 << ((u_char)(c) % LONG_BIT))

size_t
strspn(const char *s, const char *charset)
{
	/*
	 * 注: idx と bit は一時変数で、これを使うと gcc 3.4.2 が
	 * より良いコードを生成する。これがないと gcc は少し混乱する。
	 */
	const char *s1;
	u_long bit;
	u_long tbl[(UCHAR_MAX + 1) / LONG_BIT];
	int idx;

	if(*s == '\0')
		return (0);

#if LONG_BIT == 64	/* 64 ビットのアーキテクチャでは展開したほうが常に良い */
	tbl[3] = tbl[2] = tbl[1] = tbl[0] = 0;
#else
	for (idx = 0; idx < sizeof(tbl) / sizeof(tbl[0]); idx++)
		tbl[idx] = 0;
#endif
	for (; *charset != '\0'; charset++) {
		idx = IDX(*charset);
		bit = BIT(*charset);
		tbl[idx] |= bit;
	}

	for(s1 = s; ; s1++) {
		idx = IDX(*s1);
		bit = BIT(*s1);
		if ((tbl[idx] & bit) == 0)
			break;
	}
	return (s1 - s);
}
```

```c:line-numbers=33 [原文]
#define	IDX(c)	((u_char)(c) / LONG_BIT)
#define	BIT(c)	((u_long)1 << ((u_char)(c) % LONG_BIT))

size_t
strspn(const char *s, const char *charset)
{
	/*
	 * NB: idx and bit are temporaries whose use causes gcc 3.4.2 to
	 * generate better code.  Without them, gcc gets a little confused.
	 */
	const char *s1;
	u_long bit;
	u_long tbl[(UCHAR_MAX + 1) / LONG_BIT];
	int idx;

	if(*s == '\0')
		return (0);

#if LONG_BIT == 64	/* always better to unroll on 64-bit architectures */
	tbl[3] = tbl[2] = tbl[1] = tbl[0] = 0;
#else
	for (idx = 0; idx < sizeof(tbl) / sizeof(tbl[0]); idx++)
		tbl[idx] = 0;
#endif
	for (; *charset != '\0'; charset++) {
		idx = IDX(*charset);
		bit = BIT(*charset);
		tbl[idx] |= bit;
	}

	for(s1 = s; ; s1++) {
		idx = IDX(*s1);
		bit = BIT(*s1);
		if ((tbl[idx] & bit) == 0)
			break;
	}
	return (s1 - s);
}
```

:::

## 前提知識

- **C の文字列**: `char` の並びの最後に 0 のバイトが置かれたものです。`*s == '\0'` は「空文字列か」を調べています。
- **`u_char` と `u_long`**: それぞれ `unsigned char`（0〜255 の 1 バイト）と `unsigned long`（符号なしの大きな整数）の別名です。`char` は環境によって負の値（-128〜127）になることがあるので、`(u_char)c` で 0〜255 に直してから表の位置に使います。
- **`LONG_BIT`**: `long` のビット数です。64 ビット環境では 64 です。
- **ビット演算**: `1 << n` は「n 番目のビットだけが 1 の数」、`|=` はビットを立てる、`&` は両方が 1 のビットだけ残す演算です。
- **マクロ `IDX` と `BIT`**: 関数の直前で定義されています。`IDX(c)` は文字 `c` が表の何番目の整数に入るか（`c / 64`）、`BIT(c)` はその整数の何ビット目か（`c % 64` 番目だけ 1 の数）を表します。
- **ポインタの引き算**: `s1 - s` は 2 つの位置の間の文字数です。
- **`#if`**: コンパイル時の条件分岐です。条件に合わない側のコードは消えます。

## 何をしているか

### 1. 空文字列ならすぐ返す

```c:line-numbers=48
	if(*s == '\0')
		return (0);
```
`s` が空なら答えは 0 です。表を作る手間を省きます。

### 2. 表を 0 にする

```c:line-numbers=51
#if LONG_BIT == 64	/* always better to unroll on 64-bit architectures */
	tbl[3] = tbl[2] = tbl[1] = tbl[0] = 0;
#else
	for (idx = 0; idx < sizeof(tbl) / sizeof(tbl[0]); idx++)
		tbl[idx] = 0;
#endif
```
表 `tbl` は 256 ビット（`(UCHAR_MAX + 1) / LONG_BIT` 個の `u_long`）です。64 ビット環境では 4 個なので、ループを使わず 4 つまとめて 0 にします。コメントには「64 ビット環境では展開したほうが常に良い」とあります。

### 3. `charset` の文字のビットを立てる

```c:line-numbers=57
	for (; *charset != '\0'; charset++) {
		idx = IDX(*charset);
		bit = BIT(*charset);
		tbl[idx] |= bit;
	}
```
`charset` の各文字について、対応するビットを 1 にします。
たとえば `'0'` は文字コード 48 なので、`tbl[0]` の 48 番目のビットが立ちます。`'9'`（57）まで同様です。英字 `'a'`（97）なら `tbl[1]` の 33 番目（97 − 64）のビットです。

### 4. `s` を先頭から調べる

```c:line-numbers=63
	for(s1 = s; ; s1++) {
		idx = IDX(*s1);
		bit = BIT(*s1);
		if ((tbl[idx] & bit) == 0)
			break;
	}
	return (s1 - s);
```
各文字のビットが表で 1 かを `&` で調べ、0（集合にない）になった時点で止まります。
文字列の終わりの 0 は `charset` に入らない（表を作るループは `charset` の 0 の手前で止まる）ので、ループは必ず終端で止まります。進んだ文字数 `s1 - s` を返します。

`"2024-11-01"` なら、`2`、`0`、`2`、`4` はビットが立っていて、`-`（45）は立っていないので 4 文字目で止まり、4 を返します。

## ここがすごい

- **O(n × m) から O(n + m) へ**: 素直な方法では、`s` の長さを n、`charset` の長さを m とすると最悪 n × m 回の比較になります。表を作れば、表作りに m 回、調べるのに n 回で済みます。
- **表が小さい**: 256 文字ぶんの真偽を、`bool` の配列（256 バイト）ではなくビットで持つので、わずか 32 バイトです。関数のローカル変数として毎回作っても負担になりません。
- **終端の扱いが自然**: `s` を調べるループには「文字列の終わりか」という条件がありません。終端の 0 のビットは決して立たないので、表引きが自動的に止めてくれます。
- **コンパイラへの配慮もコメントに残す**: 関数冒頭のコメントは、`idx` と `bit` という一時変数を置いたほうが、当時の gcc 3.4.2 がより良いコードを出したと説明しています。性能のための書き方は、理由を書いておかないと後で「無駄な変数」として消されてしまいます。
- **同じ発想の関数**: 「集合に入っていない文字」が何文字続くかを数える `strcspn` も、同じディレクトリで同じビット表の方法を使っています。

## まとめ

- 文字の集合は、256 ビット（32 バイト）の表で表せる。
- 表を先に作ると、1 文字の判定がビット 1 つの AND で済む。
- 符号の有無が環境で違う `char` は、表の添字に使う前に `unsigned char` に直す。
- 終端の 0 が集合に入らないことを利用すると、ループの終了条件を省ける。
