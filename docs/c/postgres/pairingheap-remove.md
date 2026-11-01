---
title: "「自分を指しているポインタ」へのポインタで、途中のノードを抜き取る"
description: "ペアリングヒープの途中にある任意のノードを削除する関数。親の first_child か前の兄弟の next_sibling のどちらが自分を指しているかを見つけ、そのポインタを書き換えて子の木と差し替える。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2012-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/backend/lib/pairingheap.c
lines: [180, 239]
function: "pairingheap_remove"
difficulty: 3
format: 2
tags: [データ構造, メモリ管理, イディオム]
---

## ひとことで

`pairingheap_remove` は、ペアリングヒープの **任意の位置にあるノード** を取り除く関数です。根（最大値）だけでなく、木の途中にあるノードも消せます。
消すノードに子がいれば、その子たちを 1 つの木にまとめて、元の位置に差し替えます。子がいなければ、兄弟のリストから単に外します。
PostgreSQL では、待ち行列の途中にある要素を取り消すような場面で使われます。

## コード

::: code-group

```c:line-numbers=180 [日本語訳]
/*
 * ヒープから 'node' を取り除く。ならし O(log n)。
 */
void
pairingheap_remove(pairingheap *heap, pairingheap_node *node)
{
	pairingheap_node *children;
	pairingheap_node *replacement;
	pairingheap_node *next_sibling;
	pairingheap_node **prev_ptr;

	/*
	 * 取り除くノードがたまたま根なら、
	 * pairingheap_remove_first() で処理する。
	 */
	if (node == heap->ph_root)
	{
		(void) pairingheap_remove_first(heap);
		return;
	}

	/*
	 * 何かを書き換える前に、取り除くノードの first_child と
	 * next_sibling ポインタを覚えておく。
	 */
	children = node->first_child;
	next_sibling = node->next_sibling;

	/*
	 * また、前の兄弟の中で取り除くノードを指しているポインタを探す。
	 * 親の最初の子なら、親の中のポインタを探す。
	 */
	if (node->prev_or_parent->first_child == node)
		prev_ptr = &node->prev_or_parent->first_child;
	else
		prev_ptr = &node->prev_or_parent->next_sibling;
	Assert(*prev_ptr == node);

	/*
	 * このノードに子があれば、子から新しい部分ヒープを作り、
	 * 取り除くノードの位置にそれをつなぐ。子がなければ、単にこの
	 * ノードを外す。
	 */
	if (children)
	{
		replacement = merge_children(heap, children);

		replacement->prev_or_parent = node->prev_or_parent;
		replacement->next_sibling = node->next_sibling;
		*prev_ptr = replacement;
		if (next_sibling)
			next_sibling->prev_or_parent = replacement;
	}
	else
	{
		*prev_ptr = next_sibling;
		if (next_sibling)
			next_sibling->prev_or_parent = node->prev_or_parent;
	}
}
```

```c:line-numbers=180 [原文]
/*
 * Remove 'node' from the heap. O(log n) amortized.
 */
void
pairingheap_remove(pairingheap *heap, pairingheap_node *node)
{
	pairingheap_node *children;
	pairingheap_node *replacement;
	pairingheap_node *next_sibling;
	pairingheap_node **prev_ptr;

	/*
	 * If the removed node happens to be the root node, do it with
	 * pairingheap_remove_first().
	 */
	if (node == heap->ph_root)
	{
		(void) pairingheap_remove_first(heap);
		return;
	}

	/*
	 * Before we modify anything, remember the removed node's first_child and
	 * next_sibling pointers.
	 */
	children = node->first_child;
	next_sibling = node->next_sibling;

	/*
	 * Also find the pointer to the removed node in its previous sibling, or
	 * if this is the first child of its parent, in its parent.
	 */
	if (node->prev_or_parent->first_child == node)
		prev_ptr = &node->prev_or_parent->first_child;
	else
		prev_ptr = &node->prev_or_parent->next_sibling;
	Assert(*prev_ptr == node);

	/*
	 * If this node has children, make a new subheap of the children and link
	 * the subheap in place of the removed node. Otherwise just unlink this
	 * node.
	 */
	if (children)
	{
		replacement = merge_children(heap, children);

		replacement->prev_or_parent = node->prev_or_parent;
		replacement->next_sibling = node->next_sibling;
		*prev_ptr = replacement;
		if (next_sibling)
			next_sibling->prev_or_parent = replacement;
	}
	else
	{
		*prev_ptr = next_sibling;
		if (next_sibling)
			next_sibling->prev_or_parent = node->prev_or_parent;
	}
}
```

:::

## 前提知識

- **ペアリングヒープ**: 「親は子以上」の規則を持つ木で作る優先度付きキューです。子は `first_child` から `next_sibling` でたどる連結リストになっています。
- **`prev_or_parent`**: 各ノードが持つポインタで、自分が親の最初の子なら **親** を、そうでなければ **前の兄弟** を指します。1 本で 2 役を兼ねています。
- **ポインタへのポインタ**: `pairingheap_node **prev_ptr` は「ノードを指すポインタ」が置かれている **場所** を指す変数です。`*prev_ptr = x` と書くと、その場所にあるポインタを `x` に書き換えられます。`&node->...->first_child` の `&` は「その項目の場所」を取り出す演算子です。
- **`merge_children`**: 兄弟のリストになった複数の木を 1 つにまとめる、同じファイルの関数です。
- **`(void) 関数(...)`**: 戻り値を使わないことを明示する書き方です。
- **`Assert`**: 開発用ビルドで条件を確かめるマクロです。

## 何をしているか

### 1. 根なら専用の関数に任せる

```c:line-numbers=195
	if (node == heap->ph_root)
	{
		(void) pairingheap_remove_first(heap);
		return;
	}
```

根を消すのは「最大値の取り出し」と同じなので、`pairingheap_remove_first` を呼んで終わります。根には親も兄弟もないので、以降の処理とは扱いが違います。

### 2. 子と次の兄弟を覚えておく

```c:line-numbers=205
	children = node->first_child;
	next_sibling = node->next_sibling;
```

これからポインタを書き換えるので、先に必要な値を取っておきます。

### 3. 自分を指しているポインタを探す

```c:line-numbers=212
	if (node->prev_or_parent->first_child == node)
		prev_ptr = &node->prev_or_parent->first_child;
	else
		prev_ptr = &node->prev_or_parent->next_sibling;
	Assert(*prev_ptr == node);
```

親 P の子が X → N → Y で、N を消すとします。N の `prev_or_parent` は X です。X の `first_child` は N ではないので、N を指しているのは X の `next_sibling` だとわかり、`prev_ptr = &X->next_sibling` になります。
もし N が最初の子なら、`prev_or_parent` は P で、P の `first_child` が N なので、`prev_ptr = &P->first_child` になります。

### 4. 差し替える

```c:line-numbers=223
	if (children)
	{
		replacement = merge_children(heap, children);

		replacement->prev_or_parent = node->prev_or_parent;
		replacement->next_sibling = node->next_sibling;
		*prev_ptr = replacement;
		if (next_sibling)
			next_sibling->prev_or_parent = replacement;
	}
	else
	{
		*prev_ptr = next_sibling;
		if (next_sibling)
			next_sibling->prev_or_parent = node->prev_or_parent;
	}
```

- N に子がいれば、`merge_children` で 1 つの木 R にまとめ、R の前後のポインタを N と同じにして、`*prev_ptr = R` で X の次を R にします。Y の `prev_or_parent` も R に直します。
- 子がいなければ、`*prev_ptr = Y` で X の次を Y にし、Y の `prev_or_parent` を X に直します。

## ここがすごい

- **「ポインタへのポインタ」で場合分けを 1 回に**: N を指しているのは「親の `first_child`」か「前の兄弟の `next_sibling`」のどちらかです。素直に書くと、そのあとの差し替え処理を 2 通り書くことになります。この関数は、最初にその **場所** を `prev_ptr` に入れてしまうので、あとは `*prev_ptr = ...` の 1 通りで済みます。連結リストの削除でよく使われる、C らしい技法です。
- **ポインタ 1 本で 2 役でも判別できる**: `prev_or_parent` が親か前の兄弟かは、相手の `first_child` が自分かどうかで判別できます。ノードを小さく保ったまま、必要な情報はちゃんと取り出せる設計です。
- **ヒープの規則が保たれる理由**: N の子はすべて N 以下で、N は親 P 以下です。だから N の子をまとめた木の根も P 以下になり、P の子として差し込んでも「親は子以上」の規則は崩れません。比較なしで差し替えられるのはこのためです。
- **書き換える前に保存する**: 最初に `next_sibling` を退避しているのは、`merge_children` の中で兄弟のポインタが書き換わっても、後で正しく Y につなぎ直すためです。
- **`Assert` で探索結果を確かめる**: `Assert(*prev_ptr == node)` で「見つけた場所が本当に N を指しているか」を確認しており、ポインタの関係が壊れていれば開発中にすぐわかります。

## まとめ

- 連結リストからの削除は、「自分を指しているポインタの場所」を先に求めると、1 通りの処理で書ける。
- 親と前の兄弟を 1 本のポインタで兼ねても、相手の `first_child` を見れば区別できる。
- 子の木をまとめて元の位置に差し込んでも、ヒープの規則は崩れない。
- ポインタを書き換える前に、あとで必要な値を退避しておく。
