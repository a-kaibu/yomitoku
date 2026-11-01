---
title: 「0 に向かって切り捨て」の C++ で負の数の切り上げ割り算を正しく書く
description: 符号付き整数の切り上げ割り算 divideCeilSigned。C++ の割り算が 0 方向に丸めることを利用し、符号が同じか違うかで計算を切り替える。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [409, 423]
function: llvm::divideCeilSigned
difficulty: 2
tags: [数値計算, 防御的プログラミング, 移植性]
format: 2
---

## ひとことで

`divideCeilSigned(N, D)` は、**負の数もありの**割り算を「切り上げ」（数直線で右側、つまり大きいほうの整数）にする関数です。

- `divideCeilSigned(7, 2)` → `4`（3.5 の切り上げ）
- `divideCeilSigned(-7, 2)` → `-3`（-3.5 の切り上げは -3）
- `divideCeilSigned(-7, -2)` → `4`（3.5 の切り上げ）

負の数が混ざると「切り上げ」の向きを間違えやすいので、それを関数にまとめています。

## コード

::: code-group

```cpp:line-numbers=409 [日本語訳]
/// 整数 ceil(Numerator / Denominator) を返す。符号付き版。
/// あふれは assert で明示的に禁止している。
template <typename U, typename V, typename T = common_sint<U, V>>
constexpr T divideCeilSigned(U Numerator, V Denominator) {
  assert(Denominator && "Division by zero");
  assert(!divideSignedWouldOverflow(Numerator, Denominator) &&
         "Divide would overflow");
  if (!Numerator)
    return 0;
  // C の整数除算は 0 に向かって丸める。
  T Bias = Denominator >= 0 ? 1 : -1;
  bool SameSign = (Numerator >= 0) == (Denominator >= 0);
  return SameSign ? (Numerator - Bias) / Denominator + 1
                  : Numerator / Denominator;
}
```

```cpp:line-numbers=409 [原文]
/// Returns the integer ceil(Numerator / Denominator). Signed version.
/// Overflow is explicitly forbidden with an assert.
template <typename U, typename V, typename T = common_sint<U, V>>
constexpr T divideCeilSigned(U Numerator, V Denominator) {
  assert(Denominator && "Division by zero");
  assert(!divideSignedWouldOverflow(Numerator, Denominator) &&
         "Divide would overflow");
  if (!Numerator)
    return 0;
  // C's integer division rounds towards 0.
  T Bias = Denominator >= 0 ? 1 : -1;
  bool SameSign = (Numerator >= 0) == (Denominator >= 0);
  return SameSign ? (Numerator - Bias) / Denominator + 1
                  : Numerator / Denominator;
}
```

:::

## 前提知識

- **C++ の整数の割り算は 0 に向かって丸める**: `7 / 2` は `3`、`-7 / 2` は `-3` です。正の答えでは「切り捨て」、負の答えでは「切り上げ」になります。言語によっては負の数を小さいほうに丸めるもの（Python の `//` など）もあるので注意が必要です。
- **`common_sint<U, V>`**: LLVM が同じファイルで定義した型の別名で、2 つの型を符号付きにして広いほうにそろえた型です。
- **`assert`**: デバッグ時だけ有効な実行時チェックです。
- **三項演算子 `条件 ? A : B`**: 条件が真なら `A`、偽なら `B` を値として返します。
- **`divideSignedWouldOverflow`**: 同じファイルのすぐ上にある関数です。符号付き整数の割り算で唯一あふれる組み合わせ「最小値 ÷ -1」を検出します。

## 何をしているか

### 1. 事前チェック

```cpp:line-numbers=413
  assert(Denominator && "Division by zero");
  assert(!divideSignedWouldOverflow(Numerator, Denominator) &&
         "Divide would overflow");
  if (!Numerator)
    return 0;
```

最初の `assert` で 0 除算を、次の `assert` で「最小値 ÷ -1」を禁止します。`int32_t` の最小値 `-2147483648` を `-1` で割ると `2147483648` になりますが、これは `int32_t` に入りません。
続く `if (!Numerator)` では、0 を割った答えは常に 0 なので先に返します。

### 2. 符号が違う場合はそのまま割る

```cpp:line-numbers=420
  bool SameSign = (Numerator >= 0) == (Denominator >= 0);
```

```cpp:line-numbers=422
                  : Numerator / Denominator;
```

答えが負になる場合（`N` と `D` の符号が違う）、C++ の割り算は 0 方向、つまり**大きいほうに丸める**ので、それがそのまま切り上げです。

```
-7 / 2 = -3   ← -3.5 を切り上げた値と同じ
```

### 3. 符号が同じ場合は「1 寄せて割って 1 足す」

```cpp:line-numbers=419
  T Bias = Denominator >= 0 ? 1 : -1;
```

```cpp:line-numbers=421
  return SameSign ? (Numerator - Bias) / Denominator + 1
```

答えが正になる場合、C++ の割り算は切り捨てになってしまいます。そこで符号なし版の `divideCeil` と同じく「0 に 1 近づけて割り、1 足す」をします。

`Bias` は `D` が正なら `1`、負なら `-1` です。`N` と `D` は同じ符号なので、`N - Bias` は `N` を **0 の方向に 1 だけ近づけた値**になります。

```
N = 7,  D = 2:  Bias = 1   → (7 - 1) / 2 + 1   = 3 + 1 = 4
N = -7, D = -2: Bias = -1  → (-7 + 1) / -2 + 1 = 3 + 1 = 4
N = 6,  D = 2:  Bias = 1   → (6 - 1) / 2 + 1   = 2 + 1 = 3
```

割り切れる `6 / 2` でも正しく `3` になります。

## ここがすごい

浮動小数点に変換して `std::ceil` を使う方法もありますが、64 ビット整数は `double` で正確に表せない値があるため、大きな数で誤差が出ます。この関数は整数演算だけで完結しています。

また、`(N + D - 1) / D` 型の公式は、負の数では向きが変わるうえ、`N` が大きいとあふれます。この実装は

- 答えが負のときは**言語の丸め方向そのもの**を利用し、
- 答えが正のときは **0 に近づける方向に寄せてから**割る

ので、途中の値が `N` より絶対値で大きくなりません。あふれる可能性があるのは「最小値 ÷ -1」だけで、それは `assert` で明示的に弾いています。

「C++ の割り算がどちらに丸めるか」を正確に知っていることが、そのまま短く安全なコードにつながっている例です。

## まとめ

- C++ の整数除算は 0 方向に丸める。負の答えでは「切り上げ」と同じになる。
- 切り上げが必要なのは答えが正のときだけ。符号の一致で場合分けする。
- 「0 に 1 近づけて割って 1 足す」で、あふれずに切り上げられる。
- 符号付き除算であふれるのは「最小値 ÷ -1」だけ。
