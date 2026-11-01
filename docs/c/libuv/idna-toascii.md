---
title: "全角の句点もドメインの区切りとして扱う、国際化ドメイン名の変換"
description: "日本語などを含むドメイン名を、DNS で使える ASCII の「xn--」形式に変換する関数の外側。4 種類の区切り文字でラベルに分け、出力先のあふれも防ぐ。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: ISC
copyright: "Copyright libuv contributors. All rights reserved."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/idna.c
lines: [320, 369]
function: "uv__idna_toascii"
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, パース, ネットワーク]
---

## ひとことで

`uv__idna_toascii` は、`例え.テスト` のような日本語などを含むドメイン名を、`xn--r8jz45g.xn--zckzah` のような ASCII だけの形（Punycode）に変換する関数です。
この関数の仕事は、ドメイン名を `.` で区切って **ラベル**（区切りと区切りの間の部分）ごとに変換関数へ渡すことです。
ふつうのピリオドだけでなく、`。`（全角の句点）など 4 種類の文字を区切りとして扱う点がおもしろいところです。

## コード

::: code-group

```c:line-numbers=320 [日本語訳]
ssize_t uv__idna_toascii(const char* s, const char* se, char* d, char* de) {
  const char* si;
  const char* st;
  unsigned c;
  char* ds;
  int rc;

  if (s == se)
    return UV_EINVAL;

  ds = d;

  si = s;
  while (si < se) {
    st = si;
    c = uv__utf8_decode1(&si, se);

    if (c == UINT_MAX)
      return UV_EINVAL;

    if (c != '.')
      if (c != 0x3002)  /* 。 */
        if (c != 0xFF0E)  /* ． */
          if (c != 0xFF61)  /* ｡ */
            continue;

    rc = uv__idna_toascii_label(s, st, &d, de);

    if (rc < 0)
      return rc;

    if (d < de)
      *d++ = '.';

    s = si;
  }

  if (s < se) {
    rc = uv__idna_toascii_label(s, se, &d, de);

    if (rc < 0)
      return rc;
  }

  if (d >= de)
    return UV_EINVAL;

  *d++ = '\0';
  return d - ds;  /* 書き込んだバイト数。 */
}
```

```c:line-numbers=320 [原文]
ssize_t uv__idna_toascii(const char* s, const char* se, char* d, char* de) {
  const char* si;
  const char* st;
  unsigned c;
  char* ds;
  int rc;

  if (s == se)
    return UV_EINVAL;

  ds = d;

  si = s;
  while (si < se) {
    st = si;
    c = uv__utf8_decode1(&si, se);

    if (c == UINT_MAX)
      return UV_EINVAL;

    if (c != '.')
      if (c != 0x3002)  /* 。 */
        if (c != 0xFF0E)  /* ． */
          if (c != 0xFF61)  /* ｡ */
            continue;

    rc = uv__idna_toascii_label(s, st, &d, de);

    if (rc < 0)
      return rc;

    if (d < de)
      *d++ = '.';

    s = si;
  }

  if (s < se) {
    rc = uv__idna_toascii_label(s, se, &d, de);

    if (rc < 0)
      return rc;
  }

  if (d >= de)
    return UV_EINVAL;

  *d++ = '\0';
  return d - ds;  /* Number of bytes written. */
}
```

:::

## 前提知識

- **国際化ドメイン名（IDN）**: 英数字以外の文字を含むドメイン名です。DNS は ASCII しか扱えないので、各ラベルを `xn--` で始まる ASCII 文字列（Punycode）に変換して問い合わせます。
- **ポインタで範囲を表す**: この関数は、文字列を `s`（始まり）と `se`（終わりの次）の 2 つのポインタで受け取ります。出力先も `d`（書き込み位置）と `de`（終わり）の組です。長さを別に持つ代わりに「終わりの場所」を持つ書き方です。
- **`*d++ = '.'`**: `d` が指す場所に `.` を書き、`d` を 1 つ進めます。
- **ポインタの引き算**: `d - ds` は、書き込みを始めた位置 `ds` から今の位置 `d` まで、何バイト進んだかです。
- **`ssize_t`**: 符号付きの大きさの型です。正なら書いたバイト数、負ならエラー（`UV_EINVAL` など）を表します。
- **`continue`**: ループの残りを飛ばして、次の周回へ進みます。

## 何をしているか

### 1. 空の入力を弾く

```c:line-numbers=327
  if (s == se)
    return UV_EINVAL;

  ds = d;
```

`s == se`、つまり 1 文字もなければ不正です。`ds` に書き込みの開始位置を覚えておきます。

### 2. 1 文字ずつ読んで区切りを探す

```c:line-numbers=332
  si = s;
  while (si < se) {
    st = si;
    c = uv__utf8_decode1(&si, se);

    if (c == UINT_MAX)
      return UV_EINVAL;

    if (c != '.')
      if (c != 0x3002)  /* 。 */
        if (c != 0xFF0E)  /* ． */
          if (c != 0xFF61)  /* ｡ */
            continue;
```

`si` が読み進める位置、`st` が「今読んだ文字の始まり」です。`uv__utf8_decode1` で 1 文字読み、不正な UTF-8 なら `UV_EINVAL` を返します。
入れ子の `if` は、読んだ文字 `c` が次のどれでもなければ `continue` で次の文字へ進みます。

- `.`（U+002E、普通のピリオド）
- `。`（U+3002、全角の句点）
- `．`（U+FF0E、全角のピリオド）
- `｡`（U+FF61、半角の句点）

`&&` でつなぐ代わりに `if` を入れ子にしていますが、意味は「4 つのどれとも違えば飛ばす」です。

### 3. 区切りが見つかったらラベルを変換

```c:line-numbers=346
    rc = uv__idna_toascii_label(s, st, &d, de);

    if (rc < 0)
      return rc;

    if (d < de)
      *d++ = '.';

    s = si;
```

区切りが来たら、ラベルの始まり `s` から区切りの手前 `st` までを `uv__idna_toascii_label` に渡して変換し、出力に `.` を書きます。そして `s = si` で、次のラベルの始まりを区切りの直後にします。
出力に区切りを書くときは常に ASCII の `.` なので、`例え。テスト` と書いても結果は `xn--r8jz45g.xn--zckzah` になります。

### 4. 最後のラベルと終端

```c:line-numbers=357
  if (s < se) {
    rc = uv__idna_toascii_label(s, se, &d, de);

    if (rc < 0)
      return rc;
  }

  if (d >= de)
    return UV_EINVAL;

  *d++ = '\0';
  return d - ds;  /* Number of bytes written. */
```

ループを抜けたあと、最後の区切りより後ろに文字が残っていれば、それも変換します。
最後に `'\0'` を書く場所がなければ `UV_EINVAL` を返し、書けたら終端を含めた書き込みバイト数を返します。

## ここがすごい

- **区切り文字を広く受け付ける**: 日本語入力のままドメイン名を打つと、ピリオドが `。` や `．` になりがちです。国際化ドメイン名の仕様では、これらもラベルの区切りとして扱うことになっており、この関数はそれに従っています。ユーザーの入力に寛容な作りです。
- **書き込みのたびに境界を確認**: `if (d < de) *d++ = '.';` のように、出力に書く前には必ず `d < de` を確かめています。書けなかった分は黙って捨て、最後の `if (d >= de)` で「終端が書けなかった＝あふれた」と判定してエラーにします。途中で毎回エラー処理をするより単純で、しかもバッファを越えて書くことは絶対にありません。
- **長さではなく終わりの位置で管理**: 入力も出力も「始まりと終わりのポインタ」で表しているので、「残りの長さ」を計算して減らしていく処理がいりません。比較 `d < de` だけで安全を保てます。
- 変換そのもの（Punycode の符号化）は `uv__idna_toascii_label` に任せ、この関数は「分割と組み立て」だけに専念しています。役割を分けたことで、どちらの関数も読みやすくなっています。

## まとめ

- 国際化ドメイン名は、ラベルごとに `xn--` 形式の ASCII へ変換する。
- 区切りとして `.` だけでなく `。` `．` `｡` も受け付けると、入力に寛容になる。
- 出力の前に必ず境界を確認し、最後にあふれをまとめて判定すると、安全で単純になる。
- 範囲を「始まりと終わりのポインタ」で表すと、長さの計算が要らない。
