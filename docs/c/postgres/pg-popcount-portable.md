---
title: "揃っていれば 8 バイトずつ、残りは表引きで数えるバッファの popcount"
description: "メモリ上のバイト列全体に含まれる 1 のビット数を数える関数。アドレスが 8 の倍数なら 64 ビット単位で数え、端の数バイトは 256 要素の表で 1 バイトずつ数える。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2019-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/port/pg_bitutils.c
lines: [99, 129]
function: "pg_popcount_portable"
difficulty: 2
format: 2
tags: [ビット演算, 最適化, 移植性, メモリ管理]
---

## ひとことで

`pg_popcount_portable` は、`buf` から `bytes` バイトぶんのメモリにある **1 のビットの総数** を返します。
たとえば中身が `0xFF 0x01 0x03` の 3 バイトなら、8 + 1 + 2 = `11` です。
CPU の特別な命令を使わない「どこでも動く版」ですが、それでもできるだけ 8 バイトずつまとめて数えるように工夫されています。

## コード

::: code-group

```c:line-numbers=99 [日本語訳]
/*
 * pg_popcount_portable
 *	buf の中の 1 のビットの数を返す
 */
uint64
pg_popcount_portable(const char *buf, int bytes)
{
	uint64		popcnt = 0;

#if SIZEOF_VOID_P >= 8
	/* バッファが揃っていれば 64 ビット単位で処理する。 */
	if (buf == (const char *) TYPEALIGN(8, buf))
	{
		const uint64 *words = (const uint64 *) buf;

		while (bytes >= 8)
		{
			popcnt += pg_popcount64(*words++);
			bytes -= 8;
		}

		buf = (const char *) words;
	}
#endif

	/* 残りのバイトを処理する */
	while (bytes--)
		popcnt += pg_number_of_ones[(unsigned char) *buf++];

	return popcnt;
}
```

```c:line-numbers=99 [原文]
/*
 * pg_popcount_portable
 *		Returns the number of 1-bits in buf
 */
uint64
pg_popcount_portable(const char *buf, int bytes)
{
	uint64		popcnt = 0;

#if SIZEOF_VOID_P >= 8
	/* Process in 64-bit chunks if the buffer is aligned. */
	if (buf == (const char *) TYPEALIGN(8, buf))
	{
		const uint64 *words = (const uint64 *) buf;

		while (bytes >= 8)
		{
			popcnt += pg_popcount64(*words++);
			bytes -= 8;
		}

		buf = (const char *) words;
	}
#endif

	/* Process any remaining bytes */
	while (bytes--)
		popcnt += pg_number_of_ones[(unsigned char) *buf++];

	return popcnt;
}
```

:::

## 前提知識

- **ポインタ**: `const char *buf` はメモリ上のバイト列の先頭を指す「場所」です。`*buf` でそこにある 1 バイトを読み、`buf++` で次のバイトへ進みます。`*buf++` は「読んでから進む」をまとめて書いたものです。`const` は「書き換えない」という約束です。
- **ポインタの型の付け替え（キャスト）**: `(const uint64 *) buf` は、同じ場所を「8 バイト整数の並び」として読み直す指示です。`*words++` で 8 バイトを一度に読み、8 バイト先へ進みます。
- **アラインメント**: CPU は 8 バイトの値を 8 の倍数のアドレスから読むのが得意で、そうでない位置から読むと遅くなったり、機種によってはエラーになったりします。
- **`TYPEALIGN(8, buf)`**: PostgreSQL のマクロで、アドレスを 8 の倍数に切り上げます。切り上げても変わらない＝もともと 8 の倍数、という判定に使っています。
- **`#if SIZEOF_VOID_P >= 8`**: ポインタが 8 バイト以上の環境（64 ビット環境）でだけ中のコードを使う、という条件コンパイルです。
- **`while (bytes--)`**: `bytes` を条件として調べてから 1 減らします。`bytes` が 3 なら 3 回まわって終わります。
- **`(unsigned char)`**: `char` は環境によって負の値になることがあるので、0〜255 の範囲に直してから表の添字にしています。

## 何をしているか

### 1. 揃っているかを確かめる

```c:line-numbers=108
#if SIZEOF_VOID_P >= 8
	/* バッファが揃っていれば 64 ビット単位で処理する。 */
	if (buf == (const char *) TYPEALIGN(8, buf))
```

64 ビット環境では、まず `buf` が 8 の倍数のアドレスかを調べます。揃っていれば、同じ場所を `uint64` の並び `words` として扱います。

### 2. 8 バイトずつ数える

```c:line-numbers=112
		const uint64 *words = (const uint64 *) buf;

		while (bytes >= 8)
		{
			popcnt += pg_popcount64(*words++);
```

残りが 8 バイト以上ある間、`pg_popcount64` で 8 バイトぶんの 1 の個数を数えて `popcnt` に足し、`bytes` を 8 減らします。
たとえば `bytes = 20` なら、ここで 2 回（16 バイト）処理して `bytes = 4` が残ります。

### 3. 位置を戻す

```c:line-numbers=118
		}
```

`words` は 8 バイトずつ進んでいるので、その位置を `buf` に戻して、続きをバイト単位で処理できるようにします。

### 4. 残りを表引きで数える

```c:line-numbers=122
#endif

	/* 残りのバイトを処理する */
	while (bytes--)
		popcnt += pg_number_of_ones[(unsigned char) *buf++];
```

残った 4 バイト（揃っていなかった場合は全バイト）を 1 バイトずつ、`pg_number_of_ones` という表で数えます。この表は 0〜255 の各値について 1 のビット数を前もって入れた 256 要素の配列で、たとえば `pg_number_of_ones[3]` は `2` です。

## ここがすごい

- **速い道と確実な道の 2 段構え**: 8 バイト単位で処理できれば、ループの回数はおよそ 8 分の 1 になります。一方、揃っていない・端数がある、という場合には表引きで 1 バイトずつ確実に処理します。揃っていなければ速い道をあきらめるだけで、答えは常に正しいのが良いところです。
- **アラインメントを確かめてから読む**: 素直に `(uint64 *)` にキャストしてしまうと、揃っていないアドレスから 8 バイト読むことになり、CPU によっては例外で落ちます。先に確かめることで、どの機種でも安全に動きます。
- **表引きは分岐なし**: 1 バイトの 1 の個数を数えるのに 8 回ループする代わりに、配列を 1 回読むだけです。表は 256 バイトしかないので CPU のキャッシュにもすぐ乗ります。
- **環境ごとの層分け**: この関数は「どこでも動く版」です。CPU に popcount 命令がある環境では、別ファイルの最適化版が関数ポインタ経由で選ばれ、ない環境ではこの関数が使われます。実装を差し替えられるよう、一番素朴な版を独立した関数にしておく設計です。

## まとめ

- 大量のビットを数えるときは、8 バイトずつまとめて数えると速い。
- まとめて読む前にアドレスが揃っているかを確かめると、移植性と安全性が保てる。
- 端数は 256 要素の表を引いて 1 バイトずつ処理すると、分岐なしで確実に数えられる。
- 速い版と素朴な版を分けておくと、環境ごとに差し替えやすい。
