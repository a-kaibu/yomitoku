---
title: "空のトークンも取りこぼさない、strtok の後継 strsep"
description: "文字列を区切り文字で分割する strsep。呼び出し側の変数を「次に読む位置」として書き換えることで、隠れた状態を持たずに分割を進める、短くて素直な実装。"
language: c
project: glibc
repo: https://github.com/bminor/glibc
license: LGPL-2.1-or-later
copyright: "Copyright (C) 1992-2026 Free Software Foundation, Inc."
commit: "04e750e75b73957cf1c791535a3f4319534a52fc"
file: string/strsep.c
lines: [23, 46]
format: 2
function: "__strsep"
difficulty: 1
tags: [文字列処理, パース, 標準ライブラリ, API設計]
---

## ひとことで

`strsep` は、文字列を区切り文字で 1 つずつ切り出す関数です（BSD 由来）。
たとえば `"a,b,,c"` を `","` で区切ると、呼ぶたびに `"a"`、`"b"`、`""`（空）、`"c"` が返り、最後に `NULL` が返ります。
古くからある `strtok` と違い、**空のトークンも返し**、関数の中に状態を隠し持たないのが特徴です。

## コード

::: code-group

```c:line-numbers=23 [日本語訳]
char *
__strsep (char **stringp, const char *delim)
{
  char *begin, *end;

  begin = *stringp;
  if (begin == NULL)
    return NULL;

  /* トークンの終わりを探す。  */
  end = begin + strcspn (begin, delim);

  if (*end)
    {
      /* トークンを終わらせ、*STRINGP を NUL 文字の次に進める。  */
      *end++ = '\0';
      *stringp = end;
    }
  else
    /* もう区切り文字はない。これが最後のトークン。  */
    *stringp = NULL;

  return begin;
}
```

```c:line-numbers=23 [原文]
char *
__strsep (char **stringp, const char *delim)
{
  char *begin, *end;

  begin = *stringp;
  if (begin == NULL)
    return NULL;

  /* Find the end of the token.  */
  end = begin + strcspn (begin, delim);

  if (*end)
    {
      /* Terminate the token and set *STRINGP past NUL character.  */
      *end++ = '\0';
      *stringp = end;
    }
  else
    /* No more delimiters; this is the last token.  */
    *stringp = NULL;

  return begin;
}
```

:::

## 前提知識

- **C の文字列**: 文字が並び、最後に値 `0` のバイト（`'\0'`）が置かれたものです。途中に `'\0'` を書き込むと、そこで文字列が終わったことになります。
- **ポインタ**: メモリ上の場所を表す値です。`char *begin` は「文字の場所」を指します。`*end` はその場所の文字、`end + 3` は 3 文字先の場所です。
- **ポインタへのポインタ（`char **stringp`）**: 「文字の場所を入れた変数」の場所です。`*stringp` で呼び出し側の変数の中身（文字列の位置）を読み、`*stringp = end` で **呼び出し側の変数そのものを書き換え** られます。
- **`NULL`**: どこも指さないポインタです。ここでは「もう切り出すものがない」という意味に使います。
- **`strcspn(s, delim)`**: `s` の先頭から、`delim` に含まれる文字が最初に現れるまでの長さを返す標準関数です。`strcspn("ab,c", ",")` は 2 です。
- **`*end++ = '\0'`**: 「`end` の場所に `'\0'` を書き、そのあと `end` を 1 つ進める」という意味です。後置の `++` は値を使ったあとで増やします。

## 何をしているか

### 1. 終わりに来ていないか

```c:line-numbers=28
  begin = *stringp;
  if (begin == NULL)
    return NULL;
```

`begin` に現在の位置を取り出します。前回の呼び出しで最後のトークンを返し終えていれば `*stringp` は `NULL` なので、そのまま `NULL` を返します。

### 2. トークンの終わりを探す

```c:line-numbers=33
  end = begin + strcspn (begin, delim);
```

`strcspn` で区切り文字までの長さを求め、`begin` に足して `end` とします。`end` は区切り文字か、文字列の終端 `'\0'` を指します。

### 3. 区切り文字を消して次へ

```c:line-numbers=35
  if (*end)
    {
      /* トークンを終わらせ、*STRINGP を NUL 文字の次に進める。  */
      *end++ = '\0';
      *stringp = end;
    }
  else
    /* もう区切り文字はない。これが最後のトークン。  */
    *stringp = NULL;

  return begin;
```

`*end` が `'\0'` でなければ区切り文字があったということです。そこに `'\0'` を書き込んで `begin` からのトークンを終わらせ、次の位置（区切り文字の次）を `*stringp` に記録します。
`'\0'` だったら、もう区切り文字はありません。これが最後のトークンなので、`*stringp` に `NULL` を入れておきます。

### 4. 具体例

`char buf[] = "a,b,,c"; char *p = buf;` として `strsep(&p, ",")` を繰り返すと次のようになります。

- 1 回目: `end` は `,` を指す → `'\0'` にして `"a"` を返す。`p` は `"b,,c"` の先頭へ。
- 2 回目: `"b"` を返す。`p` は `",c"` の先頭へ。
- 3 回目: `strcspn` が 0 を返すので `end == begin`。そこを `'\0'` にして **空文字列 `""`** を返す。`p` は `"c"` へ。
- 4 回目: `'\0'` まで区切り文字がないので `"c"` を返し、`p` は `NULL` に。
- 5 回目: `NULL` を返して終わり。

## ここがすごい

- **状態を呼び出し側に持たせる**: `strtok` は「次にどこから読むか」を関数内部の `static` 変数に覚えます。そのため 2 つの文字列を交互に分割できず、マルチスレッドでも危険です。`strsep` はその位置を呼び出し側の変数（`*stringp`）に書き戻すだけなので、何組でも同時に分割できます。
- **空のトークンを返す**: `strtok` は連続した区切り文字をまとめて 1 つとみなすため、`"a,,c"` の 2 つ目の空欄が消えます。CSV のように「空欄にも意味がある」データでは、`strsep` の振る舞いの方が正確です。
- **仕事を標準関数に任せる**: 区切り文字の検索を `strcspn` に任せているので、関数本体は 20 行ほどです。`strcspn` 側が高速化されれば、`strsep` も自動的に速くなります。
- **終わりの表し方が明快**: 最後のトークンを返すときに `*stringp` を `NULL` にしておくことで、「最後のトークン」と「もう何もない」をはっきり区別できます。空文字列で終わる入力（`"a,"`）でも、最後の `""` を取りこぼしません。

## まとめ

- 「次に読む位置」をポインタのポインタで呼び出し側に返すと、隠れた状態のない API になる。
- 区切り文字の位置に `'\0'` を書くことで、新しくメモリを確保せずにトークンを切り出せる。
- 空のトークンを返すかどうかは、データの意味に関わる大事な仕様の違い。
- 元の文字列を書き換えるので、書き換え可能なバッファ（文字列リテラル以外）を渡す必要がある。
