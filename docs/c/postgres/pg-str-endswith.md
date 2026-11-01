---
title: "ポインタを後ろへずらして strcmp、末尾一致を 2 行で判定する"
description: "文字列が指定の文字列で終わるかを調べる関数。長さを比べて早めに失敗させ、ポインタを末尾側へずらすだけで既存の strcmp を使い回している。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/common/string.c
lines: [29, 45]
function: "pg_str_endswith"
difficulty: 1
format: 2
tags: [文字列処理, イディオム, 標準ライブラリ]
---

## ひとことで

`pg_str_endswith` は、文字列 `str` が文字列 `end` で **終わっているか** を調べ、`true` か `false` を返します。
たとえば `pg_str_endswith("backup.tar.gz", ".gz")` は `true`、`pg_str_endswith("gz", "tar.gz")` は `false` です。
ファイル名の拡張子を確かめるような場面で使われる、短くて素直な関数ですが、C の文字列とポインタの扱い方の基本がよく詰まっています。

## コード

::: code-group

```c:line-numbers=29 [日本語訳]
/*
 * 文字列 `str' が接尾辞 `end' を持つかどうかを返す。
 */
bool
pg_str_endswith(const char *str, const char *end)
{
	size_t		slen = strlen(str);
	size_t		elen = strlen(end);

	/* 長いなら接尾辞にはなりえない */
	if (elen > slen)
		return false;

	/* 文字列の末尾を比べる */
	str += slen - elen;
	return strcmp(str, end) == 0;
}
```

```c:line-numbers=29 [原文]
/*
 * Returns whether the string `str' has the postfix `end'.
 */
bool
pg_str_endswith(const char *str, const char *end)
{
	size_t		slen = strlen(str);
	size_t		elen = strlen(end);

	/* can't be a postfix if longer */
	if (elen > slen)
		return false;

	/* compare the end of the strings */
	str += slen - elen;
	return strcmp(str, end) == 0;
}
```

:::

## 前提知識

- **C の文字列**: C には文字列型がなく、文字（1 バイト）の並びの最後に値 0 のバイト（ヌル文字 `'\0'`）を置いたものを文字列として扱います。`"abc"` はメモリ上では `a b c \0` です。
- **ポインタ**: `const char *str` は「文字が並んでいる場所」を指す値です。`const` は、この関数は中身を書き換えないという約束です。
- **ポインタの足し算**: `str += 3` とすると、`str` は 3 文字先を指すようになります。文字列 `"abcdef"` を指していた `str` に 3 を足すと、`"def"` を指すポインタとして使えます。最後の 0 は同じ場所にあるので、そこから先も「0 で終わる文字列」のままです。
- **`strlen`**: 文字列の長さ（0 の手前までの文字数）を返す標準関数です。
- **`strcmp`**: 2 つの文字列を比べる標準関数で、まったく同じなら 0 を返します。
- **`size_t`**: 長さを表す符号なし整数の型です。符号なしなので、引き算の結果が負になる計算は避ける必要があります。
- **`bool`**: `true` か `false` の 2 値をとる型です。

## 何をしているか

### 1. 両方の長さを数える

```c:line-numbers=35
	size_t		slen = strlen(str);
	size_t		elen = strlen(end);
```

`str = "backup.tar.gz"` なら `slen = 13`、`end = ".gz"` なら `elen = 3` です。

### 2. 末尾のほうが長ければ即座に失敗

```c:line-numbers=39
	if (elen > slen)
		return false;
```

`end` のほうが長ければ、末尾に収まるはずがないので `false` を返します。`str = "gz"`、`end = "tar.gz"` なら `6 > 2` でここで終わります。

### 3. 比べ始める位置へ進める

```c:line-numbers=43
	str += slen - elen;
```

`slen - elen = 10` だけ `str` を進めます。すると `str` は `"backup.tar.gz"` の 10 文字目、つまり `".gz"` の部分を指します。

### 4. 残りを strcmp で比べる

```c:line-numbers=44
	return strcmp(str, end) == 0;
```

`strcmp(".gz", ".gz")` は 0 なので、`true` が返ります。もし `str` が `"backup.tar.bz"` なら、進めた先は `".bz"` で、`strcmp` は 0 以外を返し `false` になります。

## ここがすごい

- **長さチェックが安全装置を兼ねる**: `if (elen > slen)` のチェックは、単なる早期終了ではありません。`size_t` は符号なしなので、もし `elen > slen` のまま `slen - elen` を計算すると、負の数ではなく **非常に大きな正の数** になってしまいます。そのぶん `str` を進めると、文字列のはるか先の無関係なメモリを指し、`strcmp` が読んではいけない場所を読みます。順序を守ってチェックしているので、この落とし穴を避けています。
- **新しい比較ループを書かない**: 末尾を比べるために 1 文字ずつ後ろから比べるループを自分で書くこともできます。しかし C の文字列は「どこから読み始めても 0 で終わる」という性質を持つので、ポインタをずらすだけで末尾部分も立派な文字列になります。こうすれば、よくテストされた `strcmp` をそのまま使えます。
- **ちょうど同じ長さまで比べる**: `str` を `slen - elen` だけ進めたので、残りの長さはちょうど `elen` です。`strcmp` は両方の 0 まで比べるので、「末尾の `elen` 文字が一致し、かつ残りの長さも同じ」ことを一度に確かめられます。`strncmp` で長さを指定する必要もありません。
- **空文字列でも正しい**: `end = ""` なら `elen = 0` で、`str` は末尾の 0 を指し、`strcmp("", "")` は 0 なので `true` です。「どんな文字列も空文字列で終わる」という数学的に自然な答えになります。

## まとめ

- C の文字列は、途中を指すポインタも「0 で終わる文字列」として使える。
- 符号なしの長さどうしの引き算は、大小を確かめてから行う。
- 末尾の比較は、ポインタを後ろにずらして既存の `strcmp` に任せると簡潔。
- 早期リターンが、高速化と安全性の両方の役目を果たすことがある。
