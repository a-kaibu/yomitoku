---
title: "カウンタのビットが「いつ・どれを併合するか」を決めるマージソート"
description: "カーネルの連結リスト用ソート list_sort。要素数カウンタの 2 進表記を見るだけで、併合のタイミングと相手を決める、再帰もスタックも使わないマージソート。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/list_sort.c
lines: [178, 246]
function: "list_sort"
difficulty: 3
format: 2
tags: [ソート, アルゴリズム, データ構造, ビット演算]
---

## ひとことで

`list_sort` は、Linux カーネルの双方向連結リスト（各要素が前後の要素へのポインタを持つ数珠つなぎの構造）を並べ替える関数です。
アルゴリズムはマージソート（整列済みの列を 2 つずつ合併していく方法）ですが、再帰も作業用の配列も使いません。
「今まで何個の要素を取り込んだか」を数える変数 `count` の**2 進数のビットの並び**だけで、どの部分列同士を併合するかを決めます。

## コード

::: code-group

```c:line-numbers=178 [日本語訳]
__attribute__((nonnull(2,3)))
void list_sort(void *priv, struct list_head *head, list_cmp_func_t cmp)
{
	struct list_head *list = head->next, *pending = NULL;
	size_t count = 0;	/* 保留中の要素数 */

	if (list == head->prev)	/* 要素が 0 個か 1 個 */
		return;

	/* NULL で終わる片方向リストに変換する。 */
	head->prev->next = NULL;

	/*
	 * データ構造の不変条件:
	 * - すべてのリストは片方向で NULL 終端。prev
	 *   ポインタは維持しない。
	 * - pending は、さらなる併合を待つ整列済み部分列を
	 *   prev でつないだ「リストのリスト」。
	 * - 整列済みの各部分列の大きさは 2 のべき乗。
	 * - 部分列は大きさと古さの順に並び、小さく新しいものが先頭。
	 * - 各大きさの部分列は 0〜2 個。
	 * - 保留中の部分列の組は、その後ろに保留中の要素が
	 *   その大きさと同じ数だけたまったらすぐ併合される（つまり
	 *   count がその大きさの奇数倍になるたび）。
	 *   これにより、後の最終併合は最悪でも 2:1 になる。
	 * - 各ラウンドは次からなる:
	 *   - count を増やしたときに反転する最上位のビットで
	 *     選ばれた 2 つの部分列を併合すること、そして
	 *   - 入力から 1 要素を、大きさ 1 の部分列として加えること。
	 */
	do {
		size_t bits;
		struct list_head **tail = &pending;

		/* count の最下位の 0 のビットを探す */
		for (bits = count; bits & 1; bits >>= 1)
			tail = &(*tail)->prev;
		/* 指示された併合を行う */
		if (likely(bits)) {
			struct list_head *a = *tail, *b = a->prev;

			a = merge(priv, cmp, b, a);
			/* 併合結果を入力の代わりに据える */
			a->prev = b->prev;
			*tail = a;
		}

		/* 入力リストから 1 要素を pending へ移す */
		list->prev = pending;
		pending = list;
		list = list->next;
		pending->next = NULL;
		count++;
	} while (list);

	/* 入力の終わり。保留中のリストをすべて併合する。 */
	list = pending;
	pending = pending->prev;
	for (;;) {
		struct list_head *next = pending->prev;

		if (!next)
			break;
		list = merge(priv, cmp, pending, list);
		pending = next;
	}
	/* 最後の併合。prev のつながりを作り直す */
	merge_final(priv, cmp, head, pending, list);
}
```

```c:line-numbers=178 [原文]
__attribute__((nonnull(2,3)))
void list_sort(void *priv, struct list_head *head, list_cmp_func_t cmp)
{
	struct list_head *list = head->next, *pending = NULL;
	size_t count = 0;	/* Count of pending */

	if (list == head->prev)	/* Zero or one elements */
		return;

	/* Convert to a null-terminated singly-linked list. */
	head->prev->next = NULL;

	/*
	 * Data structure invariants:
	 * - All lists are singly linked and null-terminated; prev
	 *   pointers are not maintained.
	 * - pending is a prev-linked "list of lists" of sorted
	 *   sublists awaiting further merging.
	 * - Each of the sorted sublists is power-of-two in size.
	 * - Sublists are sorted by size and age, smallest & newest at front.
	 * - There are zero to two sublists of each size.
	 * - A pair of pending sublists are merged as soon as the number
	 *   of following pending elements equals their size (i.e.
	 *   each time count reaches an odd multiple of that size).
	 *   That ensures each later final merge will be at worst 2:1.
	 * - Each round consists of:
	 *   - Merging the two sublists selected by the highest bit
	 *     which flips when count is incremented, and
	 *   - Adding an element from the input as a size-1 sublist.
	 */
	do {
		size_t bits;
		struct list_head **tail = &pending;

		/* Find the least-significant clear bit in count */
		for (bits = count; bits & 1; bits >>= 1)
			tail = &(*tail)->prev;
		/* Do the indicated merge */
		if (likely(bits)) {
			struct list_head *a = *tail, *b = a->prev;

			a = merge(priv, cmp, b, a);
			/* Install the merged result in place of the inputs */
			a->prev = b->prev;
			*tail = a;
		}

		/* Move one element from input list to pending */
		list->prev = pending;
		pending = list;
		list = list->next;
		pending->next = NULL;
		count++;
	} while (list);

	/* End of input; merge together all the pending lists. */
	list = pending;
	pending = pending->prev;
	for (;;) {
		struct list_head *next = pending->prev;

		if (!next)
			break;
		list = merge(priv, cmp, pending, list);
		pending = next;
	}
	/* The final merge, rebuilding prev links */
	merge_final(priv, cmp, head, pending, list);
}
```

:::

## 前提知識

- **`struct list_head`**: カーネルの連結リストの部品で、`next`（次）と `prev`（前）の 2 つのポインタだけを持つ構造体です。リストの先頭には中身のない `head` があり、最後の要素の `next` は `head` に戻ってくる「輪」になっています。
- **ポインタと `->`**: `p->next` は「`p` が指す構造体の `next`」です。`NULL` はどこも指さないポインタです。
- **ポインタへのポインタ `**`**: `struct list_head **tail` は「ポインタ変数がある場所」を指します。`*tail = a` と書くと、その場所にあるポインタを書き換えられます。
- **`&(*tail)->prev`**: 「`tail` が指すポインタが指す要素の、`prev` という欄の場所」です。
- **ビット演算**: `bits & 1` は最下位ビットが 1 か、`bits >>= 1` は右に 1 ビットずらす（2 で割る）操作です。
- **`likely(x)`**: 「`x` はたいてい真」とコンパイラに伝えるヒントです。動作は変わりません。
- **`merge(priv, cmp, a, b)`**: 同じファイルにある補助関数で、整列済みの 2 つの片方向リストを 1 つに併合します。等しいときは `a` 側を先にします。
- **`cmp`**: 利用者が渡す比較関数（関数ポインタ）です。

## 何をしているか

### 準備

```c:line-numbers=184
	if (list == head->prev)	/* Zero or one elements */
		return;

	/* Convert to a null-terminated singly-linked list. */
	head->prev->next = NULL;
```

要素が 0 個か 1 個なら何もしません。そうでなければ、最後の要素の `next` を `NULL` にして、輪を「`NULL` で終わる片方向リスト」に切り開きます。作業中は `prev` を本来の意味では使いません。

### 1 個ずつ取り込みながら併合

```c:line-numbers=208
	do {
		size_t bits;
		struct list_head **tail = &pending;

		/* Find the least-significant clear bit in count */
		for (bits = count; bits & 1; bits >>= 1)
			tail = &(*tail)->prev;
		/* Do the indicated merge */
		if (likely(bits)) {
			struct list_head *a = *tail, *b = a->prev;

			a = merge(priv, cmp, b, a);
			/* Install the merged result in place of the inputs */
			a->prev = b->prev;
			*tail = a;
		}

		/* Move one element from input list to pending */
		list->prev = pending;
		pending = list;
		list = list->next;
		pending->next = NULL;
		count++;
	} while (list);
```

`pending` は「併合待ちの整列済み部分列」を並べたものです。部分列どうしは `prev` でつながり、各部分列の中身は `next` でつながります。いちばん新しくて小さい部分列が先頭です。

ループの 1 周では、次の 3 つを行います。

1. `for (bits = count; bits & 1; bits >>= 1)`: `count` の下位から続く 1 のビットの数だけ、`pending` の列を奥へたどります。
2. `if (likely(bits))`: 残ったビットが 0 でなければ、そこにある同じ大きさの部分列 2 つ（`a` と、その奥の `b`）を併合して 1 つにします。古い `b` を先に渡すので、並べ替えが安定（等しい要素の順序が保たれる）になります。
3. 最後の 5 行: 入力から 1 要素を取り出し、大きさ 1 の部分列として `pending` の先頭に積みます。

### 具体的に追う

要素 e1, e2, e3, e4, e5 を順に取り込みます。

- `count = 0`（`0`）: 併合なし。e1 を積む。
- `count = 1`（`1`）: 1 をたどると残りは 0。併合なし。e2 を積む → `[e2] [e1]`。
- `count = 2`（`10`）: 下位の 1 はなし。残りが 0 でないので `[e1]` と `[e2]` を併合 → `[e1 e2]`。e3 を積む。
- `count = 3`（`11`）: 2 つたどると残りは 0。併合なし。e4 を積む → `[e4] [e3] [e1 e2]`。
- `count = 4`（`100`）: `[e3]` と `[e4]` を併合 → `[e3 e4] [e1 e2]`。e5 を積む。
- `count = 5`（`101`）: 1 つたどって `[e3 e4]` の位置へ。残りが `10` で 0 でないので `[e1 e2]` と併合 → 大きさ 4。

同じ大きさの部分列はいつも 2 つまでしかたまらず、大きさは必ず 2 のべき乗になります。

### 残りをまとめる

```c:line-numbers=234
	list = pending;
	pending = pending->prev;
	for (;;) {
		struct list_head *next = pending->prev;

		if (!next)
			break;
		list = merge(priv, cmp, pending, list);
		pending = next;
	}
	/* The final merge, rebuilding prev links */
	merge_final(priv, cmp, head, pending, list);
```

入力がなくなったら、`pending` に残った部分列を小さいほうから順に併合します。最後の 1 回だけは `merge_final` を使い、併合しながら `prev` ポインタと輪の形を元どおりに直します。

## ここがすごい

- **2 進カウンタが併合の予定表になっている**: 繰り上がりで「下位の 1 が全部 0 になり、上の 1 ビットが立つ」瞬間が、ちょうど同じ大きさの部分列が 2 つそろった瞬間に対応します。関数の直前にある長いコメントでは、ビットの状態を 6 通りに分けてこの性質を証明しています。
- **余計なメモリがいらない**: 再帰を使う素直なマージソートはスタックを消費し、ボトムアップ型は部分列を覚えておく配列が必要です。この実装は、使っていない `prev` ポインタを「部分列の列」として再利用するので、追加のメモリはポインタ数個だけです。カーネルのスタックは小さいので、これは大切です。
- **偏りの少ない併合**: コメントによると、併合は常に大きさの比が 2:1 以内になるように行われ、完全に貪欲なボトムアップ型よりも比較回数が 0.2n ほど少なくなります。同時に、`3 * 2^k` 個がキャッシュに収まれば、キャッシュの追い出し合いも避けられます。
- **トレードオフ**: コードは短いのに、正しさの理由はとても見えにくいです。そのため実装よりずっと長いコメントで不変条件（いつも成り立つ性質）を説明しています。

## まとめ

- マージソートは、再帰や配列がなくても「2 進カウンタ」で併合の順序を管理できる。
- 使っていないポインタ（ここでは `prev`）を一時的な別の用途に使うと、メモリを増やさずに済む。
- 等しいときに古い側を先にすれば、安定なソートになる。
- 最後の 1 回の併合で後始末（`prev` の復元）を兼ねると、もう 1 周のやり直しが不要になる。
