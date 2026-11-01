---
title: "比較を減らすため「いったん底まで降りてから昇る」ヒープ修復マクロ"
description: "FreeBSD の heapsort で使われる SELECT マクロ。取り出した後のヒープを直すとき、大きい子を上に詰めながら底まで降り、そこから元の要素の居場所を探して昇るという Knuth 由来の工夫を実装している。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-3-Clause
copyright: "Copyright (c) 1991, 1993 The Regents of the University of California.  All rights reserved.; Copyright (c) 2014 David T. Chisnall"
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/stdlib/heapsort.c
lines: [97, 135]
function: "SELECT"
difficulty: 3
format: 2
tags: [ソート, データ構造, マクロ, 最適化]
---

## ひとことで

ヒープソートでは、最大の要素を取り出したあと、空いた場所に別の要素 `k` を入れてヒープを直す作業を何度も繰り返します。
`SELECT` はその「直す」処理をマクロで書いたものです。
ふつうは `k` を上から沈めていきますが、このマクロは **まず子を上に詰めながら底まで一気に降り、それから底から `k` の居場所を探して昇る** という順番で、比較の回数を減らしています。

## コード

::: code-group

```c:line-numbers=97 [日本語訳]
/*
 * ヒープの先頭を取り出して「ヒープ化」する。いちばん高くつく処理は
 * 比較関数の呼び出しなので、平均的な場合にかなり速くできる。それは、
 * 押し出された要素 k がたいてい非常に小さいという事実による。だから先に
 * ヒープ化し、そのあいだ常に「大きいほうの子を親の位置へコピーする」という
 * 不変条件を保つのが望ましい。
 *
 *
 * そのあと、ヒープの「底」から k の正しい位置を探す。このときも
 * 不変条件を保つ。不変条件のおかげで、k を正しい位置に置いたとき
 * どの要素も「失われない」。
 *
 * この最適化による時間の節約は、平均的な場合で 15〜20% 程度である。
 * Knuth 第 3 巻 158 ページ、問題 18 を参照。
 *
 * 注意: 下の #define SELECT の行を分割しないこと。Reiser cpp が混乱する。
 */
#define SELECT(par_i, child_i, nmemb, par, child, size, k, count, tmp1, tmp2) { \
	for (par_i = 1; (child_i = par_i * 2) <= nmemb; par_i = child_i) { \
		child = base + child_i * size; \
		if (child_i < nmemb && COMPAR(child, child + size) < 0) { \
			child += size; \
			++child_i; \
		} \
		par = base + par_i * size; \
		COPY(par, child, count, size, tmp1, tmp2); \
	} \
	for (;;) { \
		child_i = par_i; \
		par_i = child_i / 2; \
		child = base + child_i * size; \
		par = base + par_i * size; \
		if (child_i == 1 || COMPAR(k, par) < 0) { \
			COPY(child, k, count, size, tmp1, tmp2); \
			break; \
		} \
		COPY(child, par, count, size, tmp1, tmp2); \
	} \
}
```

```c:line-numbers=97 [原文]
/*
 * Select the top of the heap and 'heapify'.  Since by far the most expensive
 * action is the call to the compar function, a considerable optimization
 * in the average case can be achieved due to the fact that k, the displaced
 * elememt, is usually quite small, so it would be preferable to first
 * heapify, always maintaining the invariant that the larger child is copied
 * over its parent's record.
 *
 * Then, starting from the *bottom* of the heap, finding k's correct place,
 * again maintianing the invariant.  As a result of the invariant no element
 * is 'lost' when k is assigned its correct place in the heap.
 *
 * The time savings from this optimization are on the order of 15-20% for the
 * average case. See Knuth, Vol. 3, page 158, problem 18.
 *
 * XXX Don't break the #define SELECT line, below.  Reiser cpp gets upset.
 */
#define SELECT(par_i, child_i, nmemb, par, child, size, k, count, tmp1, tmp2) { \
	for (par_i = 1; (child_i = par_i * 2) <= nmemb; par_i = child_i) { \
		child = base + child_i * size; \
		if (child_i < nmemb && COMPAR(child, child + size) < 0) { \
			child += size; \
			++child_i; \
		} \
		par = base + par_i * size; \
		COPY(par, child, count, size, tmp1, tmp2); \
	} \
	for (;;) { \
		child_i = par_i; \
		par_i = child_i / 2; \
		child = base + child_i * size; \
		par = base + par_i * size; \
		if (child_i == 1 || COMPAR(k, par) < 0) { \
			COPY(child, k, count, size, tmp1, tmp2); \
			break; \
		} \
		COPY(child, par, count, size, tmp1, tmp2); \
	} \
}
```

:::

## 前提知識

- **ヒープ（最大ヒープ）**: 「親は子より大きいか等しい」という規則を満たす木です。配列で表すとき、要素を 1 番から数えると、`i` 番の子は `2i` 番と `2i+1` 番、親は `i/2` 番になります（整数の割り算なので小数は切り捨て）。
- **`#define` のマクロ**: コンパイル前に文字を置き換える仕組みです。複数行のマクロは各行末の `\` でつなぎます。`SELECT(...)` と書いた場所に、マクロの中身がそのまま埋め込まれます。関数と違い、引数の型を指定しません。
- **`base`**: 配列の先頭から **1 要素ぶん手前** を指すポインタです（`heapsort` 本体で `vbase - size` として作られます）。こうすると `base + i * size` が「1 から数えて i 番目」の要素になり、上の親子の式がそのまま使えます。
- **`COMPAR(x, y)`**: 利用者の比較関数を呼ぶマクロです。負なら x が小さい。
- **`COPY(a, b, ...)`**: すぐ上で定義されたマクロで、`b` の `size` バイトを `a` へ 1 バイトずつコピーします。
- **`for (;;)`**: 条件のない無限ループです。中の `break` で抜けます。

## 何をしているか

### 1. 大きい子を上へ詰めながら底まで降りる

```c:line-numbers=115
	for (par_i = 1; (child_i = par_i * 2) <= nmemb; par_i = child_i) { \
		child = base + child_i * size; \
		if (child_i < nmemb && COMPAR(child, child + size) < 0) { \
			child += size; \
			++child_i; \
		} \
		par = base + par_i * size; \
		COPY(par, child, count, size, tmp1, tmp2); \
	} \
```
根（1 番）から始めます。`child_i = par_i * 2` が要素数 `nmemb` を超えるまで、つまり子がいる間ずっと降ります。
2 人の子のうち大きいほうを選び、その子を親の位置へ `COPY` します。
ここでは **`k` と比べていません**。比較は「子どうし」の 1 回だけです。
降りきったとき、`par_i` は底の位置を指しています。経路上の要素は 1 段ずつ上に繰り上がり、底に「空き」ができた状態です。

### 2. 底から `k` の居場所を探して昇る

```c:line-numbers=124
	for (;;) { \
		child_i = par_i; \
		par_i = child_i / 2; \
		child = base + child_i * size; \
		par = base + par_i * size; \
		if (child_i == 1 || COMPAR(k, par) < 0) { \
			COPY(child, k, count, size, tmp1, tmp2); \
			break; \
		} \
		COPY(child, par, count, size, tmp1, tmp2); \
	} \
```
今度は空いた位置 `child_i` から親 `par_i = child_i / 2` へ昇ります。
`k` が親より小さければ、そこが `k` の居場所なので `COPY` して終わります。そうでなければ親を下へ戻して、さらに上へ進みます。根（`child_i == 1`）に着いたら必ずそこに置きます。

### 3. 具体例

7 個のヒープ `[_, 9, 8, 7, 5, 6, 3, 4]`（0 番は未使用）から 9 を取り出し、末尾の 4 を `k` にしたとします。
降りる段階: 根の子 8 と 7 のうち 8 を上へ。8 の子 5 と 6 のうち 6 を上へ。6 は 5 番で子がないので止まります。
昇る段階: 5 番から親の 2 番（今は 6）と `k=4` を比べると 4 のほうが小さいので、5 番に 4 を置いて終わりです。

## ここがすごい

- **`k` はたいてい小さい**: マクロの上のコメントが説明しているとおり、`k` は配列の末尾、つまりヒープの底から持ってきた要素なので、ほとんどの場合また底のほうに戻ります。上から沈める素直な方法だと、1 段ごとに「子どうし」と「`k` と子」の 2 回比較します。この方法は降りるときに 1 段 1 回、昇るのはたいてい 1〜2 段だけなので、比較の回数がおよそ半分に近づきます。
- **比較関数がいちばん高い**: `qsort` 系の関数では比較が利用者の関数呼び出しになるので、コピーより比較のほうがずっと重くなりがちです。コメントには平均で 15〜20% 速くなると書かれ、出典として Knuth の『The Art of Computer Programming』第 3 巻が挙げられています。
- **要素が失われない**: 降りるときは「子を親へコピー」するだけなので、同じ値が 2 か所にある瞬間はあっても、消える値はありません。最後に `k` を空いた場所へ置けば、全員がそろいます（マクロの上のコメント）。
- **マクロにした理由**: 引数に変数名をたくさん渡しているのは、マクロが呼び出し元の変数を直接使うためです。関数呼び出しの手間をなくしたい古い C でよく見られる書き方です。マクロの上のコメントの最後の一文からは、昔のプリプロセッサに配慮して書かれたことも読み取れます。

## まとめ

- ヒープは配列で表せ、`i` の子は `2i` と `2i+1`、親は `i/2`。
- 配列の 1 つ手前を `base` にすると、1 から数える式をそのまま書ける。
- 「底まで降りてから昇る」と、小さい値を入れ直すときの比較が減る。
- 比較が高くつく汎用ソートでは、比較の回数を減らす工夫がそのまま速さになる。
