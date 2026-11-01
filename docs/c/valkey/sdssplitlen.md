---
title: "複数文字の区切りにも対応した split と、失敗時に全部片付ける goto"
description: "文字列を区切り文字列で分割し、SDS 文字列の配列を返す関数。結果の配列を倍々で広げつつ、途中でメモリ確保に失敗したらそれまでに作ったものをすべて解放する。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2006-2015, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/sds.c
lines: [884, 929]
function: "sdssplitlen"
difficulty: 2
tags: [文字列処理, メモリ管理, エラー処理]
---

## ひとことで

`sdssplitlen` は、文字列 `s` を区切り `sep` で分割して、SDS 文字列の配列を返します。分割した個数は `*count` に入ります。
コメントの例のように、`"foo_-_bar"` を `"_-_"` で分けると、`"foo"` と `"bar"` の 2 つになります。区切りは 1 文字でも複数文字でもかまいません。
どこかでメモリが足りなくなったら、作りかけのものをすべて解放して `NULL` を返します。

## コード

```c:line-numbers=884
sds *sdssplitlen(const char *s, ssize_t len, const char *sep, int seplen, int *count) {
    int elements = 0, slots = 5;
    long start = 0, j;
    sds *tokens;

    if (seplen < 1 || len <= 0) {
        *count = 0;
        return NULL;
    }
    tokens = s_malloc(sizeof(sds) * slots);
    if (tokens == NULL) return NULL;

    for (j = 0; j < (len - (seplen - 1)); j++) {
        /* make sure there is room for the next element and the final one */
        if (slots < elements + 2) {
            sds *newtokens;

            slots *= 2;
            newtokens = s_realloc(tokens, sizeof(sds) * slots);
            if (newtokens == NULL) goto cleanup;
            tokens = newtokens;
        }
        /* search the separator */
        if ((seplen == 1 && *(s + j) == sep[0]) || (memcmp(s + j, sep, seplen) == 0)) {
            tokens[elements] = sdsnewlen(s + start, j - start);
            if (tokens[elements] == NULL) goto cleanup;
            elements++;
            start = j + seplen;
            j = j + seplen - 1; /* skip the separator */
        }
    }
    /* Add the final element. We are sure there is room in the tokens array. */
    tokens[elements] = sdsnewlen(s + start, len - start);
    if (tokens[elements] == NULL) goto cleanup;
    elements++;
    *count = elements;
    return tokens;

cleanup: {
    int i;
    for (i = 0; i < elements; i++) sdsfree(tokens[i]);
    s_free(tokens);
    *count = 0;
    return NULL;
}
}
```

## 前提知識

- **`sds *`（ポインタの配列）**: `sds` は文字列を指すポインタなので、`sds *tokens` は「文字列ポインタの配列」の先頭を指します。`tokens[0]`、`tokens[1]` で各要素を読めます。
- **`s_malloc` / `s_realloc` / `s_free`**: メモリの確保・大きさの変更・解放です。`realloc` は失敗すると `NULL` を返し、元のメモリはそのまま残ります。
- **`int *count`（出力用の引数）**: 個数を呼び出し元に返すためのポインタです。`*count = elements` で呼び出し元の変数に書き込みます。
- **`memcmp(a, b, n)`**: `n` バイトを比べ、同じなら 0 を返します。
- **`goto cleanup`**: 922 行目のラベル `cleanup:` へジャンプします。C には例外がないので、エラー時の後始末を 1 か所にまとめる定番の方法です。
- **`||` の短絡評価**: `A || B` は、`A` が真なら `B` を評価しません。907 行目で使われています。
- **`sdsnewlen(p, n)`**: 位置 `p` から `n` バイトをコピーした新しい SDS 文字列を作ります。

## 何をしているか

### 1. 入力の確認と初期化（889〜894 行目）

区切りが空、または文字列が空なら、`count = 0` で `NULL` を返します。結果の配列は、まず 5 個分（`slots = 5`）確保します。

### 2. 1 文字ずつ区切りを探す（896〜914 行目）

`s = "a,b,c"`（長さ 5）、`sep = ","` で追います。ループは `j = 0` から `len - (seplen - 1) - 1` まで、つまり区切りがまるごと収まる位置までです。

- `j = 1` で `','` を見つけ、`s + 0` から 1 文字の `"a"` を作って `tokens[0]` に入れます。`start = 2` にし、`j` を区切りの最後に合わせます（`j = 1 + 1 - 1 = 1`、次の周で 2 になる）。
- `j = 3` で `','` を見つけ、`"b"` を作って `tokens[1]` に。`start = 4`。

907 行目では、区切りが 1 文字なら単純な比較、そうでなければ `memcmp` を使います。

### 3. 配列を広げる（898〜905 行目）

要素を入れる前に、「次の要素と、最後に必ず追加する 1 個」の 2 つ分の空きがあるかを確かめます。足りなければ `slots` を 2 倍にして `realloc` します。広げるのに失敗したら `cleanup` へ。

### 4. 最後の要素（916〜920 行目）

ループが終わったら、最後の区切りの後ろ（`start` から末尾まで）を最後の要素にします。今の例なら `"c"` です。898 行目で「+2」と余裕を見ておいたので、ここで配列を広げる必要はありません。

### 5. 失敗時の後始末（922〜928 行目）

それまでに作った `elements` 個の文字列を `sdsfree` で 1 つずつ解放し、配列自体も解放して `NULL` を返します。

## ここがすごい

**作りかけを残さない**: メモリ確保は 3 か所（配列の拡張、途中の要素、最後の要素）で失敗しうるのに、`goto cleanup` で後始末を 1 か所にまとめています。どこで失敗しても、呼び出し側には「全部成功」か「何も残っていない」のどちらかしか見えません。メモリリーク（解放し忘れ）を防ぐ、C の典型的なエラー処理です。

**realloc の失敗に正しく備える**: 902 行目で結果を `newtokens` という別の変数に受け取っています。`tokens = s_realloc(tokens, ...)` と直接書くと、失敗したときに `tokens` が `NULL` で上書きされ、元の配列を解放できなくなります。

**最後の 1 個ぶんを先に確保**: 「+2」の空きを保つことで、ループの外の最後の要素で配列の拡張を気にしなくて済みます。境界の処理を単純にする小さな工夫です。

**区切りをまたいで飛ばす**: 区切りを見つけたら、`j` を区切りの長さぶん進めます。こうしないと、`"aaa"` を `"aa"` で分けるときに、区切りが重なって二重に見つかってしまいます。

**バイナリセーフ**: 長さを引数でもらい、`memcmp` で比べるので、途中に 0 のバイトを含むデータでも分割できます。

## まとめ

- 結果の配列は倍々で広げると、要素が増えても確保の回数が少なくて済む。
- `realloc` の戻り値は別の変数で受け、失敗時に元のポインタを失わないようにする。
- エラー時の後始末は `goto` で 1 か所にまとめると、確保が何か所あっても漏れなく解放できる。
- 区切りを見つけたら区切りの長さぶん進めて、重複検出を防ぐ。
