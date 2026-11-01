---
title: "先頭バイトで長さを決め、6 ビットずつ組み立てる UTF-8 デコーダ"
description: "UTF-8 の 2〜4 バイトの並びから文字の番号を取り出す関数。先頭バイトで続くバイト数と「最小値」を決め、冗長な書き方（過剰に長い表現）をはじく。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_string.c
lines: [1350, 1418]
function: "ngx_utf8_decode"
difficulty: 3
format: 2
tags: [Unicode, ビット演算, パース]
---

## ひとことで

`ngx_utf8_decode` は、UTF-8 で書かれた 1 文字（2〜4 バイト）を読み、その **文字の番号（コードポイント）** を返す関数です。たとえば `"é"` の UTF-8 表現 `0xC3 0xA9` からは `0xE9` を返します。
コメントのとおり、1 バイトの ASCII 文字は扱わず、呼び出し側で先に処理しておく前提です。壊れた並びなら `0xffffffff`、途中で切れていれば `0xfffffffe` を返します。

## コード

::: code-group

```c:line-numbers=1350 [日本語訳]
/*
 * ngx_utf8_decode() は 2 バイト以上の UTF 列だけをデコードする
 * 戻り値:
 *    0x80 - 0x10ffff         正しい文字
 *    0x110000 - 0xfffffffd   不正な並び
 *    0xfffffffe              途中で切れた並び
 *    0xffffffff              エラー
 */

uint32_t
ngx_utf8_decode(u_char **p, size_t n)
{
    size_t    len;
    uint32_t  u, i, valid;

    u = **p;

    if (u >= 0xf8) {

        (*p)++;
        return 0xffffffff;

    } else if (u >= 0xf0) {

        u &= 0x07;
        valid = 0xffff;
        len = 3;

    } else if (u >= 0xe0) {

        u &= 0x0f;
        valid = 0x7ff;
        len = 2;

    } else if (u >= 0xc2) {

        u &= 0x1f;
        valid = 0x7f;
        len = 1;

    } else {
        (*p)++;
        return 0xffffffff;
    }

    if (n - 1 < len) {
        return 0xfffffffe;
    }

    (*p)++;

    while (len) {
        i = *(*p)++;

        if (i < 0x80) {
            return 0xffffffff;
        }

        u = (u << 6) | (i & 0x3f);

        len--;
    }

    if (u > valid) {
        return u;
    }

    return 0xffffffff;
}
```

```c:line-numbers=1350 [原文]
/*
 * ngx_utf8_decode() decodes two and more bytes UTF sequences only
 * the return values:
 *    0x80 - 0x10ffff         valid character
 *    0x110000 - 0xfffffffd   invalid sequence
 *    0xfffffffe              incomplete sequence
 *    0xffffffff              error
 */

uint32_t
ngx_utf8_decode(u_char **p, size_t n)
{
    size_t    len;
    uint32_t  u, i, valid;

    u = **p;

    if (u >= 0xf8) {

        (*p)++;
        return 0xffffffff;

    } else if (u >= 0xf0) {

        u &= 0x07;
        valid = 0xffff;
        len = 3;

    } else if (u >= 0xe0) {

        u &= 0x0f;
        valid = 0x7ff;
        len = 2;

    } else if (u >= 0xc2) {

        u &= 0x1f;
        valid = 0x7f;
        len = 1;

    } else {
        (*p)++;
        return 0xffffffff;
    }

    if (n - 1 < len) {
        return 0xfffffffe;
    }

    (*p)++;

    while (len) {
        i = *(*p)++;

        if (i < 0x80) {
            return 0xffffffff;
        }

        u = (u << 6) | (i & 0x3f);

        len--;
    }

    if (u > valid) {
        return u;
    }

    return 0xffffffff;
}
```

:::

## 前提知識

- **Unicode とコードポイント**: 世界中の文字に番号を振ったものが Unicode で、その番号がコードポイントです。`'A'` は `0x41`、`'é'` は `0xE9`、`'あ'` は `0x3042` です。
- **UTF-8**: コードポイントを 1〜4 バイトで表す方式です。先頭バイトの上位ビットで長さが分かります。
  - `0xxxxxxx`: 1 バイト（ASCII）
  - `110xxxxx 10xxxxxx`: 2 バイト
  - `1110xxxx 10xxxxxx 10xxxxxx`: 3 バイト
  - `11110xxx` ＋ 続き 3 バイト: 4 バイト

  2 バイト目以降（継続バイト）は `10xxxxxx` の形で、下位 6 ビットに値が入ります。
- **`uint32_t`**: ちょうど 32 ビットの符号なし整数です。
- **ポインタのポインタ `u_char **p`**: 「ポインタが入っている場所」を指すポインタです。`*p` で中のポインタを、`**p` でそれが指すバイトを読めます。`(*p)++` は中のポインタを進めるので、**呼び出し側の読み取り位置を関数の中から進められます**。
- **`&` と `|` とシフト**: `u & 0x1f` は下位 5 ビットだけ残します。`(u << 6) | x` は `u` を左へ 6 ビットずらし、空いたところに `x` を入れます。

## 何をしているか

### 1. 先頭バイトで種類を決める

```c:line-numbers=1365
    u = **p;

    if (u >= 0xf8) {

        (*p)++;
        return 0xffffffff;

    } else if (u >= 0xf0) {

        u &= 0x07;
        valid = 0xffff;
        len = 3;

    } else if (u >= 0xe0) {

        u &= 0x0f;
        valid = 0x7ff;
        len = 2;

    } else if (u >= 0xc2) {

        u &= 0x1f;
        valid = 0x7f;
        len = 1;

    } else {
        (*p)++;
        return 0xffffffff;
    }
```

先頭バイト `u` の大きさで場合分けします。

- `0xf8` 以上: UTF-8 にない形なのでエラー。
- `0xf0` 以上: 4 バイト文字。値の部分は下位 3 ビット（`& 0x07`）、続きは 3 バイト。
- `0xe0` 以上: 3 バイト文字。下位 4 ビット、続きは 2 バイト。
- `0xc2` 以上: 2 バイト文字。下位 5 ビット、続きは 1 バイト。
- それ以外: エラー。

`valid` は「この長さで表すなら、これより大きくなければおかしい」という境目です。2 バイトなら `0x7f`（1 バイトで表せる最大値）です。

`0xc0` と `0xc1` を最初から弾いているのは、これらで始まる 2 バイトの並びは、必ず `0x7f` 以下の値になる（＝ 1 バイトで書けるのに 2 バイトで書いた）ためです。

### 2. 長さが足りるか

```c:line-numbers=1395
    if (n - 1 < len) {
        return 0xfffffffe;
    }
```

残りのバイト数 `n` から先頭の 1 を引いた数が、必要な続きの数 `len` より少なければ、データが途中で切れています。`0xfffffffe` を返し、ポインタは進めません。呼び出し側は、続きのデータが届いてから読み直せます。

### 3. 6 ビットずつ組み立てる

```c:line-numbers=1399
    (*p)++;

    while (len) {
        i = *(*p)++;

        if (i < 0x80) {
            return 0xffffffff;
        }

        u = (u << 6) | (i & 0x3f);

        len--;
    }
```

先頭バイトを読み終えたので `(*p)++` で進め、続きのバイトを読みます。最上位ビットが 0（`0x80` 未満）なら継続バイトではないのでエラーです。そうでなければ下位 6 ビットを取り出して、`u` の右側に継ぎ足します。

`0xC3 0xA9` で追います。

- 先頭 `0xC3` = `11000011` → `u = 00011`（3）、`len = 1`、`valid = 0x7f`
- 続き `0xA9` = `10101001` → 下位 6 ビット `101001`
- `u = (3 << 6) | 0x29 = 0xE9`

### 4. 過剰に長い表現をはじく

```c:line-numbers=1413
    if (u > valid) {
        return u;
    }

    return 0xffffffff;
```

`u` が `valid` を超えていれば正しい文字として返し、そうでなければエラーです。たとえば `0xE0 0x80 0x80` は 3 バイトで 0 を表していますが、0 は 1 バイトで書けるので不正です。

## ここがすごい

- **「最小値」1 つで冗長表現を検出**: UTF-8 では、同じ文字を必要以上に長いバイト数で書く「過剰に長い表現（overlong）」が禁止されています。これを許すと、`/` を別のバイト列で書いて文字列チェックをすり抜ける、といった攻撃に使われるおそれがあるためです。この関数は、長さごとに「超えるべき値」`valid` を 1 つ決めておくだけで、すべての長さの過剰表現をまとめて検出しています。
- **戻り値の範囲で状態を伝える**: 正しい文字は `0x80`〜`0x10ffff`、壊れた並びはそれより大きい値、という約束で、成功・失敗・データ不足を 1 つの `uint32_t` で返しています。範囲外の値（`0x110000` 以上）を返す場合もあり、呼び出し側は `> 0x10ffff` で「正しい文字ではない」と判定できます。
- **データ不足では位置を進めない**: ネットワークから届くデータは途中で切れていることがあります。切れているときだけはポインタを動かさず、別の値を返すことで、「あとで続きと合わせて読み直す」使い方ができます。
- **割り切りもある**: 継続バイトの確認は最上位ビットだけで、`10` の 2 ビットまでは見ていません。用途に必要な範囲に絞った、軽量な実装です。

## まとめ

- UTF-8 は先頭バイトの上位ビットで長さが決まり、続くバイトは 6 ビットずつ値を運ぶ。
- 長さごとの「最小値」を決めておくと、過剰に長い表現をまとめて拒否できる。
- `u_char **p` のようにポインタのポインタを受け取ると、関数の中から呼び出し側の読み取り位置を進められる。
- 「データが足りない」を「エラー」と区別して返すと、分割して届くデータを扱いやすい。
