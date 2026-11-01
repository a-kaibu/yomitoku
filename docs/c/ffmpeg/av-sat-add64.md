---
title: "あふれたら最大値で止める 64 ビット足し算と、符号ビットだけの判定"
description: "64 ビット整数を足して、あふれたら INT64_MAX か INT64_MIN で止める飽和加算。コンパイラ組み込み関数が使えればそれを、なければ XOR で符号を比べてあふれを検出する。"
language: c
project: FFmpeg
repo: https://github.com/FFmpeg/FFmpeg
license: LGPL-2.1-or-later
copyright: "copyright (c) 2006 Michael Niedermayer <michaelni@gmx.at>"
commit: "a88838af482100fa22dd22c94be592c35642de46"
file: libavutil/common.h
lines: [348, 365]
function: "av_sat_add64_c"
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, 移植性, 防御的プログラミング]
---

## ひとことで

`av_sat_add64_c(a, b)` は 64 ビット整数 `a + b` を計算し、結果が表せる範囲を超えたら **最大値（`INT64_MAX`）または最小値（`INT64_MIN`）で止める** 関数です。これを飽和加算（saturating add）と呼びます。
たとえば `INT64_MAX + 1` は普通なら最小値側に回り込みますが、この関数は `INT64_MAX` を返します。
タイムスタンプのような大きな数を足すときに、あふれて符号が反転する事故を防ぎます。

## コード

::: code-group

```c:line-numbers=348 [日本語訳]
/**
 * 符号付き 64 ビット値 2 つを飽和つきで足す。
 *
 * @param  a 1 つ目の値
 * @param  b もう 1 つの値
 * @return 符号付き飽和つきの和
 */
static av_always_inline int64_t av_sat_add64_c(int64_t a, int64_t b) {
#if (!defined(__INTEL_COMPILER) && AV_GCC_VERSION_AT_LEAST(5,1)) || AV_HAS_BUILTIN(__builtin_add_overflow)
    int64_t tmp;
    return !__builtin_add_overflow(a, b, &tmp) ? tmp : (tmp < 0 ? INT64_MAX : INT64_MIN);
#else
    int64_t s = a+(uint64_t)b;
    if ((int64_t)(a^b | ~s^b) >= 0)
        return INT64_MAX ^ (b >> 63);
    return s;
#endif
}
```

```c:line-numbers=348 [原文]
/**
 * Add two signed 64-bit values with saturation.
 *
 * @param  a one value
 * @param  b another value
 * @return sum with signed saturation
 */
static av_always_inline int64_t av_sat_add64_c(int64_t a, int64_t b) {
#if (!defined(__INTEL_COMPILER) && AV_GCC_VERSION_AT_LEAST(5,1)) || AV_HAS_BUILTIN(__builtin_add_overflow)
    int64_t tmp;
    return !__builtin_add_overflow(a, b, &tmp) ? tmp : (tmp < 0 ? INT64_MAX : INT64_MIN);
#else
    int64_t s = a+(uint64_t)b;
    if ((int64_t)(a^b | ~s^b) >= 0)
        return INT64_MAX ^ (b >> 63);
    return s;
#endif
}
```

:::

## 前提知識

- **`int64_t` / `uint64_t`**: それぞれ符号付き・符号なしの 64 ビット整数です。`INT64_MAX` は 2^63−1、`INT64_MIN` は −2^63 です。
- **オーバーフロー**: 結果が型の範囲を超えることです。C では **符号付き整数のオーバーフローは未定義動作**（何が起きても文句を言えない）ですが、符号なし整数は 2^64 で割った余りに回り込むと決まっています。
- **`#if` / `#else` / `#endif`**: コンパイル前に、条件によってコードの片方だけを残す仕組みです。ここでは「コンパイラが組み込み関数を持っているか」で実装を切り替えています。
- **`__builtin_add_overflow(a, b, &tmp)`**: GCC や Clang の組み込み関数です。`a + b` を計算して回り込んだ結果を `tmp` に書き、あふれたかどうかを真偽で返します。`&tmp` は「変数 `tmp` の場所（アドレス）」で、関数がそこに書き込めるようにする書き方です。
- **三項演算子 `x ? y : z`**: `x` が真なら `y`、偽なら `z` になる式です。
- **XOR `^` と `~`、`|`**: XOR は桁ごとに「違えば 1」、`~` は全ビット反転、`|` は OR です。最上位ビット（符号ビット）だけに注目すると、`a ^ b` の符号ビットは「a と b の符号が違うか」を表します。
- **`>> 63`**: 符号付き 64 ビット値を 63 桁右シフトすると、負なら全ビット 1 の `-1`、0 以上なら `0` になります。

## 何をしているか

### 1. 組み込み関数がある場合

```c:line-numbers=356
#if (!defined(__INTEL_COMPILER) && AV_GCC_VERSION_AT_LEAST(5,1)) || AV_HAS_BUILTIN(__builtin_add_overflow)
    int64_t tmp;
    return !__builtin_add_overflow(a, b, &tmp) ? tmp : (tmp < 0 ? INT64_MAX : INT64_MIN);
```

`#if` の条件は「Intel コンパイラ以外の GCC 5.1 以降」か「`__builtin_add_overflow` を持つコンパイラ」です。
あふれなければ `tmp` をそのまま返します。あふれたときは、回り込んだ `tmp` の符号を見ます。
正の数どうしがあふれると結果は負に回り込むので、`tmp < 0` なら上に外れた、つまり `INT64_MAX` を返します。逆なら `INT64_MIN` です。

### 2. 組み込み関数がない場合: 符号なしで足す

```c:line-numbers=360
    int64_t s = a+(uint64_t)b;
```

`int64_t s = a+(uint64_t)b;` は、`b` を符号なしにしてから足しています。符号なしの足し算は回り込みが定義されているので、未定義動作を避けて「回り込んだ結果」を安全に得られます。

### 3. 符号ビットであふれを判定する

```c:line-numbers=361
    if ((int64_t)(a^b | ~s^b) >= 0)
```

足し算があふれるのは、**`a` と `b` が同じ符号なのに、結果 `s` の符号が違うとき** だけです。
`a^b` の符号ビットは「a と b の符号が違えば 1」、`~s^b` の符号ビットは「s と b の符号が同じなら 1」です。
この 2 つを OR した値の符号ビットが 0、つまり `>= 0` なら、「a と b は同じ符号」かつ「s と b の符号が違う」ので、あふれています。

`a = INT64_MAX`、`b = 1` で確かめます。a と b はどちらも正なので `a^b` の符号ビットは 0。`s` は回り込んで `INT64_MIN`（負）なので、`~s` は正、`~s^b` も正で符号ビット 0。OR しても 0 以上なので、あふれと判定されます。

### 4. 返す端を b の符号で選ぶ

```c:line-numbers=362
        return INT64_MAX ^ (b >> 63);
```

`INT64_MAX ^ (b >> 63)` は、`b` が 0 以上なら `INT64_MAX ^ 0 = INT64_MAX`、負なら `INT64_MAX ^ -1 = ~INT64_MAX = INT64_MIN` です。あふれるとき a と b は同じ符号なので、`b` の符号を見ればどちらに外れたかがわかります。

## ここがすごい

- **使えるなら組み込み関数**: `__builtin_add_overflow` を使うと、コンパイラは CPU のオーバーフローフラグを直接使うコードを出せます。自分でビット演算を書くより短く、意図も明確です。
- **ない環境でも正しく動く代替**: 組み込み関数がないコンパイラ向けに、未定義動作を一切踏まない実装を用意しています。符号付きで `a + b` を先に計算してから調べる、というよくある間違いを避け、符号なしで足している点が重要です。
- **比較を符号ビットにまとめる**: 「a と b が同符号」かつ「結果が異符号」という 2 つの条件を、XOR と OR で 1 つの値の符号ビットに集め、`>= 0` の 1 回の比較で判定しています。
- **端の値も分岐なし**: `b >> 63` で 0 か −1 を作り、XOR で `INT64_MAX` を反転するかどうかを選んでいます。`INT64_MAX` を反転すると `INT64_MIN` になる、2 の補数の性質を使っています。

## まとめ

- 符号付き整数のオーバーフローは C では未定義動作。検査したいなら符号なしで計算するか、組み込み関数を使う。
- 足し算のあふれは「同符号の 2 数を足して、結果の符号が変わった」ときだけ起きる。
- 符号ビットの比較は XOR で表せ、複数の条件を OR でまとめて 1 回で判定できる。
- コンパイラの機能があるときはそれを使い、ないときの代替を用意する、という移植性の書き方の見本。
