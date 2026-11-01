---
title: "変換せずに数えるだけ、UTF-16 から WTF-8 への必要バイト数"
description: "UTF-16 の文字列を WTF-8 にしたら何バイトになるかを、実際には変換せずに数える関数。長さ指定と 0 終端の両方に 1 つのループで対応する。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: ISC
copyright: "Copyright libuv contributors. All rights reserved."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/idna.c
lines: [429, 459]
function: "uv_utf16_length_as_wtf8"
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, メモリ管理]
---

## ひとことで

`uv_utf16_length_as_wtf8` は、UTF-16 の文字列を WTF-8（UTF-8 をゆるめた形式）に変換したとき、**何バイトになるか** を数える関数です。
実際の変換の前にこれを呼んで、ちょうどの大きさの領域を確保するために使います。
長さを指定した文字列と、0 で終わる文字列（長さ不明）の **両方を同じループで** 扱っているのが特徴です。

## コード

::: code-group

```c:line-numbers=429 [日本語訳]
size_t uv_utf16_length_as_wtf8(const uint16_t* w_source_ptr,
                               ssize_t w_source_len) {
  size_t target_len;
  int32_t code_point;

  target_len = 0;
  while (w_source_len) {
    code_point = uv__get_surrogate_value(w_source_ptr, w_source_len);
    /* UTF-8 としては不正でもよいが、WTF-8 としては正しくなければならない。 */
    assert(code_point >= 0);
    if (w_source_len < 0 && code_point == 0)
      break;
    if (code_point < 0x80)
      target_len += 1;
    else if (code_point < 0x800)
      target_len += 2;
    else if (code_point < 0x10000)
      target_len += 3;
    else {
      target_len += 4;
      w_source_ptr++;
      if (w_source_len > 0)
        w_source_len--;
    }
    w_source_ptr++;
    if (w_source_len > 0)
      w_source_len--;
  }

  return target_len;
}
```

```c:line-numbers=429 [原文]
size_t uv_utf16_length_as_wtf8(const uint16_t* w_source_ptr,
                               ssize_t w_source_len) {
  size_t target_len;
  int32_t code_point;

  target_len = 0;
  while (w_source_len) {
    code_point = uv__get_surrogate_value(w_source_ptr, w_source_len);
    /* Can be invalid UTF-8 but must be valid WTF-8. */
    assert(code_point >= 0);
    if (w_source_len < 0 && code_point == 0)
      break;
    if (code_point < 0x80)
      target_len += 1;
    else if (code_point < 0x800)
      target_len += 2;
    else if (code_point < 0x10000)
      target_len += 3;
    else {
      target_len += 4;
      w_source_ptr++;
      if (w_source_len > 0)
        w_source_len--;
    }
    w_source_ptr++;
    if (w_source_len > 0)
      w_source_len--;
  }

  return target_len;
}
```

:::

## 前提知識

- **UTF-16**: 文字を 16 ビット単位で表す方式です。U+10000 以上の文字は 2 単位（サロゲートペア）を使います。
- **UTF-8 / WTF-8 の長さ**: 文字番号（コードポイント）が 0x80 未満なら 1 バイト、0x800 未満なら 2 バイト、0x10000 未満なら 3 バイト、それ以上なら 4 バイトになります。WTF-8 でもこの規則は同じです。
- **`ssize_t w_source_len`**: 符号付きの長さです。この関数では、**負の値は「0 で終わる文字列」** という意味で使います。
- **ポインタを進める `w_source_ptr++`**: 16 ビット値の並びの、次の要素を指すように進めます。
- **`assert(条件)`**: 開発中のチェックです。条件が偽ならプログラムが止まります。
- **`uv__get_surrogate_value`**: 先頭の 1〜2 単位から 1 文字ぶんの番号を取り出す、同じファイルの関数です。ペアなら合体した値を、そうでなければ 1 単位の値をそのまま返します。

## 何をしているか

### 1. 長さが 0 になるまで回す

```c:line-numbers=435
  while (w_source_len) {
```

`while (w_source_len)` は「長さが 0 でない間」です。長さを指定した場合は、読むたびに減らしていき 0 で止まります。
長さが負（0 終端）の場合は、減らさないので 0 にはならず、別の条件（次の項目）で止まります。

### 2. 0 終端なら 0 で止まる

```c:line-numbers=436
    code_point = uv__get_surrogate_value(w_source_ptr, w_source_len);
    /* Can be invalid UTF-8 but must be valid WTF-8. */
    assert(code_point >= 0);
    if (w_source_len < 0 && code_point == 0)
      break;
```

1 文字ぶんの番号を取り出し、`w_source_len < 0`（0 終端モード）かつ番号が 0（終端）なら `break` します。長さ指定のモードでは、途中に 0 があっても普通の文字として数え続けます。

### 3. 番号の大きさでバイト数を足す

```c:line-numbers=441
    if (code_point < 0x80)
      target_len += 1;
    else if (code_point < 0x800)
      target_len += 2;
    else if (code_point < 0x10000)
      target_len += 3;
    else {
      target_len += 4;
      w_source_ptr++;
      if (w_source_len > 0)
        w_source_len--;
    }
```

0x80 未満なら 1、0x800 未満なら 2、0x10000 未満なら 3 を足します。
0x10000 以上なら 4 を足し、さらにサロゲートペアの 2 単位目のぶん、ポインタを余分に 1 つ進めます。長さ指定のモードなら長さも 1 減らします。

### 4. 1 単位進める

```c:line-numbers=453
    w_source_ptr++;
    if (w_source_len > 0)
      w_source_len--;
```

最後に共通でポインタを 1 つ進め、長さ指定なら長さを 1 減らします。

### 例で追う

`L"aé😀"`（`0x0061 0x00E9 0xD83D 0xDE00 0x0000`）を、長さ -1（0 終端）で渡したとします。

- `0x61` → 1 バイト（計 1）
- `0xE9` → 2 バイト（計 3）
- `0xD83D 0xDE00` → 合体して `0x1F600`、4 バイト（計 7）、ポインタは 2 つ進む
- `0x0000` → 0 終端モードなので止まる

結果は 7 です。終端の 0 は数えません。

## ここがすごい

- **負の長さを「無限」として使う**: 長さを `-1` にすると、`if (w_source_len > 0) w_source_len--;` で減らされないので、`while (w_source_len)` は終端の 0 が来るまで回り続けます。長さ指定版と 0 終端版を別々の関数にしなくて済み、どちらのモードも同じ 1 つのループで正しく動きます。
- **はぐれサロゲートは 3 バイト**: 対になっていないサロゲート（たとえば `0xD83D` 単独）は `uv__get_surrogate_value` がそのまま返すので、0x10000 未満として 3 バイトに数えられます。WTF-8 はこれを 3 バイトで表すので、ちょうど一致します。ループ内のコメントにある「UTF-8 としては不正かもしれないが、WTF-8 としては正しい」とはこのことです。
- **2 回走る設計の利点**: 「数える」と「書く」を分けると入力を 2 回読むことになりますが、変換中の領域の再確保やエラー処理が不要になります。ファイル名のような短い文字列では、この単純さのほうが価値があります。

## まとめ

- UTF-8 系のバイト数は、コードポイントの大きさだけで決まる（1〜4 バイト）。
- サロゲートペアは 2 単位で 4 バイト、はぐれサロゲートは 1 単位で 3 バイトになる。
- 負の長さを「0 終端」の意味にすると、2 種類の入力を 1 つのループで扱える。
- 変換の前に必要な長さを数えると、変換側をシンプルにできる。
