---
title: "安全な文字はまとめて memcpy ― 1 枚の表でパーセントエンコードを判定する"
description: "curl_easy_escape は URL に使えない文字を %XX に置き換える。エンコード不要な文字の連続を数えておき、まとめてコピーするのがうまい。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/escape.c
lines: [153, 205]
function: "curl_easy_escape"
difficulty: 2
format: 2
tags: [文字列処理, ネットワーク, 最適化]
---

## ひとことで

`curl_easy_escape` は、文字列を URL に埋め込めるようにパーセントエンコード（使えない文字を `%` と 16 進数 2 桁に置き換える方式）します。`"a b&c"` を渡すと `"a%20b%26c"` が返ります。英数字と `-` `.` `_` `~` はそのまま残り、それ以外はすべて `%XX` になります。

## コード

::: code-group

```c:line-numbers=153 [日本語訳]
/* 指定した長さの、エスケープされていない文字列を URL 用にエスケープする。
 * 'data' は 7.82.0 以降は無視される。
 */
char *curl_easy_escape(CURL *curl, const char *string, int length)
{
  size_t len;
  const char *f = string;
  size_t nappend = 0;
  char *target;
  char *encoded;
  (void)curl;

  if(!string || (length < 0))
    return NULL;

  len = (length ? (size_t)length : strlen(string));
  if(!len)
    return curlx_strdup("");

  if(len > SIZE_MAX / 16)
    return NULL;

  encoded = target = curlx_malloc((len * 3) + 1);
  if(!target)
    return NULL;

  while(len--) {
    uint8_t in = (uint8_t)*string++;

    if(!(hextable[in] & 0x80))
      /* これは追加する */
      nappend++;
    else {
      if(nappend) {
        memcpy(target, f, nappend);
        target += nappend;
        nappend = 0;
      }
      f = string;
      /* エンコードする */
      target[0] = '%';
      memcpy(target + 1, hexpairs[in], 2);
      target += 3;
    }
  }
  if(nappend) {
    memcpy(target, f, nappend);
    target += nappend;
  }
  *target = '\0'; /* ヌル文字で終端する */

  return encoded;
}
```

```c:line-numbers=153 [原文]
/* Escapes for URL the given unescaped string of given length.
 * 'data' is ignored since 7.82.0.
 */
char *curl_easy_escape(CURL *curl, const char *string, int length)
{
  size_t len;
  const char *f = string;
  size_t nappend = 0;
  char *target;
  char *encoded;
  (void)curl;

  if(!string || (length < 0))
    return NULL;

  len = (length ? (size_t)length : strlen(string));
  if(!len)
    return curlx_strdup("");

  if(len > SIZE_MAX / 16)
    return NULL;

  encoded = target = curlx_malloc((len * 3) + 1);
  if(!target)
    return NULL;

  while(len--) {
    uint8_t in = (uint8_t)*string++;

    if(!(hextable[in] & 0x80))
      /* append this */
      nappend++;
    else {
      if(nappend) {
        memcpy(target, f, nappend);
        target += nappend;
        nappend = 0;
      }
      f = string;
      /* encode it */
      target[0] = '%';
      memcpy(target + 1, hexpairs[in], 2);
      target += 3;
    }
  }
  if(nappend) {
    memcpy(target, f, nappend);
    target += nappend;
  }
  *target = '\0'; /* null-terminate */

  return encoded;
}
```

:::

判定に使う表 `hextable` は、もともと 16 進数の文字を値に直すための表です。エンコードしなくてよい文字には `_OK_`（0x1f）、16 進数の文字には 0〜15、それ以外には `NOPE`（0xff）が入っています。`hexpairs` は、0〜255 の各値に対応する `{'0','0'}`〜`{'F','F'}` の 2 文字を並べた表です。

```c:line-numbers=47
#define NOPE 0xff
#define _OK_ 0x1f /* octet not needing encoding but not a hexadecimal
                     character */
```

## 前提知識

- **`CURL *curl` と `(void)curl;`**: 引数は受け取るけれど使わない、という印です。`(void)` を付けて読み捨てると、「使っていない変数」の警告が出ません。関数の前のコメントどおり、この引数は今は無視されます。
- **`size_t`**: 長さを表す負にならない整数型です。`SIZE_MAX` はその最大値です。
- **`uint8_t`**: 0〜255 の 8 ビット符号なし整数です。表の添字に使うので、負の値にならない型に直しています。
- **`*string++`**: 今の文字を読んでから、ポインタを次の文字へ進めます。
- **`memcpy(dst, src, n)`**: `src` から `n` バイトを `dst` にコピーする標準関数です。
- **`while(len--)`**: `len` が 0 でない間回り、毎回 1 減らします。
- **`&`（ビット AND）**: `hextable[in] & 0x80` は「表の値の最上位ビットが立っているか」を調べます。`NOPE`（0xff）だけがこのビットを持ちます。
- **`curlx_malloc`**: curl が使うメモリ確保関数で、中身は `malloc` とほぼ同じです。

## 何をしているか

### 1. 入力を確かめ、長さを決める

```c:line-numbers=165
  if(!string || (length < 0))
    return NULL;

  len = (length ? (size_t)length : strlen(string));
  if(!len)
    return curlx_strdup("");

  if(len > SIZE_MAX / 16)
    return NULL;
```

`NULL` や負の長さは失敗です。`length` が 0 なら `strlen` で長さを数えます。空文字列なら空文字列のコピーを返します。`len > SIZE_MAX / 16` の確認は、あとで `len * 3 + 1` を計算するときにあふれないための安全策です。

### 2. 最悪の場合の大きさで確保

```c:line-numbers=175
  encoded = target = curlx_malloc((len * 3) + 1);
```

全文字がエンコードされると 1 文字が 3 文字（`%XX`）になるので、`len * 3 + 1`（最後のヌル文字の分）を確保します。

### 3. 安全な文字は数えるだけ

```c:line-numbers=179
  while(len--) {
    uint8_t in = (uint8_t)*string++;

    if(!(hextable[in] & 0x80))
      /* append this */
      nappend++;
```

1 文字読むたびに `hextable` を引き、最上位ビットが立っていなければ（エンコード不要なら）`nappend` を 1 増やすだけで、まだコピーしません。`f` は「まだコピーしていない連続部分の先頭」を指しています。

### 4. エンコードが必要な文字が来たら

```c:line-numbers=185
    else {
      if(nappend) {
        memcpy(target, f, nappend);
        target += nappend;
        nappend = 0;
      }
      f = string;
      /* encode it */
      target[0] = '%';
      memcpy(target + 1, hexpairs[in], 2);
      target += 3;
    }
```

まず、貯めておいた `nappend` 文字を `memcpy` でまとめてコピーします。次に `f` を今の文字の次に動かし、`%` と `hexpairs[in]` の 2 文字を書きます。

`"a b"` で追うと、`a` で `nappend = 1`、空白（0x20）で `"a"` をコピーして `"%20"` を書き、`b` で `nappend = 1` になります。

### 5. 残りをコピーして終端

```c:line-numbers=198
  if(nappend) {
    memcpy(target, f, nappend);
    target += nappend;
  }
  *target = '\0'; /* null-terminate */

  return encoded;
```

ループの後、最後に残った連続部分をコピーし、ヌル文字を書いて返します。結果は `"a%20b"` です。

## ここがすごい

- **1 文字ずつ書かずにまとめてコピー**: URL の大半は英数字なので、ほとんどの文字はエンコード不要です。1 文字ずつ書き込む代わりに、連続部分の長さだけ数えて `memcpy` 1 回で写すので、ループの中の処理が軽くなります。
- **デコード用の表をエンコードの判定にも流用**: `hextable` は `Curl_urldecode` で `%41` の `4` や `1` を値に直すための表です。そこに「エンコード不要」の印 `_OK_` を混ぜ、16 進数でもエンコード不要でもない文字だけ 0xff にしておくことで、判定はビット 1 つを見るだけになります。`_OK_` を 0x1f にしているのは、デコード側で使う「16 進数かどうか」の判定（上位 4 ビットが 0 か）にも引っかからないようにするためです（`_OK_` の定義のコメントのとおり、16 進数ではない文字の印です）。
- **16 進数への変換も表引き**: `hexpairs[in]` には 2 文字がそのまま入っているので、割り算やシフトなしで `memcpy` 2 バイトで済みます。
- **確保は 1 回だけ**: 先に最悪の大きさを確保しておくので、途中で領域を広げる処理が要りません。その代わり、あふれ対策で大きすぎる入力をはじいています。

## まとめ

- そのまま写せる文字の連続は、数えておいてまとめて `memcpy` すると速い。
- 1 枚の表に複数の意味（値と目印）を持たせると、判定がビット 1 つで済む。
- 出力の最大サイズが計算できるなら、最初に 1 回だけ確保する。
- 確保サイズを掛け算で求めるときは、あふれないかを先に確かめる。
