---
title: "左から 2 つずつ組にして、右から順に畳む「2 パス併合」"
description: "ペアリングヒープで根を取り除いたあと、残った子の木たちを 1 つにまとめる関数。左から 2 つずつ併合し、その結果を逆順にためて、さらに 1 つずつ併合する。これがならし O(log n) の鍵になる。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2012-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/backend/lib/pairingheap.c
lines: [241, 299]
function: "merge_children"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム]
---

## ひとことで

`merge_children` は、兄弟のリストとしてつながった **複数の木** を 1 つの木にまとめる関数です。ペアリングヒープで最大値（根）を取り出したあと、残された子たちから新しいヒープを作るのに使います。
やり方は 2 段階です。まず左から 2 つずつ組にして併合し、次にできた組を 1 つずつ併合していきます（関数の前のコメントより）。
たとえば子が A, B, C, D, E の 5 つなら、1 段目で (A+B), (C+D), E を作り、2 段目でそれらを順にまとめます。

## コード

::: code-group

```c:line-numbers=241 [日本語訳]
/*
 * 部分ヒープのリストを 1 つのヒープに併合する。
 *
 * 基本的な 2 パス併合の戦略を実装している。まず左から右へ
 * 組を作り、次にその組どうしを併合する。
 */
static pairingheap_node *
merge_children(pairingheap *heap, pairingheap_node *children)
{
	pairingheap_node *curr,
			   *next;
	pairingheap_node *pairs;
	pairingheap_node *newroot;

	if (children == NULL || children->next_sibling == NULL)
		return children;

	/* 部分ヒープを左から右へたどり、2 つずつ併合する */
	next = children;
	pairs = NULL;
	for (;;)
	{
		curr = next;

		if (curr == NULL)
			break;

		if (curr->next_sibling == NULL)
		{
			/* リストの末尾に余った奇数番目のノード */
			curr->next_sibling = pairs;
			pairs = curr;
			break;
		}

		next = curr->next_sibling->next_sibling;

		/* これと次の部分ヒープを併合し、'pairs' リストに加える。 */

		curr = merge(heap, curr, curr->next_sibling);
		curr->next_sibling = pairs;
		pairs = curr;
	}

	/*
	 * すべての組を併合して 1 つのヒープにする。
	 */
	newroot = pairs;
	next = pairs->next_sibling;
	while (next)
	{
		curr = next;
		next = curr->next_sibling;

		newroot = merge(heap, newroot, curr);
	}

	return newroot;
}
```

```c:line-numbers=241 [原文]
/*
 * Merge a list of subheaps into a single heap.
 *
 * This implements the basic two-pass merging strategy, first forming pairs
 * from left to right, and then merging the pairs.
 */
static pairingheap_node *
merge_children(pairingheap *heap, pairingheap_node *children)
{
	pairingheap_node *curr,
			   *next;
	pairingheap_node *pairs;
	pairingheap_node *newroot;

	if (children == NULL || children->next_sibling == NULL)
		return children;

	/* Walk the subheaps from left to right, merging in pairs */
	next = children;
	pairs = NULL;
	for (;;)
	{
		curr = next;

		if (curr == NULL)
			break;

		if (curr->next_sibling == NULL)
		{
			/* last odd node at the end of list */
			curr->next_sibling = pairs;
			pairs = curr;
			break;
		}

		next = curr->next_sibling->next_sibling;

		/* merge this and the next subheap, and add to 'pairs' list. */

		curr = merge(heap, curr, curr->next_sibling);
		curr->next_sibling = pairs;
		pairs = curr;
	}

	/*
	 * Merge all the pairs together to form a single heap.
	 */
	newroot = pairs;
	next = pairs->next_sibling;
	while (next)
	{
		curr = next;
		next = curr->next_sibling;

		newroot = merge(heap, newroot, curr);
	}

	return newroot;
}
```

:::

## 前提知識

- **ペアリングヒープ**: 「親は子以上」の規則を持つ木で作る優先度付きキューです。各ノードは子をいくつでも持て、子は `first_child` から `next_sibling` でたどる連結リストになっています。
- **`merge(heap, a, b)`**: 同じファイルにある関数で、2 つの木の根を比べ、負けたほうを勝ったほうの最初の子につないで、勝ったほうを返します。
- **連結リストの先頭への追加**: `curr->next_sibling = pairs; pairs = curr;` は、`curr` をリスト `pairs` の先頭に加える定番の 2 行です。先頭に加えていくので、リストは追加した順の逆になります。
- **`for (;;)`**: 条件のない無限ループです。中の `break` で抜けます。
- **ならし計算量**: 1 回 1 回の操作は重いことがあっても、多数の操作を平均すると 1 回あたりこのくらい、という評価のしかたです。ファイル先頭のコメントによれば、最大値の削除はならし O(log n) です。

## 何をしているか

### 1. 0 個か 1 個なら何もしない

```c:line-numbers=255
	if (children == NULL || children->next_sibling == NULL)
		return children;
```

子がない、または 1 つしかないなら、それがそのまま答えです。

### 2. 1 段目: 左から 2 つずつ組にする

```c:line-numbers=259
	next = children;
	pairs = NULL;
	for (;;)
	{
		curr = next;

		if (curr == NULL)
			break;

		if (curr->next_sibling == NULL)
		{
			/* リストの末尾に余った奇数番目のノード */
			curr->next_sibling = pairs;
			pairs = curr;
			break;
		}

		next = curr->next_sibling->next_sibling;

		/* これと次の部分ヒープを併合し、'pairs' リストに加える。 */

		curr = merge(heap, curr, curr->next_sibling);
		curr->next_sibling = pairs;
		pairs = curr;
	}
```

子が A, B, C, D, E のとき:

- `curr = A`。次の組の先頭 `next` を C にしておき、`merge(A, B)` を作って `pairs` の先頭に加えます。`pairs` = [AB]。
- `curr = C`。`next` を E にし、`merge(C, D)` を `pairs` の先頭に加えます。`pairs` = [CD, AB]。
- `curr = E`。次の兄弟がないので、E をそのまま `pairs` の先頭に加えて終わります。`pairs` = [E, CD, AB]。

`next` を併合の **前に** 取っておくのが大事です。`merge` は兄弟のポインタを書き換えてしまうからです。

### 3. 2 段目: 順に併合する

```c:line-numbers=288
	newroot = pairs;
	next = pairs->next_sibling;
	while (next)
	{
		curr = next;
		next = curr->next_sibling;

		newroot = merge(heap, newroot, curr);
	}
```

`pairs` を先頭からたどり、`newroot` に 1 つずつ併合していきます。E と CD を併合し、その結果と AB を併合します。
`pairs` は 1 段目で逆順にたまっているので、これは元の並びでいえば **右から左へ** 畳んでいくことになります。

## ここがすごい

- **単純な方法との違い**: 子を左から順に 1 つずつ併合していく（1 パス）と、根の子の数が多いままの木ができやすく、次の取り出しでまた多くの子を処理する羽目になります。2 つずつ組にしてから畳むと、木の形がほどよく整い、ならしで O(log n) の取り出しが保証されます。ペアリングヒープの論文で示された標準的な方法で、名前（pairing、組にする）の由来でもあります。
- **追加のメモリなし**: 組を一時的にためる場所として、ノードがもともと持っている `next_sibling` を使っています。配列やスタックを確保せずに、2 パスの処理を実現しています。
- **逆順になることを利用する**: 先頭に加えていくと逆順になる、という連結リストの性質のおかげで、2 段目で「右から畳む」順序が自然に得られます。逆順にするための余分な処理がありません。
- **奇数の端も同じ流れで**: 最後に 1 つ余ったノードも `pairs` に加えておけば、2 段目では他の組と同じように扱えます。特別な後処理がいりません。

## まとめ

- ペアリングヒープの取り出し後は、子を 2 つずつ組にしてから畳む「2 パス併合」で木を整える。
- 併合でポインタが書き換わる前に、次にたどる位置を保存しておく。
- 連結リストの先頭追加で一時リストを作ると、順序が自然に逆転する。
- ノードが持つポインタを作業用に使い回せば、追加のメモリはいらない。
