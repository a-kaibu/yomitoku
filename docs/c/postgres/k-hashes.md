---
title: "ハッシュ 1 回から k 個の位置を作る「拡張ダブルハッシュ」"
description: "ブルームフィルタで使う k 個のビット位置を作る関数。64 ビットのハッシュ値を 2 つに割り、足し算を繰り返すだけで k 個の位置を生み出す。2 のべき乗の大きさで起きる偏りも避けている。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2018-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/backend/lib/bloomfilter.c
lines: [236, 276]
function: "k_hashes"
difficulty: 3
format: 2
tags: [ハッシュ, アルゴリズム, 最適化, データ構造]
---

## ひとことで

`k_hashes` は、ブルームフィルタで使う **k 個のビット位置** を計算して、配列 `hashes` に書き込みます。
ブルームフィルタは本来、独立した k 個のハッシュ関数を必要とします。しかし k 回ハッシュを計算するのは高くつきます。そこでこの関数は、**ハッシュを 1 回だけ** 計算し、それを 2 つの値 `x` と `y` に分け、足し算を繰り返して k 個の位置を作り出します。
関数の前のコメントによると、これは「拡張ダブルハッシュ」（enhanced double hashing）と呼ばれる方法です。

## コード

::: code-group

```c:line-numbers=236 [日本語訳]
/*
 * 要素の k 個のハッシュ値を生成する。
 *
 * 呼び出し側が配列を渡し、そこに呼び出し側の要素をハッシュして決めた
 * k 個の値が書き込まれる。
 *
 * 最大 MAX_HASH_FUNCS 個のハッシュ関数というインターフェースを支えるのに、
 * 本当に独立したハッシュ関数は 2 つしか使っていない。拡張ダブルハッシュで
 * これを実現している。古典的なダブルハッシュより拡張ダブルハッシュを好む
 * 主な理由は、前者には 2 のべき乗の大きさのビット列を使うと
 * 衝突が起きやすい問題があること。詳しくは Dillinger & Manolios を
 * 参照。
 */
static void
k_hashes(bloom_filter *filter, uint32 *hashes, unsigned char *elem, size_t len)
{
	uint64		hash;
	uint32		x,
				y;
	uint64		m;
	int			i;

	/* 64 ビットのハッシュで、独立した 32 ビットのハッシュを 2 つ得る */
	hash = hash_bytes_extended(elem, len, filter->seed);
	x = (uint32) hash;
	y = (uint32) (hash >> 32);
	m = filter->m;

	x = mod_m(x, m);
	y = mod_m(y, m);

	/* ハッシュ値をためていく */
	hashes[0] = x;
	for (i = 1; i < filter->k_hash_funcs; i++)
	{
		x = mod_m(x + y, m);
		y = mod_m(y + i, m);

		hashes[i] = x;
	}
}
```

```c:line-numbers=236 [原文]
/*
 * Generate k hash values for element.
 *
 * Caller passes array, which is filled-in with k values determined by hashing
 * caller's element.
 *
 * Only 2 real independent hash functions are actually used to support an
 * interface of up to MAX_HASH_FUNCS hash functions; enhanced double hashing is
 * used to make this work.  The main reason we prefer enhanced double hashing
 * to classic double hashing is that the latter has an issue with collisions
 * when using power of two sized bitsets.  See Dillinger & Manolios for full
 * details.
 */
static void
k_hashes(bloom_filter *filter, uint32 *hashes, unsigned char *elem, size_t len)
{
	uint64		hash;
	uint32		x,
				y;
	uint64		m;
	int			i;

	/* Use 64-bit hashing to get two independent 32-bit hashes */
	hash = hash_bytes_extended(elem, len, filter->seed);
	x = (uint32) hash;
	y = (uint32) (hash >> 32);
	m = filter->m;

	x = mod_m(x, m);
	y = mod_m(y, m);

	/* Accumulate hashes */
	hashes[0] = x;
	for (i = 1; i < filter->k_hash_funcs; i++)
	{
		x = mod_m(x + y, m);
		y = mod_m(y + i, m);

		hashes[i] = x;
	}
}
```

:::

## 前提知識

- **ブルームフィルタ**: 値を追加するとき、ビット列の k か所を 1 にするデータ構造です。調べるときは同じ k か所を見ます。位置どうしが似通っていると、誤判定が増えます。
- **ハッシュ値とシード**: ハッシュ値はデータの「指紋」となる数です。`hash_bytes_extended` は、バイト列とシード（結果を変える種）から 64 ビットのハッシュ値を返す関数です。
- **`(uint32) hash` と `(uint32) (hash >> 32)`**: 64 ビットの値の下半分と上半分を、それぞれ 32 ビットの値として取り出します。
- **`mod_m(v, m)`**: 同じファイルにある関数で、`v` を `m` で割った余りを返します。`m` は 2 のべき乗なので、`v & (m - 1)` という AND 1 回で計算しています。
- **配列とポインタ**: `uint32 *hashes` は、呼ぶ側が用意した配列の先頭を指します。`hashes[i] = x` で i 番目に書き込みます。
- **`->`**: ポインタが指す構造体の項目を読む書き方です。`filter->m` はビット列の大きさ（ビット数）です。

## 何をしているか

### 1. 64 ビットのハッシュを 2 つに割る

```c:line-numbers=259
	hash = hash_bytes_extended(elem, len, filter->seed);
	x = (uint32) hash;
	y = (uint32) (hash >> 32);
	m = filter->m;
```

`hash_bytes_extended` で 1 回だけハッシュを計算し、下位 32 ビットを `x`、上位 32 ビットを `y` にします。よく混ざった 64 ビットのハッシュなら、2 つの半分はほぼ独立した値とみなせます（コードのコメントより）。

### 2. ビット列の大きさに収める

```c:line-numbers=264
	x = mod_m(x, m);
	y = mod_m(y, m);
```

`x` と `y` を `m` で割った余りにします。

### 3. 足し算で次々に位置を作る

```c:line-numbers=268
	hashes[0] = x;
	for (i = 1; i < filter->k_hash_funcs; i++)
	{
		x = mod_m(x + y, m);
		y = mod_m(y + i, m);

		hashes[i] = x;
	}
```

最初の位置は `x` です。そのあとは毎回

- `x = x + y`（m で割った余り）
- `y = y + i`（m で割った余り）

として、新しい `x` を記録します。
たとえば `m = 16`、`x = 3`、`y = 5`、k = 4 なら:

- `hashes[0] = 3`
- i=1: `x = 8`、`y = 6` → `hashes[1] = 8`
- i=2: `x = 14`、`y = 8` → `hashes[2] = 14`
- i=3: `x = 22 % 16 = 6`、`y = 11` → `hashes[3] = 6`

と、4 つの位置 3, 8, 14, 6 が得られます。

## ここがすごい

- **ハッシュ計算は 1 回だけ**: k = 10 なら、素直に作ると 10 回ハッシュを計算することになります。この方法では 1 回のハッシュと、数回の足し算と AND だけです。値を追加するたび・調べるたびに走る処理なので、差は大きくなります。
- **なぜ「拡張」なのか**: 古典的なダブルハッシュは `x + i*y` という形で、`y` は固定です。ところが `m` が 2 のべき乗で `y` が偶数だと、位置が偶数番目のビットばかりに偏るなど、とり得る位置が狭まってしまいます。極端な話、`y` が 0 なら k 個の位置が全部同じになります。この関数は毎回 `y` に `i` を足して `y` 自体を変化させるので、こうした偏りが起きにくくなります。関数の前のコメントが、2 のべき乗の大きさで古典的な方法に問題があることを、この選択の主な理由として挙げています。
- **2 のべき乗との組み合わせ**: ビット列の大きさを 2 のべき乗にしたことで余りは AND で計算でき、その副作用として起きる偏りは拡張ダブルハッシュで抑える、という設計の両面がそろっています。
- **出典を明記**: 手法の名前と論文の著者（Dillinger & Manolios）をコメントに書いているので、読む人が根拠をたどれます。

## まとめ

- ブルームフィルタの k 個のハッシュは、1 個の良いハッシュを 2 つに割れば作れる（ダブルハッシュ）。
- `y` も毎回変える「拡張」版にすると、2 のべき乗の大きさでも位置が偏りにくい。
- 余りの計算は、大きさを 2 のべき乗にしておけば AND 1 回。
- 手法を採用したら、名前と出典をコメントに残す。
