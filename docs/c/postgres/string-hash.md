---
title: "切り詰められて保存される文字列は、切り詰めた長さでハッシュする"
description: "ハッシュ表のキーが文字列のときの既定のハッシュ関数。表に保存されるときに切り詰められる長さに合わせてハッシュを計算し、検索と保存で食い違わないようにしている。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/common/hashfn.c
lines: [654, 671]
function: "string_hash"
difficulty: 1
format: 2
tags: [ハッシュ, 文字列処理, 防御的プログラミング]
---

## ひとことで

`string_hash` は、0 で終わる C の文字列のハッシュ値を計算する関数です。PostgreSQL の汎用ハッシュ表（dynahash）で、特に指定がないときに使われる既定のハッシュ関数でもあります（関数の前のコメントより）。
ポイントは、文字列全体ではなく **最大 `keysize - 1` バイトだけ** をハッシュすることです。たとえば `keysize = 8` で `"abcdefghij"` を渡すと、先頭の `"abcdefg"`（7 バイト）だけでハッシュ値を計算します。

## コード

::: code-group

```c:line-numbers=654 [日本語訳]
/*
 * string_hash: NUL で終わる文字列をキーとするためのハッシュ関数。
 *
 * 注意: 何も指定されなかったときは、これが既定のハッシュ関数になる。
 */
uint32
string_hash(const void *key, Size keysize)
{
	/*
	 * 文字列が keysize-1 バイトを超えるなら、その長さだけをハッシュしたい。
	 * ハッシュ表にコピーされるときに、その長さで切り詰められる
	 * からだ。
	 */
	Size		s_len = strlen((const char *) key);

	s_len = Min(s_len, keysize - 1);
	return hash_bytes((const unsigned char *) key, (int) s_len);
}
```

```c:line-numbers=654 [原文]
/*
 * string_hash: hash function for keys that are NUL-terminated strings.
 *
 * NOTE: this is the default hash function if none is specified.
 */
uint32
string_hash(const void *key, Size keysize)
{
	/*
	 * If the string exceeds keysize-1 bytes, we want to hash only that many,
	 * because when it is copied into the hash table it will be truncated at
	 * that length.
	 */
	Size		s_len = strlen((const char *) key);

	s_len = Min(s_len, keysize - 1);
	return hash_bytes((const unsigned char *) key, (int) s_len);
}
```

:::

## 前提知識

- **C の文字列**: C では、文字（1 バイト）が並び、最後に値 0 のバイト（ヌル文字）が置かれたものを文字列として扱います。`"abc"` はメモリ上では `a b c \0` の 4 バイトです。`strlen` は 0 の手前までの文字数を数えます。
- **`const void *key`**: `void *` は「型を決めていない場所（アドレス）」を指すポインタです。ハッシュ表はいろいろな型のキーを扱うので、関数の形をそろえるために `void *` で受け取り、中で `(const char *)` と型を付け直して使います。`const` は中身を書き換えないという約束です。
- **`Size`**: PostgreSQL での大きさを表す型で、C の `size_t`（符号なし整数）と同じです。
- **`Min(a, b)`**: 小さいほうを返す PostgreSQL のマクロです。
- **`hash_bytes`**: 同じファイルにある、任意のバイト列からハッシュ値を作る汎用の関数です。
- **固定長キー**: PostgreSQL のハッシュ表は、キーを決まった大きさ（`keysize` バイト）の領域にコピーして保存します。文字列が長すぎると、末尾の 0 のための 1 バイトを残して切り詰めてコピーされます。

## 何をしているか

### 1. 文字列の長さを数える

```c:line-numbers=667
	Size		s_len = strlen((const char *) key);
```

`strlen` で、0 の手前までのバイト数を数えます。`"abcdefghij"` なら 10 です。

### 2. 保存できる長さに切り詰める

```c:line-numbers=669
	s_len = Min(s_len, keysize - 1);
```

`keysize - 1` と比べて小さいほうを選びます。`keysize = 8` なら `Min(10, 7) = 7` です。`- 1` は、保存先の最後に 0 を置く場所を残すためです。
短い文字列、たとえば `"abc"` なら `Min(3, 7) = 3` で、そのまま全体を使います。

### 3. その長さでハッシュする

```c:line-numbers=670
	return hash_bytes((const unsigned char *) key, (int) s_len);
```

`hash_bytes` に先頭アドレスと長さを渡し、ハッシュ値を計算して返します。

## ここがすごい

- **保存と検索の食い違いを防ぐ**: 素直に「文字列全体」でハッシュしてしまうと、次のような問題が起きます。`keysize = 8` の表に `"abcdefghij"` を登録すると、表には切り詰められた `"abcdefg"` が保存されます。このとき、全体でハッシュしていると `"abcdefghij"` と `"abcdefgXYZ"` は違うハッシュ値になり、別の棚を探しに行ってしまいます。しかし比較関数（dynahash.c の `string_compare`）は `strncmp(key1, key2, keysize - 1)` で先頭 7 バイトしか比べないので、この 2 つは「同じキー」とみなされるはずのものです。等しいはずのキーが違う棚に行くと、検索に失敗したり重複して登録されたりします。関数の中のコメントが説明している通り、**保存される形と同じ長さでハッシュする** ことで、このずれを根本から防いでいます。
- **ハッシュ関数とキーの保存方法の約束をそろえる**: ハッシュ表の大原則は「等しいキーは等しいハッシュ値を持つ」ことです。ここでは「等しい」が「切り詰めたあとで等しい」という意味なので、ハッシュ関数もそれに合わせる必要があります。保存（`strlcpy` による切り詰め）・比較・ハッシュの 3 つが同じ長さを基準にしているので、約束がそろっています。
- **関数の形をそろえる**: 引数を `const void *` と `Size` にしてあるので、`tag_hash`（固定長のバイト列用）や `uint32_hash` と同じ形の関数ポインタとしてハッシュ表に渡せます。キーの種類ごとに表の実装を変えなくて済みます。
- **短くて読みやすい**: 3 行の処理に対して、なぜ切り詰めるのかを説明するコメントがきちんと付いています。この理由を知らないと「なぜ全体でハッシュしないのか」と書き換えたくなる箇所なので、コメントの価値が大きい関数です。

## まとめ

- ハッシュ表では「等しいキーは等しいハッシュ値」になるよう、ハッシュ関数をキーの保存方法に合わせる。
- 切り詰めて保存されるキーは、切り詰めた長さでハッシュする。
- `void *` で受け取る共通の形にすると、いろいろなキーの種類で同じハッシュ表を使える。
- 書き換えたくなる「一見不要な処理」には、理由をコメントで残す。
