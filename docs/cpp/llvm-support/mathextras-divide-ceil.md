---
title: 「切り上げ割り算」を絶対にあふれさせない 1 行
description: 割り算の結果を切り上げる divideCeil。定番の (n + d - 1) / d が抱えるオーバーフローを、先に 1 引いて後から 1 足す形で回避している。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [386, 393]
function: llvm::divideCeil
difficulty: 1
tags: [数値計算, 防御的プログラミング, イディオム]
format: 2
---

## ひとことで

`divideCeil(N, D)` は、`N ÷ D` の答えを**切り上げた整数**を返します。
`divideCeil(7, 3)` は `3`（7÷3 = 2.33… を切り上げ）、`divideCeil(6, 3)` は `2`、`divideCeil(0, 3)` は `0` です。

「100 バイトを 32 バイトのブロックに入れるには何ブロック要るか」のような計算で毎日のように使われる関数です。

## コード

::: code-group

```cpp:line-numbers=386 [日本語訳]
/// 整数 ceil(Numerator / Denominator) を返す。符号なし版。
/// 決してあふれないことが保証されている。
template <typename U, typename V, typename T = common_uint<U, V>>
constexpr T divideCeil(U Numerator, V Denominator) {
  assert(Denominator && "Division by zero");
  T Bias = (Numerator != 0);
  return (Numerator - Bias) / Denominator + Bias;
}
```

```cpp:line-numbers=386 [原文]
/// Returns the integer ceil(Numerator / Denominator). Unsigned version.
/// Guaranteed to never overflow.
template <typename U, typename V, typename T = common_uint<U, V>>
constexpr T divideCeil(U Numerator, V Denominator) {
  assert(Denominator && "Division by zero");
  T Bias = (Numerator != 0);
  return (Numerator - Bias) / Denominator + Bias;
}
```

:::

## 前提知識

- **テンプレート**: `template <typename U, typename V, ...>` は、引数の型 `U`・`V` を呼び出し側から自動で受け取る関数の書き方です。`uint32_t` と `uint64_t` を混ぜて渡しても動きます。
- **`common_uint<U, V>`**: LLVM が同じファイルで定義している型の別名です。2 つの型をそれぞれ符号なしにして、幅の広いほうにそろえた型になります。
- **整数の割り算**: C++ の整数同士の `/` は小数点以下を**切り捨て**ます。`7 / 3` は `2` です。
- **`bool` から整数への変換**: `(Numerator != 0)` は `true` か `false` ですが、整数の変数に入れると `1` か `0` になります。
- **`assert`**: デバッグ時だけ有効な実行時チェックです。ここでは 0 での割り算を防いでいます。
- **オーバーフロー**: 整数の型に入りきらない値になることです。符号なし整数では一周して小さな値になってしまいます。

## 何をしているか

### 1. Bias を作る

```cpp:line-numbers=391
  T Bias = (Numerator != 0);
```

`Bias` は `Numerator` が 0 でなければ 1、0 なら 0 です。

### 2. 1 引いて割って、1 足す

```cpp:line-numbers=392
  return (Numerator - Bias) / Denominator + Bias;
```

`N = 7, D = 3` の場合:

```
Bias = 1
(7 - 1) / 3 + 1 = 6 / 3 + 1 = 2 + 1 = 3
```

`N = 6, D = 3` の場合:

```
(6 - 1) / 3 + 1 = 5 / 3 + 1 = 1 + 1 = 2
```

割り切れるときは、1 引いたことで商が 1 減り、最後に 1 足して元に戻ります。割り切れないときは、1 引いても商は変わらず、1 足したぶんだけ切り上がります。

`N = 0` のときは `Bias = 0` なので `0 / 3 + 0 = 0` です。もし `Bias` を常に 1 にすると `0 - 1` が符号なしで一周して巨大な数になり、答えが壊れます。`Bias` を「0 のときだけ 0」にしているのはこのためです。

## ここがすごい

切り上げ割り算の定番は `(N + D - 1) / D` です。しかし `N` が型の最大値に近いと、`N + D - 1` の時点で**オーバーフローして答えが壊れます**。

`uint32_t`（最大 4294967295）で `N = 4294967290, D = 10` を考えると:

- 定番の式: `4294967290 + 9 = 4294967299` → 最大値を超えて一周し `3`。`3 / 10 = 0` という誤った答え
- この関数: `(4294967290 - 1) / 10 + 1 = 429496728 + 1 = 429496729`。正しい

（`uint8_t` のような小さな型は計算前に `int` へ広げられるので、この例は `uint32_t` で考えています。）

この関数は「先に引く」ので、途中の値が `N` より大きくなることがありません。コメントの「Guaranteed to never overflow.」（決してあふれない）はこのことです。

ほんの 1 行の違いですが、ライブラリ関数は「どんな入力でも正しい」ことが求められます。素直な式の弱点を知ったうえで、同じ手間で安全な形を選んでいる好例です。

同じファイルにはテンプレートでない `uint64_t` 版（すぐ下の行）もあり、整数以外の型が渡されたときの受け皿になっています。

## まとめ

- 切り上げ割り算 `(N + D - 1) / D` は大きな `N` でオーバーフローする。
- `(N - 1) / D + 1` なら途中の値が大きくならない。ただし `N = 0` だけは特別扱いが要る。
- `bool` を 0/1 として計算に使うと、`if` を書かずに場合分けできる。
- ライブラリでは「端の入力」でも壊れない式を選ぶ。
