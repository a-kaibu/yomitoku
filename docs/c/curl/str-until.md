---
title: "区切り文字まで読んで「長さ付きの文字列」を返すパーサの部品"
description: "curl のヘッダ解析を支える小さな関数。ポインタのポインタで読み取り位置を進め、コピーせずに語の位置と長さだけを返す。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/curlx/strparse.c
lines: [47, 73]
function: "curlx_str_until"
difficulty: 1
format: 2
tags: [パース, 文字列処理, API設計]
---

## ひとことで

`curlx_str_until` は、文字列の今の位置から、指定した区切り文字（`delim`）の手前までを 1 つの「語」として切り出します。`"GET /index.html HTTP/1.1"` に区切り文字 `' '` を渡すと、`out` は `GET`（3 バイト）を指し、読み取り位置は最初の空白に進みます。

## コード

::: code-group

```c:line-numbers=47 [日本語訳]
/* 最初の DELIM か文字列の終わりまでの語を取り出す。最低 1 バイト。
   エラーなら 0 以外を返す。'max' が 0 なら必ずエラーを返す。 */
int curlx_str_until(const char **linep, struct Curl_str *out,
                    const size_t max, char delim)
{
  const char *s;
  size_t len = 0;
  DEBUGASSERT(linep);
  DEBUGASSERT(*linep);
  DEBUGASSERT(out);
  DEBUGASSERT(delim);
  s = *linep;

  curlx_str_init(out);
  while(*s && (*s != delim)) {
    s++;
    if(++len > max) {
      return STRE_BIG;
    }
  }
  if(!len)
    return STRE_SHORT;
  out->str = *linep;
  out->len = len;
  *linep = s; /* 語の直後の最初のバイトを指す */
  return STRE_OK;
}
```

```c:line-numbers=47 [原文]
/* Get a word until the first DELIM or end of string. At least one byte long.
   return non-zero on error. If 'max' is zero, it will always return error. */
int curlx_str_until(const char **linep, struct Curl_str *out,
                    const size_t max, char delim)
{
  const char *s;
  size_t len = 0;
  DEBUGASSERT(linep);
  DEBUGASSERT(*linep);
  DEBUGASSERT(out);
  DEBUGASSERT(delim);
  s = *linep;

  curlx_str_init(out);
  while(*s && (*s != delim)) {
    s++;
    if(++len > max) {
      return STRE_BIG;
    }
  }
  if(!len)
    return STRE_SHORT;
  out->str = *linep;
  out->len = len;
  *linep = s; /* point to the first byte after the word */
  return STRE_OK;
}
```

:::

`out` の型は `lib/curlx/strparse.h` で定義されています。

<!-- source: lib/curlx/strparse.h -->
```c:line-numbers=40
struct Curl_str {
  const char *str;
  size_t len;
};
```

## 前提知識

- **ポインタ**: メモリ上の場所を指す値です。`const char *s` は文字の並びを指し、`*s` で今の 1 文字を読み、`s++` で次の文字へ進みます。
- **ポインタのポインタ `const char **linep`**: 「読み取り位置を表すポインタ」がどこにあるかを指しています。`*linep` で読み取り位置を取り出し、`*linep = s;` で呼び出し元の読み取り位置を書き換えられます。
- **`struct` と `->`**: `struct` は複数の値をまとめた型です。`out->str` は「`out` が指す構造体の `str` メンバー」です。
- **`size_t`**: 長さを表す、負にならない整数型です。
- **`const size_t max`**: 引数に付いた `const` は「この関数の中で `max` を書き換えない」という印です。
- **`DEBUGASSERT`**: デバッグ用のビルドでだけ条件を検査するマクロです。条件が偽ならそこで止まり、使い方の誤りにすぐ気づけます。
- **`STRE_OK` / `STRE_BIG` / `STRE_SHORT`**: 結果コードです。0 が成功、`STRE_BIG` は長すぎ、`STRE_SHORT` は短すぎ（0 文字）を表します。

## 何をしているか

### 1. 引数の検査と準備

```c:line-numbers=54
  DEBUGASSERT(linep);
  DEBUGASSERT(*linep);
  DEBUGASSERT(out);
  DEBUGASSERT(delim);
  s = *linep;

  curlx_str_init(out);
```

最初の `DEBUGASSERT` で、ポインタが `NULL` でないこと、区切り文字が 0 でないことをデバッグ時に確かめます。続いて読み取り位置を `s` に写し、`out` を空にしておきます。

### 2. 区切り文字か終わりまで進む

```c:line-numbers=61
  while(*s && (*s != delim)) {
    s++;
    if(++len > max) {
      return STRE_BIG;
    }
  }
```

`while(*s && (*s != delim))` は「文字列が終わっておらず、区切り文字でもない間」進むループです。1 文字進むたびに `len` を増やし、`max` を超えたら `STRE_BIG` を返します。

`"GET /index.html"` で `max = 10` なら、`G`, `E`, `T` で `len = 3`、次の空白でループを抜けます。`max = 2` なら、`T` を数えた時点で `len = 3 > 2` となって失敗します。

### 3. 0 文字なら失敗

```c:line-numbers=67
  if(!len)
    return STRE_SHORT;
```

いきなり区切り文字だった場合（`" foo"` のように先頭が空白）は、語がないので `STRE_SHORT` です。関数の前のコメントにある「少なくとも 1 バイト」の約束です。

### 4. 結果を記録して位置を進める

```c:line-numbers=69
  out->str = *linep;
  out->len = len;
  *linep = s; /* point to the first byte after the word */
  return STRE_OK;
```

`out->str` には元の読み取り位置、`out->len` には数えた長さを入れます。最後に `*linep = s;` で、呼び出し元の読み取り位置を語の直後（区切り文字の位置）に進めます。

## ここがすごい

- **呼び出し側のコードが短くなる**: 読み取り位置をポインタのポインタで受け取り、関数の中で進めてくれるので、呼び出し側は次のように部品を並べるだけで行を読めます。

  ```c
  if(curlx_str_word(&p, &method, 10) ||
     curlx_str_singlespace(&p) || ...)
  ```

  実際、すぐ下にある `curlx_str_word` は、この関数に `' '` を渡すだけの関数です。
- **失敗したら位置を動かさない**: エラーのときは `*linep` を書き換えずに戻ります。途中まで進んだ中途半端な状態が呼び出し元に残りません。
- **コピーしない**: 結果は元の文字列の「開始位置と長さ」です。新しいメモリを確保しないので速く、解放忘れも起きません。ヌル文字で終わっていない部分文字列も表せます。
- **上限をループの中で確かめる**: 「最後まで数えてから長さを比べる」のではなく、超えた瞬間に止まります。とても長い入力でも、`max` を超えた分は読みません。

## まとめ

- 読み取り位置をポインタのポインタで渡すと、パーサの部品を順に呼ぶだけで解析が書ける。
- 結果は「開始位置と長さ」で返すと、コピーも解放も要らない。
- 失敗したときは状態を変えずに返すと、呼び出し側が扱いやすい。
- 上限チェックはループの中で行い、超えたらすぐ止める。
