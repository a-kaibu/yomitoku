---
title: "「最小の負の数」だけは符号を反転できない、という落とし穴の避け方"
description: "符号付き 64 ビット整数を文字列にする関数。マイナス記号を先に書いて符号なしの変換に任せる。そのとき LLONG_MIN だけは特別扱いが必要になる。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2009-2012, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/util.c
lines: [357, 390]
function: "ll2string"
difficulty: 2
tags: [数値計算, 文字列処理, 防御的プログラミング]
---

## ひとことで

`ll2string` は、`long long`（符号付き 64 ビット整数）を 10 進文字列に変換します。`-42` なら `"-42"` を書いて `3` を返します。
仕事の大半は符号なし版の `ull2string` に任せ、この関数は **マイナス記号の処理だけ** を担当します。
その中で、`-9223372036854775808`（`LLONG_MIN`）という 1 つの値だけを特別に扱っているのが読みどころです。

## コード

```c:line-numbers=357
/* Convert a long long into a string. Returns the number of
 * characters needed to represent the number.
 * If the buffer is not big enough to store the string, 0 is returned. */
int ll2string(char *dst, size_t dstlen, long long svalue) {
    unsigned long long value;
    int negative = 0;

    /* The ull2string function with 64bit unsigned integers for simplicity, so
     * we convert the number here and remember if it is negative. */
    if (svalue < 0) {
        if (svalue != LLONG_MIN) {
            value = -svalue;
        } else {
            value = ((unsigned long long)LLONG_MAX) + 1;
        }
        if (dstlen < 2) goto err;
        negative = 1;
        dst[0] = '-';
        dst++;
        dstlen--;
    } else {
        value = svalue;
    }

    /* Converts the unsigned long long value to string*/
    int length = ull2string(dst, dstlen, value);
    if (length == 0) return 0;
    return length + negative;

err:
    /* force add Null termination */
    if (dstlen > 0) dst[0] = '\0';
    return 0;
}
```

## 前提知識

- **`long long` と `unsigned long long`**: どちらも 64 ビットの整数型です。符号付きの `long long` は約 -922 京〜+922 京、符号なしの `unsigned long long` は 0〜約 1844 京を表せます。
- **2 の補数**: ほとんどのコンピュータは負の数を「2 の補数」という方式で表します。この方式では、符号付き 64 ビットの範囲は **-2^63 〜 2^63-1** で、負の側が 1 つだけ多くなります。だから最小値 `LLONG_MIN`（-2^63）の符号を反転した +2^63 は、`long long` では表せません。
- **符号付き整数のオーバーフローは未定義動作**: C では、符号付き整数の計算結果が範囲外になると「未定義動作」（何が起きても文句を言えない状態）になります。`-LLONG_MIN` はまさにこれです。
- **`LLONG_MAX` / `LLONG_MIN`**: `<limits.h>` で定義された、`long long` の最大値と最小値です。
- **ポインタを進める `dst++`**: `dst` が指す位置を 1 文字分うしろにずらします。先頭に `'-'` を書いたあと、続きを書く場所を変えるのに使います。
- **`goto err`**: 386 行目のラベル `err:` へジャンプします。失敗時の後始末を 1 か所にまとめる C のイディオムです。

## 何をしているか

### 1. 負の数を正の数にする（366〜371 行目）

`svalue = -42` なら `svalue != LLONG_MIN` なので、368 行目で `value = -svalue` = `42` にします。`value` は符号なし型なので、正の値として保存されます。

`svalue = LLONG_MIN` のときは `-svalue` を計算できない（オーバーフローする）ので、370 行目で `LLONG_MAX + 1` を **符号なし型で** 計算します。`LLONG_MAX` を `unsigned long long` にキャスト（型変換）してから 1 を足すので、符号なしの範囲内で正しく `9223372036854775808` が得られます。

### 2. マイナス記号を書く（372〜376 行目)

`'-'` と少なくとも 1 桁の数字が入るよう、`dstlen < 2` ならエラーにします。足りれば `dst[0] = '-'` と書き、`dst` を 1 つ進め、残りの大きさ `dstlen` を 1 減らします。こうすると、後で呼ぶ `ull2string` からは「マイナス記号の後ろの領域」がふつうのバッファに見えます。

### 3. 残りは符号なし版に任せる（382〜384 行目）

`ull2string(dst, dstlen, 42)` が `"42"` を書いて `2` を返すので、`negative` の `1` を足して `3` を返します。`ull2string` が失敗（0）したら、そのまま 0 を返します。

### 4. エラー時（386〜389 行目）

`dstlen > 0` なら先頭に `'\0'` を書いて空文字列にしてから 0 を返します。

## ここがすごい

**落とし穴を正面から扱っている**: 「負なら符号を反転してから変換」という素直な発想は、`LLONG_MIN` 1 つで壊れます。`-LLONG_MIN` は未定義動作で、多くの環境では値が `LLONG_MIN` のまま戻り、負の数として処理されて誤った結果になりかねません。このコードは、その 1 つだけを `LLONG_MAX + 1` を符号なしで計算する形に置き換えています。同じ工夫は直前の `sdigits10`（350 行目）にも出てきます。

**仕事の分担**: 数字を並べる難しい部分（2 桁ずつの表引きなど）は `ull2string` に 1 つだけ書き、この関数は符号の処理に専念しています。ポインタと残りサイズを 1 つずらすだけで、同じ関数をそのまま再利用できるのが C らしいところです。

**戻り値の約束を守る**: 成功なら書いた文字数、失敗なら 0、と呼び出し側にとって判断しやすい約束になっています。失敗時にも文字列を空にしておくので、戻り値を見忘れても壊れた文字列を読む心配が減ります。

## まとめ

- 2 の補数では、最小の負の数だけは符号を反転できない（`-LLONG_MIN` は範囲外）。
- 符号付きのオーバーフローは未定義動作なので、符号なし型で計算して回避する。
- 先頭に `'-'` を書いてポインタをずらせば、残りは符号なしの関数に任せられる。
- 境界の値（最小値・最大値・0）は、整数を扱う関数のテストで必ず確かめたい。
