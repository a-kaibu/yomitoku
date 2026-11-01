---
title: "どの長さも 4 バイトの形にそろえてから計算する UTF-8 デコード"
description: "libuv の厳密な UTF-8 デコーダの後半。switch の fall through で 2・3 バイト文字を 4 バイト文字と同じ形に詰め直し、1 つの式と 3 つのチェックで済ませる。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: ISC
copyright: "Copyright libuv contributors. All rights reserved."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/idna.c
lines: [71, 137]
function: "uv__utf8_decode1_slow"
difficulty: 3
format: 2
tags: [Unicode, パース, ビット演算, ハック]
---

## ひとことで

`uv__utf8_decode1_slow` は、UTF-8 の 1 文字のうち、ASCII 以外（2〜4 バイトの文字）を読み取る関数です。ASCII は呼び出し元の `uv__utf8_decode1` が先に処理するので、ここは「遅い道（slow path）」です。
2 バイト・3 バイトの文字を、**ダミーの継続バイトで水増しして 4 バイト文字と同じ形にそろえ**、そのあとは共通の 1 本の計算で済ませるのが見どころです。
不正な並び、無駄に長い表現、範囲外、サロゲートはすべて -1 で弾きます。

## コード

::: code-group

```c:line-numbers=71 [日本語訳]
static unsigned uv__utf8_decode1_slow(const char** p,
                                      const char* pe,
                                      unsigned a) {
  unsigned b;
  unsigned c;
  unsigned d;
  unsigned min;

  if (a > 0xF7)
    return -1;

  switch (pe - *p) {
  default:
    if (a > 0xEF) {
      min = 0x10000;
      a = a & 7;
      b = (unsigned char) *(*p)++;
      c = (unsigned char) *(*p)++;
      d = (unsigned char) *(*p)++;
      break;
    }
    /* 下へ流れ込む。 */
  case 2:
    if (a > 0xDF) {
      min = 0x800;
      b = 0x80 | (a & 15);
      c = (unsigned char) *(*p)++;
      d = (unsigned char) *(*p)++;
      a = 0;
      break;
    }
    /* 下へ流れ込む。 */
  case 1:
    if (a > 0xBF) {
      min = 0x80;
      b = 0x80;
      c = 0x80 | (a & 31);
      d = (unsigned char) *(*p)++;
      a = 0;
      break;
    }
    /* 下へ流れ込む。 */
  case 0:
    return -1;  /* 不正な継続バイト。 */
  }

  if ((b & 0xC0) != 0x80 ||
      (c & 0xC0) != 0x80 ||
      (d & 0xC0) != 0x80)
    return -1;  /* 不正なバイト列。 */

  b &= 63;
  c &= 63;
  d &= 63;
  a = (a << 18) | (b << 12) | (c << 6) | d;

  if (a < min)
    return -1;  /* 冗長表現。 */

  if (a > 0x10FFFF)
    return -1;  /* U+10FFFF を超える 4 バイト列。 */

  if (a >= 0xD800 && a <= 0xDFFF)
    return -1;  /* サロゲート。 */

  return a;
}
```

```c:line-numbers=71 [原文]
static unsigned uv__utf8_decode1_slow(const char** p,
                                      const char* pe,
                                      unsigned a) {
  unsigned b;
  unsigned c;
  unsigned d;
  unsigned min;

  if (a > 0xF7)
    return -1;

  switch (pe - *p) {
  default:
    if (a > 0xEF) {
      min = 0x10000;
      a = a & 7;
      b = (unsigned char) *(*p)++;
      c = (unsigned char) *(*p)++;
      d = (unsigned char) *(*p)++;
      break;
    }
    /* Fall through. */
  case 2:
    if (a > 0xDF) {
      min = 0x800;
      b = 0x80 | (a & 15);
      c = (unsigned char) *(*p)++;
      d = (unsigned char) *(*p)++;
      a = 0;
      break;
    }
    /* Fall through. */
  case 1:
    if (a > 0xBF) {
      min = 0x80;
      b = 0x80;
      c = 0x80 | (a & 31);
      d = (unsigned char) *(*p)++;
      a = 0;
      break;
    }
    /* Fall through. */
  case 0:
    return -1;  /* Invalid continuation byte. */
  }

  if ((b & 0xC0) != 0x80 ||
      (c & 0xC0) != 0x80 ||
      (d & 0xC0) != 0x80)
    return -1;  /* Invalid sequence. */

  b &= 63;
  c &= 63;
  d &= 63;
  a = (a << 18) | (b << 12) | (c << 6) | d;

  if (a < min)
    return -1;  /* Overlong sequence. */

  if (a > 0x10FFFF)
    return -1;  /* Four-byte sequence > U+10FFFF. */

  if (a >= 0xD800 && a <= 0xDFFF)
    return -1;  /* Surrogate pair. */

  return a;
}
```

:::

## 前提知識

- **UTF-8**: 文字番号（コードポイント）を 1〜4 バイトで表す方式です。先頭バイトが `110xxxxx` なら 2 バイト、`1110xxxx` なら 3 バイト、`11110xxx` なら 4 バイトで、続くバイトは `10xxxxxx`（下位 6 ビットが中身）です。
- **冗長表現（overlong）**: 本来 1 バイトで書ける文字を、わざと 2 バイト以上で書いたものです。セキュリティ上の問題になるので、受け付けてはいけません。
- **サロゲート**: U+D800〜U+DFFF は UTF-16 の内部処理用に予約された番号で、UTF-8 に現れてはいけません。
- **`switch` と fall through**: `switch (x)` は `x` の値に合う `case` へ飛びます。`case` の最後に `break` がないと、そのまま次の `case` の中へ流れ込みます（fall through）。
- **`unsigned` と -1**: 符号なし整数に -1 を入れると、すべてのビットが 1 の最大値（`UINT_MAX`）になります。呼び出し側はこれをエラーの印として比べています。
- **`*(*p)++`**: `p` は「読んでいる位置」を持つポインタのポインタです。今の位置の 1 バイトを読んでから、位置を 1 つ進めます。
- **`pe - *p`**: 終わりの位置から今の位置を引いた、残りのバイト数です。

## 何をしているか

### 1. 先頭バイトと残りバイト数で振り分ける

```c:line-numbers=79
  if (a > 0xF7)
    return -1;

  switch (pe - *p) {
  default:
    if (a > 0xEF) {
      min = 0x10000;
      a = a & 7;
      b = (unsigned char) *(*p)++;
      c = (unsigned char) *(*p)++;
      d = (unsigned char) *(*p)++;
      break;
    }
    /* Fall through. */
  case 2:
    if (a > 0xDF) {
      min = 0x800;
      b = 0x80 | (a & 15);
      c = (unsigned char) *(*p)++;
      d = (unsigned char) *(*p)++;
      a = 0;
      break;
    }
    /* Fall through. */
  case 1:
    if (a > 0xBF) {
      min = 0x80;
      b = 0x80;
      c = 0x80 | (a & 31);
      d = (unsigned char) *(*p)++;
      a = 0;
      break;
    }
    /* Fall through. */
  case 0:
    return -1;  /* Invalid continuation byte. */
  }
```

`a` は呼び出し元で読んだ先頭バイトです。`0xF7` より大きい先頭バイトは UTF-8 に存在しないので弾きます。

`switch` は **残りのバイト数** で分けます。残りが 3 以上なら `default`、2 なら `case 2`、1 なら `case 1` から始まります。

- **4 バイト文字**（`a > 0xEF`）: `a` の下位 3 ビットを残し、続く 3 バイトを `b`・`c`・`d` に読みます。
- **3 バイト文字**（`a > 0xDF`）: 続く 2 バイトを `c`・`d` に読みます。`b` には `0x80 | (a & 15)`、つまり **先頭バイトの中身 4 ビットを継続バイトの形に包んだもの** を入れ、`a` は 0 にします。
- **2 バイト文字**（`a > 0xBF`）: 続く 1 バイトを `d` に読み、`b = 0x80`（中身 0 の継続バイト）、`c = 0x80 | (a & 31)` とします。

どれにも当てはまらず `case 0` に流れ着いたら、継続バイトが単独で来たなどの不正なので -1 です。

### 2. 共通の検査と組み立て

```c:line-numbers=117
  if ((b & 0xC0) != 0x80 ||
      (c & 0xC0) != 0x80 ||
      (d & 0xC0) != 0x80)
    return -1;  /* Invalid sequence. */

  b &= 63;
  c &= 63;
  d &= 63;
  a = (a << 18) | (b << 12) | (c << 6) | d;
```

ここからは、どの長さでも `a, b, c, d` の 4 バイト形式です。`b`・`c`・`d` が全部 `10xxxxxx` かを確かめ、下位 6 ビットだけ残して、
`a << 18 | b << 12 | c << 6 | d` で 1 つの番号にします。

`あ`（U+3042）は `E3 81 82` です。3 バイト文字なので `b = 0x80 | 3 = 0x83`、`c = 0x81`、`d = 0x82`、`a = 0` になります。6 ビットずつにすると `b=3, c=1, d=2` で、`3<<12 | 1<<6 | 2 = 0x3042`。正しく戻りました。

### 3. 3 つの禁止事項

```c:line-numbers=127
  if (a < min)
    return -1;  /* Overlong sequence. */

  if (a > 0x10FFFF)
    return -1;  /* Four-byte sequence > U+10FFFF. */

  if (a >= 0xD800 && a <= 0xDFFF)
    return -1;  /* Surrogate pair. */
```

`min` は長さごとの最小値です（2 バイトなら `0x80`、3 バイトなら `0x800`、4 バイトなら `0x10000`）。これ未満なら冗長表現です。さらに `0x10FFFF` 超え、サロゲートの範囲を弾きます。

## ここがすごい

- **形をそろえて分岐を 1 回にする**: 素直に書くと、長さごとに「継続バイトの検査」「組み立て」「範囲チェック」を 3 回ずつ書くことになります。短い文字をダミーの `0x80` で水増しすれば、継続バイトの検査も組み立ても 1 回で済みます。ダミーは本物の継続バイトの形をしているので、検査を必ず通り、値には 0 しか足しません。
- **fall through で長さ不足も扱う**: 残りバイト数で `switch` の入口を選ぶので、「4 バイト文字なのに残りが 2 バイトしかない」とき、4 バイトの処理には入りません。下の `case` に流れて、より短い文字として読めるかを試し、どれにも当てはまらなければ `case 0` の -1 に落ちます。どの経路でも、終わりの位置 `pe` を越えて読むことはありません。ただし、この流れ込みでは 4 バイト文字の先頭バイトが 3 バイト文字の先頭として解釈されることがあり、入力が途中で切れている場合の判定は厳密な検証器と同じになるとは限りません。「範囲外を読まない」ことを最優先にした作りだと言えます。
- **`min` 1 つで冗長表現を検出**: 冗長表現の検出を、各長さごとの特別な条件ではなく「できた値が最小値以上か」という 1 つの比較にまとめています。
- **速い道と遅い道の分離**: 呼び出し元の `uv__utf8_decode1` は ASCII ならすぐ返し、ここには来ません。ホスト名のようにほとんど ASCII のデータでは、この関数はめったに呼ばれません。

## まとめ

- UTF-8 デコードでは、継続バイトの形、冗長表現、上限、サロゲートをすべて検査する必要がある。
- 短い文字をダミーの継続バイトで水増しすると、どの長さも同じ式で計算できる。
- `switch` の fall through を使うと、残りバイト数に応じて読める範囲だけを読める。
- よく通る道（ASCII）とまれな道を関数で分けると、ふだんの処理が速くなる。
