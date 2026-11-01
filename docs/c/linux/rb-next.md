---
title: "スタックを使わずに二分探索木の「次の要素」へ進む"
description: "赤黒木で、あるノードの次に大きいノードを返す関数。右の子があれば右へ 1 歩、左へ行けるだけ行く。なければ、自分が左の子になる地点まで親をさかのぼる。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-or-later
copyright: "(C) 1999  Andrea Arcangeli <andrea@suse.de>; (C) 2002  David Woodhouse <dwmw2@infradead.org>; (C) 2012  Michel Lespinasse <walken@google.com>"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/rbtree.c
lines: [480, 509]
function: "rb_next"
difficulty: 2
format: 2
tags: [データ構造, イテレータ, アルゴリズム, 探索]
---

## ひとことで

`rb_next(node)` は、赤黒木（カーネルでよく使われる、自動でバランスを保つ二分探索木）の中で、`node` の**次に大きい**ノードを返す関数です。
木を小さい順になめるとき、`rb_first` で最小のノードを取り、あとは `rb_next` をくり返し呼べばよいのです。
再帰もスタックも使わず、各ノードが持つ「親へのポインタ」を頼りに進むのがポイントです。

## コード

::: code-group

```c:line-numbers=480 [日本語訳]
struct rb_node *rb_next(const struct rb_node *node)
{
	struct rb_node *parent;

	if (RB_EMPTY_NODE(node))
		return NULL;

	/*
	 * 右の子があれば、そこへ下り、そこから左へ
	 * 行けるだけ行く。
	 */
	if (node->rb_right) {
		node = node->rb_right;
		while (node->rb_left)
			node = node->rb_left;
		return (struct rb_node *)node;
	}

	/*
	 * 右の子がない。下と左にあるものはすべて自分より小さいので、
	 * 「次」のノードは親の方向にあるはず。
	 * 木を上る。祖先がその親の右の子である間は、
	 * 上り続ける。初めて親の左の子になったとき、
	 * その親が「次」のノードだ。
	 */
	while ((parent = rb_parent(node)) && node == parent->rb_right)
		node = parent;

	return parent;
}
```

```c:line-numbers=480 [原文]
struct rb_node *rb_next(const struct rb_node *node)
{
	struct rb_node *parent;

	if (RB_EMPTY_NODE(node))
		return NULL;

	/*
	 * If we have a right-hand child, go down and then left as far
	 * as we can.
	 */
	if (node->rb_right) {
		node = node->rb_right;
		while (node->rb_left)
			node = node->rb_left;
		return (struct rb_node *)node;
	}

	/*
	 * No right-hand children. Everything down and left is smaller than us,
	 * so any 'next' node must be in the general direction of our parent.
	 * Go up the tree; any time the ancestor is a right-hand child of its
	 * parent, keep going up. First time it's a left-hand child of its
	 * parent, said parent is our 'next' node.
	 */
	while ((parent = rb_parent(node)) && node == parent->rb_right)
		node = parent;

	return parent;
}
```

:::

## 前提知識

- **二分探索木**: 各ノードについて「左の子孫はすべて自分より小さく、右の子孫はすべて自分より大きい」という規則を持つ木です。小さい順に並べると、「左の部分木 → 自分 → 右の部分木」の順（中間順）になります。
- **`struct rb_node`**: カーネルの赤黒木のノードです。`rb_left`（左の子）、`rb_right`（右の子）、親へのポインタ（色と一緒に詰め込まれている）を持ちます。
- **ポインタと `->`**: `node->rb_right` は「`node` が指すノードの右の子」です。子がいなければ `NULL`（どこも指さない値）です。
- **`rb_parent(node)`**: 親ノードを取り出すマクロです。根（いちばん上のノード）なら `NULL` を返します。
- **`RB_EMPTY_NODE(node)`**: そのノードが木に入っていない印がついているかを調べるマクロです。
- **`const`**: 「この関数は `node` の中身を書き換えない」という約束です。最後の `(struct rb_node *)node` は、返す型に合わせて `const` を外すキャスト（型変換）です。
- **`while ((parent = ...) && ...)`**: 代入と判定を 1 つの式で行う C の書き方です。`parent` に代入した値が `NULL` でなく、かつ右の条件も真の間くり返します。

## 何をしているか

### 木に入っていないノード

```c:line-numbers=484
	if (RB_EMPTY_NODE(node))
		return NULL;
```

木から外されたノードには印がついています。その場合は `NULL` を返します。

### 右の子がある場合

```c:line-numbers=491
	if (node->rb_right) {
		node = node->rb_right;
		while (node->rb_left)
			node = node->rb_left;
		return (struct rb_node *)node;
	}
```

次に大きいノードは、「右の部分木の中で一番小さいノード」です。右の子へ 1 歩進み、そこから左の子がいなくなるまで左へ進みます。

### 右の子がない場合

```c:line-numbers=505
	while ((parent = rb_parent(node)) && node == parent->rb_right)
		node = parent;

	return parent;
```

自分の下には自分より大きいものがありません。そこで親をさかのぼります。
自分が**親の右の子**である間は、その親は自分より小さいので、さらに上へ進みます。初めて**親の左の子**になったとき、その親が次のノードです。
根まで来ても見つからなければ `parent` は `NULL` になり、それが「次はない（自分が最大）」という答えになります。

### 具体例

次の木を考えます。

```
        8
      /   \
     4     12
    / \
   2   6
```

- `rb_next(4)`: 右の子 6 があり、6 には左の子がないので `6`。
- `rb_next(6)`: 右の子なし。6 は 4 の右の子なので 4 へ。4 は 8 の左の子なので、答えは `8`。
- `rb_next(12)`: 右の子なし。12 は 8 の右の子なので 8 へ。8 は根で親が `NULL` なので、答えは `NULL`。

## ここがすごい

- **追加のメモリがいらない**: 再帰で中間順になめると、木の高さぶんの呼び出しがスタックに積まれます。カーネルのスタックは小さいので、これは避けたいところです。親ポインタがあれば、今いるノードだけを覚えておけば次へ進めます。
- **イテレータとして使いやすい**: 利用者は `for (n = rb_first(&root); n; n = rb_next(n))` のような普通のループで木をたどれます。途中でやめるのも自由です。
- **平均すると速い**: 1 回の呼び出しは最悪で木の高さ（ノード数の対数）ぶん動きますが、木全体をなめると、各辺を上りと下りで高々 2 回ずつしか通りません。全体ではノード数に比例する時間で済みます。
- **左右対称のコード**: 同じファイルの `rb_prev` は、左右を入れ替えただけの同じ形です。規則が対称なので、コードも対称になっています。

## まとめ

- 二分探索木の「次の要素」は、右の部分木の最小値か、自分を左の部分木に含む最も近い祖先。
- 親へのポインタがあれば、スタックなしで木を順番にたどれる。
- 代入と条件判定を 1 つの式にまとめると、さかのぼりのループが短く書ける。
- `NULL` を「次はない」という意味の戻り値として自然に使っている。
