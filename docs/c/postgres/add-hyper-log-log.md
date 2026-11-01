---
title: "ハッシュの先頭で箱を選び、残りの「先頭の 0 の数」だけ覚える HyperLogLog"
description: "異なる値の個数を推定する HyperLogLog に 1 つ値を加える関数。ハッシュ値の上位ビットでレジスタを選び、残りのビットで最初の 1 が出る位置を記録する。最大値だけ覚えるので、同じ値を何度加えても状態は変わらない。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL AND MIT
copyright: "Portions Copyright (c) 2014-2026, PostgreSQL Global Development Group; Copyright (c) 2013 Hideaki Ohno"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/backend/lib/hyperloglog.c
lines: [157, 180]
function: "addHyperLogLog"
difficulty: 3
format: 2
tags: [アルゴリズム, ハッシュ, ビット演算, データ構造]
---

## ひとことで

`addHyperLogLog` は、**HyperLogLog**（ハイパーログログ）という推定器に、値を 1 つ加える関数です。HyperLogLog は「異なる値がいくつあるか」（カーディナリティ）を、数 KB のメモリで、ほどほどの誤差で推定できるアルゴリズムです。
この関数は値そのものではなく、その値の 32 ビットの **ハッシュ値** を受け取ります。上位の数ビットで「どの箱（レジスタ）に記録するか」を決め、残りのビットで「先頭から 0 が何個続いたか」を数えて、その箱の最大値を更新します。
PostgreSQL では、並べ替えの途中で「重複がどれくらいあるか」を見積もるのに使われています。

## コード

::: code-group

```c:line-numbers=157 [日本語訳]
/*
 * 呼び出し側が渡したハッシュ値を使って、推定器に要素を加える。
 *
 * 渡すハッシュ値は本物のハッシュ値（ふつうは hash_bytes() で
 * 作ったもの）でなければならない。このアルゴリズムは、確率的平均と
 * 組み合わせて観測される特定のビットパターンに依存している。観測される
 * 元の値それぞれについて、ハッシュ値のビットが一様に分布して
 * いなければならない。
 */
void
addHyperLogLog(hyperLogLogState *cState, uint32 hash)
{
	uint8		count;
	uint32		index;

	/* 先頭の "k"（registerWidth）ビットを 0 始まりの添字として使う */
	index = hash >> (BITS_PER_BYTE * sizeof(uint32) - cState->registerWidth);

	/* 残りの 32 - "k"（registerWidth）ビットの順位を計算する */
	count = rho(hash << cState->registerWidth,
				BITS_PER_BYTE * sizeof(uint32) - cState->registerWidth);

	cState->hashesArr[index] = Max(count, cState->hashesArr[index]);
}
```

```c:line-numbers=157 [原文]
/*
 * Adds element to the estimator, from caller-supplied hash.
 *
 * It is critical that the hash value passed be an actual hash value, typically
 * generated using hash_bytes().  The algorithm relies on a specific bit-pattern
 * observable in conjunction with stochastic averaging.  There must be a
 * uniform distribution of bits in hash values for each distinct original value
 * observed.
 */
void
addHyperLogLog(hyperLogLogState *cState, uint32 hash)
{
	uint8		count;
	uint32		index;

	/* Use the first "k" (registerWidth) bits as a zero based index */
	index = hash >> (BITS_PER_BYTE * sizeof(uint32) - cState->registerWidth);

	/* Compute the rank of the remaining 32 - "k" (registerWidth) bits */
	count = rho(hash << cState->registerWidth,
				BITS_PER_BYTE * sizeof(uint32) - cState->registerWidth);

	cState->hashesArr[index] = Max(count, cState->hashesArr[index]);
}
```

:::

## 前提知識

- **ハッシュ値**: データから計算される「指紋」の数です。よいハッシュ関数なら、各ビットは 0 と 1 が半々の確率で出ます（関数の前のコメントは、このことが決定的に重要だと述べています）。
- **確率の直感**: ランダムなビット列で「先頭が 1」の確率は 1/2、「`01` で始まる」確率は 1/4、「`001` で始まる」確率は 1/8 です。したがって、たくさんの値を見たなかで「先頭に 0 が最大 10 個続いた」なら、だいたい 2¹¹ 個くらいの異なる値を見たと推定できます。同じ値は同じハッシュ値になるので、重複は推定に影響しません。
- **レジスタ**: ここでは「数を 1 つ覚えておく箱」の意味で、`hashesArr` という `uint8`（0〜255 の整数）の配列の 1 要素です。箱の数は `2 の registerWidth 乗` 個です。
- **`>>` と `<<`**: 右シフト・左シフトです。`hash >> 28` で上位 4 ビットを取り出し、`hash << 4` で上位 4 ビットを捨てて残りを上に詰めます。
- **`BITS_PER_BYTE * sizeof(uint32)`**: 1 バイトのビット数（8）× 4 バイトで 32 です。
- **`->`**: ポインタが指す構造体の項目を読む書き方です。
- **`Max(a, b)`**: 大きいほうを返すマクロです。

## 何をしているか

`registerWidth = 4`（箱は 16 個）、`hash = 0x30A00000` で追います。2 進数では `0011 0000 1010 0000 ...` です。

### 1. 上位ビットで箱を選ぶ

```c:line-numbers=173
	index = hash >> (BITS_PER_BYTE * sizeof(uint32) - cState->registerWidth);
```

`32 - 4 = 28` ビット右にずらすと、上位 4 ビット `0011` が残り、`index = 3` になります。3 番の箱を使います。

### 2. 残りのビットで「最初の 1」の位置を求める

```c:line-numbers=176
	count = rho(hash << cState->registerWidth,
				BITS_PER_BYTE * sizeof(uint32) - cState->registerWidth);
```

`hash << 4` で上位 4 ビットを捨てると、残りの 28 ビット `0000 1010 0000 ...` が上に詰まります。`rho` は、上から何番目に最初の 1 が現れるかを返す同じファイルの関数で、ここでは 5 番目なので `count = 5` です。
調べる長さとして 28 を渡しているので、28 ビットすべてが 0 だった場合は `29` が返ります。

### 3. 箱の最大値を更新する

```c:line-numbers=179
	cState->hashesArr[index] = Max(count, cState->hashesArr[index]);
```

3 番の箱にこれまで 2 が入っていれば 5 に、7 が入っていれば 7 のままです。こうして各箱は「その箱に来た値のなかで、最も長く 0 が続いた長さ + 1」を覚えます。

## ここがすごい

- **メモリが一定で小さい**: 異なる値を正確に数えるには、見た値をすべて覚えておく必要があり、値の数に比例してメモリが増えます。HyperLogLog は各箱に 1 バイトの数を覚えるだけなので、`registerWidth = 10` でも 1024 バイトで済み、何億個の値を見ても増えません。
- **同じ値を何度加えても同じ**: 箱に記録するのは最大値だけなので、同じ値を 2 回加えても状態は変わりません。そのため「重複を除いた個数」が自然に推定できます。追加の順番にもよりません。
- **1 つのハッシュを 2 つの用途に分ける**: 「先頭の 0 の数」だけでは、たまたま長く続いた 1 回の幸運に推定が大きく引っ張られます。そこでハッシュ値の上位ビットで値を多数の箱に振り分け、箱ごとの結果を平均します（確率的平均）。1 つのハッシュ値を「箱の番号」と「観測値」に分けて使うので、ハッシュ関数を何種類も用意せずに済みます。
- **処理が軽い**: シフト 2 回、最上位ビットの位置を求める命令 1 回、比較 1 回だけです。並べ替えの途中など、大量の値に対して呼ばれる場面でも負担になりません。

## まとめ

- ランダムなビット列で 0 が長く続くのは珍しいので、「最長の 0 の列」から個数を推定できる。
- ハッシュ値の上位ビットで箱を選び、箱ごとの最大値を覚えると、推定のぶれを平均で抑えられる。
- 最大値だけを覚えるので、重複は自動的に無視される。
- この方法は、ハッシュ値のビットが一様に散らばっていることが前提。
