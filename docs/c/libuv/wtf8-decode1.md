---
title: "先頭バイトの目印をマスクで消す、WTF-8 の 1 文字デコード"
description: "UTF-8 によく似た WTF-8 の文字列から 1 文字を読み取る関数。続きのバイトを 6 ビットずつ足し込み、最後にマスクで先頭の目印ビットだけを消す。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: ISC
copyright: "Copyright libuv contributors. All rights reserved."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/idna.c
lines: [28, 68]
function: "uv__wtf8_decode1"
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, ビット演算, パース]
---

## ひとことで

`uv__wtf8_decode1` は、WTF-8 で書かれたバイト列から **1 文字ぶん** を読み取り、その文字の番号（コードポイント）を返す関数です。
WTF-8 は UTF-8 とほぼ同じ形式ですが、Windows のファイル名に現れうる「対になっていないサロゲート」もそのまま表せるよう、制限を少しゆるめたものです。
libuv は Windows のパス（UTF-16）との変換にこの関数を使います。

## コード

::: code-group

```c:line-numbers=28 [日本語訳]
static int32_t uv__wtf8_decode1(const char** input) {
  uint32_t code_point;
  uint8_t b1;
  uint8_t b2;
  uint8_t b3;
  uint8_t b4;

  b1 = **input;
  if (b1 <= 0x7F)
    return b1; /* ASCII の文字 */
  if (b1 < 0xC2)
    return -1; /* 不正: 継続バイト */
  code_point = b1;

  b2 = *++*input;
  if ((b2 & 0xC0) != 0x80)
    return -1; /* 不正: 継続バイトではない */
  code_point = (code_point << 6) | (b2 & 0x3F);
  if (b1 <= 0xDF)
    return 0x7FF & code_point; /* 2 バイト文字 */

  b3 = *++*input;
  if ((b3 & 0xC0) != 0x80)
    return -1; /* 不正: 継続バイトではない */
  code_point = (code_point << 6) | (b3 & 0x3F);
  if (b1 <= 0xEF)
    return 0xFFFF & code_point; /* 3 バイト文字 */

  b4 = *++*input;
  if ((b4 & 0xC0) != 0x80)
    return -1; /* 不正: 継続バイトではない */
  code_point = (code_point << 6) | (b4 & 0x3F);
  if (b1 <= 0xF4) {
    code_point &= 0x1FFFFF;
    if (code_point <= 0x10FFFF)
      return code_point; /* 4 バイト文字 */
  }

  /* コードポイントが大きすぎる */
  return -1;
}
```

```c:line-numbers=28 [原文]
static int32_t uv__wtf8_decode1(const char** input) {
  uint32_t code_point;
  uint8_t b1;
  uint8_t b2;
  uint8_t b3;
  uint8_t b4;

  b1 = **input;
  if (b1 <= 0x7F)
    return b1; /* ASCII code point */
  if (b1 < 0xC2)
    return -1; /* invalid: continuation byte */
  code_point = b1;

  b2 = *++*input;
  if ((b2 & 0xC0) != 0x80)
    return -1; /* invalid: not a continuation byte */
  code_point = (code_point << 6) | (b2 & 0x3F);
  if (b1 <= 0xDF)
    return 0x7FF & code_point; /* two-byte character */

  b3 = *++*input;
  if ((b3 & 0xC0) != 0x80)
    return -1; /* invalid: not a continuation byte */
  code_point = (code_point << 6) | (b3 & 0x3F);
  if (b1 <= 0xEF)
    return 0xFFFF & code_point; /* three-byte character */

  b4 = *++*input;
  if ((b4 & 0xC0) != 0x80)
    return -1; /* invalid: not a continuation byte */
  code_point = (code_point << 6) | (b4 & 0x3F);
  if (b1 <= 0xF4) {
    code_point &= 0x1FFFFF;
    if (code_point <= 0x10FFFF)
      return code_point; /* four-byte character */
  }

  /* code point too large */
  return -1;
}
```

:::

## 前提知識

- **コードポイント**: Unicode で 1 文字ごとに振られた番号です。`A` は U+0041、`あ` は U+3042、絵文字の 😀 は U+1F600 です。
- **UTF-8**: コードポイントを 1〜4 バイトで表す方式です。先頭バイトの上位ビットで長さがわかります。`0xxxxxxx` は 1 バイト、`110xxxxx` は 2 バイト、`1110xxxx` は 3 バイト、`11110xxx` は 4 バイトの始まりです。2 バイト目以降（継続バイト）は必ず `10xxxxxx` の形で、下位 6 ビットに中身が入っています。
- **ポインタのポインタ `const char** input`**: 「文字列を読んでいる位置（ポインタ）」がしまってある場所を指します。`**input` は今の位置の 1 バイト、`*++*input` は「位置を 1 つ進めてから、その 1 バイトを読む」です。こうすると、関数の中で進めた位置が呼び出し元にも反映されます。
- **`uint8_t` / `uint32_t` / `int32_t`**: 大きさが決まった整数型です。`u` は符号なし、数字はビット数です。戻り値を `int32_t`（符号付き）にして、`-1` をエラーの印にしています。
- **ビット演算**: `&` は AND（マスク）、`|` は OR、`<< 6` は 6 ビット左へずらす操作です。

## 何をしているか

### 1. 1 バイト目で振り分ける

```c:line-numbers=35
  b1 = **input;
  if (b1 <= 0x7F)
    return b1; /* ASCII code point */
  if (b1 < 0xC2)
    return -1; /* invalid: continuation byte */
  code_point = b1;
```

`b1 <= 0x7F` なら ASCII なので、そのまま返します。
`b1 < 0xC2` は、`0x80`〜`0xBF`（継続バイトがいきなり来た）と `0xC0`・`0xC1`（必ず無駄に長い表現になる先頭バイト）を弾く判定です。

### 2. 継続バイトを 6 ビットずつ足していく

```c:line-numbers=42
  b2 = *++*input;
  if ((b2 & 0xC0) != 0x80)
    return -1; /* invalid: not a continuation byte */
  code_point = (code_point << 6) | (b2 & 0x3F);
  if (b1 <= 0xDF)
    return 0x7FF & code_point; /* two-byte character */

  b3 = *++*input;
  if ((b3 & 0xC0) != 0x80)
    return -1; /* invalid: not a continuation byte */
  code_point = (code_point << 6) | (b3 & 0x3F);
  if (b1 <= 0xEF)
    return 0xFFFF & code_point; /* three-byte character */

  b4 = *++*input;
  if ((b4 & 0xC0) != 0x80)
    return -1; /* invalid: not a continuation byte */
  code_point = (code_point << 6) | (b4 & 0x3F);
```

2 バイト目を読み、`(b2 & 0xC0) != 0x80` で「`10xxxxxx` の形か」を確かめます。上位 2 ビットだけを取り出して `10` と比べているわけです。
正しければ `code_point = (code_point << 6) | (b2 & 0x3F)` で、今までの値を 6 ビット左へずらし、新しい 6 ビットを右に足します。

### 3. 長さが決まった時点でマスクして返す

```c:line-numbers=46
  if (b1 <= 0xDF)
    return 0x7FF & code_point; /* two-byte character */
```

ここが工夫の部分です。`code_point` には最初に `b1` を **目印ビットごと** 入れているので、余計な上位ビットが残っています。それを長さごとのマスクで消します。

`é`（U+00E9）は UTF-8 で `C3 A9` です。`code_point` は `0xC3 << 6 | 0x29` = `0x30E9` になります。2 バイト文字なので `0x7FF & 0x30E9` = `0xE9`。目印の `110` が消えて、正しい値になりました。
3 バイトなら `0xFFFF`、4 バイトなら `0x1FFFFF` でマスクします。4 バイトのときは、さらに `0x10FFFF`（Unicode の上限）を超えないかを確かめます。

```c:line-numbers=60
  if (b1 <= 0xF4) {
    code_point &= 0x1FFFFF;
    if (code_point <= 0x10FFFF)
      return code_point; /* four-byte character */
  }
```

### 4. 位置の進め方

`*++*input` で読むたびに位置が進むので、関数を抜けたとき `*input` は **その文字の最後のバイト** を指しています。呼び出し側の `uv_wtf8_length_as_utf16` は `while (*source_ptr++)` で、その最後のバイトを確認してから 1 つ進めます。文字が終端の `'\0'` だったときだけ 0 になってループが終わる、という組み合わせです。

## ここがすごい

- **先頭バイトから目印を外す処理を後回しにしている**: 素直に書くと「2 バイトなら `b1 & 0x1F`、3 バイトなら `b1 & 0x0F`…」と最初に分岐して目印を外します。この関数は目印ごと積み上げてしまい、長さが決まってから一度だけマスクします。分岐が減り、各段の処理が同じ形の繰り返しになります。
- **継続バイトの確認を毎回している**: 途中で `'\0'` などが来た場合も `(b & 0xC0) != 0x80` で止まるので、文字列の終わりを越えて読み進めません。
- **サロゲートを通す**: 普通の UTF-8 デコーダは U+D800〜U+DFFF（サロゲート）を不正として弾きます。この関数はわざと弾きません。Windows のファイル名には不完全な UTF-16 が含まれることがあり、それを失わずに往復させるためです。同じファイルにある厳密な `uv__utf8_decode1_slow` とは、ここが違います。

## まとめ

- UTF-8 の継続バイトは `10xxxxxx`。`(b & 0xC0) == 0x80` で見分けられる。
- 6 ビットずつ左にずらして足すと、複数バイトから 1 つの番号を組み立てられる。
- 先頭の目印ビットは、長さが決まってからマスクでまとめて消せる。
- WTF-8 は、壊れた UTF-16 も表せるように UTF-8 をゆるめた形式。
