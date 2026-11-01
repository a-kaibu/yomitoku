---
title: "文字の途中で切らない、UTF-8 を意識した長さ制限つきコピー"
description: "長さの上限つきで文字列をコピーする関数の UTF-8 版。マルチバイト文字は 1 文字まるごとコピーするかしないかのどちらかにして、壊れた文字が出力に残らないようにする。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_string.c
lines: [1448, 1491]
function: "ngx_utf8_cpystrn"
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, 防御的プログラミング]
---

## ひとことで

`ngx_utf8_cpystrn` は、UTF-8 の文字列を、最大 `n` バイト（終端の 0 を含む）の範囲でコピーする関数です。ふつうのバイト単位のコピーと違い、**日本語のような複数バイトの文字を途中で切りません**。また、壊れた UTF-8 を見つけたら、その手前でコピーを打ち切ります。
nginx のディレクトリ一覧（autoindex）で、長いファイル名を一定の長さで切って表示するのに使われています。

## コード

::: code-group

```c:line-numbers=1448 [日本語訳]
u_char *
ngx_utf8_cpystrn(u_char *dst, u_char *src, size_t n, size_t len)
{
    u_char  c, *next;

    if (n == 0) {
        return dst;
    }

    while (--n) {

        c = *src;
        *dst = c;

        if (c < 0x80) {

            if (c != '\0') {
                dst++;
                src++;
                len--;

                continue;
            }

            return dst;
        }

        next = src;

        if (ngx_utf8_decode(&next, len) > 0x10ffff) {
            /* 不正な UTF-8 */
            break;
        }

        while (src < next) {
            *dst++ = *src++;
            len--;
        }
    }

    *dst = '\0';

    return dst;
}
```

```c:line-numbers=1448 [原文]
u_char *
ngx_utf8_cpystrn(u_char *dst, u_char *src, size_t n, size_t len)
{
    u_char  c, *next;

    if (n == 0) {
        return dst;
    }

    while (--n) {

        c = *src;
        *dst = c;

        if (c < 0x80) {

            if (c != '\0') {
                dst++;
                src++;
                len--;

                continue;
            }

            return dst;
        }

        next = src;

        if (ngx_utf8_decode(&next, len) > 0x10ffff) {
            /* invalid UTF-8 */
            break;
        }

        while (src < next) {
            *dst++ = *src++;
            len--;
        }
    }

    *dst = '\0';

    return dst;
}
```

:::

## 前提知識

- **UTF-8**: 文字を 1〜4 バイトで表す方式です。英数字（ASCII）は 1 バイトで、値は `0x80` 未満です。日本語の「あ」は `0xE3 0x81 0x82` の 3 バイトです。途中で切ると、壊れた文字（文字化け）になります。
- **C の文字列**: バイトの並びと、終わりを表す 0 です。
- **ポインタ**: `*src` は `src` が指すバイト、`src++` で次のバイトへ進みます。`src < next` のように、同じ配列を指すポインタどうしは大小を比べられます。
- **`--n`**: `n` を 1 減らしてから、その値を使います。`while (--n)` は最大 `n - 1` 回回ります。
- **`ngx_utf8_decode(&next, len)`**: 同じファイルにある関数で、`next` が指す位置から UTF-8 の 1 文字を読み、`next` をその文字の次まで進めます。壊れていれば `0x10ffff` より大きい値を返します。`&next` は「`next` という変数の場所」で、これを渡すことで関数の中から `next` を書き換えてもらえます。
- **`continue` と `break`**: `continue` はループの次の周へ、`break` はループを抜けます。

## 何をしているか

### 1. 大きさ 0 なら何もしない

```c:line-numbers=1453
    if (n == 0) {
        return dst;
    }
```

### 2. ASCII の文字はそのままコピー

```c:line-numbers=1459
        c = *src;
        *dst = c;

        if (c < 0x80) {

            if (c != '\0') {
                dst++;
                src++;
                len--;

                continue;
            }

            return dst;
        }
```

1 バイト読んでとりあえず `dst` に書き（`*dst = c;`）、それが `0x80` 未満（ASCII）なら、0 でなければ進めて次へ、0 なら文字列の終わりなのでその位置を返します。

### 3. マルチバイト文字は、まるごとコピーする

```c:line-numbers=1475
        next = src;

        if (ngx_utf8_decode(&next, len) > 0x10ffff) {
            /* invalid UTF-8 */
            break;
        }

        while (src < next) {
            *dst++ = *src++;
            len--;
        }
```

`0x80` 以上なら、マルチバイト文字の先頭です。`next` に `src` をコピーし、`ngx_utf8_decode` で 1 文字ぶん読みます。読めたら `next` は文字の次を指しているので、`src` から `next` の手前までを全部コピーします。

壊れた文字なら（`if (ngx_utf8_decode(&next, len) > 0x10ffff)`）、そこでループを抜けます。

### 4. 終端の 0 を書く

```c:line-numbers=1488
    *dst = '\0';

    return dst;
```

### n の数え方に注意

`n` はループ 1 周ごとに 1 減ります。マルチバイト文字も 1 周でコピーされるので、`n` は **バイト数ではなく文字数** の上限として働きます。「あいう」（9 バイト）を `n = 3` でコピーすると、2 周して「あい」（6 バイト）と 0 が書かれます。出力先には文字数ぶんより大きなバッファが必要で、autoindex ではファイル名の「バイト数 − 文字数」を見込みに足してバッファを確保しています。一方 `len` は、入力の残りバイト数で、デコードが入力の外を読まないための制限です。

## ここがすごい

- **文字の途中で切らない**: ふつうの `ngx_cpystrn` で日本語のファイル名を切ると、3 バイトの文字の 1 バイト目だけが残ることがあります。ブラウザはこれを壊れた文字として表示します。この関数は 1 文字を「まるごとコピーするか、しないか」にしているので、出力は常に正しい UTF-8 になります。
- **壊れた入力はそこで止める**: ファイル名は UTF-8 とは限らず、別の文字コードのこともあります。壊れた並びを見つけたら、そこから先を出力しません。不正なバイトを HTML にそのまま流さずに済みます。
- **ASCII を速く処理する**: 英数字が大半のファイル名では、`if (c < 0x80)` の比較 1 回でコピーが済みます。デコード関数を呼ぶのは `0x80` 以上のときだけです。
- **終端の 0 を先に書いておく工夫**: `*dst = c;` で `c` をとりあえず書いてしまうので、`c` が 0 のときは、それがそのまま終端になります。0 のための特別な書き込みがいりません。

## まとめ

- UTF-8 の文字列を切り詰めるときは、文字の境目を意識しないと文字化けが起きる。
- ASCII（`0x80` 未満）だけ先に安く処理し、マルチバイトのときだけ本格的に読むと速い。
- 「文字数の上限」と「入力の残りバイト数」を別々に管理すると、出力と入力の両方を守れる。
