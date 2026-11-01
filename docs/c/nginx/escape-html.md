---
title: "「NULL を渡すと長さだけ数える」2 回呼び出し方式の HTML エスケープ"
description: "「<」や「&」を「&lt;」「&amp;」に置き換える関数。出力先に NULL を渡すと書き込まずに増えるバイト数だけを返すので、呼び出し側はぴったりの大きさのメモリを確保してから本番の変換ができる。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_string.c
lines: [1832, 1901]
function: "ngx_escape_html"
difficulty: 1
format: 2
tags: [文字列処理, API設計, セキュリティ, メモリ管理]
---

## ひとことで

`ngx_escape_html` は、HTML の中で特別な意味を持つ 4 つの文字 `<`、`>`、`&`、`"` を、`&lt;`、`&gt;`、`&amp;`、`&quot;` に置き換える関数です。`a<b` は `a&lt;b` になります。
おもしろいのは呼び出し方です。**出力先 `dst` に `NULL` を渡すと、何も書かずに「何バイト増えるか」だけを返し**、本物の出力先を渡すと実際に変換します。nginx のディレクトリ一覧（autoindex）などで、ファイル名を安全に HTML に埋め込むのに使われています。

## コード

```c:line-numbers=1832
uintptr_t
ngx_escape_html(u_char *dst, u_char *src, size_t size)
{
    u_char      ch;
    ngx_uint_t  len;

    if (dst == NULL) {

        len = 0;

        while (size) {
            switch (*src++) {

            case '<':
                len += sizeof("&lt;") - 2;
                break;

            case '>':
                len += sizeof("&gt;") - 2;
                break;

            case '&':
                len += sizeof("&amp;") - 2;
                break;

            case '"':
                len += sizeof("&quot;") - 2;
                break;

            default:
                break;
            }
            size--;
        }

        return (uintptr_t) len;
    }

    while (size) {
        ch = *src++;

        switch (ch) {

        case '<':
            *dst++ = '&'; *dst++ = 'l'; *dst++ = 't'; *dst++ = ';';
            break;

        case '>':
            *dst++ = '&'; *dst++ = 'g'; *dst++ = 't'; *dst++ = ';';
            break;

        case '&':
            *dst++ = '&'; *dst++ = 'a'; *dst++ = 'm'; *dst++ = 'p';
            *dst++ = ';';
            break;

        case '"':
            *dst++ = '&'; *dst++ = 'q'; *dst++ = 'u'; *dst++ = 'o';
            *dst++ = 't'; *dst++ = ';';
            break;

        default:
            *dst++ = ch;
            break;
        }
        size--;
    }

    return (uintptr_t) dst;
}
```

## 前提知識

- **HTML エスケープ**: `<` は HTML ではタグの始まりなので、文字として表示したいときは `&lt;` と書きます。これを怠ると、ファイル名などに紛れ込んだ `<script>` が実行されてしまう（クロスサイトスクリプティング）おそれがあります。
- **`NULL`**: どこも指していないポインタです。ここでは「書き込み先はない」という合図に使っています。
- **`switch` 文**: 値によって処理を分ける構文です。`case '<':` は値が `'<'` のときの処理で、`break` で `switch` を抜けます。どれにも当たらなければ `default` に進みます。
- **`sizeof("&lt;")`**: 文字列リテラルの大きさです。C の文字列は最後に 0 が付くので、`"&lt;"` は 4 文字＋1 で 5 になります。
- **`*dst++ = 'x'`**: `dst` が指す場所に `'x'` を書き、`dst` を次へ進めます。
- **`uintptr_t`**: ポインタと同じ大きさの符号なし整数型です。この関数は、数（増えるバイト数）とポインタ（書き終えた位置）の両方をこの型で返します。

## 何をしているか

### 1. 長さを数えるだけのモード

```c:line-numbers=1838
    if (dst == NULL) {

        len = 0;

        while (size) {
            switch (*src++) {

            case '<':
                len += sizeof("&lt;") - 2;
                break;

            case '>':
                len += sizeof("&gt;") - 2;
                break;

            case '&':
                len += sizeof("&amp;") - 2;
                break;

            case '"':
                len += sizeof("&quot;") - 2;
                break;

            default:
                break;
            }
            size--;
        }

        return (uintptr_t) len;
    }
```

`dst == NULL` なら、入力を 1 文字ずつ見て、置き換えで **増える** バイト数を合計します。
`<` は 1 文字が `&lt;` の 4 文字になるので 3 バイト増えます。`sizeof("&lt;") - 2` は、5（終端の 0 込み）から 0 の 1 と元の 1 文字の 1 を引いて 3 です。同じように `&amp;` は 4、`&quot;` は 5 増えます。

`a<b&c` なら、`<` で 3、`&` で 4、合計 7 を返します。

### 2. 実際に変換するモード

```c:line-numbers=1870
    while (size) {
        ch = *src++;

        switch (ch) {

        case '<':
            *dst++ = '&'; *dst++ = 'l'; *dst++ = 't'; *dst++ = ';';
            break;

        case '>':
            *dst++ = '&'; *dst++ = 'g'; *dst++ = 't'; *dst++ = ';';
            break;

        case '&':
            *dst++ = '&'; *dst++ = 'a'; *dst++ = 'm'; *dst++ = 'p';
            *dst++ = ';';
            break;

        case '"':
            *dst++ = '&'; *dst++ = 'q'; *dst++ = 'u'; *dst++ = 'o';
            *dst++ = 't'; *dst++ = ';';
            break;

        default:
            *dst++ = ch;
            break;
        }
        size--;
    }

    return (uintptr_t) dst;
```

`dst` が本物のバッファなら、1 文字ずつ読み、4 つの特別な文字は置き換えた文字列を、それ以外はそのまま書きます。`*dst++ = '&'; *dst++ = 'l'; *dst++ = 't'; *dst++ = ';';` のように、`&lt;` を 1 文字ずつ書き並べています。
最後に、書き終えた位置を返します。

### 呼び出し側の使い方

autoindex モジュールでは、まず `ngx_escape_html(NULL, uri, len)` で増える量 `escape_html` を求め、`len + escape_html` の大きさでバッファを確保し、次に本物の出力先を渡して変換しています。

## ここがすごい

- **「数える」と「書く」を 1 つの関数に**: エスケープ後の長さは、入力を全部見ないと分かりません。長さ計算と変換を別の関数にすると、「どの文字が何バイトになるか」の知識が 2 か所に分かれ、片方だけ直して食い違う危険があります。1 つの関数の 2 つのモードにしておけば、両者は同じ場所に並んでいて、ずれに気づきやすくなります。
- **ぴったりの大きさでメモリを確保できる**: 先に長さが分かるので、「最悪の場合 6 倍」などと多めに確保する必要がありません。nginx ではメモリプールから必要な量だけ取れるので、ムダがありません。
- **書き込み中に境界チェックがいらない**: 大きさが事前に分かっているので、変換ループの中で「バッファがあふれないか」を毎回確かめなくて済みます。
- **`sizeof` で数を書く**: 増える量を `3` と直接書かず、`sizeof("&lt;") - 2` と書いているので、何の文字列から導いた数なのかがコードから読み取れます。
- **最小限の 4 文字**: 対象は `<`、`>`、`&`、`"` の 4 つだけです。`'`（シングルクォート）は含まれないので、この関数の出力を `'` で囲んだ属性に入れるのは安全ではありません。どこで使うかを決めたうえで、必要な文字だけに絞った関数です。

## まとめ

- 出力の長さが入力しだいで変わる変換は、「`NULL` なら長さだけ返す」2 回呼び出し方式にすると、ぴったりのメモリを確保できる。
- 長さ計算と変換を同じ関数に置くと、2 つが食い違うのを防げる。
- 信用できない文字列を HTML に埋め込むときは、必ずエスケープする。
