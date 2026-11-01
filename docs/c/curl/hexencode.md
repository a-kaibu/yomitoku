---
title: "バイト列を 16 進文字列に ― 上位 4 ビットと下位 4 ビットで 2 文字にする"
description: "1 バイトを 2 文字の小文字 16 進数に変換する関数。出力バッファの大きさを毎回確かめ、足りなければ途中で切ってでも必ず終端する。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/escape.c
lines: [344, 366]
function: "Curl_hexencode"
difficulty: 1
format: 2
tags: [ビット演算, 文字列処理, 防御的プログラミング]
---

## ひとことで

`Curl_hexencode` は、バイト列を `"0123456789abcdef"` の文字だけを使った 16 進数の文字列に変換します。`{0xAB, 0x01}` を渡すと `"ab01"` になります。出力先の大きさ `olen` が足りないときは、入るところまで書いて必ずヌル文字で終わらせます。

## コード

::: code-group

```c:line-numbers=344 [日本語訳]
/*
 * Curl_hexencode()
 *
 * バイナリの入力を、小文字の 16 進数の ASCII 出力に変換する。
 * 出力はヌル文字で終端される。
 */
void Curl_hexencode(const unsigned char *src, size_t len, /* 入力の長さ */
                    unsigned char *out, size_t olen) /* 出力バッファの大きさ */
{
  DEBUGASSERT(src && len && (olen >= 3));
  if(src && len && (olen >= 3)) {
    while(len-- && (olen >= 3)) {
      out[0] = Curl_ldigits[*src >> 4];
      out[1] = Curl_ldigits[*src & 0x0F];
      ++src;
      out += 2;
      olen -= 2;
    }
    *out = 0;
  }
  else if(olen)
    *out = 0;
}
```

```c:line-numbers=344 [原文]
/*
 * Curl_hexencode()
 *
 * Converts binary input to lowercase hex-encoded ASCII output.
 * null-terminated.
 */
void Curl_hexencode(const unsigned char *src, size_t len, /* input length */
                    unsigned char *out, size_t olen) /* output buffer size */
{
  DEBUGASSERT(src && len && (olen >= 3));
  if(src && len && (olen >= 3)) {
    while(len-- && (olen >= 3)) {
      out[0] = Curl_ldigits[*src >> 4];
      out[1] = Curl_ldigits[*src & 0x0F];
      ++src;
      out += 2;
      olen -= 2;
    }
    *out = 0;
  }
  else if(olen)
    *out = 0;
}
```

:::

`Curl_ldigits` は `lib/mprintf.c` にある、16 進数の数字を並べた文字列です。

<!-- source: lib/mprintf.c -->
```c:line-numbers=37
const unsigned char Curl_ldigits[] = "0123456789abcdef";
```

## 前提知識

- **`unsigned char`**: 0〜255 を表す 1 バイトの符号なし整数です。バイナリデータを扱うときによく使います。
- **ポインタ**: `const unsigned char *src` は入力の並びを指し、`*src` で今の 1 バイトを読み、`++src` で次へ進みます。`out += 2` は書き込み位置を 2 つ進めます。
- **`>>`（右シフト）**: ビットを右にずらします。`0xAB >> 4` は `0x0A`、つまり上位 4 ビットを取り出します。
- **`& 0x0F`（ビット AND）**: 下位 4 ビットだけを残します。`0xAB & 0x0F` は `0x0B` です。
- **4 ビット = 16 進数 1 桁**: 4 ビットは 0〜15 の値を表し、ちょうど 16 進数 1 桁に対応します。
- **`while(len-- && (olen >= 3))`**: `len` が 0 でなく、かつ残りが 3 バイト以上ある間回ります。`len--` は値を見てから 1 減らします。
- **`DEBUGASSERT`**: デバッグビルドでだけ条件を確かめるマクロです。製品版では消えるので、すぐ下で同じ条件をもう一度 `if` で調べています。

## 何をしているか

### 1. 引数が正しいかを 2 段階で確かめる

```c:line-numbers=353
  DEBUGASSERT(src && len && (olen >= 3));
  if(src && len && (olen >= 3)) {
```

入力があり、長さが 0 でなく、出力が 3 バイト以上あること。開発中は `DEBUGASSERT` で止めて間違いを知らせ、製品版でも `if` で安全に処理を分けます。

### 2. 1 バイトを 2 文字に

```c:line-numbers=355
    while(len-- && (olen >= 3)) {
      out[0] = Curl_ldigits[*src >> 4];
      out[1] = Curl_ldigits[*src & 0x0F];
      ++src;
      out += 2;
      olen -= 2;
    }
```

`*src >> 4` で上位 4 ビット、`*src & 0x0F` で下位 4 ビットを取り出し、それぞれ `Curl_ldigits` の何番目かを引いて文字にします。

`0xAB` なら、上位は `0x0A`（10）なので `Curl_ldigits[10]` = `'a'`、下位は `0x0B`（11）なので `'b'` です。

書き込んだら入力を 1 つ、出力を 2 つ進め、残り容量 `olen` を 2 減らします。

### 3. 容量が足りなくなったら止まる

ループの条件 `olen >= 3` は「2 文字書いても、ヌル文字の 1 バイトが残る」ことを意味します。

`{0xAB, 0x01}` を `olen = 5` で変換すると、1 バイト目で `olen = 3`、2 バイト目も書けて `olen = 1`、最後に `"ab01"` とヌル文字で 5 バイトです。`olen = 4` なら、1 バイト目のあと `olen = 2` になり、2 バイト目は書かずにループを抜けて `"ab"` で終わります。

### 4. 必ず終端する

```c:line-numbers=362
    *out = 0;
```

正常な場合はループの後でヌル文字を書きます。引数がおかしい場合でも、出力に 1 バイトでも場所があれば `else if` の中でヌル文字を書き、呼び出し側が空文字列として安全に扱えるようにしています。

## ここがすごい

- **割り算ではなくシフトとマスク**: 16 で割った商と余りは、`>> 4` と `& 0x0F` で求められます。2 の累乗の割り算をビット演算に置き換える定番の書き方です。
- **表引きで分岐なし**: 「10 未満なら `'0' + n`、そうでなければ `'a' + n - 10`」のような条件分岐を書かず、16 文字の表を引くだけです。
- **バッファあふれを起こさない**: ループの条件に出力の残り容量を入れているので、呼び出し側が小さいバッファを渡しても書き過ぎません。代わりに出力が途中で切れますが、ヌル文字で終わっているので文字列として壊れません。
- **どんな場合も終端する**: 失敗した経路（`else if(olen)`）でも、可能なら出力を空文字列にしてから戻ります。呼び出し側が戻り値を確かめ忘れても、ゴミが残ったバッファを読まずに済みます。
- **実際の使われ方**: 同じ curl の `lib/rand.c` の `Curl_rand_hex` は、乱数のバイト列をこの関数で 16 進文字列にしています。

## まとめ

- 1 バイトは上位 4 ビットと下位 4 ビットに分けると、16 進数 2 桁になる。
- 16 で割る・余りを取る操作は `>> 4` と `& 0x0F` で書ける。
- 数字を文字にするときは、小さな表を引くと分岐が要らない。
- ループ条件に「出力の残り容量」を入れ、どの経路でも終端すると安全。
