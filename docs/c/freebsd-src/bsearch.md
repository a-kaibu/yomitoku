---
title: "「残りの個数」だけを半分にしていく 7 行の二分探索"
description: "FreeBSD libc の bsearch。左右の端を 2 つ持つ代わりに、探索範囲の先頭 base と残りの個数 lim だけで二分探索を書き、lim >>= 1 と lim-- の組み合わせで右へ進む場合も正しく範囲を縮めている。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-3-Clause
copyright: "Copyright (c) 1990, 1993 The Regents of the University of California.  All rights reserved."
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/stdlib/bsearch.c
lines: [51, 123]
function: "bsearch"
difficulty: 2
format: 2
tags: [探索, アルゴリズム, 標準ライブラリ, イディオム]
---

## ひとことで

`bsearch` は、小さい順に並んだ配列から、目的の値（`key`）を **二分探索** で探す C 標準の関数です。見つかればその要素の場所を、なければ `NULL` を返します。
二分探索は「真ん中を見て、目的の値が大きければ右半分、小さければ左半分へ」を繰り返す方法で、100 万個の配列でも 20 回ほどの比較で見つかります。
FreeBSD の実装は、範囲を `base`（先頭）と `lim`（残りの個数）の 2 つだけで表すことで、ループ本体をわずか数行にしています。

## コード

::: code-group

```c:line-numbers=51 [日本語訳]
/*
 * 二分探索を行う。
 *
 * 下のコードは少しずるい。比較が一致しなかったら、左か右へ
 * 動いて仕事を半分にする。lim が奇数なら、左へ動くには
 * lim を半分にするだけでよい。たとえば lim が 5 なら 2 番を見たので、
 * lim を 2 にすれば 0 番と 1 番を見ることになる。lim が偶数でも同じ。
 * lim が奇数なら、右へ動くときも lim を半分にし、今度は
 * base を p の 1 つ先へ進める。たとえば lim が 5 なら base を
 * 3 番にして lim を 2 にすれば、3 番と 4 番を見ることになる。
 * ところが lim が偶数なら、半分にする前に 1 減らさなければ
 * ならない。たとえば lim が 4 でも 2 番を見たので、
 * lim を 3 にしてから半分にして 1 を得れば、3 番だけを
 * 見ることになる。
 *
 */
#ifdef I_AM_BSEARCH_B
void *
(bsearch_b)(const void *key, const void *base0, size_t nmemb, size_t size,
    compar_block compar)
#elif defined(I_AM_BSEARCH_S)
void *
(bsearch_s)(const void *key, const void *base0, rsize_t nmemb, rsize_t size,
    int (*compar)(const void *, const void *, void *), void *context)
#else
void *
(bsearch)(const void *key, const void *base0, size_t nmemb, size_t size,
    int (*compar)(const void *, const void *))
#endif
{
	const char *base = base0;
	size_t lim;
	int cmp;
	const void *p;

#ifdef I_AM_BSEARCH_S
	if (nmemb > RSIZE_MAX) {
		__throw_constraint_handler_s("bsearch_s : nmemb > RSIZE_MAX",
		    EINVAL);
		return (NULL);
	} else if (size > RSIZE_MAX) {
		__throw_constraint_handler_s("bsearch_s : size > RSIZE_MAX",
		    EINVAL);
		return (NULL);
	} else if (nmemb != 0) {
		if (key == NULL) {
			__throw_constraint_handler_s("bsearch_s : key == NULL",
			    EINVAL);
			return (NULL);
		} else if (base0 == NULL) {
			__throw_constraint_handler_s("bsearch_s : base == NULL",
			    EINVAL);
			return (NULL);
		} else if (compar == NULL) {
			__throw_constraint_handler_s("bsearch_s : compar == NULL",
			    EINVAL);
			return (NULL);
		}
	}
#endif

	for (lim = nmemb; lim != 0; lim >>= 1) {
		p = base + (lim >> 1) * size;
		cmp = COMPAR(key, p);
		if (cmp == 0)
			return ((void *)p);
		if (cmp > 0) {	/* key > p: 右へ動く */
			base = (char *)p + size;
			lim--;
		}		/* そうでなければ左へ動く */
	}
	return (NULL);
}
```

```c:line-numbers=51 [原文]
/*
 * Perform a binary search.
 *
 * The code below is a bit sneaky.  After a comparison fails, we
 * divide the work in half by moving either left or right. If lim
 * is odd, moving left simply involves halving lim: e.g., when lim
 * is 5 we look at item 2, so we change lim to 2 so that we will
 * look at items 0 & 1.  If lim is even, the same applies.  If lim
 * is odd, moving right again involves halving lim, this time moving
 * the base up one item past p: e.g., when lim is 5 we change base
 * to item 3 and make lim 2 so that we will look at items 3 and 4.
 * If lim is even, however, we have to shrink it by one before
 * halving: e.g., when lim is 4, we still looked at item 2, so we
 * have to make lim 3, then halve, obtaining 1, so that we will only
 * look at item 3.
 */
#ifdef I_AM_BSEARCH_B
void *
(bsearch_b)(const void *key, const void *base0, size_t nmemb, size_t size,
    compar_block compar)
#elif defined(I_AM_BSEARCH_S)
void *
(bsearch_s)(const void *key, const void *base0, rsize_t nmemb, rsize_t size,
    int (*compar)(const void *, const void *, void *), void *context)
#else
void *
(bsearch)(const void *key, const void *base0, size_t nmemb, size_t size,
    int (*compar)(const void *, const void *))
#endif
{
	const char *base = base0;
	size_t lim;
	int cmp;
	const void *p;

#ifdef I_AM_BSEARCH_S
	if (nmemb > RSIZE_MAX) {
		__throw_constraint_handler_s("bsearch_s : nmemb > RSIZE_MAX",
		    EINVAL);
		return (NULL);
	} else if (size > RSIZE_MAX) {
		__throw_constraint_handler_s("bsearch_s : size > RSIZE_MAX",
		    EINVAL);
		return (NULL);
	} else if (nmemb != 0) {
		if (key == NULL) {
			__throw_constraint_handler_s("bsearch_s : key == NULL",
			    EINVAL);
			return (NULL);
		} else if (base0 == NULL) {
			__throw_constraint_handler_s("bsearch_s : base == NULL",
			    EINVAL);
			return (NULL);
		} else if (compar == NULL) {
			__throw_constraint_handler_s("bsearch_s : compar == NULL",
			    EINVAL);
			return (NULL);
		}
	}
#endif

	for (lim = nmemb; lim != 0; lim >>= 1) {
		p = base + (lim >> 1) * size;
		cmp = COMPAR(key, p);
		if (cmp == 0)
			return ((void *)p);
		if (cmp > 0) {	/* key > p: move right */
			base = (char *)p + size;
			lim--;
		}		/* else move left */
	}
	return (NULL);
}
```

:::

## 前提知識

- **`void *` と `const void *`**: 型の決まっていないデータを指すポインタ（メモリ上の場所）です。`bsearch` はどんな型の配列でも探せるように、配列や `key` をこの形で受け取ります。`const` は「中身を書き換えない」という約束です。
- **`char *` でのポインタ計算**: 型がわからないので、配列を 1 バイトの並びとして扱い、`base + i * size` で `i` 番目の要素の場所を求めます。
- **関数ポインタ**: `int (*compar)(const void *, const void *)` は「2 つの要素を比べる関数」の場所を受け取る引数です。利用者が自分の比較関数を渡します。負なら 1 つ目が小さい、0 なら等しい、正なら 1 つ目が大きい、という決まりです。
- **`>>`（右シフト）**: ビットを右へずらす演算です。`lim >> 1` は `lim / 2`（切り捨て）と同じ意味で、`lim >>= 1` は `lim = lim / 2` です。
- **`#ifdef`**: 条件付きコンパイルです。`I_AM_BSEARCH_S` が定義されているときだけ、`#ifdef I_AM_BSEARCH_S` 〜 `#endif` の引数チェックが有効になります。同じファイルから `bsearch` と、安全版の `bsearch_s` の両方を作るための仕組みです。

## 何をしているか

### 1. 3 つの関数を 1 つのファイルから作る

```c:line-numbers=86
#ifdef I_AM_BSEARCH_S
	if (nmemb > RSIZE_MAX) {
		__throw_constraint_handler_s("bsearch_s : nmemb > RSIZE_MAX",
		    EINVAL);
		return (NULL);
	} else if (size > RSIZE_MAX) {
		__throw_constraint_handler_s("bsearch_s : size > RSIZE_MAX",
		    EINVAL);
		return (NULL);
	} else if (nmemb != 0) {
```
関数の頭は `#ifdef` で 3 通りに書き分けられ、ブロック版 `bsearch_b`、安全版 `bsearch_s`、通常の `bsearch` になります。
安全版では、個数や大きさが大きすぎないか、ポインタが `NULL` でないかを先に調べます。

### 2. 探索ループ

```c:line-numbers=112
	for (lim = nmemb; lim != 0; lim >>= 1) {
		p = base + (lim >> 1) * size;
		cmp = COMPAR(key, p);
		if (cmp == 0)
			return ((void *)p);
		if (cmp > 0) {	/* key > p: move right */
			base = (char *)p + size;
			lim--;
		}		/* else move left */
	}
```
範囲は「`base` から始まる `lim` 個」です。真ん中の要素 `p` は `base + (lim >> 1) * size` です。

- 等しければ見つかったので `p` を返します。
- `key` のほうが大きければ右へ進みます。`base` を `p` の 1 つ右にし、`lim` を 1 減らします。そのあと `for` の更新部分 `lim >>= 1` で半分になります。
- `key` のほうが小さければ何もしません。`lim >>= 1` だけで左半分に縮みます。

### 3. 具体例で追う

`[1, 3, 5, 7, 9]` から 9 を探します。

- `lim = 5`。真ん中は 2 番（値 5）。9 > 5 なので `base` を 3 番へ、`lim` を 4 にし、半分にして `lim = 2`。範囲は 3〜4 番。
- `lim = 2`。真ん中は 3 + 1 = 4 番（値 9）。一致したので返します。

今度は 2 を探します。`lim = 5` で 2 番（5）と比べて小さいので `lim = 2`、範囲は 0〜1 番。真ん中は 1 番（3）でまた小さいので `lim = 1`、範囲は 0 番。0 番（1）より大きいので `base` を 1 番、`lim` を 0 にし、半分にしても 0 なのでループを抜け、`NULL` を返します。

## ここがすごい

- **端を 2 つ持たない**: よくある二分探索は `low` と `high` を持ち、`mid = (low + high) / 2` を計算します。この足し算は、配列が非常に大きいと値があふれる（オーバーフローする）という有名なバグの原因になりました。この実装は「先頭」と「個数」だけを持ち、真ん中を `base + (lim >> 1) * size` と求めるので、そもそも足し算があふれる心配がありません。
- **奇数・偶数の扱いを 1 行で吸収する**: 右へ進むときの `lim--` が鍵です。関数の上の長いコメントが説明するとおり、`lim` が 5 なら真ん中（2 番）を除いた右側は 2 個、`lim` が 4 なら右側は 1 個です。どちらの場合も「1 減らしてから半分」で正しい個数になります。左へ進むときは半分にするだけで正しい個数になります。コメント自身が "a bit sneaky"（ちょっとずるい）と書いている技です。
- **場合分けが少ない**: `if` は「一致」と「右へ」の 2 つだけで、「左へ」はループの更新に任せています。短いコードは誤りも入りにくくなります。
- **1 つのソースから複数の版**: `#ifdef` とマクロ `COMPAR` によって、比較関数の呼び方だけが違う 3 つの関数を、本体のコードを重複させずに作っています。

## まとめ

- 二分探索は「先頭と個数」でも書ける。そうすると真ん中の計算があふれない。
- 右へ進むときに「1 減らしてから半分」にすると、奇数でも偶数でも正しく範囲が縮む。
- `void *` と関数ポインタを使えば、型に依存しない探索関数が書ける。
- `#ifdef` とマクロで、少しずつ違う関数を 1 つのソースから作れる。
