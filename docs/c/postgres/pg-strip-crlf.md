---
title: "末尾から改行を削る、str[--len] = '\\0' のひと工夫"
description: "文字列の末尾にある改行（\\n）と復帰（\\r）をすべて取り除き、新しい長さを返す関数。後ろから見ていき、削った位置に 0 を書くだけで文字列を短くする。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/common/string.c
lines: [152, 171]
function: "pg_strip_crlf"
difficulty: 1
format: 2
tags: [文字列処理, イディオム, 移植性]
---

## ひとことで

`pg_strip_crlf` は、文字列の **末尾にある改行文字をすべて削り**、削ったあとの長さを返します。
たとえば `"password\r\n"` を渡すと、文字列は `"password"` に書き換わり、`8` が返ります。
ファイルや端末から 1 行読んだとき、最後に付いてくる改行を取り除くための関数です。Windows では行末が `\r\n`（2 文字）、Unix 系では `\n`（1 文字）なので、両方をまとめて削れるようにしています。

## コード

::: code-group

```c:line-numbers=152 [日本語訳]
/*
 * pg_strip_crlf -- 末尾の改行と復帰をすべて取り除く
 *
 * 入力文字列の末尾にある改行と復帰の文字（Windows の \r）を
 * 取り除き、0 で終端させる。
 *
 * 渡される文字列は 0 で終わっていなければならない。この関数は
 * 文字列の新しい長さを返す。
 */
int
pg_strip_crlf(char *str)
{
	int			len = strlen(str);

	while (len > 0 && (str[len - 1] == '\n' ||
					   str[len - 1] == '\r'))
		str[--len] = '\0';

	return len;
}
```

```c:line-numbers=152 [原文]
/*
 * pg_strip_crlf -- Remove any trailing newline and carriage return
 *
 * Removes any trailing newline and carriage return characters (\r on
 * Windows) in the input string, zero-terminating it.
 *
 * The passed in string must be zero-terminated.  This function returns
 * the new length of the string.
 */
int
pg_strip_crlf(char *str)
{
	int			len = strlen(str);

	while (len > 0 && (str[len - 1] == '\n' ||
					   str[len - 1] == '\r'))
		str[--len] = '\0';

	return len;
}
```

:::

## 前提知識

- **C の文字列**: 文字の並びの最後に値 0 のバイト（`'\0'`）を置いたものです。この 0 の位置で文字列が終わるので、**途中に 0 を書けば、そこで文字列が短くなります**。
- **`\n` と `\r`**: `\n` は改行（LF、値 10）、`\r` は復帰（CR、値 13）という制御文字です。行の終わりの書き方は OS によって違い、Windows は `\r\n`、Linux や macOS は `\n` です。
- **配列の添字**: `str[i]` は文字列の `i` 番目（0 から数える）の文字です。長さが `len` の文字列では、最後の文字は `str[len - 1]` です。
- **`--len`（前置デクリメント）**: `len` を 1 減らしてから、その値を使います。`str[--len] = '\0'` は「`len` を 1 減らし、その位置に 0 を書く」という意味です。
- **`&&` の短絡評価**: `A && B` は、`A` が偽なら `B` を評価しません。
- **`strlen`**: 0 の手前までの文字数を返す標準関数です。

## 何をしているか

### 1. 長さを測る

```c:line-numbers=164
	int			len = strlen(str);
```

`str = "password\r\n"` なら、`len = 10` です（`password` の 8 文字と `\r`、`\n`）。

### 2. 末尾が改行のあいだ削り続ける

```c:line-numbers=166
	while (len > 0 && (str[len - 1] == '\n' ||
					   str[len - 1] == '\r'))
		str[--len] = '\0';
```

条件は「`len` が 0 より大きく、かつ最後の文字 `str[len - 1]` が `\n` か `\r`」です。

- 1 回目: `str[9]` は `\n`。`len` を 9 にして `str[9]` に 0 を書きます。文字列は `"password\r"` になります。
- 2 回目: `str[8]` は `\r`。`len` を 8 にして `str[8]` に 0 を書きます。文字列は `"password"` です。
- 3 回目: `str[7]` は `d` なので終わります。

### 3. 新しい長さを返す

```c:line-numbers=170
	return len;
```

`len = 8` を返します。呼ぶ側はもう一度 `strlen` を呼ばなくても、新しい長さを知ることができます。

### 4. 特殊な場合

`str = "\n"` なら、1 回削って `len = 0` になり、ループの条件 `len > 0` が偽になって止まります。空文字列 `""` なら最初から `len = 0` で、`str[-1]` を読むことはありません。

## ここがすごい

- **`len > 0` を先に書いて範囲外を防ぐ**: `&&` は左が偽なら右を評価しないので、`len` が 0 のときに `str[len - 1]`、つまり `str[-1]`（文字列の手前のメモリ）を読むことがありません。条件の順番そのものが安全装置になっています。
- **0 を書くだけで「削除」できる**: C の文字列は 0 で終わるので、後ろの文字を消すのにメモリを詰め直したり確保し直したりする必要がありません。1 バイト書き換えるだけです。
- **改行の組み合わせを気にしない**: 素直に書くと「最後が `\n` なら削る。その前が `\r` ならそれも削る」と、`\r\n` の形を決め打ちにしがちです。この関数は「末尾が `\n` か `\r` である限り削る」という単純なルールにしたので、`\r\n`、`\n`、`\r`、`\n\n` のような変則的な形でも同じように扱えます。
- **長さを返す設計**: 削ったあとの長さは関数の中ですでにわかっています。それを返すことで、呼び出し側の無駄な `strlen` を省けます。もとの文字列を書き換える関数でも、役に立つ情報を戻り値で渡す良い例です。
- **以前は各所に散らばっていた処理**: 同じような改行除去は多くのプログラムで手書きされがちです。小さくても共通関数にまとめておけば、`\r` の削り忘れのようなバグを 1 か所で防げます。

## まとめ

- C の文字列は、途中に 0 を書くだけで短くできる。
- `len > 0 && str[len - 1] ...` のように、範囲チェックを `&&` の左に置くと安全。
- 改行の形を決め打ちせず「該当する文字が続く限り削る」とすると、変則的な入力にも強い。
- 関数の中でわかっている値（新しい長さ）は、戻り値で返すと呼ぶ側が楽になる。
