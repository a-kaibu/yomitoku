---
title: "同じバッファの中でも安全に、2 バイトずつ上下を入れ替える swab"
description: "隣り合う 2 バイトを入れ替える古い関数 swab の FreeBSD 実装。2 バイトをいったん一時変数に読み込んでから入れ替えて書き戻すことで、入力と出力が同じ場所でも正しく動くようにしている。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-2-Clause
copyright: "Copyright (c) 2024 rilysh <nightquick@proton.me>"
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/string/swab.c
lines: [10, 32]
function: "swab"
difficulty: 1
format: 2
tags: [低レイヤ, 移植性, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`swab(from, to, len)` は、`from` から `len` バイトを読み、**隣り合う 2 バイトごとに順番を入れ替えて** `to` に書く関数です。
`"ABCD"` は `"BADC"` になります。
2 バイトの整数をネットワークや別のマシンとやりとりするとき、バイトの並び順（エンディアン）が違う相手に合わせるために使われてきました。
この実装は 20 行ほどですが、コメントが説明しているとおり、**入力と出力が同じ場所でも壊れない** ように書かれています。

## コード

::: code-group

```c:line-numbers=10 [日本語訳]
void
swab(const void * __restrict from, void * __restrict to, ssize_t len)
{
	const char *f = from;
	char *t = to;
	uint16_t tmp;

	/*
	 * POSIX では、重なったコピーの動作は未定義とされている。しかし多くの
	 * アプリケーションは、昔の FreeBSD と今の GNU libc の動作、つまり
	 * from == to のときに正しくバイトを入れ替える動作を前提にしている。両方のバイトを読んでから
	 * 入れ替えて書き戻すことで、これを実現している。
	 */
	while (len > 1) {
		memcpy(&tmp, f, 2);
		tmp = bswap16(tmp);
		memcpy(t, &tmp, 2);

		f += 2;
		t += 2;
		len -= 2;
	}
}
```

```c:line-numbers=10 [原文]
void
swab(const void * __restrict from, void * __restrict to, ssize_t len)
{
	const char *f = from;
	char *t = to;
	uint16_t tmp;

	/*
	 * POSIX says overlapping copy behavior is undefined, however many
	 * applications assume the old FreeBSD and current GNU libc behavior
	 * that will swap the bytes correctly when from == to. Reading both bytes
	 * and swapping them before writing them back accomplishes this.
	 */
	while (len > 1) {
		memcpy(&tmp, f, 2);
		tmp = bswap16(tmp);
		memcpy(t, &tmp, 2);

		f += 2;
		t += 2;
		len -= 2;
	}
}
```

:::

## 前提知識

- **エンディアン**: 2 バイト以上の整数をメモリに置くとき、上位のバイトを先に置くか（ビッグエンディアン）、下位を先に置くか（リトルエンディアン）の違いです。0x1234 はビッグエンディアンでは `12 34`、リトルエンディアンでは `34 12` と並びます。
- **`void *` と `char *`**: `void *` は型の決まっていないポインタです。関数の中で `char *`（1 バイト単位）にして扱います。
- **`__restrict`**: 「この 2 つのポインタは重ならない」とコンパイラに約束する指定です。POSIX の仕様では重なった場合の動作は未定義とされています。
- **`ssize_t`**: 符号付きのサイズの型です。負の値も入るので、`len > 1` の比較が負の長さでも安全に偽になります。
- **`uint16_t`**: ちょうど 16 ビット（2 バイト）の符号なし整数型です。
- **`memcpy(dst, src, n)`**: `src` から `n` バイトを `dst` へコピーする関数です。
- **`bswap16(x)`**: `sys/endian.h` が提供する、16 ビット整数の上下のバイトを入れ替える関数（マクロ）です。0x1234 は 0x3412 になります。

## 何をしているか

### 1. 2 バイト以上残っている間繰り返す

```c:line-numbers=23
	while (len > 1) {
```
`len` が 2 以上の間ループします。奇数のときの最後の 1 バイトは何もしません（相手がいないので入れ替えられない）。

### 2. 2 バイトを読んで、入れ替えて、書く

```c:line-numbers=24
		memcpy(&tmp, f, 2);
		tmp = bswap16(tmp);
		memcpy(t, &tmp, 2);
```
`memcpy(&tmp, f, 2)` で、入力の 2 バイトを一時変数 `tmp` にコピーします。`bswap16` で上下を入れ替え、`memcpy(t, &tmp, 2)` で出力に書きます。

### 3. 2 バイト進む

```c:line-numbers=28
		f += 2;
		t += 2;
		len -= 2;
```
入力と出力の位置を 2 つ進め、残りの長さを 2 減らします。

### 4. 具体例

`char buf[] = "ABCDE";` に対して `swab(buf, buf, 5)` を呼ぶと:

- 1 回目: `A B` を読んで `B A` と書く → `"BACDE"`
- 2 回目: `C D` を読んで `D C` と書く → `"BADCE"`
- 残り 1 バイトの `E` はそのまま

結果は `"BADCE"` です。入力と出力が同じ場所でも、2 バイトを読み終えてから書くので正しく入れ替わります。

## ここがすごい

- **読んでから書くので同じ場所でも安全**: 1 バイトずつ `t[0] = f[1]; t[1] = f[0];` と書くと、`from == to` のとき、1 つ目の代入で `f[0]` が上書きされ、2 つ目の代入で `B` が 2 つ並んでしまいます。関数内のコメントのとおり、POSIX はこの使い方を未定義としていますが、昔の FreeBSD や GNU libc で動いていたため、頼っているプログラムがあります。両方のバイトを先に読む書き方で、その期待を守っています。
- **`memcpy` でアラインメントの問題を避ける**: `*(uint16_t *)f` のようにポインタを直接変換して読むと、`f` が奇数のアドレスのとき、一部の CPU では例外になります。また、C の「別の型として読んではいけない」という規則（strict aliasing）にも触れます。`memcpy` を使えばどちらの心配もなく、しかも最近のコンパイラは 2 バイトの `memcpy` を 1 命令の読み書きに置き換えるので、遅くもなりません。
- **専用の入れ替え関数を使う**: `bswap16` は、多くの CPU でバイト入れ替えの専用命令になります。自分でシフトと OR を書くより意図がはっきりします。

## まとめ

- 入力と出力が重なりうる処理では、「全部読んでから書く」と壊れにくい。
- 任意の位置から整数を読むときは、ポインタの型変換より `memcpy` が安全で、遅くもならない。
- 仕様では未定義でも、既存のプログラムが頼っている動作は守る価値がある。
- バイト順の入れ替えには、`bswap16` のような専用の関数を使う。
