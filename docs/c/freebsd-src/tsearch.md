---
title: "通った道を 2 つの整数のビットに記録する AVL 木への挿入"
description: "POSIX の tsearch を AVL 木で実装した FreeBSD の関数の前半。根から葉までの左右の選択をビット列に記録し、バランスが崩れていない区間を見切ることで、親へのポインタも再帰も使わずに木を更新している。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-2-Clause
copyright: "Copyright (c) 2015 Nuxi, https://nuxi.nl/"
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/stdlib/tsearch.c
lines: [32, 100]
function: "tsearch"
difficulty: 3
format: 2
tags: [データ構造, ビット演算, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`tsearch` は、二分探索木にキー（値）を探し、なければ追加する POSIX の関数です。
FreeBSD の実装は **AVL 木**（左右の高さの差を常に 1 以下に保つ二分探索木）を使っています。
ふつう AVL 木への挿入は再帰で書くか、各ノードに親へのポインタを持たせます。この実装は **根から葉までの「左・右」の選び方をビットとして記録** し、それを使って 2 回目の走査でバランスを直します。ここでは、その前半（探索・追加・バランス値の更新）を読みます。

## コード

::: code-group

```c:line-numbers=32 [日本語訳]
posix_tnode *
tsearch(const void *key, posix_tnode **rootp,
    int (*compar)(const void *, const void *))
{
	struct path path;
	posix_tnode **leaf, *result, *n, *x, *y, *z;
	int cmp;

	/* POSIX は、rootp が NULL なら tsearch() が NULL を返すことを求めている。 */
	if (rootp == NULL)
		return (NULL);

	/*
	 * 新しいキーを入れるべき葉を探す。既存の要素が見つかったら
	 * 戻る。そのノードにたどり着くまでの道を
	 * 記録しておく。バランス値を直すのに
	 * 必要になるからである。
	*/
	path_init(&path);
	leaf = rootp;
	while (*leaf != NULL) {
		if ((*leaf)->balance != 0) {
			/*
			 * 途中で balance が 0 でないノードに
			 * 出会ったら、この地点より上では
			 * 回転が必要ないとわかる。
			 * この場合、回転によって必ず
			 * 部分木のバランスを保てるからだ。
			 * ここを根とみなし、道の記録をやり直す。
			 */
			rootp = leaf;
			path_init(&path);
		}
		cmp = compar(key, (*leaf)->key);
		if (cmp < 0) {
			path_taking_left(&path);
			leaf = &(*leaf)->llink;
		} else if (cmp > 0) {
			path_taking_right(&path);
			leaf = &(*leaf)->rlink;
		} else {
			return (*leaf);
		}
	}

	/* 木に一致するキーがなかった。新しいノードを挿入する。 */
	result = *leaf = malloc(sizeof(**leaf));
	if (result == NULL)
		return (NULL);
	result->key = (void *)key;
	result->llink = NULL;
	result->rlink = NULL;
	result->balance = 0;

	/*
	 * 同じ道を 2 回目にたどり、バランス値を
	 * 直す。最初のノードを除き、これらのノードはすべて
	 * balance が 0 のはずなので、
	 * バランスが崩れることはない。
	*/
	for (n = *rootp; n != *leaf;) {
		if (path_took_left(&path)) {
			n->balance += 1;
			n = n->llink;
		} else {
			n->balance -= 1;
			n = n->rlink;
		}
	}
```

```c:line-numbers=32 [原文]
posix_tnode *
tsearch(const void *key, posix_tnode **rootp,
    int (*compar)(const void *, const void *))
{
	struct path path;
	posix_tnode **leaf, *result, *n, *x, *y, *z;
	int cmp;

	/* POSIX requires that tsearch() returns NULL if rootp is NULL. */
	if (rootp == NULL)
		return (NULL);

	/*
	 * Find the leaf where the new key needs to be inserted. Return
	 * if we've found an existing entry. Keep track of the path that
	 * is taken to get to the node, as we will need it to adjust the
	 * balances.
	*/
	path_init(&path);
	leaf = rootp;
	while (*leaf != NULL) {
		if ((*leaf)->balance != 0) {
			/*
			 * If we reach a node that has a non-zero
			 * balance on the way, we know that we won't
			 * need to perform any rotations above this
			 * point. In this case rotations are always
			 * capable of keeping the subtree in balance.
			 * Make this the root node and reset the path.
			 */
			rootp = leaf;
			path_init(&path);
		}
		cmp = compar(key, (*leaf)->key);
		if (cmp < 0) {
			path_taking_left(&path);
			leaf = &(*leaf)->llink;
		} else if (cmp > 0) {
			path_taking_right(&path);
			leaf = &(*leaf)->rlink;
		} else {
			return (*leaf);
		}
	}

	/* Did not find a matching key in the tree. Insert a new node. */
	result = *leaf = malloc(sizeof(**leaf));
	if (result == NULL)
		return (NULL);
	result->key = (void *)key;
	result->llink = NULL;
	result->rlink = NULL;
	result->balance = 0;

	/*
	 * Walk along the same path a second time and adjust the
	 * balances. Except for the first node, all of these nodes must
	 * have a balance of zero, meaning that these nodes will not get
	 * out of balance.
	*/
	for (n = *rootp; n != *leaf;) {
		if (path_took_left(&path)) {
			n->balance += 1;
			n = n->llink;
		} else {
			n->balance -= 1;
			n = n->rlink;
		}
	}
```

:::

## 前提知識

- **二分探索木**: 各ノードの左側には小さい値、右側には大きい値が入っている木です。左右をたどるだけで値を探せます。
- **AVL 木と `balance`**: 各ノードは `balance`（左の高さ − 右の高さ）を持ちます。-1、0、1 のいずれかなら釣り合いがとれています。2 や -2 になったら「回転」で形を直します。
- **`struct` と `->`**: `struct` は複数の値をまとめた型です。ノードの型 `posix_tnode` は `include/search.h` で `key`（値へのポインタ）、`llink` / `rlink`（左右の子）、`balance` を持つ構造体として定義されています。`p->llink` は「ポインタ `p` が指す構造体の `llink`」です。
- **ポインタのポインタ `**`**: `posix_tnode **leaf` は「ノードを指すポインタ」が置かれている場所を指します。`*leaf = malloc(...)` と書くと、親の `llink` や `rlink` そのものを書き換えられます。
- **`malloc`**: 実行中にメモリを借りる関数です。失敗すると `NULL` を返します。
- **`struct path`**: `tsearch_path.h` の補助構造体で、`uintptr_t`（ポインタと同じ大きさの符号なし整数）2 個と、記録した歩数 `nsteps` を持ちます。`path_taking_left` は次のビットを 1 に、`path_taking_right` は 0 にし、`path_took_left` は先頭のビットを取り出して全体を 1 ビット右へずらします。

## 何をしているか

### 1. 葉まで降りながら道を記録する

```c:line-numbers=50
	path_init(&path);
	leaf = rootp;
	while (*leaf != NULL) {
		if ((*leaf)->balance != 0) {
			/*
			 * If we reach a node that has a non-zero
			 * balance on the way, we know that we won't
			 * need to perform any rotations above this
			 * point. In this case rotations are always
			 * capable of keeping the subtree in balance.
			 * Make this the root node and reset the path.
			 */
			rootp = leaf;
			path_init(&path);
		}
		cmp = compar(key, (*leaf)->key);
		if (cmp < 0) {
			path_taking_left(&path);
			leaf = &(*leaf)->llink;
		} else if (cmp > 0) {
			path_taking_right(&path);
			leaf = &(*leaf)->rlink;
		} else {
			return (*leaf);
		}
	}
```
`leaf` は「次に見るノードへのポインタが入った場所」です。比較して小さければ左（ビット 1）、大きければ右（ビット 0）を記録して降ります。一致すれば既存のノードを返して終わりです。

`if ((*leaf)->balance != 0)` の部分が要点です。途中で `balance` が 0 でないノードに出会ったら、その場所を新しい `rootp` にして、記録した道を捨てます。
コメントにあるとおり、ここより上は回転が要らないことがわかっているからです。

### 2. 新しいノードをぶら下げる

```c:line-numbers=78
	result = *leaf = malloc(sizeof(**leaf));
	if (result == NULL)
		return (NULL);
	result->key = (void *)key;
	result->llink = NULL;
	result->rlink = NULL;
	result->balance = 0;
```
`*leaf = malloc(...)` で、たどり着いた空きの場所に直接ノードを作ります。親の `llink` か `rlink` を書き換えていることになります。

### 3. 同じ道をもう一度たどってバランス値を更新する

```c:line-numbers=92
	for (n = *rootp; n != *leaf;) {
		if (path_took_left(&path)) {
			n->balance += 1;
			n = n->llink;
		} else {
			n->balance -= 1;
			n = n->rlink;
		}
	}
```
記録した道の先頭から順にビットを取り出し、左へ進んだノードは `balance` を +1、右なら -1 します。
この区間のノードは、`rootp` 以外はすべて `balance` が 0 だったので、更新後も -1 か 1 になるだけです。崩れる可能性があるのは `rootp` の 1 つだけです。

### 4. 具体例

1 → 2 の順に入れた木（1 の右に 2、1 の `balance` は -1）に 3 を入れます。
根 1 は `balance` が 0 でないので、ここを `rootp` にします。右、右と降りて 2 の右に 3 を作ります。
道をたどり直すと 1 の `balance` は -2、2 は -1 になります。関数の後半で、この `rootp` に対して 1 回だけ回転（右-右のケース）をすれば完了です。

## ここがすごい

- **親ポインタも再帰もいらない**: バランスを直すには葉から上へ戻る必要があり、ふつうは親ポインタか再帰を使います。この実装は「どちらへ進んだか」を 1 歩 1 ビットで記録し、上から同じ道をたどり直すので、どちらも不要です。
- **道の記録はたった 2 ワード**: `tsearch_path.h` のコメントによると、AVL 木の高さは約 1.44 × log2(n) を超えません。ノード数はアドレス空間の大きさで制限されるので、64 ビット環境でも 128 ビットあれば必ず足ります。`malloc` もスタックの配列も使わずに済みます。
- **直すべき場所を 1 か所に絞る**: 「`balance` が 0 でない最後のノード」より上は、挿入で高さが変わらないか、回転で元の高さに戻るので影響を受けません。この性質を使って記録をリセットするので、回転の判定は `rootp` の 1 か所だけで済みます。
- **ポインタのポインタで分岐を減らす**: `leaf` が「ポインタの置き場所」を指しているので、根に入れるときも子に入れるときも同じ `*leaf = ...` で書けます。「根が空なら特別扱い」という場合分けがありません。

## まとめ

- AVL 木は各ノードの高さの差を -1〜1 に保ち、崩れたら回転で直す。
- 木の道のりは 1 歩 1 ビットで記録でき、高さの上限から必要なビット数が決まる。
- バランスが 0 でないノードより上は影響を受けない、という性質で修正範囲を絞れる。
- ポインタのポインタを使うと、「どこにつなぐか」を場合分けせずに書ける。
