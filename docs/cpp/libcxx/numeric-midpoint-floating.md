---
title: 浮動小数点の中点を、あふれも精度落ちもなく求める 4 つの場合分け
description: C++20 の std::midpoint の浮動小数点版。ふつうは (a+b)/2、巨大な値なら半分にしてから足し、極小の値は半分にしないという場合分けで、常に正しい丸めを保つ。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__numeric/midpoint.h
lines: [55, 75]
function: std::midpoint（浮動小数点版）
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

浮動小数点数（`double` など、小数を扱える数）の `std::midpoint(a, b)` は、2 つの数の真ん中を返します。`midpoint(1.0, 4.0)` は `2.5` です。

ふつうは `(a + b) / 2` で十分ですが、`a` と `b` が `double` の最大値に近いと、`a + b` が **無限大にあふれます**。逆に、0 にとても近い数を先に半分にすると、**精度が失われます**。この関数は値の大きさで 4 通りに場合分けし、どの場合でも正しく丸められた答えを返します。

## コード

::: code-group

```cpp:line-numbers=55 [日本語訳]
template <typename _Fp>
_LIBCPP_HIDE_FROM_ABI constexpr _Fp __fp_abs(_Fp __f) {
  return __f >= 0 ? __f : -__f;
}

template <class _Fp>
  requires(is_floating_point_v<_Fp>)
[[nodiscard]] _LIBCPP_HIDE_FROM_ABI constexpr _Fp midpoint(_Fp __a, _Fp __b) noexcept {
  constexpr _Fp __lo = numeric_limits<_Fp>::min() * 2;
  constexpr _Fp __hi = numeric_limits<_Fp>::max() / 2;

  // ふつうの場合: オーバーフローは起こりえない
  if (std::__fp_abs(__a) <= __hi && std::__fp_abs(__b) <= __hi)
    return (__a + __b) / 2; // 常に正しく丸められる
  if (std::__fp_abs(__a) < __lo)
    return __a + __b / 2; // a を半分にするのは安全でない
  if (std::__fp_abs(__b) < __lo)
    return __a / 2 + __b; // b を半分にするのは安全でない

  return __a / 2 + __b / 2; // それ以外は正しく丸められる
}
```

```cpp:line-numbers=55 [原文]
template <typename _Fp>
_LIBCPP_HIDE_FROM_ABI constexpr _Fp __fp_abs(_Fp __f) {
  return __f >= 0 ? __f : -__f;
}

template <class _Fp>
  requires(is_floating_point_v<_Fp>)
[[nodiscard]] _LIBCPP_HIDE_FROM_ABI constexpr _Fp midpoint(_Fp __a, _Fp __b) noexcept {
  constexpr _Fp __lo = numeric_limits<_Fp>::min() * 2;
  constexpr _Fp __hi = numeric_limits<_Fp>::max() / 2;

  // typical case: overflow is impossible
  if (std::__fp_abs(__a) <= __hi && std::__fp_abs(__b) <= __hi)
    return (__a + __b) / 2; // always correctly rounded
  if (std::__fp_abs(__a) < __lo)
    return __a + __b / 2; // not safe to halve a
  if (std::__fp_abs(__b) < __lo)
    return __a / 2 + __b; // not safe to halve b

  return __a / 2 + __b / 2; // otherwise correctly rounded
}
```

:::

## 前提知識

- **浮動小数点数**: `double` は「仮数 × 2 の指数乗」の形で数を表します。表せる最大値は約 `1.8 × 10^308` で、それを超えると無限大（`inf`）になります。
- **`numeric_limits<_Fp>::max()` と `min()`**: `max()` は最大の値、`min()` は **0 より大きい最小の「正規化数」** です（`double` で約 `2.2 × 10^-308`）。それより 0 に近い数は「非正規化数」と呼ばれ、桁数（精度）が少なくなります。最小の負の数ではない点に注意してください。
- **`requires(is_floating_point_v<_Fp>)`**: C++20 の制約で、浮動小数点型のときだけこの版が選ばれます。整数版は同じファイルに別にあります。
- **`constexpr`**: コンパイル時にも計算できる関数です。`constexpr _Fp __lo = ...` は、型ごとにコンパイル時に決まる定数です。
- **`__fp_abs`**: 絶対値を返す小さな補助関数です。`std::fabs` を使わないのは、この関数自体を `constexpr` にするためだと考えられます。

## 何をしているか

### 1. しきい値を決める

```cpp:line-numbers=63
  constexpr _Fp __lo = numeric_limits<_Fp>::min() * 2;
  constexpr _Fp __hi = numeric_limits<_Fp>::max() / 2;
```

`__hi` は最大値の半分です。両方の絶対値が `__hi` 以下なら、足してもあふれません。`__lo` は最小の正規化数の 2 倍です。これより小さい数を半分にすると、非正規化数になって精度が落ちるおそれがあります。

### 2. ふつうの場合

```cpp:line-numbers=66
  // ふつうの場合: オーバーフローは起こりえない
  if (std::__fp_abs(__a) <= __hi && std::__fp_abs(__b) <= __hi)
    return (__a + __b) / 2; // 常に正しく丸められる
```

`midpoint(1.0, 4.0)` は `(1.0 + 4.0) / 2 = 2.5` です。足し算の丸めは 1 回だけで、2 で割るのは指数を 1 減らすだけなので誤差を増やしません。コメントのとおり、常に正しく丸められます。

### 3. a がとても小さい場合

```cpp:line-numbers=69
  if (std::__fp_abs(__a) < __lo)
    return __a + __b / 2; // a を半分にするのは安全でない
```

ここに来るのは `a` か `b` のどちらかが `__hi` より大きいときです。`a` が極小（`__lo` 未満）なら、`a` を半分にせず `a + b / 2` とします。`b` は巨大なので半分にしても精度は落ちず、極小の `a` を足しても結果はほぼ `b / 2` のままです。

### 4. b がとても小さい場合と、残りの場合

```cpp:line-numbers=71
  if (std::__fp_abs(__b) < __lo)
    return __a / 2 + __b; // b を半分にするのは安全でない

  return __a / 2 + __b / 2; // それ以外は正しく丸められる
```

`b` が極小なら同じように `a / 2 + b` です。どちらも極小でなければ、両方を半分にしてから足します。たとえば `a = b = 1.5e308` なら、`a + b` は無限大になりますが、`0.75e308 + 0.75e308 = 1.5e308` と正しく求まります。

## ここがすごい

- **よくある場合を最速に**: 最初の `if` で「ふつうの場合」を判定し、ほとんどの入力は `(a + b) / 2` の 1 行で終わります。特別な処理は、本当に必要な極端な値のときだけ走ります。
- **2 つの危険を両方避ける**: 「足すとあふれる」危険と、「半分にすると精度が落ちる」危険は向きが逆です。いつも `a / 2 + b / 2` にすればあふれは防げますが、極小の値で精度を失います。値の大きさで場合分けし、それぞれに安全な式を選んでいます。
- **2 で割るのは安全な操作**: 2 進数の浮動小数点数では、2 で割るのは指数を 1 つ減らすだけです。正規化数の範囲にいる限り、丸め誤差は生まれません。この性質があるので「半分にしてから足す」が成り立ちます。
- **コメントが根拠になっている**: 各行に「常に正しく丸められる」「a を半分にするのは安全でない」と理由が書いてあり、場合分けの意図がすぐわかります。

## まとめ

- 浮動小数点の `(a + b) / 2` は、巨大な値で無限大にあふれることがある。
- 0 に近すぎる数を半分にすると、非正規化数になって精度を失うことがある。
- 値の大きさで場合分けし、それぞれに安全な式を使えば、どちらの問題も避けられる。
- よくある場合を最初に判定すると、特別扱いのコストはまれな入力だけが払う。
