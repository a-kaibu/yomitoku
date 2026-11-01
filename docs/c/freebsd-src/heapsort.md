---
title: "配列の「1 つ手前」を基点にして 1 始まりのヒープを作る heapsort"
description: "FreeBSD libc の heapsort。先頭より 1 要素前を指すポインタを作ることで、親子関係を 2i / i/2 の単純な式で書けるようにし、最悪でも O(n log n) の並べ替えを追加メモリ 1 要素で実現している。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-3-Clause
copyright: "Copyright (c) 1991, 1993 The Regents of the University of California.  All rights reserved.; Copyright (c) 2014 David T. Chisnall"
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/stdlib/heapsort.c
lines: [143, 196]
function: "heapsort"
difficulty: 2
format: 2
tags: [ソート, アルゴリズム, データ構造, 標準ライブラリ]
---

## ひとことで

`heapsort` は、配列をヒープソートで並べ替える FreeBSD 独自の関数です。使い方は `qsort` と同じで、配列・要素数・要素の大きさ・比較関数を渡します。
クイックソートと違い、どんなデータでも O(n log n)（要素数 n に対して n × log n に比例する時間）で終わり、余分なメモリは要素 1 個ぶんしか使いません。
この関数は、その全体の流れを「ヒープを作る」「最大値を末尾へ送ってヒープを直す」の 2 段階で書いています。

## コード

::: code-group

```c:line-numbers=143 [日本語訳]
/*
 * ヒープソート -- Knuth 第 3 巻 145 ページ。平均でも最悪でも O(N lg N) で動く。
 * ヒープソートはクイックソートの最悪の場合よりは速いが、
 * BSD のクイックソートは中央値で選ぶので、最悪の場合を引き起こす
 * データに当たる可能性は事実上ない。ヒープソートが
 * クイックソートより優れている点は、追加のメモリがほとんど要らないことだけである。
 */
#ifdef I_AM_HEAPSORT_B
int
heapsort_b(void *vbase, size_t nmemb, size_t size, heapsort_block compar)
#else
int
heapsort(void *vbase, size_t nmemb, size_t size,
    int (*compar)(const void *, const void *))
#endif
{
	size_t cnt, i, j, l;
	char tmp, *tmp1, *tmp2;
	char *base, *k, *p, *t;

	if (nmemb <= 1)
		return (0);

	if (!size) {
		errno = EINVAL;
		return (-1);
	}

	if ((k = malloc(size)) == NULL)
		return (-1);

	/*
	 * 要素は 1 から nmemb まで番号を振るので、開始アドレスより
	 * size バイト手前を基点にする。
	 */
	base = (char *)vbase - size;

	for (l = nmemb / 2 + 1; --l;)
		CREATE(l, nmemb, i, j, t, p, size, cnt, tmp);

	/*
	 * ヒープの各要素について、最大の要素を最終位置に保存し、
	 * 押し出された要素 (k) を保存してから、ヒープを
	 * 作り直す。
	 */
	while (nmemb > 1) {
		COPY(k, base + nmemb * size, cnt, size, tmp1, tmp2);
		COPY(base + nmemb * size, base + size, cnt, size, tmp1, tmp2);
		--nmemb;
		SELECT(i, j, nmemb, t, p, size, k, cnt, tmp1, tmp2);
	}
	free(k);
	return (0);
}
```

```c:line-numbers=143 [原文]
/*
 * Heapsort -- Knuth, Vol. 3, page 145.  Runs in O (N lg N), both average
 * and worst.  While heapsort is faster than the worst case of quicksort,
 * the BSD quicksort does median selection so that the chance of finding
 * a data set that will trigger the worst case is nonexistent.  Heapsort's
 * only advantage over quicksort is that it requires little additional memory.
 */
#ifdef I_AM_HEAPSORT_B
int
heapsort_b(void *vbase, size_t nmemb, size_t size, heapsort_block compar)
#else
int
heapsort(void *vbase, size_t nmemb, size_t size,
    int (*compar)(const void *, const void *))
#endif
{
	size_t cnt, i, j, l;
	char tmp, *tmp1, *tmp2;
	char *base, *k, *p, *t;

	if (nmemb <= 1)
		return (0);

	if (!size) {
		errno = EINVAL;
		return (-1);
	}

	if ((k = malloc(size)) == NULL)
		return (-1);

	/*
	 * Items are numbered from 1 to nmemb, so offset from size bytes
	 * below the starting address.
	 */
	base = (char *)vbase - size;

	for (l = nmemb / 2 + 1; --l;)
		CREATE(l, nmemb, i, j, t, p, size, cnt, tmp);

	/*
	 * For each element of the heap, save the largest element into its
	 * final slot, save the displaced element (k), then recreate the
	 * heap.
	 */
	while (nmemb > 1) {
		COPY(k, base + nmemb * size, cnt, size, tmp1, tmp2);
		COPY(base + nmemb * size, base + size, cnt, size, tmp1, tmp2);
		--nmemb;
		SELECT(i, j, nmemb, t, p, size, k, cnt, tmp1, tmp2);
	}
	free(k);
	return (0);
}
```

:::

## 前提知識

- **ヒープ**: 「親は子以上」という規則を満たす木を配列で表したものです。1 番から数えると、`i` 番の子は `2i` と `2i+1`、親は `i/2` です。根（1 番）が常に最大値になります。
- **ポインタと `char *`**: ポインタはメモリ上の場所を指す値です。要素の型がわからないので、配列を `char`（1 バイト）の並びとして扱い、`base + i * size` のように **バイト単位で** 場所を計算します。
- **`size_t`**: 大きさや個数を表す符号なし（負にならない）整数の型です。
- **`malloc` / `free`**: 実行中にメモリを借りる関数と、返す関数です。失敗すると `malloc` は `NULL`（どこも指さないポインタ）を返します。
- **`errno`**: 失敗の理由を入れておく、ライブラリ共通の変数です。`EINVAL` は「引数が不正」を意味します。
- **`CREATE` / `SELECT` / `COPY`**: 同じファイルの関数の手前で定義されたマクロ（コンパイル前に文字を置き換える仕組み）です。`CREATE` は 1 つの親から下へ沈めてヒープの規則を満たすようにし、`SELECT` は根を取り出した後のヒープを直し、`COPY` は `size` バイトをコピーします。

## 何をしているか

### 1. 引数を確かめ、一時領域を借りる

```c:line-numbers=163
	if (nmemb <= 1)
		return (0);

	if (!size) {
		errno = EINVAL;
		return (-1);
	}

	if ((k = malloc(size)) == NULL)
		return (-1);
```
要素が 1 個以下なら並べ替えは不要なので、すぐ成功（0）を返します。要素の大きさが 0 なら不正なので `errno = EINVAL` にして -1 を返します。
次に、要素 1 個ぶんのメモリ `k` を `malloc` で借ります。これはヒープから押し出された要素を一時的に置いておく場所です。

### 2. 1 始まりにするための `base`

```c:line-numbers=178
	base = (char *)vbase - size;
```
`base = (char *)vbase - size;` は、配列の先頭から **1 要素ぶん手前** の場所です。
こうすると `base + 1 * size` が配列の 0 番目、`base + 2 * size` が 1 番目、となり、ヒープの「1 番から数える」式をそのまま使えます。
0 から数えると子は `2i+1` と `2i+2` になり、式が少し複雑になります。

### 3. ヒープを作る

```c:line-numbers=180
	for (l = nmemb / 2 + 1; --l;)
		CREATE(l, nmemb, i, j, t, p, size, cnt, tmp);
```
`for (l = nmemb / 2 + 1; --l;)` は、`l` を `nmemb/2` から 1 まで 1 ずつ減らすループです。`--l` が 0 になった時点で終わります。
子を持つ最後の親（`nmemb/2` 番）から根へ向かって順に `CREATE` を呼び、下から順にヒープの形に整えます。
たとえば 10 要素なら 5, 4, 3, 2, 1 番の順に処理します。

### 4. 最大値を末尾へ送る

```c:line-numbers=188
	while (nmemb > 1) {
		COPY(k, base + nmemb * size, cnt, size, tmp1, tmp2);
		COPY(base + nmemb * size, base + size, cnt, size, tmp1, tmp2);
		--nmemb;
		SELECT(i, j, nmemb, t, p, size, k, cnt, tmp1, tmp2);
	}
```
根には最大値があります。末尾の要素をいったん `k` に退避し、根の値を末尾へコピーします。
これで最大値が最終位置に決まったので、`nmemb` を 1 減らしてヒープの範囲を縮め、`SELECT` で `k` を入れ直してヒープを直します。
これを要素が 1 個になるまで繰り返すと、後ろから大きい順に値が確定し、配列全体が小さい順に並びます。最後に `k` を `free` で返します。

## ここがすごい

- **ポインタを 1 つずらすだけで式が単純になる**: `base = (char *)vbase - size;` の 1 行 は小さな工夫ですが、ヒープのすべての計算を `i*2` と `i/2` だけで書けるようにしています。`base` を作る行の上のコメントにもその意図が書かれています。（配列の外を指すポインタを作ること自体は C の規格上きわどい書き方ですが、`base + size` 以上の場所にしかアクセスしないので、実際に配列の外を読み書きすることはありません。）
- **追加メモリは 1 要素だけ**: `qsort` の多くの実装は再帰のためにスタックを使い、マージソートは配列と同じ大きさの作業領域が要ります。ヒープソートは配列の中だけで並べ替えられ、ここでも `k` の 1 要素しか借りていません。関数の上のコメントは「ヒープソートの唯一の利点は追加メモリが少ないこと」と率直に書いています。
- **失敗を返せる設計**: 標準の `qsort` は戻り値がなく、失敗を伝えられません。`heapsort` は `int` を返し、メモリ不足や不正な引数を -1 と `errno` で知らせます。
- **ヒープ作りは下から**: 下の親から順に沈める方法だと、ヒープを作る作業は全体で O(n) で済みます。上から 1 個ずつ追加するより効率的です。

## まとめ

- ヒープソートは「ヒープを作る」「根を末尾に送って直す」の繰り返し。
- ポインタを 1 要素手前にずらすと、1 始まりの式をそのまま使える。
- どんな入力でも O(n log n) で、追加メモリは要素 1 個ぶん。
- 戻り値と `errno` で失敗を伝える関数は、使う側が安全に扱える。
