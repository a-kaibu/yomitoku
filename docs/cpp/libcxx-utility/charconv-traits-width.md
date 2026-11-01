---
title: 10 進の桁数を、ビット数 × 1233 ÷ 4096 で見積もって 1 回だけ補正する
description: std::to_chars の内部で、整数が 10 進で何桁かを求める __width。log10(2) を 1233/4096 で近似し、10 のべき乗表と 1 回比べるだけで正確な桁数を出す。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__charconv/traits.h
lines: [38, 55]
function: std::__itoa::__traits_base<_Tp>::__width
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, 最適化]
---
## ひとことで

`__width` は、整数を 10 進数で書いたときに **何桁になるか** を返す関数です。
たとえば `0` は 1 桁、`999` は 3 桁、`1000` は 4 桁です。
`std::to_chars`（整数を文字列にする関数）が、出力先の大きさが足りるかを書き始める前に確かめるために使います。

## コード

::: code-group

```cpp:line-numbers=38 [日本語訳]
template <typename _Tp>
struct _LIBCPP_HIDDEN __traits_base<_Tp, __enable_if_t<sizeof(_Tp) <= sizeof(uint32_t)> > {
  using type = uint32_t;

  /// log10 のアルゴリズムを使った桁数の見積もり。
  ///
  /// このアルゴリズムの元ネタは
  /// http://graphics.stanford.edu/~seander/bithacks.html#IntegerLog10 （ビット演算ハック集）
  /// IntegerLogBase2 の代わりに __countl_zero を使っている。
  static _LIBCPP_CONSTEXPR_SINCE_CXX23 int __width(_Tp __v) {
    auto __t = (32 - std::__countl_zero(static_cast<type>(__v | 1))) * 1233 >> 12;
    return __t - (__v < __itoa::__pow10_32[__t]) + 1;
  }

  static _LIBCPP_CONSTEXPR_SINCE_CXX23 char* __convert(char* __p, _Tp __v) { return __itoa::__base_10_u32(__p, __v); }

  static _LIBCPP_CONSTEXPR_SINCE_CXX23 decltype(__pow10_32)& __pow() { return __itoa::__pow10_32; }
};
```

```cpp:line-numbers=38 [原文]
template <typename _Tp>
struct _LIBCPP_HIDDEN __traits_base<_Tp, __enable_if_t<sizeof(_Tp) <= sizeof(uint32_t)> > {
  using type = uint32_t;

  /// The width estimation using a log10 algorithm.
  ///
  /// The algorithm is based on
  /// http://graphics.stanford.edu/~seander/bithacks.html#IntegerLog10
  /// Instead of using IntegerLogBase2 it uses __countl_zero.
  static _LIBCPP_CONSTEXPR_SINCE_CXX23 int __width(_Tp __v) {
    auto __t = (32 - std::__countl_zero(static_cast<type>(__v | 1))) * 1233 >> 12;
    return __t - (__v < __itoa::__pow10_32[__t]) + 1;
  }

  static _LIBCPP_CONSTEXPR_SINCE_CXX23 char* __convert(char* __p, _Tp __v) { return __itoa::__base_10_u32(__p, __v); }

  static _LIBCPP_CONSTEXPR_SINCE_CXX23 decltype(__pow10_32)& __pow() { return __itoa::__pow10_32; }
};
```

:::

## 前提知識

- **`template <typename _Tp>` と部分特殊化**: `__traits_base` はテンプレートです。この `__traits_base<_Tp, __enable_if_t<...>>` は「条件を満たす型のときだけ使われる版」です。ここでは 4 バイト以下の整数用で、同じファイルに 8 バイト用・16 バイト用の版も並んでいます。
- **`__enable_if_t<条件>`**: 条件が真のときだけ型になり、偽のときはその特殊化を候補から外します（SFINAE と呼ばれる仕組み）。
- **`struct` と `static` 関数**: `struct` は C++ ではクラスとほぼ同じです。`static` なメンバ関数は、オブジェクトを作らずに `__traits_base<int>::__width(x)` のように呼べます。
- **`using type = uint32_t;`**: 型に別名を付けています。
- **`auto`**: 変数の型を、右辺から自動で決めさせる書き方です。
- **`__countl_zero(x)`**: 上位から 0 が何個続くかを数える関数です。`32 - __countl_zero(x)` は「`x` を表すのに必要なビット数」になります。
- **`bool` から整数への変換**: C++ では `true` は 1、`false` は 0 として足し引きに使えます。

## 何をしているか

### 1. ビット数を数える

```cpp:line-numbers=48
    auto __t = (32 - std::__countl_zero(static_cast<type>(__v | 1))) * 1233 >> 12;
```

`32 - __countl_zero(__v | 1)` で、`__v` が何ビットの数かを求めます。`| 1` は `__v = 0` のときの対策です。0 は先頭ゼロの数え方が特殊なので、最下位ビットを立てて「1 ビットの数」として扱います。

### 2. ビット数から 10 進の桁数を見積もる

```cpp:line-numbers=48
    auto __t = (32 - std::__countl_zero(static_cast<type>(__v | 1))) * 1233 >> 12;
```

ビット数を `b` とすると、10 進の桁数はおよそ `b × log10(2)` です。`log10(2) ≈ 0.30103` で、`1233 / 4096 ≈ 0.30103` です。4096 は 2 の 12 乗なので、`* 1233 >> 12` は掛け算とシフトだけで `× 0.30103` を計算できます。

### 3. 表を 1 回引いて補正する

```cpp:line-numbers=49
    return __t - (__v < __itoa::__pow10_32[__t]) + 1;
```

`__pow10_32` は `{0, 10, 100, 1000, ...}` という表です（先頭だけ 0）。見積もり `__t` は「桁数 − 1」か「桁数」のどちらかです。`__v < __pow10_32[__t]` は、見積もりが 1 多すぎたときだけ真（1）になります。これを引いてから 1 を足すと正確な桁数になります。

具体的な値で追います。

| `__v` | ビット数 | `__t` | `__pow10_32[__t]` | 比較 | 結果 |
| --- | --- | --- | --- | --- | --- |
| 0 | 1 | 0 | 0 | 偽 (0) | 1 |
| 9 | 4 | 1 | 10 | 真 (1) | 1 |
| 10 | 4 | 1 | 10 | 偽 (0) | 2 |
| 999 | 10 | 3 | 1000 | 真 (1) | 3 |
| 1000 | 10 | 3 | 1000 | 偽 (0) | 4 |

4 ビットの数は 8〜15 なので、1 桁（8, 9）と 2 桁（10〜15）が混ざります。見積もりはどちらにも `__t = 1` を出し、表との比較で振り分けています。

## ここがすごい

素直に書くなら「10 で割れなくなるまで割り、回数を数える」ループです。32 ビットなら最大 10 回の割り算が必要で、割り算は CPU にとって重い命令です。この関数は **先頭ゼロ数え 1 回・掛け算 1 回・シフト 1 回・表引き 1 回・比較 1 回** で終わり、ループも分岐もありません。

関数の前のコメントにあるとおり、元になっているのは有名な「Bit Twiddling Hacks」の IntegerLog10 です。そこで使われている 2 を底とする対数の計算を、`__countl_zero` に置き換えています。

表の先頭を 0 にしているのも細かい工夫です。`__v = 0` のとき `__t = 0` になり、比較が必ず偽になるので、特別扱いせずに 1 桁と答えられます。

`1233 / 4096 = 0.3010253...` は、log10(2) = 0.3010299... にとても近い値です。この近似で計算した `__t` は、1〜32 ビット（64 ビット版なら 1〜64 ビット）のどのビット数でも「桁数 − 1」か「桁数」のどちらかに収まります。ずれが 1 以内なので、表との比較 1 回で補正できるのです。

## まとめ

- 10 進の桁数は「ビット数 × log10(2)」でほぼ決まる。
- 定数の掛け算は「整数を掛けて 2 のべき乗で割る（シフトする）」で近似できる。
- 見積もりのずれが 1 以内なら、表との比較 1 回で正確な答えにできる。
- `bool` を 0/1 として足し引きすると、分岐を書かずに補正できる。
