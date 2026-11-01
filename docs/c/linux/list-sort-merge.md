---
title: "「ポインタのポインタ」で先頭の特別扱いを消すリスト併合"
description: "整列済みの 2 つの連結リストを 1 つにまとめる関数。末尾を「次に書き込むポインタの場所」で持つことで、先頭要素の場合分けやダミー要素をなくしている。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/list_sort.c
lines: [7, 39]
function: "merge"
difficulty: 2
format: 2
tags: [データ構造, イディオム, ソート, 可読性]
---

## ひとことで

`merge` は、すでに小さい順に並んでいる 2 つの連結リスト `a` と `b` を、1 本の並んだリストにまとめる関数です。
`list_sort`（カーネルの連結リスト用マージソート）の部品として何度も呼ばれます。
「次につなぐ場所」を**ポインタへのポインタ**で覚えておく、C らしいイディオムが見どころです。

## コード

::: code-group

```c:line-numbers=7 [日本語訳]
/*
 * merge() 呼び出しの連鎖に向いた中間形式のリストを返す:
 * NULL 終端で、予約された先頭ノードや番兵ノードはなく、
 * "prev" のつながりは維持しない。
 */
__attribute__((nonnull(2,3,4)))
static struct list_head *merge(void *priv, list_cmp_func_t cmp,
				struct list_head *a, struct list_head *b)
{
	struct list_head *head, **tail = &head;

	for (;;) {
		/* 等しければ 'a' を取る -- ソートの安定性のために重要 */
		if (cmp(priv, a, b) <= 0) {
			*tail = a;
			tail = &a->next;
			a = a->next;
			if (!a) {
				*tail = b;
				break;
			}
		} else {
			*tail = b;
			tail = &b->next;
			b = b->next;
			if (!b) {
				*tail = a;
				break;
			}
		}
	}
	return head;
}
```

```c:line-numbers=7 [原文]
/*
 * Returns a list organized in an intermediate format suited
 * to chaining of merge() calls: null-terminated, no reserved or
 * sentinel head node, "prev" links not maintained.
 */
__attribute__((nonnull(2,3,4)))
static struct list_head *merge(void *priv, list_cmp_func_t cmp,
				struct list_head *a, struct list_head *b)
{
	struct list_head *head, **tail = &head;

	for (;;) {
		/* if equal, take 'a' -- important for sort stability */
		if (cmp(priv, a, b) <= 0) {
			*tail = a;
			tail = &a->next;
			a = a->next;
			if (!a) {
				*tail = b;
				break;
			}
		} else {
			*tail = b;
			tail = &b->next;
			b = b->next;
			if (!b) {
				*tail = a;
				break;
			}
		}
	}
	return head;
}
```

:::

## 前提知識

- **連結リスト**: 要素が「次の要素の場所（ポインタ）」を持ち、数珠つなぎになったデータ構造です。ここでは `next` をたどり、最後は `NULL`（どこも指さない値）で終わります。
- **ポインタと `*`、`&`**: `&x` は変数 `x` の場所（アドレス）、`*p` は `p` が指す場所の中身です。
- **ポインタへのポインタ `**`**: `struct list_head **tail` は「ポインタ変数がある場所」を指す変数です。`*tail = a;` と書くと、その場所にあるポインタを `a` に書き換えます。
- **`->`**: `a->next` は「`a` が指す要素の `next`」です。`&a->next` はその `next` 欄の場所です。
- **関数ポインタ `cmp`**: 比較のしかたを呼び出し側が渡します。`cmp(priv, a, b) <= 0` なら「`a` を先にしてよい」という意味です。
- **`__attribute__((nonnull(2,3,4)))`**: 2〜4 番目の引数に `NULL` を渡してはいけない、とコンパイラに伝える指定です。
- **`static`**: このファイルの中だけで使う関数という意味です。

## 何をしているか

### 書き込み先を「場所」で持つ

```c:line-numbers=16
	struct list_head *head, **tail = &head;
```

`head` は結果のリストの先頭を入れる変数です。`tail` は最初、その `head` 変数の場所を指します。
以後、「次の要素をつなぐ」とは「`*tail` に書き込む」ことで、1 個目のときは `head` が、2 個目以降は直前の要素の `next` が書き換わります。

### `a` の先頭が小さい（か等しい）とき

```c:line-numbers=20
		if (cmp(priv, a, b) <= 0) {
			*tail = a;
			tail = &a->next;
			a = a->next;
			if (!a) {
				*tail = b;
				break;
			}
```

`*tail = a` で `a` の先頭を結果につなぎ、`tail = &a->next` で書き込み先をその要素の `next` 欄に移します。`a` を 1 つ進め、`a` が空になったら、残りの `b` をまるごとつないで終わります。

### `b` の先頭が小さいとき

```c:line-numbers=28
		} else {
			*tail = b;
			tail = &b->next;
			b = b->next;
			if (!b) {
				*tail = a;
				break;
			}
```

左右を入れ替えただけの同じ処理です。

### 具体例

`a = 1 → 4`、`b = 2 → 3` とします。

1. `1 <= 2` なので 1 をつなぐ。`head = 1`。`a = 4`。
2. `4 > 2` なので 2 をつなぐ。1 の `next` が 2 に。`b = 3`。
3. `4 > 3` なので 3 をつなぐ。`b` が空になったので、3 の `next` に `a`（4）をつないで終わり。

結果は `1 → 2 → 3 → 4` です。

## ここがすごい

- **先頭の場合分けが消える**: 素直に書くと「結果がまだ空なら `head` に入れる、そうでなければ最後の要素の `next` に入れる」と if が必要です。よくある別解は、中身のないダミー要素を用意してその `next` から始める方法ですが、余計な変数が増えます。書き込み先の「場所」を持てば、`head` も `next` も同じ「ポインタがある場所」として扱えるので、どちらも要りません。
- **残りは 1 回でつなげる**: 片方が空になった時点で、もう片方は整列済みなので、ループを回さず 1 回の代入でつなぎます。
- **安定性を守る比較**: ループ内のコメントのとおり、等しいときは `a` を取ります。`list_sort` は古いほうの部分列を `a` として渡すので、等しい要素の元の順序が保たれます。比較関数が `0`/`1` しか返さない場合でも正しく動きます。
- **わざと手を抜いた形式**: 関数の直前のコメントにあるように、結果は `prev` ポインタを直さない「中間形式」です。何度も呼ばれる途中の併合では `prev` を気にせず、最後の 1 回だけ別関数でまとめて直すことで、全体の手間を減らしています。

## まとめ

- 「次に書き込むポインタの場所」を `**` で持つと、リストの先頭と途中を同じコードで扱える。
- ダミー要素や先頭の特別扱いがいらなくなる。
- 片方が尽きたら、残りは 1 回でつなげばよい。
- 等しいときにどちらを取るかで、ソートの安定性が決まる。
