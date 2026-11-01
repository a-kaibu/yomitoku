---
title: "針の長さで 4 種類のアルゴリズムを使い分ける strstr の入口"
description: "文字列の中から部分文字列を探す標準関数の入口部分。探す文字列が短いときは専用の速い関数へ、長いときは Two-Way 法へと振り分け、途中で「もう見つかりえない」場合を素早く切り捨てる。"
language: c
project: musl
repo: https://github.com/ifduyue/musl
license: MIT
copyright: "Copyright © 2005-2020 Rich Felker, et al."
commit: "7813e9119eb5fe681b6750b8a033a0490bca0941"
file: src/string/strstr.c
lines: [138, 154]
function: "strstr"
difficulty: 2
format: 2
tags: [文字列処理, 探索, アルゴリズム, 最適化]
---

## ひとことで

`strstr(h, n)` は、文字列 `h`（haystack＝干し草の山）の中から、文字列 `n`（needle＝針）が最初に現れる場所を返します。見つからなければ `NULL` です。
`strstr("hello world", "wor")` は `"world"` の先頭を指すポインタを返します。
この関数そのものは「振り分け係」で、針の長さに応じて 2 文字用・3 文字用・4 文字用・それ以上用（Two-Way 法）の 4 つの探索関数を使い分けます。

## コード

::: code-group

```c:line-numbers=138 [日本語訳]
char *strstr(const char *h, const char *n)
{
	/* 針が空ならすぐに返す */
	if (!n[0]) return (char *)h;

	/* 短い針には速いアルゴリズムを使う */
	h = strchr(h, *n);
	if (!h || !n[1]) return (char *)h;
	if (!h[1]) return 0;
	if (!n[2]) return twobyte_strstr((void *)h, (void *)n);
	if (!h[2]) return 0;
	if (!n[3]) return threebyte_strstr((void *)h, (void *)n);
	if (!h[3]) return 0;
	if (!n[4]) return fourbyte_strstr((void *)h, (void *)n);

	return twoway_strstr((void *)h, (void *)n);
}
```

```c:line-numbers=138 [原文]
char *strstr(const char *h, const char *n)
{
	/* Return immediately on empty needle */
	if (!n[0]) return (char *)h;

	/* Use faster algorithms for short needles */
	h = strchr(h, *n);
	if (!h || !n[1]) return (char *)h;
	if (!h[1]) return 0;
	if (!n[2]) return twobyte_strstr((void *)h, (void *)n);
	if (!h[2]) return 0;
	if (!n[3]) return threebyte_strstr((void *)h, (void *)n);
	if (!h[3]) return 0;
	if (!n[4]) return fourbyte_strstr((void *)h, (void *)n);

	return twoway_strstr((void *)h, (void *)n);
}
```

:::

## 前提知識

- **C の文字列**: 文字の並びの最後に値 0 のバイトを置いたものです。`n[1]` が 0 なら、`n` は 1 文字だけの文字列です。
- **ポインタと添字**: `h[2]` は `h` が指す場所から 3 文字目です。`*n` は `n[0]` と同じ意味です。
- **`!` で終端を判定**: `!n[0]` は「`n[0]` が 0（終端）」、つまり `n` が空文字列であることを表します。
- **`strchr(h, c)`**: 文字列 `h` の中から文字 `c` を探し、最初に現れる場所を返します。なければ `NULL` です。
- **`(void *)` の型変換**: 振り分け先の関数は `const unsigned char *`（0〜255 として読む文字）を受け取るので、型を合わせるために一度 `void *` を経由しています。
- **`(char *)h`**: 標準の決まりで `strstr` の戻り値は `char *` なので、`const` を外して返しています。
- **Two-Way 法**: 長い針のための文字列探索アルゴリズムです。追加のメモリをほとんど使わず、最悪でも文字列の長さに比例する時間で探せるのが特徴です。

## 何をしているか

### 1. 空の針

```c:line-numbers=141
	if (!n[0]) return (char *)h;
```

空文字列はどこにでも「現れる」とみなすのが標準の決まりなので、`h` の先頭をそのまま返します。

### 2. 最初の 1 文字で山を削る

```c:line-numbers=144
	h = strchr(h, *n);
	if (!h || !n[1]) return (char *)h;
```

`strchr(h, *n)` で、針の最初の文字が山の中に現れる最初の位置まで一気に進みます。見つからなければ `NULL` が返り、ここで終わります。針が 1 文字だけなら、この位置がそのまま答えです。
`strstr("hello world", "wor")` なら、`h` は `"world"` の `w` を指すところまで進みます。

### 3. 長さを 1 文字ずつ確かめながら振り分け

```c:line-numbers=146
	if (!h[1]) return 0;
	if (!n[2]) return twobyte_strstr((void *)h, (void *)n);
	if (!h[2]) return 0;
	if (!n[3]) return threebyte_strstr((void *)h, (void *)n);
	if (!h[3]) return 0;
	if (!n[4]) return fourbyte_strstr((void *)h, (void *)n);
```

ここからは「針の長さ」と「山の残りの長さ」を交互に確かめます。

- `!h[1]`: 山が 1 文字しか残っていないのに、針は 2 文字以上ある → 見つかりえないので 0。
- `!n[2]`: 針が 2 文字なら `twobyte_strstr` へ。
- `!h[2]`: 山が 2 文字しか残っていないのに針は 3 文字以上 → 0。
- `!n[3]`: 針が 3 文字なら `threebyte_strstr` へ。
- 以下同様に、4 文字なら `fourbyte_strstr` へ。

`"wor"` は 3 文字なので `threebyte_strstr` が呼ばれます。

### 4. 5 文字以上は Two-Way 法

```c:line-numbers=153
	return twoway_strstr((void *)h, (void *)n);
```

針が 5 文字以上なら、`twoway_strstr` で探します。

## ここがすごい

- **strlen を呼ばずに長さを判定**: 針の長さを知るために `strlen(n)` を呼ぶと、長い針では最後まで数える必要があります。ここでは `n[1]`、`n[2]`…と必要な分だけ覗くので、5 文字目まで見れば振り分けが決まります。山についても同じで、残りが短すぎる場合だけを素早く検出します。
- **短い針には専用の速い関数**: 2〜4 文字なら、針全体を 1 つの整数に詰めて、山の上を 1 文字ずつ「窓」をずらしながら整数比較するだけで探せます。Two-Way 法の前処理（針の分析）は短い針には割に合わないので、使いません。
- **最初の文字の検索を速い関数に任せる**: `strchr` は 8 バイトずつ調べる高速な実装なので、最初の文字が現れない長い区間を一気に飛ばせます。
- **最悪の場合も安全**: 単純な「ずらしては比べる」方法は、`"aaaa...ab"` のような意地悪な入力で、山の長さ×針の長さの時間がかかります。Two-Way 法はどんな入力でも山の長さに比例する時間で終わるので、長い針でも性能が崩れません。

## まとめ

- 汎用の関数でも、入力の大きさで最適なアルゴリズムは変わる。入口で振り分けるのは有効な設計。
- 長さが「ある値以上か」だけ知りたいなら、strlen で全部数えずに、その位置を覗けばよい。
- 最初の文字を高速に探して候補を絞るのは、文字列探索の定番の前処理。
