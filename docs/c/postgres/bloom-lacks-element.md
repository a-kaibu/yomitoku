---
title: "「確実に無い」だけを答えるブルームフィルタの検索"
description: "ブルームフィルタに要素が無いかを調べる関数。k 個のビット位置を順に見て、0 が 1 つでもあればすぐに「無い」と答える。名前を lacks にして、答えの確かさの向きを API で表している。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2018-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/backend/lib/bloomfilter.c
lines: [149, 172]
function: "bloom_lacks_element"
difficulty: 1
format: 2
tags: [データ構造, ビット演算, API設計, ハッシュ]
---

## ひとことで

`bloom_lacks_element` は、ブルームフィルタに値 `elem` が **確実に入っていないか** を調べます。入っていなければ `true`、入っている「かもしれない」なら `false` を返します。
ブルームフィルタは、値を追加するときに k 個のビットを 1 にするデータ構造です。調べるときに同じ k 個のビットのどれか 1 つでも 0 なら、その値は一度も追加されていないと断言できます。
たとえば k = 3 で、ビット位置が 5, 130, 77 なら、そのうち 1 つでも 0 だった時点で `true` を返します。

## コード

::: code-group

```c:line-numbers=149 [日本語訳]
/*
 * ブルームフィルタに要素が確実に無いかを調べる。
 *
 * bloom_add_element() で観測した要素の集合に確実に含まれないなら
 * true を返す。そうでなければ false を返し、
 * 要素がおそらく集合に存在することを示す。
 */
bool
bloom_lacks_element(bloom_filter *filter, unsigned char *elem, size_t len)
{
	uint32		hashes[MAX_HASH_FUNCS];
	int			i;

	k_hashes(filter, hashes, elem, len);

	/* ビット単位のアドレスを、バイト単位のアドレス + ビットの位置に対応させる */
	for (i = 0; i < filter->k_hash_funcs; i++)
	{
		if (!(filter->bitset[hashes[i] >> 3] & (1 << (hashes[i] & 7))))
			return true;
	}

	return false;
}
```

```c:line-numbers=149 [原文]
/*
 * Test if Bloom filter definitely lacks element.
 *
 * Returns true if the element is definitely not in the set of elements
 * observed by bloom_add_element().  Otherwise, returns false, indicating that
 * element is probably present in set.
 */
bool
bloom_lacks_element(bloom_filter *filter, unsigned char *elem, size_t len)
{
	uint32		hashes[MAX_HASH_FUNCS];
	int			i;

	k_hashes(filter, hashes, elem, len);

	/* Map a bit-wise address to a byte-wise address + bit offset */
	for (i = 0; i < filter->k_hash_funcs; i++)
	{
		if (!(filter->bitset[hashes[i] >> 3] & (1 << (hashes[i] & 7))))
			return true;
	}

	return false;
}
```

:::

## 前提知識

- **ブルームフィルタ**: 大きなビット列を使って「集合に入っているか」を判定するデータ構造です。追加したものは必ず「たぶん有る」と答えますが、追加していないものを「たぶん有る」と答えることがあります（偽陽性）。
- **ビット列をバイト配列で持つ**: C にはビット単位の配列がないので、`unsigned char`（1 バイト = 8 ビット）の配列 `bitset` で表します。ビット番号 `n` は、`n / 8` 番目のバイトの `n % 8` 番目のビットです。
- **`>> 3` と `& 7`**: `n >> 3` は 8 で割った商、`n & 7` は 8 で割った余りと同じです（8 は 2³ なので、ビット演算で計算できます）。
- **`1 << b`**: b 番目のビットだけが 1 の数です。`1 << 2` は `00000100` です。
- **`&` で調べる**: `byte & (1 << b)` は、`byte` の b 番目のビットが 1 なら 0 以外、0 なら 0 になります。`!` はそれを反転し、「0 だったら真」にします。
- **`unsigned char *elem` と `size_t len`**: 調べる値を「バイトの並び」として受け取ります。整数でも文字列でも、メモリ上のバイト列として渡せます。
- **`->`**: ポインタが指す構造体の項目を読む書き方です。

## 何をしているか

### 1. k 個のビット位置を計算する

```c:line-numbers=162
	k_hashes(filter, hashes, elem, len);
```

`k_hashes` が `elem` から k 個のハッシュ値を作り、すでにビット列の大きさで割った余り（0〜m-1）にして `hashes` 配列に入れます。追加のとき（`bloom_add_element`）とまったく同じ計算なので、同じ値なら同じ位置が出てきます。

### 2. 順に確かめる

```c:line-numbers=165
	for (i = 0; i < filter->k_hash_funcs; i++)
	{
		if (!(filter->bitset[hashes[i] >> 3] & (1 << (hashes[i] & 7))))
			return true;
	}
```

`hashes[i] = 130` なら、`130 >> 3 = 16` 番目のバイトの、`130 & 7 = 2` 番目のビットを見ます。そのビットが 0 なら、この値は一度も追加されていないので `true` を返して終わります。

### 3. 全部 1 なら「たぶん有る」

```c:line-numbers=171
	return false;
```

k 個すべてが 1 なら、追加されたか、たまたま別の値たちが同じ位置を 1 にしたかのどちらかです。区別できないので `false`（無いとは言えない）を返します。

## ここがすごい

- **名前が答えの確かさを表している**: 素直に作ると `bloom_contains`（含むか）という名前で `true` を返したくなります。しかしブルームフィルタの `true` は「たぶん」でしかありません。この関数は向きを逆にして `lacks`（欠けているか）とし、**`true` が返ったときだけは確実** という性質を名前で表現しています。呼ぶ側が「`true` なら高価な本当の検索を省ける」と正しく理解できる、誤用を防ぐ API 設計です。
- **0 を見つけたら即終了**: 入っていない値を調べるとき、たいていは最初の数個のビットで 0 が見つかります。k 個全部を調べずに済むので、ほとんどの問い合わせが速く終わります。
- **追加と同じ形のコード**: `bloom_add_element` は同じループで `|=` を使ってビットを立てるだけです。追加と検索のビット位置の計算が完全に同じ書き方なので、食い違いが起きません。
- **ハッシュ値を配列に一度に用意する**: `hashes` は `MAX_HASH_FUNCS`（10）個の固定長配列で、関数の中の一時領域に置かれます。メモリの確保が不要で、k が最大 10 という上限とも対応しています。

## まとめ

- ブルームフィルタの検索は「1 つでも 0 なら確実に無い」。
- ビット n は `bitset[n >> 3]` の `1 << (n & 7)` で読み書きできる。
- 確実な答えが `true` になるように関数名と戻り値の向きを決めると、誤用を防げる。
- 確実な答えが出た時点でループを抜けると、多くの問い合わせが速く終わる。
