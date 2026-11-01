---
title: "1 要素 2 バイトを目安に、2 のべき乗ビットで作るブルームフィルタ"
description: "ブルームフィルタを作る関数。要素数の見積もりとメモリ上限から大きさを決め、2 のべき乗のビット数に切り下げ、構造体の末尾に可変長の配列を付けて一度に確保する。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2018-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/backend/lib/bloomfilter.c
lines: [60, 120]
function: "bloom_create"
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, ハッシュ, 設計パターン]
---

## ひとことで

`bloom_create` は、**ブルームフィルタ** を作って返す関数です。ブルームフィルタは「ある値が集合に入っているか」を、とても少ないメモリで判定できるデータ構造です。ただし「入っていないのに入っているかも、と答える」誤り（偽陽性）が少しだけ起きます。逆の誤りは起きません。
たとえば `total_elems = 1000万`、`bloom_work_mem = 64MB` で呼ぶと、1 要素あたり 2 バイトを目安に 2000 万バイト（約 19MB）を求め、それ以下で最大の 2 のべき乗である 16MB（2²⁷ ビット）のビット列を持つフィルタができます。
PostgreSQL では索引の整合性チェックなどで使われています。

## コード

::: code-group

```c:line-numbers=60 [日本語訳]
/*
 * 呼び出し側のメモリコンテキストにブルームフィルタを作る。ビット列の大きさが
 * メモリの量で制限されないときは、偽陽性率 1%〜2% を目標にする。
 * availability.
 *
 * total_elems は集合の最終的な大きさの見積もり。おおよそ正しいことが
 * 望ましいが、実装は 5 倍かそれ以上ずれても十分に対処できる。その理由は
 * "Bloom Filters in
 * Probabilistic Verification"（Dillinger & Manolios, 2004）を
 * 参照。
 *
 * bloom_work_mem は、一般的な work_mem の慣習に合わせて KB 単位。
 * これが土台のビット列の大きさを決める（わずかな管理用の領域は
 * 数えない）。ビット列は常に 2 のべき乗のビット数で、
 * 最大は 512MB（2^32 ビット）。
 * 実装は、標準の偽陽性率を目指すのに十分なメモリだけを確保し、
 * その計算には呼び出し側の total_elems の見積もりを入力とする簡単な式を使う。
 * bloom_work_mem がずっと大きくても、ビット列は 1MB ほどの
 * 小ささになることがある。
 *
 * ブルームフィルタは呼び出し側が渡す値でシードされる。呼び出しごとに
 * 違うシードを使えば、同じ集合を 2 度目に指紋化したときに、同じ偽陽性が
 * 再び起きる可能性は低くなる。
 * これを気にしない呼び出し側は定数（ふつうは 0）をシードに渡す。
 * pg_prng_uint64() などの疑似乱数をシードにしてもよい。
 */
bloom_filter *
bloom_create(int64 total_elems, int bloom_work_mem, uint64 seed)
{
	bloom_filter *filter;
	int			bloom_power;
	uint64		bitset_bytes;
	uint64		bitset_bits;

	/*
	 * 1 要素あたり 2 バイトを目指す。ビット列の大きさや要素の総数に
	 * よらず、これで偽陽性率を 1% 未満にできる。また、ビット列の大きさを
	 * 1 つ下の 2 のべき乗に切り下げたことで大きく
	 * 減ってしまった場合でも、ほとんどすべての場合で
	 * 偽陽性率は 2% を超えない。
	 */
	bitset_bytes = Min(bloom_work_mem * UINT64CONST(1024), total_elems * 2);
	bitset_bytes = Max(1024 * 1024, bitset_bytes);

	/*
	 * ビット数は目標以下で最大の 2 のべき乗にする。bitset_bits が
	 * uint64 なのは、PG_UINT32_MAX が 2^32 ではなく 2^32 - 1 だから
	 */
	bloom_power = my_bloom_power(bitset_bytes * BITS_PER_BYTE);
	bitset_bits = UINT64CONST(1) << bloom_power;
	bitset_bytes = bitset_bits / BITS_PER_BYTE;

	/* ビットが立っていない状態のブルームフィルタを確保する */
	filter = palloc0(offsetof(bloom_filter, bitset) +
					 sizeof(unsigned char) * bitset_bytes);
	filter->k_hash_funcs = optimal_k(bitset_bits, total_elems);
	filter->seed = seed;
	filter->m = bitset_bits;

	return filter;
}
```

```c:line-numbers=60 [原文]
/*
 * Create Bloom filter in caller's memory context.  We aim for a false positive
 * rate of between 1% and 2% when bitset size is not constrained by memory
 * availability.
 *
 * total_elems is an estimate of the final size of the set.  It should be
 * approximately correct, but the implementation can cope well with it being
 * off by perhaps a factor of five or more.  See "Bloom Filters in
 * Probabilistic Verification" (Dillinger & Manolios, 2004) for details of why
 * this is the case.
 *
 * bloom_work_mem is sized in KB, in line with the general work_mem convention.
 * This determines the size of the underlying bitset (trivial bookkeeping space
 * isn't counted).  The bitset is always sized as a power of two number of
 * bits, and the largest possible bitset is 512MB (2^32 bits).  The
 * implementation allocates only enough memory to target its standard false
 * positive rate, using a simple formula with caller's total_elems estimate as
 * an input.  The bitset might be as small as 1MB, even when bloom_work_mem is
 * much higher.
 *
 * The Bloom filter is seeded using a value provided by the caller.  Using a
 * distinct seed value on every call makes it unlikely that the same false
 * positives will reoccur when the same set is fingerprinted a second time.
 * Callers that don't care about this pass a constant as their seed, typically
 * 0.  Callers can also use a pseudo-random seed, eg from pg_prng_uint64().
 */
bloom_filter *
bloom_create(int64 total_elems, int bloom_work_mem, uint64 seed)
{
	bloom_filter *filter;
	int			bloom_power;
	uint64		bitset_bytes;
	uint64		bitset_bits;

	/*
	 * Aim for two bytes per element; this is sufficient to get a false
	 * positive rate below 1%, independent of the size of the bitset or total
	 * number of elements.  Also, if rounding down the size of the bitset to
	 * the next lowest power of two turns out to be a significant drop, the
	 * false positive rate still won't exceed 2% in almost all cases.
	 */
	bitset_bytes = Min(bloom_work_mem * UINT64CONST(1024), total_elems * 2);
	bitset_bytes = Max(1024 * 1024, bitset_bytes);

	/*
	 * Size in bits should be the highest power of two <= target.  bitset_bits
	 * is uint64 because PG_UINT32_MAX is 2^32 - 1, not 2^32
	 */
	bloom_power = my_bloom_power(bitset_bytes * BITS_PER_BYTE);
	bitset_bits = UINT64CONST(1) << bloom_power;
	bitset_bytes = bitset_bits / BITS_PER_BYTE;

	/* Allocate bloom filter with unset bitset */
	filter = palloc0(offsetof(bloom_filter, bitset) +
					 sizeof(unsigned char) * bitset_bytes);
	filter->k_hash_funcs = optimal_k(bitset_bits, total_elems);
	filter->seed = seed;
	filter->m = bitset_bits;

	return filter;
}
```

:::

## 前提知識

- **ブルームフィルタのしくみ**: 大きなビット列（最初は全部 0）を用意し、値を追加するときは、その値から計算した k 個のハッシュ値の位置のビットを 1 にします。調べるときは同じ k 個の位置を見て、1 つでも 0 なら「確実に入っていない」、全部 1 なら「たぶん入っている」と答えます。
- **ハッシュ値**: データから計算される「指紋」のような数です。
- **`struct` と `->`**: `struct` は複数の値をひとまとめにした型です。ポインタ `filter` が指す構造体の項目 `m` は `filter->m` と書きます。
- **フレキシブル配列メンバ**: 構造体の最後の項目を大きさを決めない配列（ここでは `bitset[FLEXIBLE_ARRAY_MEMBER]`）にしておくと、構造体と配列を **ひと続きのメモリ** として確保できます。
- **`offsetof(型, 項目)`**: 構造体の先頭からその項目までのバイト数です。可変長配列の手前までの大きさを求めるのに使います。
- **`palloc0`**: PostgreSQL のメモリ確保関数で、確保した領域を 0 で埋めます（`0` が付かない `palloc` は埋めません）。
- **`Min` / `Max`**: 小さいほう・大きいほうを返すマクロです。`UINT64CONST(1024)` は 64 ビットの定数 1024 です。
- **`<<`**: 左シフト。`1 << 27` は 2²⁷ です。

## 何をしているか

### 1. 目標のバイト数を決める

```c:line-numbers=101
	bitset_bytes = Min(bloom_work_mem * UINT64CONST(1024), total_elems * 2);
	bitset_bytes = Max(1024 * 1024, bitset_bytes);
```

関数の中のコメントによれば、1 要素につき 2 バイト（16 ビット）あれば、偽陽性率を 1% 未満にできます。そこで「メモリ上限」と「要素数 × 2」の小さいほうを選び、さらに最低 1MB を保証します。
`total_elems = 1000万`、`bloom_work_mem = 65536`（KB 単位で 64MB）なら、`Min(64MB, 2000万バイト)` で 2000 万バイト、`Max(1MB, 2000万バイト)` も 2000 万バイトのままです。

### 2. 2 のべき乗に切り下げる

```c:line-numbers=108
	bloom_power = my_bloom_power(bitset_bytes * BITS_PER_BYTE);
	bitset_bits = UINT64CONST(1) << bloom_power;
	bitset_bytes = bitset_bits / BITS_PER_BYTE;
```

`my_bloom_power` は、目標のビット数以下で最大の 2 のべき乗の指数を返します（上限 32）。2000 万バイトは 1 億 6000 万ビットなので、それ以下で最大の 2 のべき乗は 2²⁷ = 134,217,728 ビット（16MB）です。
`bitset_bits` が `uint64` なのは、最大の 2³² が 32 ビット整数に入らないからです（コメントにもそう書かれています）。

### 3. 構造体とビット列をまとめて確保する

```c:line-numbers=113
	filter = palloc0(offsetof(bloom_filter, bitset) +
					 sizeof(unsigned char) * bitset_bytes);
```

`offsetof(bloom_filter, bitset)`（管理用の項目の大きさ）にビット列のバイト数を足して `palloc0` で確保します。0 で埋まるので、ビット列は最初から「何も入っていない」状態です。

### 4. 設定を書き込む

```c:line-numbers=115
	filter->k_hash_funcs = optimal_k(bitset_bits, total_elems);
	filter->seed = seed;
	filter->m = bitset_bits;
```

ハッシュ関数の数 k を `optimal_k` で求め、シードとビット数を保存して返します。

## ここがすごい

- **2 のべき乗にそろえる理由**: ビット数を 2 のべき乗にすると、ハッシュ値をビット位置に変換する「余りの計算」を AND 1 回で済ませられます（同じファイルの `mod_m`）。割り算は遅い命令なので、追加や検索のたびに効いてきます。
- **切り下げても大丈夫な余裕を持たせる**: 2 のべき乗に切り下げると、最悪で目標の半分近くまで小さくなります。それでも 2% を超えにくいように、最初から 1 要素 2 バイトという余裕のある目標を置いています。
- **見積もりの誤差に強い**: 関数の前のコメントによれば、要素数の見積もりが 5 倍程度ずれても実用上は問題ないとされます。呼ぶ側が正確な数を知らなくても使える API です。
- **1 回の確保で済ませる**: 構造体とビット列を別々に確保すると、確保と解放が 2 回ずつ必要で、ポインタを 1 段たどる手間も増えます。フレキシブル配列メンバを使うと、確保は 1 回、解放も `pfree` 1 回（`bloom_free`）で済み、管理情報とビット列がメモリ上で隣り合います。
- **上限 2³² ビットの意味**: ビット位置を 32 ビットのハッシュ値で表せるようにするための上限です（`my_bloom_power` のコメントより）。512MB あれば現在の用途に十分で、PostgreSQL の 1 回の確保の上限にも収まります。

## まとめ

- ブルームフィルタは「確実に無い」か「たぶん有る」を少ないメモリで答える。
- 大きさを 2 のべき乗にそろえると、余りの計算を AND にできる。
- 切り下げで小さくなることを見込んで、目標に余裕を持たせる。
- 構造体の末尾に可変長配列を置くと、ひと続きのメモリとして 1 回で確保できる。
