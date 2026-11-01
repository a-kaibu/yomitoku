---
title: "「1gb」と「1g」は違う値。設定ファイルのメモリ量をパースする関数"
description: "\"1gb\" や \"100mb\" のようなメモリ量の文字列をバイト数に変換する関数。単位の大文字小文字を無視しつつ、k と kb で 1000 倍と 1024 倍を区別する。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2009-2012, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/util.c
lines: [235, 295]
function: "memtoull"
difficulty: 1
tags: [パース, エラー処理, イディオム]
---

## ひとことで

`memtoull` は、設定ファイルに書かれた `"1gb"` や `"512mb"` のような **メモリの大きさ** を、バイト数の整数に変換する関数です。
`memtoull("1Gb", &err)` は `1073741824`（1024×1024×1024）を返します。
`"1g"` は `1000000000`（10 億）になり、`b` の有無で 1000 倍と 1024 倍を区別しているのが特徴です。

## コード

```c:line-numbers=235
/* Convert a string representing an amount of memory into the number of
 * bytes, so for instance memtoull("1Gb") will return 1073741824 that is
 * (1024*1024*1024).
 *
 * On parsing error, if *err is not NULL, it's set to 1; otherwise, it's
 * set to 0. On error the function return value is 0, regardless of the
 * fact 'err' is NULL or not. */
unsigned long long memtoull(const char *p, int *err) {
    const char *u;
    char buf[128];
    long mul; /* unit multiplier */
    unsigned long long val;
    unsigned int digits;

    if (err) *err = 0;

    /* Search the first non digit character. */
    u = p;
    if (*u == '-') {
        if (err) *err = 1;
        return 0;
    }
    while (*u && isdigit(*u)) u++;
    if (*u == '\0' || !strcasecmp(u, "b")) {
        mul = 1;
    } else if (!strcasecmp(u, "k")) {
        mul = 1000;
    } else if (!strcasecmp(u, "kb")) {
        mul = 1024;
    } else if (!strcasecmp(u, "m")) {
        mul = 1000 * 1000;
    } else if (!strcasecmp(u, "mb")) {
        mul = 1024 * 1024;
    } else if (!strcasecmp(u, "g")) {
        mul = 1000L * 1000 * 1000;
    } else if (!strcasecmp(u, "gb")) {
        mul = 1024L * 1024 * 1024;
    } else {
        if (err) *err = 1;
        return 0;
    }

    /* Copy the digits into a buffer, we'll use strtoll() to convert
     * the digit (without the unit) into a number. */
    digits = u - p;
    if (digits >= sizeof(buf)) {
        if (err) *err = 1;
        return 0;
    }
    memcpy(buf, p, digits);
    buf[digits] = '\0';

    char *endptr;
    errno = 0;
    val = strtoull(buf, &endptr, 10);
    if ((errno == ERANGE) || (val == 0 && errno == EINVAL) || *endptr != '\0') {
        if (err) *err = 1;
        return 0;
    }
    return val * mul;
}
```

## 前提知識

- **`int *err`（出力用の引数）**: C の関数は値を 1 つしか返せないので、「エラーが起きたか」を別に伝えるために、呼び出し元の変数を指すポインタを受け取ります。`*err = 1` と書くと、呼び出し元の変数が 1 になります。`if (err)` で、`NULL`（何も指していない）でないときだけ書き込んでいます。
- **`isdigit(c)`**: 文字 `c` が `'0'`〜`'9'` なら真を返す標準関数です。
- **`strcasecmp(a, b)`**: 大文字小文字を区別せずに 2 つの文字列を比べ、等しければ `0` を返します。`!strcasecmp(u, "kb")` は「`u` が `kb`（`KB` や `Kb` も可）と等しい」という意味になります。
- **`strtoull(buf, &endptr, 10)`**: 文字列を 10 進数として読み、`unsigned long long` を返す標準関数です。読み終えた位置を `endptr` に入れます。範囲外なら `errno` に `ERANGE` が入ります。
- **`errno`**: 標準関数がエラーの種類を書き込む、グローバルな変数です。呼ぶ前に 0 にしておくのが作法です。
- **ポインタの引き算**: `u - p` は、`p` から `u` までの文字数です。
- **`1000L`**: 末尾の `L` は `long` 型の印です。`1000 * 1000 * 1000` は `int` の範囲（約 21 億）に収まりますが、`1024 * 1024 * 1024` と同様に、大きな数の計算で型の範囲を超えないよう `long` にしています。

## 何をしているか

### 1. マイナスを拒否し、数字の終わりを探す（252〜257 行目）

先頭が `'-'` ならエラーです。その後、`u` を数字でない最初の文字まで進めます。`"512mb"` なら `u` は `"mb"` を指します。

### 2. 単位を決める（258〜275 行目）

残りの文字列 `u` を単位の一覧と比べ、倍率 `mul` を決めます。

| 単位 | 倍率 |
| --- | --- |
| なし / `b` | 1 |
| `k` | 1000 |
| `kb` | 1024 |
| `m` | 1000×1000 |
| `mb` | 1024×1024 |
| `g` | 1000×1000×1000 |
| `gb` | 1024×1024×1024 |

`"512mb"` は `mb` に当たるので `mul = 1048576` です。知らない単位（`"5tb"` など）はエラーです。

### 3. 数字部分だけを取り出す（279〜285 行目）

数字の部分は `u - p` 文字（`"512mb"` なら 3 文字）です。128 バイトの `buf` に収まらなければエラー。収まれば `memcpy` でコピーし、終端の `'\0'` を付けて `"512"` という独立した文字列を作ります。

### 4. 数値に変換して掛ける（287〜294 行目）

`strtoull` で `512` を得て、`512 * 1048576 = 536870912` を返します。`strtoull` が範囲外（`ERANGE`）を報告したときや、読み残しがあるとき（`*endptr != '\0'`）はエラーです。

## ここがすごい

**単位の区別が明快**: `k` と `kb` を別の値にするのは、10 進の接頭辞（キロ＝1000）と 2 進の慣習（1024）を両方使えるようにするためです。ユーザーが `maxmemory 1gb` と書けば 2 進、`1g` と書けば 10 進になります。表のように並んだ `if` で、どちらがどの値かが一目でわかります。

**エラーの伝え方**: 戻り値の 0 は「正しく 0 と書かれた」場合にも起こりうるので、0 だけではエラーかどうか区別できません。そこで `err` という出力用の引数を別に用意しています。`err` に `NULL` を渡せば、エラーの詳細を気にしない呼び出しもできます。

**元の文字列を壊さない**: 単位の前で文字列を切るとき、元の文字列に `'\0'` を書き込むのではなく、小さなバッファにコピーしています。引数は `const char *` で、呼び出し元の文字列を書き換えない約束を守るためです。バッファの大きさも先に確認しているので、極端に長い入力でも溢れません。

**掛け算の溢れ**: 294 行目の `val * mul` は、とても大きな値だと 64 ビットを超えて巻き戻ります。この関数はそこまでは検査していないので、設定値として現実的な範囲で使われる前提の関数だと読めます。

## まとめ

- 「数字の終わり」を探してから、前半を数、後半を単位として別々に扱う。
- 戻り値と別に「エラーが起きたか」を返すには、出力用のポインタ引数を使う。
- `const` な文字列は書き換えず、小さなバッファにコピーしてから標準関数に渡す。
- `errno` は呼ぶ前に 0 にし、呼んだ後に確認する。
