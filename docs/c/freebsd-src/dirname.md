---
title: "末尾のスラッシュに惑わされずに親ディレクトリを取り出す dirname"
description: "パスから「最後の要素を除いた部分」を返す POSIX の dirname。後ろから 3 回だけ走査し、末尾のスラッシュ、最後の要素、その手前のスラッシュの順に削ることで、\"/usr/lib/\" や \"/\" のような境界の入力も正しく扱う。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-2-Clause
copyright: "Copyright (c) 2015-2016 Nuxi, https://nuxi.nl/"
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/gen/dirname.c
lines: [29, 70]
function: "dirname"
difficulty: 1
format: 2
tags: [文字列処理, ファイル, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`dirname` は、ファイルのパスから **親ディレクトリの部分** を取り出す POSIX の関数です。`dirname("/usr/lib/libc.so")` は `"/usr/lib"` を返します。
単純に「最後の `/` より前」を取るだけだと思われがちですが、`"/usr/lib/"`（末尾に `/`）、`"libc.so"`（`/` がない）、`"/"`（ルートだけ）、`"//usr//"`（`/` の重複）などの入力で間違えやすい関数です。
FreeBSD の実装は、文字列の **後ろから 3 段階** に削っていくことで、これらをすべて同じ流れで処理しています。

## コード

::: code-group

```c:line-numbers=29 [日本語訳]
char *
(dirname)(char *path)
{
	char *end;

	/*
	 * path が NULL ポインタか空文字列を指しているなら、
	 * dirname() は文字列 "." へのポインタを返す。
	 */
	if (path == NULL || *path == '\0')
		return (__DECONST(char *, "."));

	/* パスの最後の要素の終わりを探す。 */
	end = path + strlen(path);
	while (end > path + 1 && *(end - 1) == '/')
		--end;

	/* パスの最後の要素を取り除く。 */
	while (end > path && *(end - 1) != '/')
		--end;

	/*
	 * path に '/' が含まれないなら、dirname() は
	 * 文字列 "." へのポインタを返す。
	 */
	if (end == path) {
		path[0] = '.';
		path[1] = '\0';
		return (path);
	}

	/*
	 * 結果のディレクトリ名から末尾のスラッシュを取り除く。
	 * 少なくとも 1 文字は残るようにする。
	 */
	while (end > path + 1 && *(end - 1) == '/')
		--end;

	/* ディレクトリ名を NUL で終わらせて返す。 */
	*end = '\0';
	return (path);
}
```

```c:line-numbers=29 [原文]
char *
(dirname)(char *path)
{
	char *end;

	/*
	 * If path is a null pointer or points to an empty string,
	 * dirname() shall return a pointer to the string ".".
	 */
	if (path == NULL || *path == '\0')
		return (__DECONST(char *, "."));

	/* Find end of last pathname component. */
	end = path + strlen(path);
	while (end > path + 1 && *(end - 1) == '/')
		--end;

	/* Strip off the last pathname component. */
	while (end > path && *(end - 1) != '/')
		--end;

	/*
	 * If path does not contain a '/', then dirname() shall return a
	 * pointer to the string ".".
	 */
	if (end == path) {
		path[0] = '.';
		path[1] = '\0';
		return (path);
	}

	/*
	 * Remove trailing slashes from the resulting directory name. Ensure
	 * that at least one character remains.
	 */
	while (end > path + 1 && *(end - 1) == '/')
		--end;

	/* Null terminate directory name and return it. */
	*end = '\0';
	return (path);
}
```

:::

## 前提知識

- **C の文字列**: 文字の並びの最後に値 0 のバイト（`'\0'`）が置かれたものです。途中に `'\0'` を書くと、そこで文字列が終わったことになります。
- **ポインタ**: メモリ上の場所を指す値です。`end` は文字列の中のある位置を指し、`--end` で 1 文字前へ戻ります。`*(end - 1)` は `end` の 1 つ前の文字です。
- **ポインタの比較**: 同じ文字列の中を指すポインタは `>` で前後を比べられます。`end > path + 1` は「先頭から 2 文字目より後ろにいる」という意味です。
- **`strlen`**: 文字列の長さを返す関数です。`path + strlen(path)` は終端の `'\0'` の位置です。
- **`NULL`**: どこも指さないポインタです。
- **`__DECONST`**: `const`（書き換え禁止）の付いたポインタから `const` を外す FreeBSD のマクロです。`"."` は書き換えてはいけない文字列ですが、戻り値の型 `char *` に合わせるために使っています。

## 何をしているか

### 1. 空なら "."

```c:line-numbers=38
	if (path == NULL || *path == '\0')
		return (__DECONST(char *, "."));
```
`NULL` か空文字列なら、POSIX の決まりどおり `"."`（今のディレクトリ）を返します。

### 2. 末尾のスラッシュを飛ばす

```c:line-numbers=42
	end = path + strlen(path);
	while (end > path + 1 && *(end - 1) == '/')
		--end;
```
`end` を文字列の終わりに置き、`/` が続く間だけ戻ります。ただし `end > path + 1` なので、少なくとも 1 文字は残します。`"/"` だけの入力で全部消えてしまわないためです。

### 3. 最後の要素を飛ばす

```c:line-numbers=47
	while (end > path && *(end - 1) != '/')
		--end;
```
今度は `/` 以外の文字が続く間だけ戻ります。これで最後の要素（ファイル名など）を飛び越えます。

### 4. `/` がなかった場合

```c:line-numbers=54
	if (end == path) {
		path[0] = '.';
		path[1] = '\0';
		return (path);
	}
```
先頭まで戻ってしまったら、パスに `/` がなかったということです。`"."` を返します。ここでは渡された `path` 自体を `"."` に書き換えて返しています。

### 5. 間のスラッシュを削って終わる

```c:line-numbers=64
	while (end > path + 1 && *(end - 1) == '/')
		--end;

	/* Null terminate directory name and return it. */
	*end = '\0';
	return (path);
```
最後の要素の手前にある `/`（複数かもしれない）を、1 文字残して飛ばします。その位置に `'\0'` を書いて、`path` を返します。

### 6. 具体例

- `"/usr/lib/"`: 2 で末尾の `/` を飛ばし、3 で `lib` を飛ばし、5 で `/` を飛ばして `"/usr"`。
- `"libc.so"`: 3 で先頭まで戻るので、4 で `"."`。
- `"/"`: 2 では 1 文字残して止まり、3 では `/` なので動かず、5 でも 1 文字残すので `"/"`。
- `"//usr//"`: 末尾の `//` を飛ばし、`usr` を飛ばし、先頭の `//` を 1 文字残して削るので `"/"`。

## ここがすごい

- **3 つのループで境界の入力をすべて処理する**: 「末尾の `/`」「最後の要素」「その手前の `/`」という 3 つの塊を順に削るだけで、末尾スラッシュ、スラッシュの重複、ルートだけ、といった特殊な場合を特別扱いせずに扱えます。`strrchr` で最後の `/` を探す素直な方法だと、`"/usr/lib/"` では `"/usr/lib"` を返してしまいます。
- **「1 文字は残す」という条件**: 2 か所の `end > path + 1` が、ルート `"/"` を守っています。この 1 つの条件のおかげで、`"/usr"` の親が空文字列ではなく `"/"` になります。
- **メモリを確保しない**: 結果を新しく作らず、渡された文字列の途中に `'\0'` を書いて返します。失敗することがなく、解放の手間もありません。その代わり、渡した文字列は書き換えられるので、元のパスが必要なら呼び出し側でコピーしておく必要があります。POSIX はこの書き換えを許しています。
- **兄弟の `basename` と同じ形**: 同じディレクトリの `basename.c` も、末尾の `/` を飛ばしてから最後の要素の先頭を探す、という同じ形で書かれています。2 つを並べて読むと、どこが違うのかがよくわかります。

## まとめ

- パスの処理は、末尾のスラッシュやルートのような境界の入力でこそ間違えやすい。
- 後ろから「スラッシュ」「名前」「スラッシュ」の順に削ると、特殊な場合を分けずに済む。
- 「最低 1 文字は残す」という条件で、ルートディレクトリを守れる。
- 結果を元の文字列の中に作る関数は速いが、入力が書き換わることに注意する。
