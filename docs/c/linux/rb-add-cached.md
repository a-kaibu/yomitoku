---
title: "挿入のついでに「最小のノード」を覚えておく赤黒木"
description: "赤黒木にノードを入れる汎用関数。下りる途中で一度でも右へ進んだかを記録し、新しいノードが最小かどうかを追加コストほぼゼロで判定してキャッシュする。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-or-later
copyright: "(C) 1999  Andrea Arcangeli <andrea@suse.de>"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: include/linux/rbtree.h
lines: [189, 219]
function: "rb_add_cached"
difficulty: 2
format: 2
tags: [データ構造, キャッシュ, API設計, イディオム]
---

## ひとことで

`rb_add_cached` は、赤黒木（カーネルの自動でバランスを保つ二分探索木）にノードを 1 つ追加する関数です。
この木は「一番小さいノード」へのポインタを別に覚えている（キャッシュしている）型で、最小値をすぐ取り出せます。プロセスのスケジューラのように、「次に一番優先すべきもの」を何度も取り出す場面で使われます。
挿入のついでに、新しいノードが最小になったかを、ほぼ追加の手間なしで判定しているのが見どころです。

## コード

::: code-group

```c:line-numbers=189 [日本語訳]
/**
 * rb_add_cached() - 最左ノードをキャッシュする木 @tree に @node を挿入する
 * @node: 挿入するノード
 * @tree: @node を挿入する、最左ノードをキャッシュする木
 * @less: ノードの（半）順序を定める演算子
 *
 * @node が新しい最左ノードならそれを返し、そうでなければ NULL を返す。
 */
static __always_inline struct rb_node *
rb_add_cached(struct rb_node *node, struct rb_root_cached *tree,
	      bool (*less)(struct rb_node *, const struct rb_node *))
{
	struct rb_node **link = &tree->rb_root.rb_node;
	struct rb_node *parent = NULL;
	bool leftmost = true;

	while (*link) {
		parent = *link;
		if (less(node, parent)) {
			link = &parent->rb_left;
		} else {
			link = &parent->rb_right;
			leftmost = false;
		}
	}

	rb_link_node(node, parent, link);
	rb_insert_color_cached(node, tree, leftmost);

	return leftmost ? node : NULL;
}
```

```c:line-numbers=189 [原文]
/**
 * rb_add_cached() - insert @node into the leftmost cached tree @tree
 * @node: node to insert
 * @tree: leftmost cached tree to insert @node into
 * @less: operator defining the (partial) node order
 *
 * Returns @node when it is the new leftmost, or NULL.
 */
static __always_inline struct rb_node *
rb_add_cached(struct rb_node *node, struct rb_root_cached *tree,
	      bool (*less)(struct rb_node *, const struct rb_node *))
{
	struct rb_node **link = &tree->rb_root.rb_node;
	struct rb_node *parent = NULL;
	bool leftmost = true;

	while (*link) {
		parent = *link;
		if (less(node, parent)) {
			link = &parent->rb_left;
		} else {
			link = &parent->rb_right;
			leftmost = false;
		}
	}

	rb_link_node(node, parent, link);
	rb_insert_color_cached(node, tree, leftmost);

	return leftmost ? node : NULL;
}
```

:::

## 前提知識

- **二分探索木**: 「左の子孫は自分より小さく、右の子孫は大きい（か等しい）」という規則の木です。新しい値は、根から比較しながら左か右へ下り、空いた場所に入れます。
- **`struct rb_root_cached`**: 木の根 `rb_root` と、最小のノード `rb_leftmost` をまとめた構造体です。
- **ポインタへのポインタ `struct rb_node **link`**: 「子へのポインタが入っている欄」の場所を指します。`*link` でその欄の中身（子ノード）を読み、そこに新しいノードを書き込むこともできます。
- **`&parent->rb_left`**: 「`parent` の左の子の欄」の場所です。
- **関数ポインタ `less`**: 比較方法を呼び出し側が渡します。`less(a, b)` が真なら「`a` は `b` より小さい」です。
- **`static __always_inline`**: ヘッダに書かれ、呼び出し元に必ず埋め込まれる関数です。
- **`bool`**: 真か偽の型です。
- **`x ? a : b`**: 条件演算子です。`x` が真なら `a`、偽なら `b` になります。

## 何をしているか

### 準備

```c:line-numbers=201
	struct rb_node **link = &tree->rb_root.rb_node;
	struct rb_node *parent = NULL;
	bool leftmost = true;
```

`link` は「新しいノードを入れる候補の欄」の場所で、最初は根の欄を指します。`parent` は最後に通ったノード、`leftmost` は「ここまで左にしか進んでいない」という印で、最初は真です。

### 下りる

```c:line-numbers=205
	while (*link) {
		parent = *link;
		if (less(node, parent)) {
			link = &parent->rb_left;
		} else {
			link = &parent->rb_right;
			leftmost = false;
		}
	}
```

欄が空でない間、そこにあるノードを `parent` にして比較します。新しいノードが小さければ左の欄へ、そうでなければ右の欄へ進みます。
**右へ進んだ瞬間に `leftmost` を偽にします。** 一度でも右へ進めば、そのとき比較したノードより大きいので、新しいノードは最小ではありません。

### つないで色を直す

```c:line-numbers=215
	rb_link_node(node, parent, link);
	rb_insert_color_cached(node, tree, leftmost);
```

`rb_link_node` で、空いていた欄 `*link` に新しいノードを入れ、親を設定します。続いて `rb_insert_color_cached` が、`leftmost` が真なら `rb_leftmost` を新しいノードに更新し、赤黒木のバランスを直します。

### 戻り値

```c:line-numbers=218
	return leftmost ? node : NULL;
```

新しいノードが最小になったときだけ、そのノードを返します。呼び出し側は「最小が入れ替わった」ことをすぐ知ることができます。

### 具体例

木に 5, 3, 8 があり、最小は 3 とします。

- 2 を入れる: 5 より小さいので左、3 より小さいので左。右に一度も進まないので `leftmost` は真のまま。2 が新しい最小になります。
- 4 を入れる: 5 より小さいので左、3 以上なので右。ここで `leftmost` が偽に。最小は 2 のまま、戻り値は `NULL` です。

## ここがすごい

- **最小判定がタダ同然**: 新しい最小かを調べるために、もう一度木をたどったり、元の最小と比べたりする必要がありません。下りる途中の分岐で、すでに答えが出ているからです。
- **ポインタのポインタで場所を覚える**: 下りるときに「子の欄の場所」を持っておくと、空き場所を見つけた時点で、そこへ直接書き込めます。「親の左か右か」を最後にもう一度判定する必要がありません。
- **コールバックでも遅くならない**: 比較を関数ポインタ `less` で受け取りますが、関数は `__always_inline` で埋め込まれます。呼び出し側が具体的な比較関数を渡せば、コンパイラは間接呼び出しをやめて比較を直接埋め込めます。ヘッダ冒頭のコメントにあるとおり、コールバックの遅さを嫌ってきたカーネルの赤黒木に、汎用的な挿入を後から加えるための工夫です。
- **等しい値は右へ**: `less` が偽なら右へ進むので、同じ値のノードは後から入れたものほど右に入ります。等しい値の間で、入れた順番が保たれます。

## まとめ

- 二分探索木で最小のノードを覚えておくと、取り出しが一瞬で済む。
- 「一度も右へ進まなかった」なら、新しいノードは最小。判定は挿入のついでにできる。
- 「子の欄の場所」をポインタのポインタで持つと、見つけた空き場所に直接つなげる。
- 必ずインライン化される関数なら、関数ポインタで比較を渡しても速さを保てる。
