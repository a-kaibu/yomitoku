---
title: 筆算そのままの 128 ビット割り算「シフトと引き算」
description: 128 ビット整数の割り算と余りを同時に求める関数。2 進数の筆算を素直に実装しつつ、最上位ビットをそろえて無駄な周回を省いている。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/numeric/int128.cc
lines: [55, 94]
function: DivModImpl
difficulty: 2
tags: [アルゴリズム, 数値計算, 移植性]
---

## ひとことで

`DivModImpl` は、128 ビットの符号なし整数 `uint128` どうしの **割り算の商と余りを同時に** 求める関数です。
CPU には 128 ビットを一度に割る命令がないことが多いので、小学校で習う筆算を 2 進数でそのまま行います。

`100 ÷ 7` なら、商 `14`、余り `2` が返ります。

## コード

::: code-group

```cpp:line-numbers=55 [日本語訳]
// uint128 の長除法（割り算と余り）。次のページの
// シフトと引き算による割り算アルゴリズムを元にしている:
// https://stackoverflow.com/questions/5386377/division-without-using
inline void DivModImpl(uint128 dividend, uint128 divisor, uint128* quotient_ret,
                       uint128* remainder_ret) {
  assert(divisor != 0);

  if (divisor > dividend) {
    *quotient_ret = 0;
    *remainder_ret = dividend;
    return;
  }

  if (divisor == dividend) {
    *quotient_ret = 1;
    *remainder_ret = 0;
    return;
  }

  uint128 denominator = divisor;
  uint128 quotient = 0;

  // 割る数と割られる数の最上位ビット（MSB）の位置を左にそろえる。
  const int shift = Fls128(dividend) - Fls128(denominator);
  denominator <<= shift;

  // シフトと引き算のアルゴリズムで dividend を denominator で割る。
  // 余りは dividend に残る。
  for (int i = 0; i <= shift; ++i) {
    quotient <<= 1;
    if (dividend >= denominator) {
      dividend -= denominator;
      quotient |= 1;
    }
    denominator >>= 1;
  }

  *quotient_ret = quotient;
  *remainder_ret = dividend;
}
```

```cpp:line-numbers=55 [原文]
// Long division/modulo for uint128 implemented using the shift-subtract
// division algorithm adapted from:
// https://stackoverflow.com/questions/5386377/division-without-using
inline void DivModImpl(uint128 dividend, uint128 divisor, uint128* quotient_ret,
                       uint128* remainder_ret) {
  assert(divisor != 0);

  if (divisor > dividend) {
    *quotient_ret = 0;
    *remainder_ret = dividend;
    return;
  }

  if (divisor == dividend) {
    *quotient_ret = 1;
    *remainder_ret = 0;
    return;
  }

  uint128 denominator = divisor;
  uint128 quotient = 0;

  // Left aligns the MSB of the denominator and the dividend.
  const int shift = Fls128(dividend) - Fls128(denominator);
  denominator <<= shift;

  // Uses shift-subtract algorithm to divide dividend by denominator. The
  // remainder will be left in dividend.
  for (int i = 0; i <= shift; ++i) {
    quotient <<= 1;
    if (dividend >= denominator) {
      dividend -= denominator;
      quotient |= 1;
    }
    denominator >>= 1;
  }

  *quotient_ret = quotient;
  *remainder_ret = dividend;
}
```

:::

## 前提知識

- **`uint128`**: Abseil が用意する 128 ビットの符号なし整数クラスです。中身は 64 ビット整数 2 つで、`+` `-` `<<` `>=` などの演算子が普通の整数と同じように使えるよう定義されています。
- **ポインタ引数 `uint128* quotient_ret`**: `*` 付きの型はポインタ（値が置かれた場所を指す変数）です。`*quotient_ret = 0;` と書くと、呼び出し元の変数に値を書き込めます。C++ で「戻り値を 2 つ返す」ときの古典的な方法です。
- **`assert(条件)`**: デバッグビルドで条件を確認し、偽ならプログラムを止めます。0 で割ることは許されないので、ここで検出します。
- **`<<=` / `>>=` / `|=`**: `a <<= 1` は `a = a << 1` の短縮形です。
- **`Fls128(n)`**: 同じファイルの少し上で定義されている補助関数で、最上位の 1 のビット位置（0 始まり）を返します。`5`（`101`）なら 2 です。

## 何をしているか

### 1. すぐ答えが出る場合

```cpp:line-numbers=62
  if (divisor > dividend) {
    *quotient_ret = 0;
    *remainder_ret = dividend;
    return;
  }

  if (divisor == dividend) {
    *quotient_ret = 1;
    *remainder_ret = 0;
    return;
  }
```

割る数のほうが大きければ、商は 0、余りは割られる数そのものです。両者が等しければ、商は 1、余りは 0 です。
これを先に片付けることで、後のループに入る回数を減らしています。

### 2. 最上位ビットをそろえる

```cpp:line-numbers=77
  // 割る数と割られる数の最上位ビット（MSB）の位置を左にそろえる。
  const int shift = Fls128(dividend) - Fls128(denominator);
  denominator <<= shift;
```

筆算では、割る数を割られる数の左端までずらしてから始めます。2 進数でも同じです。
`100` は `1100100`（最上位は 6 ビット目）、`7` は `111`（2 ビット目）なので、`shift = 4` です。
`denominator = 7 << 4 = 112` にしてから引き算を始めます。

### 3. シフトと引き算を繰り返す

```cpp:line-numbers=83
  for (int i = 0; i <= shift; ++i) {
    quotient <<= 1;
    if (dividend >= denominator) {
      dividend -= denominator;
      quotient |= 1;
    }
    denominator >>= 1;
  }
```

`shift + 1` 回、「引けるなら引いて商に 1 を立てる」を繰り返します。

| i | 引けるか | 残り（dividend） | 商（2 進数） | 次の denominator |
| --- | --- | --- | --- | --- |
| 0 | 100 ≥ 112？ いいえ | 100 | 0 | 56 |
| 1 | 100 ≥ 56？ はい | 44 | 1 | 28 |
| 2 | 44 ≥ 28？ はい | 16 | 11 | 14 |
| 3 | 16 ≥ 14？ はい | 2 | 111 | 7 |
| 4 | 2 ≥ 7？ いいえ | 2 | 1110 | 3 |

商は `1110` で 14、`dividend` に残った 2 が余りです。

### 4. 結果を書き込む

```cpp:line-numbers=92
  *quotient_ret = quotient;
  *remainder_ret = dividend;
```

2 つのポインタを通じて、呼び出し元に商と余りを返します。

## ここがすごい

- **周回数を「桁の差」に抑える**: いつも 128 回まわすのではなく、`Fls128` で最上位ビットの差を求めて、必要なぶんだけまわしています。`100 ÷ 7` なら 5 回で終わります。
- **商と余りを一度に求める**: この関数は `operator/` と `operator%` の両方から呼ばれます。筆算をすると商と余りは同時に手に入るので、1 つの関数にまとめて重複をなくしています。
- **割られる数そのものを作業領域に使う**: 引き算した残りをそのまま `dividend` に上書きしていくので、ループが終わった時点で余りが完成しています。余り用の変数を別に計算する必要がありません。
- **ふつうの整数と同じ見た目のコード**: `uint128` が演算子をすべて用意しているおかげで、このアルゴリズムは 32 ビット整数で書いた筆算とほとんど同じ見た目です。演算子オーバーロードのよい使いどころです。

なお、コンパイラが 128 ビット整数を直接サポートしている環境（`ABSL_HAVE_INTRINSIC_INT128`）では、`operator/` はこの関数を使わずにコンパイラ任せになります。

## まとめ

- 2 進数の割り算は「そろえて、引けたら 1、ずらす」の繰り返しで書ける。
- 最上位ビットの位置を使えば、ループの回数を必要最小限にできる。
- 商と余りが同時に得られる処理は、1 つの関数にまとめて両方を返す。
- 演算子オーバーロードがあれば、大きな整数型でもアルゴリズムをそのままの形で書ける。
