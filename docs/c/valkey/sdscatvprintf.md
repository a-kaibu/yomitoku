---
title: "まずスタックの 1KB で試し、足りなければ必要量ぴったりで再挑戦する printf"
description: "printf 形式で整形した文字列を SDS に追記する関数。最初はスタック上の固定バッファを使い、vsnprintf が返す「必要な長さ」を見て、足りないときだけヒープに確保し直す。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2006-2015, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/sds.c
lines: [579, 619]
function: "sdscatvprintf"
difficulty: 2
tags: [文字列処理, メモリ管理, 標準ライブラリ]
---

## ひとことで

`sdscatvprintf` は、`printf` と同じ書式（`"%d+%d = %d"` など）で文字列を作り、SDS 文字列 `s` の後ろに追記する関数です。
整形結果がどれくらいの長さになるかは、実際に整形するまでわかりません。そこでこの関数は、**まず小さな固定バッファで試し、溢れたら必要な大きさで確保し直す** という戦略をとります。

## コード

```c:line-numbers=579
/* Like sdscatprintf() but gets va_list instead of being variadic. */
sds sdscatvprintf(sds s, const char *fmt, va_list ap) {
    va_list copy;
    char staticbuf[1024], *buf = staticbuf, *t;
    size_t buflen = strlen(fmt) * 2;
    int bufstrlen;

    /* We try to start using a static buffer for speed.
     * If not possible we revert to heap allocation. */
    if (buflen > sizeof(staticbuf)) {
        buf = s_malloc(buflen);
        if (buf == NULL) return NULL;
    } else {
        buflen = sizeof(staticbuf);
    }

    /* Alloc enough space for buffer and \0 after failing to
     * fit the string in the current buffer size. */
    while (1) {
        va_copy(copy, ap);
        bufstrlen = vsnprintf(buf, buflen, fmt, copy);
        va_end(copy);
        if (bufstrlen < 0) {
            if (buf != staticbuf) s_free(buf);
            return NULL;
        }
        if (((size_t)bufstrlen) >= buflen) {
            if (buf != staticbuf) s_free(buf);
            buflen = ((size_t)bufstrlen) + 1;
            buf = s_malloc(buflen);
            if (buf == NULL) return NULL;
            continue;
        }
        break;
    }

    /* Finally concat the obtained string to the SDS string and return it. */
    t = sdscatlen(s, buf, bufstrlen);
    if (buf != staticbuf) s_free(buf);
    return t;
}
```

## 前提知識

- **可変長引数と `va_list`**: `printf` のように引数の数が決まっていない関数は、`...` で引数を受け取ります。中身は `va_list` 型の値で順に取り出します。この関数は、すでに `va_list` になった引数 `ap` を受け取る版です（`sdscatprintf` から呼ばれます）。
- **`va_copy` と `va_end`**: `va_list` は一度使うと中身を読み進めてしまい、もう一度使えません。`va_copy(copy, ap)` で複製を作り、それを使い終わったら `va_end(copy)` で後始末します。
- **`vsnprintf(buf, n, fmt, ap)`**: 整形した文字列を最大 `n - 1` 文字まで `buf` に書き、終端を付ける標準関数です。戻り値は **バッファが十分大きかったら書いたはずの文字数** です。だから戻り値が `n` 以上なら「切り詰められた」とわかります。負の値はエラーです。
- **スタックとヒープ**: 関数の中で `char staticbuf[1024]` のように宣言した配列はスタックに置かれ、関数を抜けると自動で消えます。確保も解放もとても速いです。`malloc` で確保するヒープのメモリは、自分で `free` する必要があります。
- **`s_malloc` / `s_free`**: Valkey が使うメモリ確保・解放の関数です。中身は `malloc`/`free` の仲間です。
- **`continue` / `break`**: ループの先頭に戻る / ループを抜ける命令です。

## 何をしているか

### 1. 最初のバッファを選ぶ（582〜593 行目）

書式文字列の長さの 2 倍を、最初の見積もりにします。`"%d+%d = %d"` は 10 文字なので 20 バイトです。
これが 1024 バイト以下なら、スタック上の `staticbuf`（1024 バイト）をそのまま使い、`buflen` を 1024 にします。見積もりが 1024 を超えるような長い書式なら、最初からヒープに確保します。

### 2. 試しに整形する（597〜600 行目）

`va_copy` で引数の複製を作ってから `vsnprintf` を呼びます。ループで何度か呼ぶ可能性があるので、毎回複製を使うのがポイントです。

### 3. 結果を判定する（601〜612 行目）

- 負の値なら整形エラーなので、ヒープを使っていれば解放して `NULL` を返します。
- 戻り値が `buflen` 以上なら、収まりきらなかったということです。たとえば整形結果が 3000 文字なら、`vsnprintf` は 3000 を返します。そこで `buflen = 3001` として **ぴったりの大きさ** を確保し直し、`continue` でもう一度試します。
- 収まっていれば `break` でループを抜けます。

### 4. 追記して後始末（616〜618 行目）

`sdscatlen` で整形結果を `s` の後ろに追加し、ヒープを使った場合だけ解放します。`buf != staticbuf` で、今のバッファがスタックのものかヒープのものかを区別しています。

## ここがすごい

**ほとんどの場合、確保ゼロ**: ログの 1 行やエラーメッセージなど、整形結果は 1KB に収まることがほとんどです。その場合はスタックのバッファだけで済み、`malloc` も `free` も呼ばれません。

**2 回目で必ず成功**: `vsnprintf` の戻り値は「本当に必要な長さ」なので、2 回目はその長さ＋1 を確保すれば必ず収まります。「足りなければ倍にして再挑戦」のように何度もループする必要はなく、`while (1)` のループは実質 2 周で終わります。

**`va_copy` の重要性**: `vsnprintf` に `ap` を直接渡すと、1 回目の呼び出しで引数を読み進めてしまい、2 回目は壊れた引数で整形することになります。毎回複製を作るのは、この落とし穴を避けるための作法です。

**解放の判定が簡潔**: スタックかヒープかを別のフラグで覚えるのではなく、ポインタが `staticbuf` と同じかどうかで判定しています。どの出口でも同じ 1 行で正しく後始末できます。

**同じファイルの別解**: 646 行目以降の `sdscatfmt` は、`%s` や `%i` などに機能を絞った代わりに、libc の `printf` 系を使わずに直接 SDS に書き込む、より速い版です。用途に応じて使い分けられるようになっています。

## まとめ

- 結果の長さが読めないときは、「小さな固定バッファで試し、だめなら必要量で確保」が定石。
- `vsnprintf` の戻り値は「必要だった長さ」なので、再確保の大きさがぴったりわかる。
- `va_list` を複数回使うときは、毎回 `va_copy` で複製する。
- ポインタを比べるだけで、スタックかヒープかを判定して後始末できる。
