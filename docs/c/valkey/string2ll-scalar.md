---
title: "「戻して同じ文字列になるか」まで保証する厳格な文字列→整数変換"
description: "文字列を 64 ビット整数に変換する関数。先頭の 0 や空白を許さず、一桁ごとにオーバーフローを検査することで、変換結果を文字列に戻しても元と一致することを保証する。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2009-2012, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/util.c
lines: [575, 639]
function: "string2llScalar"
difficulty: 2
tags: [パース, 数値計算, 防御的プログラミング]
---

## ひとことで

`string2llScalar` は、`"123"` や `"-45"` のような文字列を `long long`（64 ビット整数）に変換し、成功したら 1、失敗したら 0 を返します。
標準の `strtoll` より **ずっと厳しい** のが特徴で、`"007"`、`" 12"`、`"12abc"`、`"+5"` はすべて失敗になります。
Valkey はこの関数で「この文字列は整数として保存しても情報を失わないか」を判定し、メモリを節約するために使っています。

## コード

```c:line-numbers=575
static int string2llScalar(const char *s, size_t slen, long long *value) {
    const char *p = s;
    size_t plen = 0;
    int negative = 0;
    unsigned long long v;

    /* A string of zero length or excessive length is not a valid number. */
    if (plen == slen || slen >= LONG_STR_SIZE) return 0;

    /* Special case: first and only digit is 0. Also handle single-digit 1-9 here. */
    if (slen == 1 && p[0] >= '0' && p[0] <= '9') {
        if (value != NULL) *value = p[0] - '0';
        return 1;
    }

    /* Handle negative numbers: just set a flag and continue like if it
     * was a positive number. Later convert into negative. */
    if (p[0] == '-') {
        negative = 1;
        p++;
        plen++;

        /* Abort on only a negative sign. */
        if (plen == slen) return 0;
    }

    /* First digit should be 1-9; otherwise, the string should just be 0. */
    if (p[0] >= '1' && p[0] <= '9') {
        v = p[0] - '0';
        p++;
        plen++;
    } else {
        return 0;
    }

    /* Parse all the other digits, checking for overflow at every step. */
    while (plen < slen && p[0] >= '0' && p[0] <= '9') {
        if (v > (ULLONG_MAX / 10)) /* Overflow. */
            return 0;
        v *= 10;

        if (v > (ULLONG_MAX - (p[0] - '0'))) /* Overflow. */
            return 0;
        v += p[0] - '0';

        p++;
        plen++;
    }

    /* Return if not all bytes were used. */
    if (plen < slen) return 0;

    /* Convert to negative if needed, and do the final overflow check when
     * converting from unsigned long long to long long. */
    if (negative) {
        if (v > ((unsigned long long)(-(LLONG_MIN + 1)) + 1)) /* Overflow. */
            return 0;
        if (value != NULL) *value = -v;
    } else {
        if (v > LLONG_MAX) /* Overflow. */
            return 0;
        if (value != NULL) *value = v;
    }
    return 1;
}
```

## 前提知識

- **`const char *s` と `size_t slen`**: 文字列の先頭を指すポインタと、その長さです。Valkey の文字列は途中に `'\0'` を含むこともあるので、長さを別にもらいます。
- **`p[0]`**: ポインタ `p` が指す位置の文字です。`p++` で次の文字へ進みます。
- **文字から数への変換**: `'7' - '0'` は `7` です。文字コードでは `'0'`〜`'9'` が連続して並んでいるからです。
- **`unsigned long long`**: 符号なし 64 ビット整数で、最大値は `ULLONG_MAX`（約 1844 京）。符号付きの最大値 `LLONG_MAX`（約 922 京）の約 2 倍です。
- **`long long *value` と `NULL`**: 結果を書き込む場所を指すポインタです。`*value = ...` で呼び出し元の変数に値を入れます。`NULL`（何も指さないポインタ）が渡されたら、「変換できるかだけ知りたい」という意味なので書き込みません。
- **オーバーフロー**: 計算結果が型の最大値を超えることです。符号なし整数では値が 0 側に巻き戻ってしまうので、超える前に検出する必要があります。

## 何をしているか

### 1. 長さのチェックと 1 文字の特例（582〜588 行目）

空文字列、または `LONG_STR_SIZE`（64 ビット整数の最長の文字列表現に終端を足した長さ）以上の長さは即座に失敗です。
1 文字で `'0'`〜`'9'` なら、その数字をそのまま返します。`"0"` を通す唯一の道がここです。

### 2. マイナス記号（592〜599 行目）

先頭が `'-'` なら `negative = 1` にして 1 文字進めます。`"-"` だけなら失敗です。

### 3. 最初の数字は 1〜9 だけ（602〜608 行目）

ここで `'0'` を拒否するので、`"007"` や `"-0"` は失敗します。`"0"` は 1 文字の特例で処理済みなので問題ありません。

### 4. 残りの桁（611〜622 行目）

`"-123"` なら、`v = 1` から始まり、`v = 1*10 + 2 = 12`、`v = 12*10 + 3 = 123` と進みます。
各段階で、**掛ける前に** `v > ULLONG_MAX / 10` を、**足す前に** `v > ULLONG_MAX - 数字` を確かめます。超えそうならその場で失敗です。

### 5. 余りがないか確認し、符号を付ける（625〜637 行目）

数字以外の文字で止まっていたら `plen < slen` なので失敗です（`"12abc"` など）。
負の数のときは、`v` が `-(LLONG_MIN + 1) + 1`、つまり `2^63` 以下かを確かめます。`LLONG_MIN` の絶対値は `long long` では表せないので、`LLONG_MIN + 1` を反転してから符号なしで 1 を足す、という回り道で上限を作っています。正の数なら `LLONG_MAX` 以下かを確かめます。

## ここがすごい

**「往復できる」ことを保証**: コメントにあるように、この関数が成功した文字列は、整数にしてから文字列に戻すと **元とまったく同じ** になります。`"007"` を 7 にしたら `"7"` に戻ってしまい、ユーザーが保存した値が変わってしまいます。だから先頭の 0、`+` 記号、空白をすべて拒否しているのです。Valkey はこの性質を利用して、数字の文字列を整数のまま保存し、メモリを節約しています。

**符号なしで計算して最後に符号を付ける**: 計算中は符号なし整数で絶対値を組み立て、最後に範囲を確かめてから符号を付けます。符号付きのまま計算すると、オーバーフローが未定義動作になる危険がありますが、符号なしの範囲（約 1844 京）で検査すれば安全に判定できます。

**溢れる前に判定する**: `v * 10` を計算してから「大きすぎるか」を調べても、溢れた後の値は巻き戻っていて判定できません。「掛ける前に `ULLONG_MAX / 10` と比べる」のが、オーバーフロー検査の定番の書き方です。

**SIMD 版の基準**: 同じファイルには AVX-512 命令を使う高速版もあり、CPU が対応していればそちらが選ばれます（641〜666 行目）。このスカラー版は、どの環境でも動く基準の実装です。

## まとめ

- 「変換できるか」だけでなく「元に戻せるか」を基準にすると、先頭の 0 や `+` も拒否すべきとわかる。
- オーバーフローは、計算する **前に** 上限との比較で検出する。
- 符号なしで絶対値を作り、最後に符号付きの範囲を確かめると安全。
- `LLONG_MIN` の絶対値は `long long` で表せないので、計算の仕方に工夫がいる。
