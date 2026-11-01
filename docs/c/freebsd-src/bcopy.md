---
title: "重なりを向きで解決し、端数を整えてから 1 ワードずつ写すメモリコピー"
description: "FreeBSD libc の移植用 bcopy/memcpy/memmove の共通実装。コピー元と先が重なっても壊れないよう前から写すか後ろから写すかを選び、アドレスの端数を合わせてから整数 1 個ずつまとめてコピーする。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-3-Clause
copyright: "Copyright (c) 1990, 1993 The Regents of the University of California.  All rights reserved."
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/string/bcopy.c
lines: [65, 136]
function: "bcopy"
difficulty: 2
format: 2
tags: [メモリ管理, 最適化, 低レイヤ, 標準ライブラリ]
---

## ひとことで

`bcopy` は、メモリのある場所から別の場所へ `length` バイトをコピーする関数です。同じファイルから、マクロの切り替えで `memcpy` と `memmove` も作られます。
この実装には 2 つの工夫があります。1 つは、コピー元と先が **重なっていても** 壊れないように、前から写すか後ろから写すかを選ぶこと。もう 1 つは、1 バイトずつではなく **ワード（整数 1 個ぶん、64 ビット環境では 8 バイト）単位** でまとめて写すことです。

## コード

::: code-group

```c:line-numbers=65 [日本語訳]
void
bcopy(const void *src0, void *dst0, size_t length)
#endif
{
	char *dst = dst0;
	const char *src = src0;
	size_t t;

	if (length == 0 || dst == src)		/* 何もすることがない */
		goto done;

	/*
	 * マクロ: t 回くり返す、および t 回くり返す（t>0 の場合）
	 */
#define	TLOOP(s) if (t) TLOOP1(s)
#define	TLOOP1(s) do { s; } while (--t)

	if ((unsigned long)dst < (unsigned long)src) {
		/*
		 * 前から写す。
		 */
		t = (uintptr_t)src;	/* 下位ビットだけあればよい */
		if ((t | (uintptr_t)dst) & wmask) {
			/*
			 * 位置をそろえてみる。下位ビットが一致していないと
			 * そろえることはできない。
			 */
			if ((t ^ (uintptr_t)dst) & wmask || length < wsize)
				t = length;
			else
				t = wsize - (t & wmask);
			length -= t;
			TLOOP1(*dst++ = *src++);
		}
		/*
		 * ワード単位で写し、残りの端数バイトを片付ける。
		 */
		t = length / wsize;
		TLOOP(*(word *)(void *)dst = *(const word *)(const void *)src;
		    src += wsize; dst += wsize);
		t = length & wmask;
		TLOOP(*dst++ = *src++);
	} else {
		/*
		 * 後ろから写す。それ以外は基本的に同じ。
		 * 位置合わせも前と同じだが、そろえるのに必要なのは
		 * wsize-(t&wmask) バイトではなく (t&wmask) バイトである。
		 */
		src += length;
		dst += length;
		t = (uintptr_t)src;
		if ((t | (uintptr_t)dst) & wmask) {
			if ((t ^ (uintptr_t)dst) & wmask || length <= wsize)
				t = length;
			else
				t &= wmask;
			length -= t;
			TLOOP1(*--dst = *--src);
		}
		t = length / wsize;
		TLOOP(src -= wsize; dst -= wsize;
		    *(word *)(void *)dst = *(const word *)(const void *)src);
		t = length & wmask;
		TLOOP(*--dst = *--src);
	}
done:
#if defined(MEMCOPY) || defined(MEMMOVE)
	return (dst0);
#else
	return;
#endif
}
```

```c:line-numbers=65 [原文]
void
bcopy(const void *src0, void *dst0, size_t length)
#endif
{
	char *dst = dst0;
	const char *src = src0;
	size_t t;

	if (length == 0 || dst == src)		/* nothing to do */
		goto done;

	/*
	 * Macros: loop-t-times; and loop-t-times, t>0
	 */
#define	TLOOP(s) if (t) TLOOP1(s)
#define	TLOOP1(s) do { s; } while (--t)

	if ((unsigned long)dst < (unsigned long)src) {
		/*
		 * Copy forward.
		 */
		t = (uintptr_t)src;	/* only need low bits */
		if ((t | (uintptr_t)dst) & wmask) {
			/*
			 * Try to align operands.  This cannot be done
			 * unless the low bits match.
			 */
			if ((t ^ (uintptr_t)dst) & wmask || length < wsize)
				t = length;
			else
				t = wsize - (t & wmask);
			length -= t;
			TLOOP1(*dst++ = *src++);
		}
		/*
		 * Copy whole words, then mop up any trailing bytes.
		 */
		t = length / wsize;
		TLOOP(*(word *)(void *)dst = *(const word *)(const void *)src;
		    src += wsize; dst += wsize);
		t = length & wmask;
		TLOOP(*dst++ = *src++);
	} else {
		/*
		 * Copy backwards.  Otherwise essentially the same.
		 * Alignment works as before, except that it takes
		 * (t&wmask) bytes to align, not wsize-(t&wmask).
		 */
		src += length;
		dst += length;
		t = (uintptr_t)src;
		if ((t | (uintptr_t)dst) & wmask) {
			if ((t ^ (uintptr_t)dst) & wmask || length <= wsize)
				t = length;
			else
				t &= wmask;
			length -= t;
			TLOOP1(*--dst = *--src);
		}
		t = length / wsize;
		TLOOP(src -= wsize; dst -= wsize;
		    *(word *)(void *)dst = *(const word *)(const void *)src);
		t = length & wmask;
		TLOOP(*--dst = *--src);
	}
done:
#if defined(MEMCOPY) || defined(MEMMOVE)
	return (dst0);
#else
	return;
#endif
}
```

:::

## 前提知識

- **ポインタ**: メモリ上の場所を指す値です。`*dst++ = *src++` は「`src` の 1 バイトを `dst` に写し、両方を 1 つ進める」です。`*--dst = *--src` は「先に 1 つ戻ってから写す」です。
- **`void *`**: 型の決まっていないポインタです。何のデータでもコピーできるように、引数はこの型で受け取り、中では `char *`（1 バイト単位）として扱います。
- **`intptr_t` / `uintptr_t`**: ポインタと同じ大きさの整数型です。ファイルの先頭で `typedef intptr_t word;` として `word` という名前を付け、「1 回でコピーする単位」にしています。アドレスを整数として計算したいときにも使います。
- **アラインメント（整列）**: CPU は、8 バイトの値を 8 の倍数のアドレスから読み書きするのが得意です。`wmask` は 7（`wsize - 1`）で、`アドレス & wmask` が 0 なら 8 の倍数です。
- **ビット演算**: `|` はどちらかが 1、`^`（XOR）は違えば 1、`&` は両方 1 のビットを残します。
- **マクロ `TLOOP` / `TLOOP1`**: 関数の中で定義されています。`TLOOP1(s)` は文 `s` を `t` 回繰り返し（`t` は 1 以上が前提）、`TLOOP(s)` は `t` が 0 なら何もしません。
- **`goto done`**: 関数の最後にある `done:` へ飛びます。

## 何をしているか

### 1. 何もしなくてよい場合

```c:line-numbers=73
	if (length == 0 || dst == src)		/* nothing to do */
		goto done;
```
長さが 0 か、コピー元と先が同じなら、すぐ終わります。

### 2. 向きを決める

```c:line-numbers=82
	if ((unsigned long)dst < (unsigned long)src) {
```
コピー先がコピー元より前にあれば前から、そうでなければ後ろから写します。
たとえば `[A B C D E]` の先頭 4 バイトを 1 バイト右へずらす（元が 0 番、先が 1 番）とき、前から写すと 0 番の `A` で 1 番の `B` を上書きしてしまい、次に写すべき `B` が消えます。後ろから写せば `D→4 番`、`C→3 番`… と、上書きする前に読み終えるので安全です。

### 3. 前向きのコピー

```c:line-numbers=86
		t = (uintptr_t)src;	/* only need low bits */
		if ((t | (uintptr_t)dst) & wmask) {
			/*
			 * Try to align operands.  This cannot be done
			 * unless the low bits match.
			 */
			if ((t ^ (uintptr_t)dst) & wmask || length < wsize)
				t = length;
			else
				t = wsize - (t & wmask);
			length -= t;
			TLOOP1(*dst++ = *src++);
		}
		/*
		 * Copy whole words, then mop up any trailing bytes.
		 */
		t = length / wsize;
		TLOOP(*(word *)(void *)dst = *(const word *)(const void *)src;
		    src += wsize; dst += wsize);
		t = length & wmask;
		TLOOP(*dst++ = *src++);
```
まず、元と先のどちらかが 8 の倍数の位置にないか調べます。
ずれている場合、`(t ^ (uintptr_t)dst) & wmask` で「元と先の端数（下 3 ビット）が同じか」を XOR で調べます。同じなら、数バイトを 1 バイトずつ写せば両方が同時に 8 の倍数にそろうので、その数 `wsize - (t & wmask)` だけ写します。違えば、そろえようがないので全部 1 バイトずつ写します。
そろったら、`length / wsize` 回、8 バイトずつ写します。残りの端数 `length & wmask` バイトを 1 バイトずつ写して終わります。

例: 元 0x1003、先 0x2003、長さ 30 なら、端数はどちらも 3 なので、最初に 5 バイト写すと 0x1008 と 0x2008 にそろいます。残り 25 バイトは 8 バイト × 3 回 + 1 バイトです。

### 4. 後ろ向きのコピー

```c:line-numbers=113
		src += length;
		dst += length;
		t = (uintptr_t)src;
		if ((t | (uintptr_t)dst) & wmask) {
			if ((t ^ (uintptr_t)dst) & wmask || length <= wsize)
				t = length;
			else
				t &= wmask;
			length -= t;
			TLOOP1(*--dst = *--src);
		}
		t = length / wsize;
		TLOOP(src -= wsize; dst -= wsize;
		    *(word *)(void *)dst = *(const word *)(const void *)src);
		t = length & wmask;
		TLOOP(*--dst = *--src);
```
ポインタを末尾に動かし、同じことを逆向きに行います。後ろからそろえるので、必要な端数は `t & wmask` バイトになります（後ろ向きの部分の先頭のコメント）。

## ここがすごい

- **1 つの関数で重なりに対応**: `memcpy` は重なりを考えなくてよい関数、`memmove` は重なりに対応する関数ですが、ここでは同じコードを使っています。向きを選ぶ比較は 1 回だけなので、安全側に倒しても損はほとんどありません。
- **端数の一致を XOR で調べる**: `(src ^ dst) & wmask` は、2 つのアドレスの下位 3 ビットが一致するかを 1 回の演算で調べます。一致しないと、片方をそろえるともう片方がずれるので、ワード単位のコピーは諦めます。無理をしないことで、どの CPU でも正しく動きます。
- **ループ回数がおよそ 8 分の 1**: 長いコピーでは、ほとんどの部分を 8 バイトずつ写すので、1 バイトずつより大幅にループが減ります。
- **移植用の基準実装**: ファイル冒頭のコメントのとおり、これは「移植用（portable）」の実装です。多くのアーキテクチャには専用のアセンブリ版がありますが、それがない環境でも、C だけでそこそこ速く安全なコピーができます。

## まとめ

- 重なるメモリのコピーは、コピー先が前なら前から、後ろなら後ろから写せば壊れない。
- アドレスの端数が元と先で同じなら、少しだけ 1 バイトずつ写してワード単位にそろえられる。
- `(a ^ b) & mask` で「下位ビットが一致するか」を一度に調べられる。
- 大きな単位でまとめて写し、端数だけ 1 バイトずつ処理するのが高速コピーの基本形。
