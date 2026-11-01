---
title: "文字列を動かさずに前後の空白を削る ― ポインタと長さだけの trim"
description: "長さ付き文字列の両端からスペースとタブを取り除く 10 行の関数。メモリをコピーせず、先頭位置と長さを動かすだけで済ませる。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/curlx/strparse.c
lines: [306, 315]
function: "curlx_str_trimblanks"
difficulty: 1
format: 2
tags: [文字列処理, イディオム, データ構造]
---

## ひとことで

`curlx_str_trimblanks` は、長さ付きの文字列の前後にあるスペースとタブを取り除きます。`"  text/html \t"` を表す `out` を渡すと、`out` は `"text/html"` の 9 バイトを指すように変わります。文字そのものはどこにもコピーされず、元の場所に残ったままです。

## コード

::: code-group

```c:line-numbers=306 [日本語訳]
/* 文字列の両端から ISBLANK() な文字を取り除く */
void curlx_str_trimblanks(struct Curl_str *out)
{
  while(out->len && ISBLANK(*out->str))
    curlx_str_nudge(out, 1);

  /* 末尾のスペースとタブを削る */
  while(out->len && ISBLANK(out->str[out->len - 1]))
    out->len--;
}
```

```c:line-numbers=306 [原文]
/* remove ISBLANK()s from both ends of the string */
void curlx_str_trimblanks(struct Curl_str *out)
{
  while(out->len && ISBLANK(*out->str))
    curlx_str_nudge(out, 1);

  /* trim trailing spaces and tabs */
  while(out->len && ISBLANK(out->str[out->len - 1]))
    out->len--;
}
```

:::

`ISBLANK` は `lib/curl_ctype.h`、`curlx_str_nudge` は同じファイルにあります。

<!-- source: lib/curl_ctype.h -->
```c:line-numbers=43
#define ISBLANK(x)  (((x) == ' ') || ((x) == '\t'))
```

```c:line-numbers=276
int curlx_str_nudge(struct Curl_str *str, size_t num)
{
  if(num <= str->len) {
    str->str += num;
    str->len -= num;
    return STRE_OK;
  }
  return STRE_OVERFLOW;
}
```

## 前提知識

- **`struct Curl_str`**: 「文字列の開始位置 `str`」と「長さ `len`」の 2 つを持つ構造体です。ヌル文字で終わっていなくても、部分文字列を表せます。
- **`->`**: 構造体を指すポインタからメンバーを取り出す書き方です。`out->len` は「`out` が指す構造体の `len`」です。
- **`*out->str`**: `->` の方が `*` より先に結び付くので、`*(out->str)`、つまり「開始位置にある 1 文字」です。
- **`out->str[out->len - 1]`**: 開始位置から `len - 1` 番目、つまり最後の 1 文字です。
- **ポインタの足し算**: `str += num` で、指す位置が `num` 文字分うしろにずれます。
- **マクロ `#define`**: コンパイル前に文字の置き換えをする仕組みです。`ISBLANK(c)` はその場で `((c) == ' ') || ((c) == '\t')` に置き換わります。
- **`out->len--`**: 長さを 1 減らします。

## 何をしているか

### 1. 先頭の空白を飛ばす

```c:line-numbers=309
  while(out->len && ISBLANK(*out->str))
    curlx_str_nudge(out, 1);
```

長さが 0 でなく、先頭の文字が空白の間、`curlx_str_nudge(out, 1)` を呼びます。`nudge`（そっと押す）は、開始位置を 1 つ進めて長さを 1 減らす関数です。

`"  text/html \t"`（長さ 13）なら、2 回呼ばれて開始位置が `t` に移り、長さは 11 になります。

### 2. 末尾の空白を削る

```c:line-numbers=312
  /* trim trailing spaces and tabs */
  while(out->len && ISBLANK(out->str[out->len - 1]))
    out->len--;
```

今度は最後の文字を見て、空白なら長さを 1 減らします。開始位置は動かさず、長さを縮めるだけで「末尾を切り落とした」ことになります。

上の例では、最後の文字はタブ、その前はスペースなので 2 回縮み、長さは 9 になります。結果は `text/html` です。

### 3. 全部が空白だったら

`"   "` のように全部が空白なら、1 で長さが 0 になります。2 のループは `out->len &&` が偽なので 1 回も回らず、空の文字列が残ります。`out->len - 1` を計算する前に長さを確かめているので、0 から 1 を引いて巨大な値（`size_t` は負にならないので、0 - 1 は最大値になります）になる事故も起きません。

## ここがすごい

- **メモリをまったく動かさない**: ヌル文字で終わる普通の C 文字列で trim を書くと、先頭の空白を消すために残りを `memmove` で前に詰めるか、末尾にヌル文字を書き込んで元の文字列を壊すことになります。長さ付き文字列なら、開始位置と長さという 2 つの数を変えるだけで済みます。元のバッファ（たとえば受信した HTTP ヘッダ）は読み取り専用のまま使えます。
- **ループの条件に長さを先に書く**: `out->len && ISBLANK(...)` の順番が大事です。`&&` は左が偽なら右を評価しないので、長さ 0 の文字列で範囲外の文字を読むことがありません。
- **小さな部品の組み合わせ**: 先頭側は既存の `curlx_str_nudge` を再利用し、末尾側は 1 行で書いています。この関数自体は 10 行に収まり、一目で正しさを確かめられます。
- **HTTP の空白の定義に合わせる**: HTTP ヘッダの値の前後に置ける空白は、スペースとタブです。`ISBLANK` はちょうどこの 2 つだけを対象にし、改行などは残します。

## まとめ

- 「開始位置と長さ」で文字列を表すと、trim はコピーなしで書ける。
- 先頭を削るには開始位置を進めて長さを減らし、末尾を削るには長さを減らすだけ。
- `len && 条件(最後の文字)` の順に書くと、空文字列で範囲外を読まない。
- 小さい部品を再利用すると、関数が短く読みやすくなる。
