---
title: "木を壊しながらでもたどれる「後順」の次のノード"
description: "赤黒木を「子を先に、親を後に」の順でたどるための 2 つの関数。左を優先して一番深いノードを探す補助関数と、親ポインタだけで次へ進む関数の組み合わせ。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-or-later
copyright: "(C) 1999  Andrea Arcangeli <andrea@suse.de>; (C) 2002  David Woodhouse <dwmw2@infradead.org>; (C) 2012  Michel Lespinasse <walken@google.com>"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/rbtree.c
lines: [580, 608]
function: "rb_next_postorder"
difficulty: 2
format: 2
tags: [データ構造, イテレータ, メモリ管理]
---

## ひとことで

`rb_next_postorder` は、赤黒木（カーネルの二分探索木）を**後順**（ある節点を、その子たちをすべて訪れたあとに訪れる順番）でたどるための関数です。
後順は、木を丸ごと解放するときに役立ちます。子を先に処理するので、親を解放した時点で、その子たちはもう用済みになっているからです。
補助関数 `rb_left_deepest_node` と組み合わせて、再帰もスタックも使わずにたどります。

## コード

::: code-group

```c:line-numbers=580 [日本語訳]
static struct rb_node *rb_left_deepest_node(const struct rb_node *node)
{
	for (;;) {
		if (node->rb_left)
			node = node->rb_left;
		else if (node->rb_right)
			node = node->rb_right;
		else
			return (struct rb_node *)node;
	}
}

struct rb_node *rb_next_postorder(const struct rb_node *node)
{
	const struct rb_node *parent;
	if (!node)
		return NULL;
	parent = rb_parent(node);

	/* このノードにいるなら、子はもう見終わっている */
	if (parent && node == parent->rb_left && parent->rb_right) {
		/* 親の左の子なら、親の右の子へ行き、
		 * そこから左へ一番下まで */
		return rb_left_deepest_node(parent->rb_right);
	} else
		/* そうでなければ自分は親の右の子で、親が
		 * 次になる */
		return (struct rb_node *)parent;
}
```

```c:line-numbers=580 [原文]
static struct rb_node *rb_left_deepest_node(const struct rb_node *node)
{
	for (;;) {
		if (node->rb_left)
			node = node->rb_left;
		else if (node->rb_right)
			node = node->rb_right;
		else
			return (struct rb_node *)node;
	}
}

struct rb_node *rb_next_postorder(const struct rb_node *node)
{
	const struct rb_node *parent;
	if (!node)
		return NULL;
	parent = rb_parent(node);

	/* If we're sitting on node, we've already seen our children */
	if (parent && node == parent->rb_left && parent->rb_right) {
		/* If we are the parent's left node, go to the parent's right
		 * node then all the way down to the left */
		return rb_left_deepest_node(parent->rb_right);
	} else
		/* Otherwise we are the parent's right node, and the parent
		 * should be next */
		return (struct rb_node *)parent;
}
```

:::

## 前提知識

- **後順（ポストオーダー）**: 「左の部分木 → 右の部分木 → 自分」の順に訪れる方法です。葉（子のないノード）から先に出てきます。
- **`struct rb_node`**: 赤黒木のノードで、`rb_left`、`rb_right`（左右の子）と、親へのポインタを持ちます。子がいなければ `NULL` です。
- **`rb_parent(node)`**: 親ノードを返すマクロです。根なら `NULL` です。
- **`for (;;)`**: 終わりのないループで、中の `return` で抜けます。
- **`const` とキャスト**: `const struct rb_node *` は「中身を書き換えない」という約束付きのポインタで、`(struct rb_node *)` で約束を外して返しています。
- **`&&`**: 「かつ」です。左から順に評価され、途中で偽になれば残りは評価されません。

## 何をしているか

### `rb_left_deepest_node`

```c:line-numbers=580
static struct rb_node *rb_left_deepest_node(const struct rb_node *node)
{
	for (;;) {
		if (node->rb_left)
			node = node->rb_left;
		else if (node->rb_right)
			node = node->rb_right;
		else
			return (struct rb_node *)node;
	}
}
```

後順で最初に訪れるのは、「左があれば左、なければ右」と下り続けて、子がいなくなったノードです。
ループの中身はまさにそれで、左の子がいれば左へ、いなければ右へ、どちらもいなければそのノードを返します。
「一番左のノード」ではない点に注意してください。一番左のノードに右の子がいれば、そちらが先です。

### 準備

```c:line-numbers=595
	if (!node)
		return NULL;
	parent = rb_parent(node);
```

`node` が `NULL` なら `NULL` を返します。そうでなければ親を取り出します。

### 自分が親の左の子で、右の兄弟がいる場合

```c:line-numbers=600
	if (parent && node == parent->rb_left && parent->rb_right) {
		/* If we are the parent's left node, go to the parent's right
		 * node then all the way down to the left */
		return rb_left_deepest_node(parent->rb_right);
```

後順では「左の部分木 → 右の部分木 → 親」なので、左の部分木（自分が根）を終えたら、次は右の部分木の最初、つまり右の兄弟から `rb_left_deepest_node` で下りた先です。

### それ以外

```c:line-numbers=604
	} else
		/* Otherwise we are the parent's right node, and the parent
		 * should be next */
		return (struct rb_node *)parent;
```

自分が親の右の子か、左の子でも右の兄弟がいないなら、親の子はすべて訪れ終わったので、次は親です。根の場合は親が `NULL` なので、終わりを意味する `NULL` が返ります。

### 具体例

```
        8
      /   \
     4     12
      \
       6
```

- 最初: `rb_left_deepest_node(8)` は 8 → 4（左）→ 6（左がないので右）で `6`。
- `rb_next_postorder(6)`: 6 は 4 の右の子なので、次は親の `4`。
- `rb_next_postorder(4)`: 4 は 8 の左の子で、右の兄弟 12 がいるので、`rb_left_deepest_node(12)` で `12`。
- `rb_next_postorder(12)`: 12 は右の子なので親の `8`。`rb_next_postorder(8)` は親がないので `NULL`。

順番は 6, 4, 12, 8 で、確かに子が先、親が後です。

## ここがすごい

- **訪れたノードを壊しても大丈夫**: 次のノードを決めるのに使うのは、「今のノードの親」と「親の子へのポインタ」だけです。今のノード自身の子は見ません（すでに処理済みだからです）。そのためカーネルには、この関数を使って木の全ノードを解放しながらたどるマクロ（`rbtree_postorder_for_each_entry_safe`）があります。ただし次のノードは解放する前に求めておく必要があります。
- **木のつなぎ直しが不要**: 木を全部消すだけなら、赤黒木の削除処理（色の付け替えや回転）を 1 個ずつ行う必要はありません。後順でたどって片っ端から解放すれば、ノード数に比例する時間で済みます。
- **2 つの小さな関数に分けた設計**: 「一番深いところまで下りる」処理は、最初の 1 個を探すとき（`rb_first_postorder`）にも、右の兄弟へ移るときにも使います。共通部分を補助関数にしたことで、どちらも数行になっています。

## まとめ

- 後順は「子を先、親を後」の順で、木全体の解放に向いている。
- 後順の最初のノードは「左を優先して、子がなくなるまで下りた」ノード。
- 次のノードは、右の兄弟がいればその部分木の最初、いなければ親。
- 親ポインタだけで進めば、処理済みのノードを壊しても巡回を続けられる。
