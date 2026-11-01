---
title: "3 バイトを 24 ビットの箱に詰めて 4 文字に ― Base64 エンコーダ"
description: "curl の Base64 エンコード。3 バイトを 1 つの 32 ビット整数にまとめてから 6 ビットずつ切り出し、端数は場合分けで処理する。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/curlx/base64.c
lines: [185, 251]
function: "base64_encode"
difficulty: 2
format: 2
tags: [ビット演算, 文字列処理, 移植性]
---

## ひとことで

`base64_encode` は、バイナリデータを Base64（64 種類の文字だけでデータを表す方式）の文字列に変換します。`"Man"` は `"TWFu"`、`"Ma"` は `"TWE="` になります。変換表とパディング文字を引数で受け取るので、通常の Base64 と URL 用の Base64url の両方をこの 1 つの関数で作れます。

## コード

::: code-group

```c:line-numbers=185 [日本語訳]
static CURLcode base64_encode(const char *table64,
                              uint8_t padbyte,
                              const uint8_t *inputbuff, size_t insize,
                              char **outptr, size_t *outlen)
{
  char *output;
  char *base64data;
  const unsigned char *in = (const unsigned char *)inputbuff;

  *outptr = NULL;
  *outlen = 0;

  if(!insize)
    return CURLE_OK;

  /* 安全のための予防策 */
  DEBUGASSERT(insize <= CURL_MAX_BASE64_INPUT);
  if(insize > CURL_MAX_BASE64_INPUT)
    return CURLE_TOO_LARGE;

  base64data = output = curlx_malloc(((insize + 2) / 3 * 4) + 1);
  if(!output)
    return CURLE_OUT_OF_MEMORY;

  while(insize >= 3) {
    /* 出力を書く前に入力 3 バイトをすべて読み込み、コンパイラがエイリアスを
       否定できない場合の読み直しを避ける。まとめた値から 6 ビットの添字を
       4 つ取り出す。1 バイトずつ読むので整列とエンディアンの問題が起きない。 */
    uint32_t bits = ((uint32_t)in[0] << 16) |
      ((uint32_t)in[1] << 8) | in[2];
    *output++ = table64[bits >> 18];
    *output++ = table64[(bits >> 12) & 0x3F];
    *output++ = table64[(bits >> 6) & 0x3F];
    *output++ = table64[bits & 0x3F];
    insize -= 3;
    in += 3;
  }
  if(insize) {
    /* ここでは残りは 1 バイトか 2 バイトだけ */
    *output++ = table64[in[0] >> 2];
    if(insize == 1) {
      *output++ = table64[((in[0] & 0x03) << 4)];
      if(padbyte) {
        *output++ = padbyte;
        *output++ = padbyte;
      }
    }
    else {
      /* insize == 2 の場合 */
      *output++ = table64[((in[0] & 0x03) << 4) | ((in[1] & 0xF0) >> 4)];
      *output++ = table64[((in[1] & 0x0F) << 2)];
      if(padbyte)
        *output++ = padbyte;
    }
  }

  /* ヌル文字で終端する */
  *output = '\0';

  /* 新しいデータ（確保したメモリ）へのポインタを返す */
  *outptr = base64data;

  /* 新しいデータの長さを返す */
  *outlen = (size_t)(output - base64data);

  return CURLE_OK;
}
```

```c:line-numbers=185 [原文]
static CURLcode base64_encode(const char *table64,
                              uint8_t padbyte,
                              const uint8_t *inputbuff, size_t insize,
                              char **outptr, size_t *outlen)
{
  char *output;
  char *base64data;
  const unsigned char *in = (const unsigned char *)inputbuff;

  *outptr = NULL;
  *outlen = 0;

  if(!insize)
    return CURLE_OK;

  /* safety precaution */
  DEBUGASSERT(insize <= CURL_MAX_BASE64_INPUT);
  if(insize > CURL_MAX_BASE64_INPUT)
    return CURLE_TOO_LARGE;

  base64data = output = curlx_malloc(((insize + 2) / 3 * 4) + 1);
  if(!output)
    return CURLE_OUT_OF_MEMORY;

  while(insize >= 3) {
    /* Load all three input bytes before storing output, avoiding reloads when
       the compiler cannot rule out aliasing. Extract four 6-bit indices from
       the packed value; byte-wise loads avoid alignment and endian issues. */
    uint32_t bits = ((uint32_t)in[0] << 16) |
      ((uint32_t)in[1] << 8) | in[2];
    *output++ = table64[bits >> 18];
    *output++ = table64[(bits >> 12) & 0x3F];
    *output++ = table64[(bits >> 6) & 0x3F];
    *output++ = table64[bits & 0x3F];
    insize -= 3;
    in += 3;
  }
  if(insize) {
    /* this is only one or two bytes now */
    *output++ = table64[in[0] >> 2];
    if(insize == 1) {
      *output++ = table64[((in[0] & 0x03) << 4)];
      if(padbyte) {
        *output++ = padbyte;
        *output++ = padbyte;
      }
    }
    else {
      /* insize == 2 */
      *output++ = table64[((in[0] & 0x03) << 4) | ((in[1] & 0xF0) >> 4)];
      *output++ = table64[((in[1] & 0x0F) << 2)];
      if(padbyte)
        *output++ = padbyte;
    }
  }

  /* null-terminate */
  *output = '\0';

  /* Return the pointer to the new data (allocated memory) */
  *outptr = base64data;

  /* Return the length of the new data */
  *outlen = (size_t)(output - base64data);

  return CURLE_OK;
}
```

:::

変換表は同じファイルにあり、公開関数 `curlx_base64_encode` は表と `'='` を渡すだけです。URL 用の `curlx_base64url_encode` は `base64url` とパディングなし（0）を渡します。

```c:line-numbers=32
const char curlx_base64encdec[] =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/* The Base 64 encoding with a URL and filename safe alphabet, RFC 4648
   section 5 */
static const char base64url[] =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
```

## 前提知識

- **Base64**: 3 バイト（24 ビット）を 6 ビットずつ 4 つに分け、それぞれを 64 文字の表の文字に置き換える方式です。入力が 3 の倍数でないときは、足りない分を `=` で埋めます（パディング）。
- **`uint8_t` / `uint32_t`**: 8 ビットと 32 ビットの符号なし整数です。
- **`<<` / `>>`（シフト）**: ビットを左右にずらします。`x << 16` は 16 ビット左へ、`x >> 18` は 18 ビット右へずらします。
- **`|`（ビット OR）**: ビットを重ね合わせます。ずらした 3 バイトを `|` で 1 つの整数にまとめています。
- **`& 0x3F`**: 下位 6 ビット（0〜63）だけを残します。
- **`*output++ = c`**: 書き込み位置に `c` を書いて、位置を 1 つ進めます。
- **`char **outptr`**: 結果の文字列の場所を呼び出し元に返すためのポインタです。`*outptr = base64data;` で呼び出し元の変数に書き込みます。
- **`CURLcode`**: curl の関数が返す結果コードです。`CURLE_OK` が成功です。

## 何をしているか

### 1. 準備と上限チェック

```c:line-numbers=194
  *outptr = NULL;
  *outlen = 0;

  if(!insize)
    return CURLE_OK;

  /* safety precaution */
  DEBUGASSERT(insize <= CURL_MAX_BASE64_INPUT);
  if(insize > CURL_MAX_BASE64_INPUT)
    return CURLE_TOO_LARGE;

  base64data = output = curlx_malloc(((insize + 2) / 3 * 4) + 1);
  if(!output)
    return CURLE_OUT_OF_MEMORY;
```

結果を空にしてから、入力が 0 バイトなら何もせず成功を返します。上限 `CURL_MAX_BASE64_INPUT`（`base64.h` で 16000000）を超える入力は断ります。確保量の `(insize + 2) / 3 * 4` は「3 バイトごとに 4 文字、端数は切り上げ」の計算で、そこにヌル文字の 1 を足して確保します。

### 2. 3 バイトずつ 4 文字に

```c:line-numbers=209
  while(insize >= 3) {
    /* Load all three input bytes before storing output, avoiding reloads when
       the compiler cannot rule out aliasing. Extract four 6-bit indices from
       the packed value; byte-wise loads avoid alignment and endian issues. */
    uint32_t bits = ((uint32_t)in[0] << 16) |
      ((uint32_t)in[1] << 8) | in[2];
    *output++ = table64[bits >> 18];
    *output++ = table64[(bits >> 12) & 0x3F];
    *output++ = table64[(bits >> 6) & 0x3F];
    *output++ = table64[bits & 0x3F];
    insize -= 3;
    in += 3;
  }
```

ループの最初で 3 バイトを 24 ビットの値 `bits` にまとめます。`"Man"`（0x4D, 0x61, 0x6E）なら `bits = 0x4D616E` です。

そこから 6 ビットずつ取り出します。

- `bits >> 18` = 19 → `'T'`
- `(bits >> 12) & 0x3F` = 22 → `'W'`
- `(bits >> 6) & 0x3F` = 5 → `'F'`
- `bits & 0x3F` = 46 → `'u'`

### 3. 端数の 1 バイトまたは 2 バイト

```c:line-numbers=222
  if(insize) {
    /* this is only one or two bytes now */
    *output++ = table64[in[0] >> 2];
    if(insize == 1) {
      *output++ = table64[((in[0] & 0x03) << 4)];
      if(padbyte) {
        *output++ = padbyte;
        *output++ = padbyte;
      }
    }
    else {
      /* insize == 2 */
      *output++ = table64[((in[0] & 0x03) << 4) | ((in[1] & 0xF0) >> 4)];
      *output++ = table64[((in[1] & 0x0F) << 2)];
      if(padbyte)
        *output++ = padbyte;
    }
  }
```

1 バイト余ったときは、8 ビットを「6 ビット + 2 ビット（下に 0 を 4 つ足す）」の 2 文字にして、`=` を 2 つ付けます。2 バイト余ったときは 16 ビットを 3 文字にして、`=` を 1 つ付けます。

`"Ma"`（0x4D, 0x61）なら、`0x4D >> 2` = 19 で `'T'`、`(0x4D & 3) << 4 | (0x61 & 0xF0) >> 4` = 16 + 6 = 22 で `'W'`、`(0x61 & 0x0F) << 2` = 4 で `'E'`、最後に `'='` を付けて `"TWE="` です。

`padbyte` が 0 のとき（Base64url）は `=` を付けません。

### 4. 終端して結果を返す

```c:line-numbers=242
  *output = '\0';

  /* Return the pointer to the new data (allocated memory) */
  *outptr = base64data;

  /* Return the length of the new data */
  *outlen = (size_t)(output - base64data);

  return CURLE_OK;
```

ヌル文字を書き、先頭の位置と、書いた長さ（`output - base64data`）を返します。

## ここがすごい

- **先に全部読んでから書く**: ループの中のコメントが理由を説明しています。入力と出力が同じメモリを指しているかもしれない（エイリアス）とコンパイラが判断できないと、書き込むたびに入力を読み直すコードになります。3 バイトを 1 つの変数に読み込んでおけば、読み直しは起きません。
- **1 バイトずつ組み立てる**: 3 バイトをまとめて 32 ビット整数として読むと、アドレスの整列や、CPU によるバイトの並び順（エンディアン）の違いが問題になります。1 バイトずつシフトして組み立てる方法なら、どの CPU でも同じ結果になります（これもコメントにある理由です）。
- **表とパディングを引数にする**: 通常の Base64 と Base64url の違いは「62・63 番目の文字」と「`=` を付けるか」だけです。そこを引数にしたことで、同じ処理を二度書かずに済んでいます。
- **大きさを先に計算して 1 回で確保**: 出力の長さは入力の長さから正確に分かるので、途中で領域を広げる必要がありません。

## まとめ

- Base64 は「3 バイト → 24 ビット → 6 ビット × 4 → 64 文字の表」で変換する。
- バイト列を整数にまとめるときは、1 バイトずつシフトして OR すると移植性が高い。
- 入力を先に変数へ読み込んでおくと、コンパイラが無駄な読み直しをしなくなる。
- 違いが小さい複数の方式は、違う部分だけを引数にすると 1 つの関数で書ける。
