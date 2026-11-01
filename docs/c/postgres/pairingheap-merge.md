---
title: "勝った根の子リストの先頭に負けた木をつなぐだけ、ペアリングヒープの併合"
description: "ペアリングヒープの基本操作である 2 つの木の併合。根どうしを 1 回比べ、大きいほうの根の「最初の子」として小さいほうをつなぐ。ポインタを 4 本書き換えるだけで O(1) で終わる。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2012-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/backend/lib/pairingheap.c
lines: [82, 118]
function: "merge"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, メモリ管理]
---

## ひとことで

`merge` は、**ペアリングヒープ** という優先度付きキューの部品で、2 つの木を 1 つにまとめる関数です。
根どうしを 1 回だけ比べ、値の大きいほうを新しい根にし、小さいほうの木をその根の **最初の子** としてつなぎます。
たとえば根が 9 の木と根が 5 の木を併合すると、9 が根になり、5 の木が 9 の子の先頭に加わります。比較 1 回とポインタの書き換え数本で終わるので、ペアリングヒープへの追加は O(1)（要素数によらない一定時間）になります。

## コード

::: code-group

```c:line-numbers=82 [日本語訳]
/*
 * 2 つの部分ヒープを 1 つに併合する補助関数。
 *
 * 値の小さいほうの部分ヒープを、もう一方の子にする（最大ヒープを
 * 想定した場合）。
 *
 * 入力ノードの next_sibling と prev_or_parent ポインタは
 * 無視される。戻ったとき、返されたノードの next_sibling と prev_or_parent
 * ポインタはでたらめな値になっている。
 */
static pairingheap_node *
merge(pairingheap *heap, pairingheap_node *a, pairingheap_node *b)
{
	if (a == NULL)
		return b;
	if (b == NULL)
		return a;

	/* 'a' のほうが大きい値になるように 'a' と 'b' を入れ替える */
	if (heap->ph_compare(a, b, heap->ph_arg) < 0)
	{
		pairingheap_node *tmp;

		tmp = a;
		a = b;
		b = tmp;
	}

	/* そして 'b' を 'a' の子にする */
	if (a->first_child)
		a->first_child->prev_or_parent = b;
	b->prev_or_parent = a;
	b->next_sibling = a->first_child;
	a->first_child = b;

	return a;
}
```

```c:line-numbers=82 [原文]
/*
 * A helper function to merge two subheaps into one.
 *
 * The subheap with smaller value is put as a child of the other one (assuming
 * a max-heap).
 *
 * The next_sibling and prev_or_parent pointers of the input nodes are
 * ignored. On return, the returned node's next_sibling and prev_or_parent
 * pointers are garbage.
 */
static pairingheap_node *
merge(pairingheap *heap, pairingheap_node *a, pairingheap_node *b)
{
	if (a == NULL)
		return b;
	if (b == NULL)
		return a;

	/* swap 'a' and 'b' so that 'a' is the one with larger value */
	if (heap->ph_compare(a, b, heap->ph_arg) < 0)
	{
		pairingheap_node *tmp;

		tmp = a;
		a = b;
		b = tmp;
	}

	/* and put 'b' as a child of 'a' */
	if (a->first_child)
		a->first_child->prev_or_parent = b;
	b->prev_or_parent = a;
	b->next_sibling = a->first_child;
	a->first_child = b;

	return a;
}
```

:::

## 前提知識

- **優先度付きキューとヒープ**: いちばん大きい（または小さい）値をすぐ取り出せるデータ構造です。ヒープは「親は子以上」という規則を持つ木で、根が最大値になります（関数の前のコメントは最大ヒープを想定しています）。
- **ペアリングヒープ**: 各ノードが子をいくつでも持てる木で作るヒープです。子は「最初の子」から「次の兄弟」へとたどる連結リストで表します。
- **ノードの 3 本のポインタ**: ヘッダで定義された `pairingheap_node` には `first_child`（最初の子）、`next_sibling`（次の兄弟）、`prev_or_parent`（前の兄弟、最初の子なら親）の 3 つがあります。
- **ポインタと `->`**: `a` はノードの場所を指すポインタで、`a->first_child` はそのノードの項目を読み書きします。`NULL` は「何も指していない」ことを表します。
- **関数ポインタ**: `heap->ph_compare` は、比較のやり方を利用者が渡せるように、関数の場所を保存したものです。`ph_compare(a, b, arg)` は、`a` が `b` より小さいとき負の値を返す約束です。`ph_arg` は比較関数に渡す追加の情報です。
- **侵入型（intrusive）データ構造**: 利用者は自分の構造体の中に `pairingheap_node` を埋め込み、ヒープはそのノード部分だけを扱います。ノードを別に確保する必要がありません。

## 何をしているか

### 1. 片方が空ならもう片方を返す

```c:line-numbers=95
	if (a == NULL)
		return b;
	if (b == NULL)
		return a;
```

空の木との併合は、もう一方の木そのものです。

### 2. 大きいほうを a にそろえる

```c:line-numbers=101
	if (heap->ph_compare(a, b, heap->ph_arg) < 0)
	{
		pairingheap_node *tmp;

		tmp = a;
		a = b;
		b = tmp;
	}
```

比較関数で `a < b` なら、`a` と `b` を入れ替えます。以降は「`a` が勝者」と決め打ちで書けます。根 5 の木を `a`、根 9 の木を `b` として呼ばれた場合、ここで入れ替わって `a` が 9 になります。

### 3. b を a の最初の子にする

```c:line-numbers=111
	if (a->first_child)
		a->first_child->prev_or_parent = b;
	b->prev_or_parent = a;
	b->next_sibling = a->first_child;
	a->first_child = b;
```

9 にすでに子 7 → 3 があるとします。

- `a->first_child->prev_or_parent = b`: 今の最初の子 7 の `prev_or_parent` を 5 に向けます（7 の前の兄弟が 5 になる）。
- `b->prev_or_parent = a`: 5 の `prev_or_parent` を 9 に向けます（5 は最初の子なので、親を指す）。
- `b->next_sibling = a->first_child`: 5 の `next_sibling` を 7 に向けます。
- `a->first_child = b`: 9 の `first_child` を 5 にします。

これで 9 の子は 5 → 7 → 3 になります。

### 4. 勝者を返す

```c:line-numbers=117
	return a;
```

返されたノードの兄弟・親のポインタは不定なので、呼ぶ側が設定し直します（関数の前のコメントより）。

## ここがすごい

- **併合を後回しにする設計**: 二分ヒープでは、追加のたびに値を正しい位置まで移動させる処理（O(log n)）が必要です。ペアリングヒープは、追加のときは「根と比べて、子の先頭につなぐ」だけにして、木を整える仕事を最大値の取り出しまで先送りします。この `merge` 1 つが、追加・取り出し・削除のすべての土台になっています。
- **先頭に挿入するから速い**: 子のリストの末尾に加えるには、末尾までたどる必要があります。先頭に加えれば、リストの長さにかかわらずポインタ数本の書き換えで済みます。
- **入れ替えで場合分けを消す**: 「`a` が大きい場合」と「`b` が大きい場合」の 2 通りを書く代わりに、最初に入れ替えて 1 通りにしています。同じ処理を 2 回書かずに済み、間違いも減ります。
- **`prev_or_parent` の兼用**: 前の兄弟と親を 1 本のポインタで兼ねることで、ノード 1 個あたりのポインタを 3 本に抑えています。最初の子かどうかは、親の `first_child` が自分かどうかで判別できます（`pairingheap_remove` で使われています）。
- **比較は 1 回**: どんなに大きな木どうしでも、比べるのは根の 2 つだけです。

## まとめ

- ペアリングヒープの併合は、根を比べて、負けた木を勝った根の最初の子にするだけ。
- 木を整える仕事を後回しにすると、追加は一定時間になる。
- 連結リストへの追加は、先頭に行うとたどる手間がない。
- 最初に入れ替えておくと、対称な 2 つの場合を 1 つのコードで書ける。
