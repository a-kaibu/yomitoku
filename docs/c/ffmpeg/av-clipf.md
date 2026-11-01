---
title: "NaN が来ても必ず範囲内を返す、引数の順番まで計算された float のクリップ"
description: "浮動小数点数を amin〜amax に収める関数。FFMAX と FFMIN を組み合わせた 1 行だが、比較の向きと引数の順番によって NaN でも amin が返るようになっている。"
language: c
project: FFmpeg
repo: https://github.com/FFmpeg/FFmpeg
license: LGPL-2.1-or-later
copyright: "copyright (c) 2006 Michael Niedermayer <michaelni@gmx.at>"
commit: "a88838af482100fa22dd22c94be592c35642de46"
file: libavutil/common.h
lines: [387, 402]
function: "av_clipf_c"
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, マクロ]
---

## ひとことで

`av_clipf_c(a, amin, amax)` は、`float`（浮動小数点数）の値 `a` を `amin`〜`amax` の範囲に収める関数です。`a = 1.5`、範囲 0〜1 なら `1.0` を返します。
本体は `FFMIN(FFMAX(a, amin), amax)` の 1 行だけですが、コメントにあるとおり、**`a` が NaN（非数）でも `amin` が返る** ように作られています。音声のサンプル値などで NaN が混ざっても、範囲外の値が後ろに流れないようにする工夫です。

## コード

::: code-group

```c:line-numbers=387 [日本語訳]
/**
 * float の値を amin〜amax の範囲に収める。
 * a が nan か -inf なら amin を返す。
 * a が +inf なら amax を返す。
 * @param a 収める値
 * @param amin 範囲の最小値
 * @param amax 範囲の最大値
 * @return 収めた値
 */
static av_always_inline av_const float av_clipf_c(float a, float amin, float amax)
{
#if defined(HAVE_AV_CONFIG_H) && defined(ASSERT_LEVEL) && ASSERT_LEVEL >= 2
    if (amin > amax) abort();
#endif
    return FFMIN(FFMAX(a, amin), amax);
}
```

```c:line-numbers=387 [原文]
/**
 * Clip a float value into the amin-amax range.
 * If a is nan or -inf amin will be returned.
 * If a is +inf amax will be returned.
 * @param a value to clip
 * @param amin minimum value of the clip range
 * @param amax maximum value of the clip range
 * @return clipped value
 */
static av_always_inline av_const float av_clipf_c(float a, float amin, float amax)
{
#if defined(HAVE_AV_CONFIG_H) && defined(ASSERT_LEVEL) && ASSERT_LEVEL >= 2
    if (amin > amax) abort();
#endif
    return FFMIN(FFMAX(a, amin), amax);
}
```

:::

`FFMAX` と `FFMIN` は `libavutil/macros.h` で次のように定義されています。

<!-- source: libavutil/macros.h -->
```c:line-numbers=47
#define FFMAX(a,b) ((a) > (b) ? (a) : (b))
#define FFMAX3(a,b,c) FFMAX(FFMAX(a,b),c)
#define FFMIN(a,b) ((a) > (b) ? (b) : (a))
```

## 前提知識

- **`float`**: 小数を表す型（単精度浮動小数点数）です。`double` はその倍の精度を持つ型です。
- **NaN と無限大**: 浮動小数点数には、`0.0 / 0.0` などの結果を表す **NaN（Not a Number）** と、`+inf`・`-inf`（無限大）という特別な値があります。NaN は **どんな比較をしても偽** になります。`NaN > 1` も `NaN < 1` も `NaN == NaN` も偽です。
- **マクロ `#define`**: コンパイル前に文字列を置き換える仕組みです。`FFMAX(a, amin)` は `((a) > (amin) ? (a) : (amin))` に置き換わります。関数呼び出しではなく、その場に式が埋め込まれます。
- **三項演算子 `x ? y : z`**: `x` が真なら `y`、偽なら `z` になる式です。
- **`#if defined(...) && ...`**: 条件付きコンパイルです。ここでは FFmpeg 自身をビルドしていて、検査レベル `ASSERT_LEVEL` が 2 以上のときだけ、`amin > amax` という呼び出し側の間違いを `abort()`（プログラムを即座に止める）で見つけます。
- **`static`、`av_always_inline`、`av_const`**: ファイル内専用、必ずインライン展開、副作用なし、という指定です。

## 何をしているか

### 1. 呼び出し側の間違いを検査する

```c:line-numbers=398
#if defined(HAVE_AV_CONFIG_H) && defined(ASSERT_LEVEL) && ASSERT_LEVEL >= 2
    if (amin > amax) abort();
#endif
```

デバッグ向けのビルドでは、範囲の下限が上限より大きいという矛盾を検出して止めます。通常のビルドではこの 3 行は消え、コストはかかりません。

### 2. 下限で持ち上げてから上限で抑える

```c:line-numbers=401
    return FFMIN(FFMAX(a, amin), amax);
```

`FFMAX(a, amin)` で「`a` と `amin` の大きいほう」を取り、その結果と `amax` の小さいほうを `FFMIN` で取ります。普通の値で追ってみます（範囲 0〜1）。

- `a = 0.5`: `FFMAX` → `0.5`、`FFMIN` → `0.5`
- `a = -2`: `FFMAX` → `0`、`FFMIN` → `0`
- `a = 3`: `FFMAX` → `3`、`FFMIN` → `1`

### 3. NaN のときの動き

```c:line-numbers=401
    return FFMIN(FFMAX(a, amin), amax);
```

`a` が NaN のとき、`FFMAX(a, amin)` は `(a) > (amin) ? (a) : (amin)` です。NaN との比較は偽なので、**`amin` が選ばれます**。
続く `FFMIN(amin, amax)` は、`amin <= amax` なので `amin` になります。結果は `amin` で、コメントの「If a is nan or -inf amin will be returned.」のとおりです。
`-inf` なら `-inf > amin` が偽なので `amin`、`+inf` なら `FFMAX` は `+inf`、`FFMIN` で `amax` になります。

## ここがすごい

- **比較の向きが NaN の行き先を決めている**: 三項演算子は「条件が偽なら 2 番目」を選びます。NaN との比較は必ず偽なので、偽のときに選ばれる側に `amin` が来るよう、`FFMAX(a, amin)` の **引数の順番** と `>` の向きが組まれています。もし `FFMAX(amin, a)` と書いていたら、`amin > NaN` が偽になり NaN がそのまま返ってしまいます。数学的には同じ「最大値」でも、NaN が絡むと順番で結果が変わるのです。
- **契約をコメントに書いている**: 「NaN と −inf なら amin、+inf なら amax」という振る舞いがドキュメントに明記されています。たまたまそう動くのではなく、保証された仕様です。呼び出し側は NaN を自分で検査しなくてよくなります。
- **検査はデバッグ時だけ**: `amin > amax` の検査を条件付きコンパイルにしているので、リリースビルドでは比較 2 回の最小コードになります。
- **double 版も同じ形**: すぐ下の `av_clipd_c` も同じ 1 行で書かれ、同じ NaN の約束を持っています。型ごとに振る舞いがそろっているので、使う側は型を変えても驚きません。

## まとめ

- NaN はどんな比較でも偽になる。三項演算子では「偽のときの値」が選ばれる。
- `max` や `min` を三項演算子で書くとき、引数の順番によって NaN の扱いが変わる。
- 特殊な値に対する振る舞いを決めて、コメントで約束しておくと、呼び出し側が楽になる。
- 呼び出し側の誤りの検査は、デバッグビルドだけで有効にするとコストがかからない。
