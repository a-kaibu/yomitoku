---
title: "関数ポインタに「0, 1, 2, 3」を入れて間接呼び出しを避ける"
description: "カーネルの sort() で要素を入れ替える関数を選ぶディスパッチ。関数ポインタの変数に小さな整数を目印として入れ、よく使う入れ替えは直接呼び出す。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/sort.c
lines: [133, 152]
function: "do_swap"
difficulty: 3
format: 2
tags: [最適化, ハック, 設計パターン, セキュリティ]
---

## ひとことで

`do_swap` は、ソート中に 2 つの要素を入れ替えるときの「入れ替え方」を選ぶ関数です。
入れ替え方は関数ポインタ（関数のアドレスを入れておける変数）で渡されますが、この関数ポインタには本物の関数だけでなく、`0`〜`3` という**目印の値**も入ります。
目印なら、組み込みの入れ替え関数を直接呼びます。こうして、遅い「間接呼び出し」をできるだけ避けています。

## コード

::: code-group

```c:line-numbers=133 [日本語訳]
/*
 * 関数ポインタを最後の引数にしているのは、コンパイラがこの関数を
 * インライン化しなかった場合に末尾呼び出しを最も効率よくするため。
 */
static void do_swap(void *a, void *b, size_t size, swap_r_func_t swap_func, const void *priv)
{
	if (swap_func == SWAP_WRAPPER) {
		((const struct wrapper *)priv)->swap(a, b, (int)size);
		return;
	}

	if (swap_func == SWAP_WORDS_64)
		swap_words_64(a, b, size);
	else if (swap_func == SWAP_WORDS_32)
		swap_words_32(a, b, size);
	else if (swap_func == SWAP_BYTES)
		swap_bytes(a, b, size);
	else
		swap_func(a, b, (int)size, priv);
}
```

```c:line-numbers=133 [原文]
/*
 * The function pointer is last to make tail calls most efficient if the
 * compiler decides not to inline this function.
 */
static void do_swap(void *a, void *b, size_t size, swap_r_func_t swap_func, const void *priv)
{
	if (swap_func == SWAP_WRAPPER) {
		((const struct wrapper *)priv)->swap(a, b, (int)size);
		return;
	}

	if (swap_func == SWAP_WORDS_64)
		swap_words_64(a, b, size);
	else if (swap_func == SWAP_WORDS_32)
		swap_words_32(a, b, size);
	else if (swap_func == SWAP_BYTES)
		swap_bytes(a, b, size);
	else
		swap_func(a, b, (int)size, priv);
}
```

:::

同じファイルで、目印の値と `struct wrapper` が定義されています。

```c:line-numbers=118
/*
 * The values are arbitrary as long as they can't be confused with
 * a pointer, but small integers make for the smallest compare
 * instructions.
 */
#define SWAP_WORDS_64 (swap_r_func_t)0
#define SWAP_WORDS_32 (swap_r_func_t)1
#define SWAP_BYTES    (swap_r_func_t)2
#define SWAP_WRAPPER  (swap_r_func_t)3

struct wrapper {
	cmp_func_t cmp;
	swap_func_t swap;
};
```

## 前提知識

- **関数ポインタ**: 関数のアドレスを入れておく変数です。`swap_func(a, b, size, priv)` と書くと、入っているアドレスの関数が呼ばれます（間接呼び出し）。`swap_r_func_t` はそのような関数ポインタの型名です。
- **`#define`（マクロ）**: コンパイル前に文字を置き換える仕組みです。`SWAP_BYTES` と書くと `(swap_r_func_t)2` に置き換わります。
- **キャスト**: `(swap_r_func_t)2` は整数 2 を関数ポインタ型だと言い張る変換です。2 番地に関数はありませんが、比較に使うだけなら問題ありません。
- **`struct`**: 複数の値をまとめた型です。`struct wrapper` は比較関数と入れ替え関数をひとまとめにしています。
- **`->`**: 構造体を指すポインタから中身を取り出す書き方です。`p->swap` は「`p` が指す構造体の `swap`」です。
- **`const void *priv`**: 呼び出し側が自由に使える追加データへのポインタです。ここでは `struct wrapper` を指していることがあります。
- **`(int)size`**: 古い形の入れ替え関数は大きさを `int` で受け取るので、型を合わせています。

## 何をしているか

### 古い API 向けのラッパー

```c:line-numbers=139
	if (swap_func == SWAP_WRAPPER) {
		((const struct wrapper *)priv)->swap(a, b, (int)size);
		return;
	}
```

`sort()` には、`priv` を受け取らない古い形の入れ替え関数を渡す API もあります。その場合 `sort()` は関数を `struct wrapper` に詰めて `priv` として渡し、`swap_func` には目印 `SWAP_WRAPPER`（3）を入れます。
ここではそれを見分けて、`wrapper` の中の関数を正しい引数で呼びます。

### 組み込みの入れ替えを直接呼ぶ

```c:line-numbers=144
	if (swap_func == SWAP_WORDS_64)
		swap_words_64(a, b, size);
	else if (swap_func == SWAP_WORDS_32)
		swap_words_32(a, b, size);
	else if (swap_func == SWAP_BYTES)
		swap_bytes(a, b, size);
```

目印が `0` なら 8 バイトずつ、`1` なら 4 バイトずつ、`2` なら 1 バイトずつ入れ替える関数を、**名前で直接**呼びます。
ソートの最初に `is_aligned` で調べた結果、たとえば要素が 16 バイトで 8 の倍数のアドレスにあれば `SWAP_WORDS_64` が選ばれ、以後の入れ替えはすべて `swap_words_64` の直接呼び出しになります。

### 本物の関数ポインタ

```c:line-numbers=150
	else
		swap_func(a, b, (int)size, priv);
```

どの目印でもなければ、利用者が渡した本物の関数なので、間接呼び出しします。

## ここがすごい

- **間接呼び出しが高くつく事情**: 関数ポインタ経由の呼び出しは、CPU の脆弱性（Spectre）対策で「retpoline」という遅い仕組みを通ることがあります。`sort_r` の説明コメントにも、組み込みの入れ替えは retpoline を避けるのでかなり速い、と書かれています。比較 1 回と直接呼び出しに置き換えれば、その遅さを避けられます。
- **型を増やさずに選択肢を表現**: 「どの組み込み関数か」を別の引数や `enum` で渡すのではなく、すでにある関数ポインタの引数に小さな整数を詰め込んでいます。目印の定義の直前のコメントのとおり、値は本物のポインタと混同しないものなら何でもよく、小さい整数にすると比較命令が最小になります。0 番地や 1〜3 番地に本物の関数が置かれることはないので、安全に区別できます。
- **末尾呼び出しへの配慮**: 関数の直前のコメントは、関数ポインタを引数の最後に置くことで、インライン化されなかった場合でも末尾呼び出し（呼んだ関数からそのまま戻る最適化）が効きやすくなると説明しています。
- **トレードオフ**: 整数を関数ポインタにキャストするのは、C の規格上は移植性の怪しい書き方です。カーネルは対応するコンパイラと CPU が決まっているので、その前提の上で速さを取っています。

## まとめ

- 関数ポインタ経由の呼び出しは、直接呼び出しより遅くなることがある（特に retpoline 環境）。
- よく使う選択肢は、目印の値で見分けて直接呼び出すと速い。
- 本物のポインタと絶対に重ならない値（小さな整数）は、目印として使える。
- 古い API と新しい API の違いを、ラッパー構造体と目印で 1 つの実装に吸収している。
