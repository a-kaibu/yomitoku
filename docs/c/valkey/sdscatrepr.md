---
title: "印字できない文字だけエスケープし、普通の文字はまとめてコピーする"
description: "バイト列を、改行などの制御文字を \\n や \\x01 にエスケープした引用符つき文字列として追記する関数。エスケープ不要な部分はひと続きでまとめて追記し、コピーの回数を減らす。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2006-2015, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/sds.c
lines: [938, 976]
function: "sdscatrepr"
difficulty: 1
tags: [文字列処理, 最適化, ログ]
---

## ひとことで

`sdscatrepr` は、任意のバイト列 `p` を、人間が読める形にして SDS 文字列 `s` の後ろに追記します。
たとえば `a`・改行・`b` の 3 バイトは、画面上では `"a\nb"`（引用符を含めて 6 文字）と表示されます。改行が `\` と `n` の 2 文字に置き換わるのです。値 1 のバイトは `\x01` になります。
Valkey の CLI やログで、改行やバイナリを含む値を安全に表示するのに使われています。

## コード

```c:line-numbers=938
/* Append to the sds string "s" an escaped string representation where
 * all the non-printable characters (tested with isprint()) are turned into
 * escapes in the form "\n\r\a...." or "\x<hex-number>".
 *
 * After the call, the modified sds string is no longer valid and all the
 * references must be substituted with the new pointer returned by the call. */
sds sdscatrepr(sds s, const char *p, size_t len) {
    s = sdsMakeRoomFor(s, len + 2);
    s = sdscatlen(s, "\"", 1);
    while (len) {
        /* The condition here in combination with the loop inside ensures we're calling sdscatlen only once for an
         * entire string chunk rather than calling it for every character. This reduces the amount of memcpy calls.
         * \ and " are valid isprint characters but we need to handle them in the else block below to escape them. */
        if (isprint(*p) && *p != '\\' && *p != '"') {
            const char *start = p;
            while (len && isprint(*p) && *p != '\\' && *p != '"') {
                len--;
                p++;
            }
            s = sdscatlen(s, start, p - start);
        } else {
            switch (*p) {
            case '\\':
            case '"': s = sdscatprintf(s, "\\%c", *p); break;
            case '\n': s = sdscatlen(s, "\\n", 2); break;
            case '\r': s = sdscatlen(s, "\\r", 2); break;
            case '\t': s = sdscatlen(s, "\\t", 2); break;
            case '\a': s = sdscatlen(s, "\\a", 2); break;
            case '\b': s = sdscatlen(s, "\\b", 2); break;
            default:
                s = sdscatprintf(s, "\\x%02x", (unsigned char)*p);
                break;
            }
            p++;
            len--;
        }
    }
    return sdscatlen(s, "\"", 1);
}
```

## 前提知識

- **`isprint(c)`**: 文字 `c` が「画面に表示できる文字」（空白を含む、英数字や記号）なら真を返す標準関数です。改行やタブ、値 0〜31 の制御文字などは偽になります。
- **エスケープ**: 表示できない文字や特別な意味を持つ文字を、`\n` や `\"` のような別の書き方に置き換えることです。
- **C の文字列の中の `\\`**: C のソースコードで `"\\n"` と書くと、`\` と `n` の 2 文字になります。`"\\"` 1 つで `\` 1 文字です。
- **`switch` と、`case` を並べる書き方**: 960〜961 行目のように `case '\\':` と `case '"':` を続けて書くと、どちらの場合も同じ処理になります。
- **`sdscatlen(s, p, n)` / `sdscatprintf(s, fmt, ...)`**: SDS 文字列に `n` バイトを追記する / printf 形式で整形して追記する関数です。どちらも新しい `s` を返すので、`s = ...` で受け取ります。
- **`%02x`**: printf の書式で、「16 進数 2 桁、足りなければ 0 で埋める」です。値 1 は `01` になります。
- **`(unsigned char)*p`**: `char` は環境によって符号付きのことがあり、値 200 のバイトが負の数になってしまいます。`unsigned char` にしてから渡すと、0〜255 の値として正しく表示されます。

## 何をしているか

`p = "hi\n"`（3 バイト）で追います。

### 1. 先に場所を確保して引用符を書く（945〜946 行目）

`len + 2`（中身と前後の引用符）ぶんの空きを先に確保しておき、`"` を追記します。エスケープでそれより長くなっても、後の追記で自動的に広がります。

### 2. 表示できる文字はまとめて追記（951〜957 行目）

`'h'` は表示できて、`\` でも `"` でもないので、この分岐に入ります。953 行目のループで、条件を満たす文字が続く限り `p` を進めます。`'h'`、`'i'` と進み、`'\n'` で止まります。
そして `start` から `p` までの 2 文字 `"hi"` を **1 回の `sdscatlen`** で追記します。

### 3. 特別な文字は 1 文字ずつ変換（958〜973 行目）

`'\n'` は表示できないので、`switch` に入ります。`case '\n'` で `\n` の 2 文字を追記し、1 文字進めます。

- `\` と `"` は表示できる文字ですが、エスケープしないと引用符の範囲がわからなくなるので、`\\` と `\"` にします。
- `\r`、`\t`、`\a`、`\b` は決まった 2 文字に。
- それ以外の表示できない文字は `\x01` のように 16 進数 2 桁にします。

### 4. 閉じ引用符（975 行目）

最後に `"` を追記します。結果は `"hi\n"`（引用符も含めて 6 文字）です。

## ここがすごい

**ひと続きをまとめて追記する**: コメントにあるとおり、素直に 1 文字ずつ `sdscatlen` を呼ぶと、ふつうの文字ばかりの長い文字列でも 1 文字ごとにコピー処理が走ります。この関数は、エスケープ不要な部分をひと続きの「かたまり」として扱い、1 回の呼び出しで追記します。たいていの値は大半がふつうの文字なので、呼び出し回数が大きく減ります。

**同じ条件を 2 回書く理由**: 951 行目の `if` と 953 行目の `while` には同じ条件が書かれています。`if` で「かたまりの始まりか」を判定し、`while` で「どこまで続くか」を調べているのです。こうすると、どちらの分岐でも最低 1 文字は進むので、ループが止まる心配がありません。

**元に戻せる表現**: 出力は、Valkey の `sdssplitargs`（設定ファイルやコマンドの引数を分解する関数）が読み戻せる形になっています。`\` と `"` もエスケープするので、表示した文字列を貼り付ければ元のバイト列を再現できます。

**よく使う変換は固定の文字列**: `\n` などは `sdscatprintf` を使わず、固定の 2 文字を `sdscatlen` で追記しています。printf の書式解析は比較的重いので、本当に必要な 16 進表記と `\`・`"` のときだけ使っています。

## まとめ

- エスケープ処理は、「そのままでよい部分」をまとめてコピーすると速い。
- 引用符で囲む形式では、引用符そのものとエスケープ文字 `\` もエスケープが必要。
- 表示できない文字は `\xHH` の 16 進表記にすると、どんなバイトでも表せる。
- `char` を数として表示するときは `unsigned char` にキャストして符号の問題を避ける。
