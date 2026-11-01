---
title: "ls -l の「rwxr-xr-x」を作る、権限ビットから文字列への変換"
description: "ファイルの種類と権限を表す mode_t を、ls -l でおなじみの 10 文字の文字列に変える strmode。読み・書き・実行のビットを順に調べ、setuid や sticky ビットとの組み合わせを switch で 4 通りに書き分けている。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-3-Clause
copyright: "Copyright (c) 1990, 1993 The Regents of the University of California.  All rights reserved."
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/string/strmode.c
lines: [73, 144]
function: "strmode"
difficulty: 1
format: 2
tags: [ビット演算, 文字列処理, ファイル, 標準ライブラリ]
---

## ひとことで

`strmode` は、ファイルの種類と権限を表す数値 `mode` を、`ls -l` で表示される `drwxr-xr-x ` のような文字列に変換する BSD の関数です。
`ls` をはじめ、多くのコマンドがこの関数を使って権限を表示しています。
ここで読むのは、種類を表す 1 文字目の後に続く、所有者・グループ・その他の 3 組の権限を書き出す部分です。

## コード

::: code-group

```c:line-numbers=73 [日本語訳]
	/* 所有者 */
	if (mode & S_IRUSR)
		*p++ = 'r';
	else
		*p++ = '-';
	if (mode & S_IWUSR)
		*p++ = 'w';
	else
		*p++ = '-';
	switch (mode & (S_IXUSR | S_ISUID)) {
	case 0:
		*p++ = '-';
		break;
	case S_IXUSR:
		*p++ = 'x';
		break;
	case S_ISUID:
		*p++ = 'S';
		break;
	case S_IXUSR | S_ISUID:
		*p++ = 's';
		break;
	}
	/* グループ */
	if (mode & S_IRGRP)
		*p++ = 'r';
	else
		*p++ = '-';
	if (mode & S_IWGRP)
		*p++ = 'w';
	else
		*p++ = '-';
	switch (mode & (S_IXGRP | S_ISGID)) {
	case 0:
		*p++ = '-';
		break;
	case S_IXGRP:
		*p++ = 'x';
		break;
	case S_ISGID:
		*p++ = 'S';
		break;
	case S_IXGRP | S_ISGID:
		*p++ = 's';
		break;
	}
	/* その他 */
	if (mode & S_IROTH)
		*p++ = 'r';
	else
		*p++ = '-';
	if (mode & S_IWOTH)
		*p++ = 'w';
	else
		*p++ = '-';
	switch (mode & (S_IXOTH | S_ISVTX)) {
	case 0:
		*p++ = '-';
		break;
	case S_IXOTH:
		*p++ = 'x';
		break;
	case S_ISVTX:
		*p++ = 'T';
		break;
	case S_IXOTH | S_ISVTX:
		*p++ = 't';
		break;
	}
	*p++ = ' ';
	*p = '\0';
}
```

```c:line-numbers=73 [原文]
	/* usr */
	if (mode & S_IRUSR)
		*p++ = 'r';
	else
		*p++ = '-';
	if (mode & S_IWUSR)
		*p++ = 'w';
	else
		*p++ = '-';
	switch (mode & (S_IXUSR | S_ISUID)) {
	case 0:
		*p++ = '-';
		break;
	case S_IXUSR:
		*p++ = 'x';
		break;
	case S_ISUID:
		*p++ = 'S';
		break;
	case S_IXUSR | S_ISUID:
		*p++ = 's';
		break;
	}
	/* group */
	if (mode & S_IRGRP)
		*p++ = 'r';
	else
		*p++ = '-';
	if (mode & S_IWGRP)
		*p++ = 'w';
	else
		*p++ = '-';
	switch (mode & (S_IXGRP | S_ISGID)) {
	case 0:
		*p++ = '-';
		break;
	case S_IXGRP:
		*p++ = 'x';
		break;
	case S_ISGID:
		*p++ = 'S';
		break;
	case S_IXGRP | S_ISGID:
		*p++ = 's';
		break;
	}
	/* other */
	if (mode & S_IROTH)
		*p++ = 'r';
	else
		*p++ = '-';
	if (mode & S_IWOTH)
		*p++ = 'w';
	else
		*p++ = '-';
	switch (mode & (S_IXOTH | S_ISVTX)) {
	case 0:
		*p++ = '-';
		break;
	case S_IXOTH:
		*p++ = 'x';
		break;
	case S_ISVTX:
		*p++ = 'T';
		break;
	case S_IXOTH | S_ISVTX:
		*p++ = 't';
		break;
	}
	*p++ = ' ';
	*p = '\0';
}
```

:::

## 前提知識

- **Unix のファイル権限**: 各ファイルには「所有者（user）」「グループ（group）」「その他（other）」の 3 組について、読み（r）・書き（w）・実行（x）の許可があります。
- **`mode_t` とビット**: 権限は 1 つの整数の各ビットで表されます。たとえば `S_IRUSR` は「所有者が読める」を表すビット（8 進数で 0400）、`S_IXOTH` は「その他が実行できる」ビット（0001）です。`chmod 755` の 755 は、このビットを 8 進数で書いたものです。
- **特別なビット**: `S_ISUID`（setuid、実行時に所有者の権限で動く）、`S_ISGID`（setgid、グループの権限で動く）、`S_ISVTX`（sticky、ディレクトリ内のファイルを所有者しか消せない）があります。これらは x の位置に `s` や `t` として表示されます。
- **`&` によるビットの検査**: `mode & S_IRUSR` は、そのビットが立っていれば 0 以外、立っていなければ 0 になります。C の `if` は 0 以外を「真」とみなします。
- **ポインタ `*p++ = 'r'`**: `p` が指す場所に `'r'` を書き、`p` を 1 つ進めます。呼び出し側が用意したバッファ（12 バイト以上）に、1 文字ずつ書いていきます。
- **`switch`**: 値に応じて `case` に分岐する文です。`break` で抜けます。

## 何をしているか

この抜粋の前では、`mode & S_IFMT` でファイルの種類を取り出し、ディレクトリなら `d`、通常ファイルなら `-`、シンボリックリンクなら `l` を書きます。

### 1. 所有者の読み・書き

```c:line-numbers=73
	/* usr */
	if (mode & S_IRUSR)
		*p++ = 'r';
	else
		*p++ = '-';
	if (mode & S_IWUSR)
		*p++ = 'w';
	else
		*p++ = '-';
```
`S_IRUSR` が立っていれば `r`、なければ `-`。`S_IWUSR` も同様に `w` か `-` です。

### 2. 所有者の実行と setuid

```c:line-numbers=82
	switch (mode & (S_IXUSR | S_ISUID)) {
	case 0:
		*p++ = '-';
		break;
	case S_IXUSR:
		*p++ = 'x';
		break;
	case S_ISUID:
		*p++ = 'S';
		break;
	case S_IXUSR | S_ISUID:
		*p++ = 's';
		break;
	}
```
ここが面白いところです。実行ビット `S_IXUSR` と setuid ビット `S_ISUID` の **2 つを同時に取り出し**、4 通りの組み合わせで分岐します。

| 実行 | setuid | 表示 |
| --- | --- | --- |
| なし | なし | `-` |
| あり | なし | `x` |
| なし | あり | `S` |
| あり | あり | `s` |

大文字の `S` は「setuid が付いているのに実行できない」という、たいてい設定ミスの状態を目立たせる表示です。

### 3. グループとその他

```c:line-numbers=105
	switch (mode & (S_IXGRP | S_ISGID)) {
	case 0:
		*p++ = '-';
		break;
	case S_IXGRP:
		*p++ = 'x';
		break;
	case S_ISGID:
		*p++ = 'S';
		break;
	case S_IXGRP | S_ISGID:
		*p++ = 's';
		break;
	}
```
同じ形が 2 回繰り返されます。グループの実行位置は setgid と組み合わせて `x / S / s`、その他の実行位置は sticky ビットと組み合わせて `x / T / t` になります。

### 4. 最後の空白と終端

```c:line-numbers=142
	*p++ = ' ';
	*p = '\0';
```
最後に空白を 1 つと、文字列の終わりを示す `'\0'` を書きます。この空白は、ACL などの追加情報を示す記号を置く場所として、`ls` などの表示で使われることがあります。

### 5. 具体例

`mode` が通常ファイルで 8 進数 4755 のとき（`/usr/bin/su` のような setuid プログラム）:

- 種類: `-`
- 所有者: 読み・書き可、実行と setuid の両方 → `rws`
- グループ: `r-x`、その他: `r-x`

結果は `-rwsr-xr-x ` です。

## ここがすごい

- **組み合わせをまとめて取り出す**: `mode & (S_IXUSR | S_ISUID)` は、2 つのビットを一度に取り出す書き方です。`if` を入れ子にして「実行可能なら、さらに setuid なら…」と書くより、4 通りの結果が表のように並んで読みやすく、間違いにくくなります。
- **規則的な形の繰り返し**: 3 組の権限がまったく同じ形で書かれているので、どこか 1 か所だけ違えば目で見てすぐわかります。ループや表で短くまとめることもできますが、あえて展開して書くことで、各ビットの意味がそのまま読めるコードになっています。
- **`#ifdef` で環境差を吸収**: 抜粋の前の種類の判定では、`S_IFIFO` や `S_IFWHT`（ホワイトアウト、重ねたファイルシステムで「削除された」ことを示す特別なエントリ）のように、環境によって存在しない定義を `#ifdef` で囲んでいます。
- **呼び出し側のバッファに書く**: 関数の中でメモリを確保しないので、失敗することがなく、解放の心配もありません。必要な大きさ（種類 1 + 権限 9 + 空白 1 + 終端 1 = 12 バイト）は決まっているので、呼び出し側が `char buf[12]` を用意すれば十分です。

## まとめ

- ファイルの権限は整数のビットで表され、`&` で 1 つずつ調べられる。
- 関係する 2 つのビットを同時に取り出して `switch` すると、組み合わせを表のように書ける。
- `S` や `T` の大文字は「特別なビットはあるのに実行できない」ことを示す。
- 出力の長さが決まっているなら、呼び出し側のバッファに書くのがいちばん簡単で安全。
