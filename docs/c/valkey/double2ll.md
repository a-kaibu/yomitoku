---
title: "小数を整数にしても情報が消えないか、2 回の型変換で確かめる"
description: "double の値が long long に正確に変換できるかを判定する関数。範囲を先に絞り、整数に変換した値と元の値を比べることで、小数部が 0 であることを確認する。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2009-2012, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/util.c
lines: [784, 811]
function: "double2ll"
difficulty: 2
tags: [数値計算, 移植性, 防御的プログラミング]
---

## ひとことで

`double2ll` は、浮動小数点数（`double`）が **整数として正確に表せるか** を調べ、表せるならその整数を `*out` に書いて 1 を返します。
`3.0` なら 1 を返して `*out = 3`、`3.5` なら 0 を返します。
Valkey はこれを使い、整数で済む値は整数として扱って、文字列化や保存を効率よくしています。

## コード

```c:line-numbers=784
/* Returns 1 if the double value can safely be represented in long long without
 * precision loss, in which case the corresponding long long is stored in the out variable. */
int double2ll(double d, long long *out) {
#if (DBL_MANT_DIG >= 52) && (DBL_MANT_DIG <= 63) && (LLONG_MAX == 0x7fffffffffffffffLL)
    /* Check if the float is in a safe range to be casted into a
     * long long. We are assuming that long long is 64 bit here.
     * Also we are assuming that there are no implementations around where
     * double has precision < 52 bit.
     *
     * Under this assumptions we test if a double is inside a range
     * where casting to long long is safe. Then using two castings we
     * make sure the decimal part is zero. If all this is true we can use
     * integer without precision loss.
     *
     * Note that numbers above 2^52 and below 2^63 use all the fraction bits as real part,
     * and the exponent bits are positive, which means the "decimal" part must be 0.
     * i.e. all double values in that range are representable as a long without precision loss,
     * but not all long values in that range can be represented as a double.
     * we only care about the first part here. */
    if (d < (double)(-LLONG_MAX / 2) || d > (double)(LLONG_MAX / 2)) return 0;
    long long ll = d;
    if (ll == d) {
        *out = ll;
        return 1;
    }
#endif
    return 0;
}
```

## 前提知識

- **`double`**: 小数を表す 64 ビットの浮動小数点数型です。中身は「符号 1 ビット・指数 11 ビット・仮数 52 ビット」で、有効数字は 2 進数で 53 桁ぶんです。
- **`long long`**: 64 ビットの符号付き整数です。範囲は約 ±922 京（±2^63）です。
- **暗黙の型変換**: `long long ll = d;` のように、`double` を整数の変数に代入すると、小数部が切り捨てられます。ただし、元の値が整数の範囲を超えていると **未定義動作** になります（何が起きるか保証されない）。
- **比較時の変換**: `ll == d` では、`ll` が `double` に変換されてから比べられます。
- **`#if`**: コンパイル前に条件を判定し、条件が偽ならその間のコードをまるごと捨てる仕組みです。`DBL_MANT_DIG`（`double` の仮数の桁数）や `LLONG_MAX` は `<float.h>`・`<limits.h>` の定数です。
- **`long long *out`**: 結果を書き込む先を指すポインタです。`*out = ll` で呼び出し元の変数に値が入ります。

## 何をしているか

### 1. 前提を確かめる（787 行目）

`#if` で「`double` の仮数が 52〜63 ビット」「`long long` が 64 ビット」という前提が成り立つ環境でだけ、判定のコードを有効にします。前提が成り立たない珍しい環境では、810 行目の `return 0` だけが残り、「常に変換しない」という安全側の動きになります。

### 2. 範囲を絞る（803 行目）

`d` が `-LLONG_MAX/2` 〜 `LLONG_MAX/2`（約 ±461 京）の外なら、即座に 0 を返します。この範囲の中なら、804 行目の代入が未定義動作になる心配がありません。

なぜ `LLONG_MAX` ちょうどではなく半分なのでしょうか。`LLONG_MAX`（2^63 - 1）は `double` では正確に表せず、`(double)LLONG_MAX` は丸められて 2^63 になります。2^63 は `long long` の範囲外なので、境界ぎりぎりで比べると危ういのです。半分にすれば、境界の丸めの影響を受けずに済みます。

### 3. 2 回の変換で小数部を確かめる（804〜808 行目）

`d = 3.5` なら、`ll = 3`（切り捨て）。`ll == d` は `3.0 == 3.5` で偽なので、0 を返します。
`d = 3.0` なら、`ll = 3`。`3.0 == 3.0` で真なので、`*out = 3` として 1 を返します。

「整数にしてから戻して比べる」ことで、小数部が 0 かどうかを調べているわけです。

## ここがすごい

**未定義動作を先回りして避ける**: `long long ll = d;` を最初に書いてしまうと、`d = 1e30` のような巨大な値で未定義動作になります。範囲チェックを **先に** 置くことで、変換そのものを安全にしています。

**往復の比較という簡潔な判定**: 小数部が 0 かどうかを調べるのに、`modf` や `floor` などの数学関数を使わず、型変換 2 回と比較 1 回で済ませています。範囲内であれば、切り捨てた整数を `double` に戻したときに誤差が出ないことも重要です。コメントにあるように、2^52 以上の `double` はすべて整数値（小数部を持てない）なので、この範囲では比較が正しく働きます。

**前提を `#if` で明示する**: 「`double` は 52 ビット以上の精度がある」「`long long` は 64 ビット」という暗黙の前提をコードに書き、成り立たない環境では機能を無効にしています。めったに出会わない環境でも、間違った答えを返すより「変換しない」を選ぶ、安全側への倒し方です。

**トレードオフ**: 範囲を半分にしたぶん、`LLONG_MAX/2` を超える大きな整数値の `double` は「変換できない」と判定されます。正確さと安全のために、ごく一部の値をあきらめているわけです。

## まとめ

- `double` を整数に代入するとき、範囲外の値は未定義動作になるので先に範囲を確かめる。
- 「整数にして戻して比べる」と、小数部が 0 かを簡単に判定できる。
- `(double)LLONG_MAX` は丸められて範囲外になるので、境界には余裕を持たせる。
- 環境についての前提は `#if` で明示し、外れたら安全側の動作にする。
