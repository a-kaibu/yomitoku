---
title: "エスケープを読み飛ばしてダブルクォートの中身を切り出す"
description: "ダブルクォートで囲まれた語を取り出す小さなパーサ。コピーせずに元の文字列を指す「スライス」を返し、バックスラッシュのエスケープも正しく扱う。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/curlx/strparse.c
lines: [105, 134]
function: "curlx_str_quotedword"
difficulty: 2
format: 2
tags: [パース, 文字列処理, メモリ管理]
---

## ひとことで

`curlx_str_quotedword` は、`"` で始まる文字列から、対応する閉じ `"` までの中身を切り出します。中身はコピーせず、「元の文字列のどこから何バイトか」を `out` に記録するだけです。入力が `"abc" rest` なら、`out` は `abc`（3 バイト）を指し、読み取り位置は閉じ `"` の直後（空白の位置）に進みます。

## コード

::: code-group

```c:line-numbers=105 [日本語訳]
/* 「引用符で囲まれた」語を取り出す。エスケープされた引用符にも対応。
   エラーなら 0 以外を返す */
int curlx_str_quotedword(const char **linep, struct Curl_str *out,
                         const size_t max)
{
  const char *s = *linep;
  size_t len = 0;
  DEBUGASSERT(linep && *linep && out && max);

  curlx_str_init(out);
  if(*s != '\"')
    return STRE_BEGQUOTE;
  s++;
  while(*s && (*s != '\"')) {
    if(*s == '\\' && s[1]) {
      s++;
      if(++len > max)
        return STRE_BIG;
    }
    s++;
    if(++len > max)
      return STRE_BIG;
  }
  if(*s != '\"')
    return STRE_ENDQUOTE;
  out->str = (*linep) + 1;
  out->len = len;
  *linep = s + 1;
  return STRE_OK;
}
```

```c:line-numbers=105 [原文]
/* Get a "quoted" word. Escaped quotes are supported.
   return non-zero on error */
int curlx_str_quotedword(const char **linep, struct Curl_str *out,
                         const size_t max)
{
  const char *s = *linep;
  size_t len = 0;
  DEBUGASSERT(linep && *linep && out && max);

  curlx_str_init(out);
  if(*s != '\"')
    return STRE_BEGQUOTE;
  s++;
  while(*s && (*s != '\"')) {
    if(*s == '\\' && s[1]) {
      s++;
      if(++len > max)
        return STRE_BIG;
    }
    s++;
    if(++len > max)
      return STRE_BIG;
  }
  if(*s != '\"')
    return STRE_ENDQUOTE;
  out->str = (*linep) + 1;
  out->len = len;
  *linep = s + 1;
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

- **`struct`（構造体）**: 複数の値をひとまとめにした型です。`struct Curl_str` は「文字列の開始位置 `str`」と「長さ `len`」の 2 つを持ちます。
- **`->`**: 構造体を指すポインタからメンバーを取り出す書き方です。`out->len` は「`out` が指す構造体の `len`」です。
- **`const char **linep`**: 読み取り位置（ポインタ）を指すポインタです。`*linep` が今の読み取り位置で、`*linep = s + 1;` と書くと呼び出し元の位置を進められます。
- **`'\"'` と `'\\'`**: C の文字リテラルで、それぞれ `"` と `\` 1 文字です。`\` は C でもエスケープに使うので、`\` 自身は `'\\'` と書きます。
- **`s[1]`**: `s` が指す位置の 1 つ先の文字です。
- **`size_t`**: 長さを表す負にならない整数型です。
- **`STRE_OK` など**: `lib/curlx/strparse.h` で定義された結果コードで、0 が成功、それ以外が失敗の理由（長すぎる、開き引用符がない、など）です。

## 何をしているか

### 1. 先頭が `"` でなければ失敗

```c:line-numbers=114
  curlx_str_init(out);
  if(*s != '\"')
    return STRE_BEGQUOTE;
```

まず `out` を空（`NULL` と長さ 0）にしてから、先頭の文字を確かめます。`"` でなければ `STRE_BEGQUOTE` を返します。そのあと `s++` で開き `"` を飛ばします。

### 2. 閉じ `"` まで進む

```c:line-numbers=118
  while(*s && (*s != '\"')) {
    if(*s == '\\' && s[1]) {
      s++;
      if(++len > max)
        return STRE_BIG;
    }
    s++;
    if(++len > max)
      return STRE_BIG;
  }
```

`"` か文字列の終わりに出会うまで進みます。ループの中の `if(*s == '\\' && s[1])` が、エスケープの処理です。`\` を見つけたら、その次の文字まで 1 つ余分に進みます。こうすると `\"` の `"` は「閉じ引用符」として扱われずに済みます。

入力 `"a\"b" x` で追ってみます（開き `"` は飛ばし済み）。

- `a`: ふつうの文字。進んで `len = 1`
- `\`: エスケープ。`if` の中で `len = 2`、`if` の後でさらに進んで `"` を飛ばし `len = 3`
- `b`: `len = 4`
- `"`: ループ終了

`s[1]` も確かめているので、`\` が文字列の最後の文字でも、ヌル文字を飛び越えて範囲外を読むことはありません。

1 文字進むたびに `++len > max` を確かめ、上限を超えたら `STRE_BIG` を返します。

### 3. 閉じ `"` があるか

```c:line-numbers=128
  if(*s != '\"')
    return STRE_ENDQUOTE;
```

ループを抜けた理由が文字列の終わりなら、閉じ引用符がないので `STRE_ENDQUOTE` です。

### 4. 結果を記録

```c:line-numbers=130
  out->str = (*linep) + 1;
  out->len = len;
  *linep = s + 1;
  return STRE_OK;
```

`out->str` は開き `"` の次（`*linep + 1`）、`out->len` は数えた長さです。読み取り位置は閉じ `"` の次（`s + 1`）まで進めます。上の例では `out` は `a\"b` の 4 バイトを指します。エスケープの `\` は取り除かれず、そのまま含まれる点に注意してください。

## ここがすごい

- **コピーしない**: 結果は「元の文字列の一部を指すポインタと長さ」です。`malloc` で新しい文字列を作らないので、メモリ確保の失敗や解放忘れが起こりません。ほかの言語でいう「スライス」や「ビュー」の考え方です。
- **成功したときだけ読み取り位置を進める**: 失敗したときは `*linep` を変えません。呼び出し側は失敗したら別の読み方を試す、といった書き方ができます。
- **終わりを越えないエスケープ処理**: `\` の直後がヌル文字かどうかを `s[1]` で確かめてから飛ばしています。1 文字の確認で、範囲外読み込みという典型的なバグを防いでいます。
- **上限付き**: すべての「進む」操作のあとに `max` との比較があります。巨大な入力を渡されても、決めた長さ以上は読みません。

## まとめ

- 文字列を切り出すとき、コピーせず「開始位置と長さ」で表すと安全で速い。
- エスケープ文字を飛ばすときは、次の文字が存在するかを先に確かめる。
- 読み取り位置は成功したときだけ進めると、呼び出し側が扱いやすい。
- 上限 `max` を毎回確かめると、悪意ある長い入力にも強くなる。
