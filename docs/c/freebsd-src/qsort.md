---
title: "「等しい要素」を両端に寄せて最後に真ん中へ集めるクイックソート"
description: "FreeBSD の qsort の心臓部。Bentley と McIlroy の論文に基づき、9 点からピボットを選び、等しい要素をまとめて扱う 3 分割と、小さい側だけ再帰する工夫を組み合わせている。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-3-Clause
copyright: "Copyright (c) 1992, 1993 The Regents of the University of California.  All rights reserved."
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/stdlib/qsort.c
lines: [122, 198]
function: "local_qsort"
difficulty: 3
format: 2
tags: [ソート, アルゴリズム, 標準ライブラリ, 最適化]
---

## ひとことで

`qsort` は C 標準の並べ替え関数で、配列と「2 つの要素を比べる関数」を渡すと、その順に並べ替えてくれます。
FreeBSD の実装は、ファイル中のコメントにあるとおり Bentley と McIlroy の論文 "Engineering a Sort Function" の方式です。
ここで読むのは、要素が 7 個以上のときに走る本体部分です。**ピボット（基準値）の選び方**、**ピボットと等しい要素の扱い**、**再帰の深さを抑える工夫** の 3 つが詰まっています。

## コード

::: code-group

```c:line-numbers=122 [日本語訳]
	pm = (char *)a + (n / 2) * es;
	if (n > 7) {
		pl = a;
		pn = (char *)a + (n - 1) * es;
		if (n > 40) {
			size_t d = (n / 8) * es;

			pl = med3(pl, pl + d, pl + 2 * d, cmp, thunk);
			pm = med3(pm - d, pm, pm + d, cmp, thunk);
			pn = med3(pn - 2 * d, pn - d, pn, cmp, thunk);
		}
		pm = med3(pl, pm, pn, cmp, thunk);
	}
	swapfunc(a, pm, es);
	pa = pb = (char *)a + es;

	pc = pd = (char *)a + (n - 1) * es;
	for (;;) {
		while (pb <= pc && (cmp_result = CMP(thunk, pb, a)) <= 0) {
			if (cmp_result == 0) {
				swapfunc(pa, pb, es);
				pa += es;
			}
			pb += es;
		}
		while (pb <= pc && (cmp_result = CMP(thunk, pc, a)) >= 0) {
			if (cmp_result == 0) {
				swapfunc(pc, pd, es);
				pd -= es;
			}
			pc -= es;
		}
		if (pb > pc)
			break;
		swapfunc(pb, pc, es);
		pb += es;
		pc -= es;
	}

	pn = (char *)a + n * es;
	d1 = MIN(pa - (char *)a, pb - pa);
	vecswap(a, pb - d1, d1);
	/*
	 * MIN() の右辺の符号を保つために es をキャストし、暗黙の比較で
	 * 符号のあいまいさが出ないようにする。es は
	 * 確実に [0, SSIZE_MAX] の範囲にある。
	 */
	d1 = MIN(pd - pc, pn - pd - (ssize_t)es);
	vecswap(pb, pn - d1, d1);

	d1 = pb - pa;
	d2 = pd - pc;
	if (d1 <= d2) {
		/* 左の区画は再帰し、右の区画はループで続ける */
		if (d1 > es) {
			local_qsort(a, d1 / es, es, cmp, thunk);
		}
		if (d2 > es) {
			/* スタックを節約するため、再帰せずにループで続ける */
			/* qsort(pn - d2, d2 / es, es, cmp); */
			a = pn - d2;
			n = d2 / es;
			goto loop;
		}
	} else {
		/* 右の区画は再帰し、左の区画はループで続ける */
		if (d2 > es) {
			local_qsort(pn - d2, d2 / es, es, cmp, thunk);
		}
		if (d1 > es) {
			/* スタックを節約するため、再帰せずにループで続ける */
			/* qsort(a, d1 / es, es, cmp); */
			n = d1 / es;
			goto loop;
		}
	}
}
```

```c:line-numbers=122 [原文]
	pm = (char *)a + (n / 2) * es;
	if (n > 7) {
		pl = a;
		pn = (char *)a + (n - 1) * es;
		if (n > 40) {
			size_t d = (n / 8) * es;

			pl = med3(pl, pl + d, pl + 2 * d, cmp, thunk);
			pm = med3(pm - d, pm, pm + d, cmp, thunk);
			pn = med3(pn - 2 * d, pn - d, pn, cmp, thunk);
		}
		pm = med3(pl, pm, pn, cmp, thunk);
	}
	swapfunc(a, pm, es);
	pa = pb = (char *)a + es;

	pc = pd = (char *)a + (n - 1) * es;
	for (;;) {
		while (pb <= pc && (cmp_result = CMP(thunk, pb, a)) <= 0) {
			if (cmp_result == 0) {
				swapfunc(pa, pb, es);
				pa += es;
			}
			pb += es;
		}
		while (pb <= pc && (cmp_result = CMP(thunk, pc, a)) >= 0) {
			if (cmp_result == 0) {
				swapfunc(pc, pd, es);
				pd -= es;
			}
			pc -= es;
		}
		if (pb > pc)
			break;
		swapfunc(pb, pc, es);
		pb += es;
		pc -= es;
	}

	pn = (char *)a + n * es;
	d1 = MIN(pa - (char *)a, pb - pa);
	vecswap(a, pb - d1, d1);
	/*
	 * Cast es to preserve signedness of right-hand side of MIN()
	 * expression, to avoid sign ambiguity in the implied comparison.  es
	 * is safely within [0, SSIZE_MAX].
	 */
	d1 = MIN(pd - pc, pn - pd - (ssize_t)es);
	vecswap(pb, pn - d1, d1);

	d1 = pb - pa;
	d2 = pd - pc;
	if (d1 <= d2) {
		/* Recurse on left partition, then iterate on right partition */
		if (d1 > es) {
			local_qsort(a, d1 / es, es, cmp, thunk);
		}
		if (d2 > es) {
			/* Iterate rather than recurse to save stack space */
			/* qsort(pn - d2, d2 / es, es, cmp); */
			a = pn - d2;
			n = d2 / es;
			goto loop;
		}
	} else {
		/* Recurse on right partition, then iterate on left partition */
		if (d2 > es) {
			local_qsort(pn - d2, d2 / es, es, cmp, thunk);
		}
		if (d1 > es) {
			/* Iterate rather than recurse to save stack space */
			/* qsort(a, d1 / es, es, cmp); */
			n = d1 / es;
			goto loop;
		}
	}
}
```

:::

## 前提知識

- **クイックソート**: 基準になる値（ピボット）を 1 つ選び、それより小さいものを左、大きいものを右に分け、左右をそれぞれ同じ方法で並べ替えるアルゴリズムです。
- **`char *` で汎用の配列を扱う**: `qsort` は整数でも構造体でも並べられるよう、配列を「バイトの並び」として受け取ります。要素 1 個の大きさが `es` バイトなので、`i` 番目の要素は `(char *)a + i * es` の場所にあります。`char` は 1 バイトなので、ポインタに足した数がそのままバイト数になります。
- **ポインタ**: メモリ上の場所を指す値です。`pa`、`pb` などはすべて配列内のどこかを指すポインタです。`pb += es` で 1 要素ぶん右へ進みます。
- **ポインタの引き算**: `pb - pa` は 2 つの場所の間のバイト数です。`es` で割ると要素数になります。
- **`CMP(thunk, x, y)`**: ファイルの前半で定義されたマクロ（コンパイル前の文字の置き換え）で、利用者の比較関数を呼びます。負なら x が先、0 なら等しい、正なら x が後です。
- **`swapfunc` / `vecswap`**: ファイルの前半で定義された、`es` バイトの領域を 1 バイトずつ入れ替える関数と、`n` バイトぶんまとめて入れ替えるマクロです。
- **`goto loop`**: 関数の先頭近くの `loop:` という目印へ飛ぶ命令です。ここでは再帰呼び出しの代わりに使われています。

## 何をしているか

### 1. ピボットを選ぶ

```c:line-numbers=122
	pm = (char *)a + (n / 2) * es;
	if (n > 7) {
		pl = a;
		pn = (char *)a + (n - 1) * es;
		if (n > 40) {
			size_t d = (n / 8) * es;

			pl = med3(pl, pl + d, pl + 2 * d, cmp, thunk);
			pm = med3(pm - d, pm, pm + d, cmp, thunk);
			pn = med3(pn - 2 * d, pn - d, pn, cmp, thunk);
		}
		pm = med3(pl, pm, pn, cmp, thunk);
	}
	swapfunc(a, pm, es);
```
まず真ん中の要素 `pm` を候補にします。要素数が 8 以上なら先頭 `pl`・末尾 `pn` と合わせた 3 つの「中央値」を `med3` で選びます。
さらに 40 個を超えると、配列を 8 等分した間隔 `d` で 3 点ずつ、合計 9 点を取り、3 つの中央値のさらに中央値を取ります（ninther と呼ばれる方法）。
たとえば 100 個なら `d` は 12 要素ぶんで、先頭付近・中央付近・末尾付近からそれぞれ 3 点を見ます。選んだピボットは `swapfunc(a, pm, es)` で配列の先頭 `a` に移します。

### 2. 4 つのポインタで分割する

```c:line-numbers=136
	pa = pb = (char *)a + es;

	pc = pd = (char *)a + (n - 1) * es;
	for (;;) {
		while (pb <= pc && (cmp_result = CMP(thunk, pb, a)) <= 0) {
			if (cmp_result == 0) {
				swapfunc(pa, pb, es);
				pa += es;
			}
			pb += es;
		}
		while (pb <= pc && (cmp_result = CMP(thunk, pc, a)) >= 0) {
			if (cmp_result == 0) {
				swapfunc(pc, pd, es);
				pd -= es;
			}
			pc -= es;
		}
		if (pb > pc)
			break;
		swapfunc(pb, pc, es);
		pb += es;
		pc -= es;
	}
```
`pa` と `pb` は左端から、`pc` と `pd` は右端から始まります。
`pb` はピボット以下の要素の上を右へ進み、ピボットと **等しい** 要素を見つけると `pa` の位置へ入れ替えて左端に寄せます。
`pc` は逆に右から左へ進み、等しい要素を右端 `pd` へ寄せます。
両方が止まったら `pb` と `pc` の要素を入れ替えて続けます。終わると配列はこう並びます。

```
[ =ピボット | <ピボット | >ピボット | =ピボット ]
 a        pa          pb/pc        pd        pn
```

### 3. 等しい要素を真ん中へ戻す

```c:line-numbers=161
	pn = (char *)a + n * es;
	d1 = MIN(pa - (char *)a, pb - pa);
	vecswap(a, pb - d1, d1);
	/*
	 * Cast es to preserve signedness of right-hand side of MIN()
	 * expression, to avoid sign ambiguity in the implied comparison.  es
	 * is safely within [0, SSIZE_MAX].
	 */
	d1 = MIN(pd - pc, pn - pd - (ssize_t)es);
	vecswap(pb, pn - d1, d1);
```
両端に寄せた「等しい要素」を `vecswap` で中央へ移します。左端の塊と「小さい塊」の短いほうの長さ `d1` だけ入れ替えれば足りるので、無駄がありません。
こうして `[ < | = | > ]` の 3 つに分かれ、真ん中の `=` はもう並べ替える必要がありません。

### 4. 小さい側だけ再帰する

```c:line-numbers=172
	d1 = pb - pa;
	d2 = pd - pc;
	if (d1 <= d2) {
		/* Recurse on left partition, then iterate on right partition */
		if (d1 > es) {
			local_qsort(a, d1 / es, es, cmp, thunk);
		}
		if (d2 > es) {
			/* Iterate rather than recurse to save stack space */
			/* qsort(pn - d2, d2 / es, es, cmp); */
			a = pn - d2;
			n = d2 / es;
			goto loop;
		}
```
`d1` は「小さい塊」、`d2` は「大きい塊」のバイト数です。短いほうを再帰呼び出しで処理し、長いほうは `a` と `n` を書き換えて `goto loop` で先頭へ戻ります。

## ここがすごい

- **同じ値が多くても遅くならない**: 素直なクイックソートは、全部が同じ値の配列で分割が偏り、とても遅くなることがあります。この 3 分割では等しい要素が一度に「確定」するので、たとえば全要素が同じなら 1 回の分割で終わります。
- **ピボットの質を段階的に上げる**: 小さな配列で 9 点も比べるのは損なので、7 個以下は挿入ソート、40 個以下は 3 点、それより多いと 9 点と使い分けています。比較関数の呼び出しはコストが高いので、ここで手間を惜しまないのが効いてきます。
- **スタックが深くならない**: 再帰するのは常に小さいほうなので、1 段深くなるたびに対象は半分以下になります。再帰の深さは要素数の log2 程度に収まります。長いほうを `goto` で続ける書き方は、関数の末尾での再帰呼び出しを手でループに直したものです。`goto` の手前のコメントに、元の再帰呼び出しが残されています。
- **型を知らない汎用関数**: 要素の型を一切知らず、バイト数 `es` だけで動いています。C で「何でも並べられる関数」を書くときの典型的な形です。

## まとめ

- ピボットは 3 点や 9 点の中央値で選ぶと、偏ったデータに強くなる。
- 等しい要素を両端に逃がしてから中央に戻す 3 分割で、重複の多いデータも速く並べられる。
- 小さい側だけ再帰し、大きい側はループにすると、スタックの深さを log n に抑えられる。
- `char *` とバイト数で計算すれば、型に依存しない汎用の配列処理が書ける。
