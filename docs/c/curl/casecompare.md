---
title: "トルコ語でも壊れない大文字小文字無視の比較と「!a == !b」の技"
description: "curl が strcasecmp を使わずに自前で持つ比較関数。ループ後の 1 行で「両方とも終わったか」をまとめて判定している。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/strequal.c
lines: [28, 49]
function: "casecompare"
difficulty: 1
format: 2
tags: [文字列処理, 移植性, イディオム]
---

## ひとことで

`casecompare` は、大文字と小文字を区別せずに 2 つの文字列が等しいかを調べます。`"Content-Length"` と `"content-length"` なら 1（等しい）、`"Host"` と `"Hosts"` なら 0 を返します。C 標準の関数に頼らず、ASCII の a〜z だけを対象にしているのが特徴です。

## コード

::: code-group

```c:line-numbers=28 [日本語訳]
/*
 * curl_strequal() は「生の」大文字小文字を区別しない比較をする。これは
 * ロケールに依存せず、それで安全だと分かっている文字列だけを
 * 比べるためのもの。この関数が必要な理由の詳しい説明は
 * https://daniel.haxx.se/blog/2008/10/15/strcasecmp-in-turkish/ を参照。
 */

static int casecompare(const char *first, const char *second)
{
  while(*first) {
    if(Curl_raw_toupper(*first) != Curl_raw_toupper(*second))
      /* 一致しなくなったらすぐにループを抜ける */
      return 0;
    first++;
    second++;
  }
  /* ここに来たなら、文字列が同じか、長さが違うかのどちらか。
     「今の」文字が片方で 0 でなく、もう片方で 0 かを調べればよい。
     なお、一致していても文字が完全に同じとは限らないので、
     ここでは 0 かどうかだけを比べたい。 */
  return !*first == !*second;
}
```

```c:line-numbers=28 [原文]
/*
 * curl_strequal() is for doing "raw" case insensitive strings. This is meant
 * to be locale independent and only compare strings we know are safe for
 * this. See https://daniel.haxx.se/blog/2008/10/15/strcasecmp-in-turkish/ for
 * further explanations as to why this function is necessary.
 */

static int casecompare(const char *first, const char *second)
{
  while(*first) {
    if(Curl_raw_toupper(*first) != Curl_raw_toupper(*second))
      /* get out of the loop as soon as they do not match */
      return 0;
    first++;
    second++;
  }
  /* If we are here either the strings are the same or the length is different.
     We can test if the "current" character is non-zero for one and zero
     for the other. Note that the characters may not be exactly the same even
     if they match, we only want to compare zero-ness. */
  return !*first == !*second;
}
```

:::

`Curl_raw_toupper` は `lib/strcase.h` で定義された、256 要素の変換表 `Curl_touppermap` を引くだけの関数です。表は `'a'`(97)〜`'z'`(122) の位置にだけ `'A'`(65)〜`'Z'`(90) が入り、ほかは元の値のままです。

<!-- source: lib/strcase.h -->
```c:line-numbers=37
static CURL_INLINE char Curl_raw_toupper(char in)
{
  return (char)Curl_touppermap[(unsigned char)in];
}
```

## 前提知識

- **`static`**: 関数の前に付けると「このファイルの中だけで使える」関数になります。外に公開するのは同じファイルの `curl_strequal` で、`casecompare` はその下請けです。
- **ポインタと `*first`**: `const char *first` は文字の並びを指すポインタで、`*first` で今の 1 文字を読みます。`first++` で次の文字へ進みます。
- **C の文字列の終わり**: 値 0 の文字（ヌル文字）で終わります。`while(*first)` は「今の文字が 0 でない間」という意味です。
- **`!`（論理否定）**: 0 なら 1、0 以外なら 0 にします。`!*first` は「今の文字が終わりなら 1」です。
- **`==` の結果**: 比較の結果は 1（真）か 0（偽）の整数です。`return` でそのまま返せます。
- **ロケール**: プログラムの言語・地域設定です。C の `toupper` や `strcasecmp` はこれに影響を受けます。

## 何をしているか

### 1. 1 文字ずつ大文字にして比べる

```c:line-numbers=37
  while(*first) {
    if(Curl_raw_toupper(*first) != Curl_raw_toupper(*second))
      /* get out of the loop as soon as they do not match */
      return 0;
    first++;
    second++;
  }
```

`first` が終わるまでループし、両方の文字を大文字に直して比べます。違えばすぐ 0 を返します。等しければ両方のポインタを進めます。

`second` の終わりはループ条件で見ていませんが、問題ありません。`second` が先に終わると `*second` は 0 になり、`first` 側は 0 でない文字なので、ループ内の比較で必ず「違う」と判定されるからです。

### 2. 最後の 1 行で長さを確かめる

```c:line-numbers=48
  return !*first == !*second;
```

ループを抜けるのは、`first` が終わったときだけです。このとき `second` も終わっていれば等しく、まだ続いていれば `second` の方が長いので等しくありません。

`return !*first == !*second;` はこれを 1 行で判定します。`!*first` はここでは必ず 1 です。`*second` が 0 なら `!*second` も 1 で、`1 == 1` で 1 を返します。`"Host"` と `"Hosts"` なら `*second` は `'s'` なので `!*second` は 0、`1 == 0` で 0 を返します。

ループ直後のコメントが言うとおり、ここで比べたいのは「文字が同じか」ではなく「0 かどうか（終わったかどうか）」だけです。`!` で両方を 0 か 1 にそろえてから比べる、という小技です。

## ここがすごい

- **ロケールに依存しない**: 関数の前のコメントは、トルコ語の環境で `strcasecmp` の結果が変わる問題を挙げています。トルコ語では `i` の大文字が `I` ではなく点付きの `İ` になるため、ロケールに従う関数だと `"FILE"` と `"file"` が等しくならないことがあります。HTTP ヘッダ名やプロトコル名は英字の決まった綴りなので、curl は ASCII だけを変換する表を自前で持ち、どの環境でも同じ結果にしています。
- **終了判定を片側だけにする**: ループ条件に `*second` を入れなくても、比較で自然に違いが検出されます。条件を 1 つ減らした分、ループが簡潔です。
- **`!a == !b` で「両方 0 か、両方非 0 か」**: 値そのものではなく真偽だけを比べたいときの定番の書き方です。`(a == 0) == (b == 0)` と同じ意味を短く書けます。
- **表引きで速い**: `strcase.h` のコメントは、この関数が 1 バイトごとに変換を 2 回呼ぶので、関数呼び出しのコストが表を引く手間より大きくなると説明しています。そのため変換関数をヘッダでインライン化しています。

## まとめ

- プロトコルの文字列を比べるときは、ロケールに左右されない比較を使う。
- ループの終了条件は、もう一方の失敗で自然に検出できるなら片側だけでよい。
- `!x == !y` は「どちらも 0、またはどちらも非 0」を調べる短い書き方。
- 変換表を使うと、条件分岐なしで大文字小文字をそろえられる。
