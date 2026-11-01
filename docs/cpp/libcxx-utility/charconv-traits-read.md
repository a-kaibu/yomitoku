---
title: 最上位の 1 桁だけ別に掛けて、整数パースの桁あふれを確実に見抜く
description: std::from_chars の 10 進パースの心臓部。数字を配列に逆順でためてから内積で値を組み立て、桁あふれしうる最上位桁だけを別に計算してあふれ検出付きの掛け算にかける。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__charconv/traits.h
lines: [110, 139]
function: std::__itoa::__traits<_Tp>::__read
difficulty: 3
format: 2
tags: [パース, 数値計算, 防御的プログラミング]
---
## ひとことで

`__read` は、`"1234"` のような 10 進の数字列を読み、整数値を 2 つの部品 `__a` と `__b` に分けて返す関数です。最終的な値は `__a + __b` です。
`std::from_chars`（文字列を整数にする関数）が、**桁あふれを確実に検出しながら** 数を読むために使っています。

## コード

::: code-group

```cpp:line-numbers=110 [日本語訳]
template <typename _Tp>
struct _LIBCPP_HIDDEN __traits : __traits_base<_Tp> {
  static _LIBCPP_CONSTEXPR const int digits = numeric_limits<_Tp>::digits10 + 1;
  using __traits_base<_Tp>::__pow;
  using typename __traits_base<_Tp>::type;

  // 事前条件: 0 でない文字が少なくとも 1 つあること
  static _LIBCPP_CONSTEXPR_SINCE_CXX23 char const* __read(char const* __p, char const* __ep, type& __a, type& __b) {
    type __cprod[digits];
    int __j = digits - 1;
    int __i = digits;
    do {
      if (*__p < '0' || *__p > '9')
        break;
      __cprod[--__i] = *__p++ - '0';
    } while (__p != __ep && __i != 0);

    __a = __inner_product(__cprod + __i + 1, __cprod + __j, __pow() + 1, __cprod[__i]);
    if (__itoa::__mul_overflowed(__cprod[__j], __pow()[__j - __i], __b))
      --__p;
    return __p;
  }

  template <typename _It1, typename _It2, class _Up>
  static _LIBCPP_CONSTEXPR_SINCE_CXX23 _Up __inner_product(_It1 __first1, _It1 __last1, _It2 __first2, _Up __init) {
    for (; __first1 < __last1; ++__first1, ++__first2)
      __init = __init + *__first1 * *__first2;
    return __init;
  }
};
```

```cpp:line-numbers=110 [原文]
template <typename _Tp>
struct _LIBCPP_HIDDEN __traits : __traits_base<_Tp> {
  static _LIBCPP_CONSTEXPR const int digits = numeric_limits<_Tp>::digits10 + 1;
  using __traits_base<_Tp>::__pow;
  using typename __traits_base<_Tp>::type;

  // precondition: at least one non-zero character available
  static _LIBCPP_CONSTEXPR_SINCE_CXX23 char const* __read(char const* __p, char const* __ep, type& __a, type& __b) {
    type __cprod[digits];
    int __j = digits - 1;
    int __i = digits;
    do {
      if (*__p < '0' || *__p > '9')
        break;
      __cprod[--__i] = *__p++ - '0';
    } while (__p != __ep && __i != 0);

    __a = __inner_product(__cprod + __i + 1, __cprod + __j, __pow() + 1, __cprod[__i]);
    if (__itoa::__mul_overflowed(__cprod[__j], __pow()[__j - __i], __b))
      --__p;
    return __p;
  }

  template <typename _It1, typename _It2, class _Up>
  static _LIBCPP_CONSTEXPR_SINCE_CXX23 _Up __inner_product(_It1 __first1, _It1 __last1, _It2 __first2, _Up __init) {
    for (; __first1 < __last1; ++__first1, ++__first2)
      __init = __init + *__first1 * *__first2;
    return __init;
  }
};
```

:::

## 前提知識

- **`struct __traits : __traits_base<_Tp>`**: `__traits` は `__traits_base` を継承（機能を引き継ぐこと）しています。`__pow()` は 10 のべき乗の表 `{0, 10, 100, ...}` を返す関数で、親から引き継いだものです。
- **`static const int digits = ...`**: 型ごとに決まる定数です。`numeric_limits<_Tp>::digits10 + 1` は「その型の最大値の 10 進桁数」です。32 ビットの `unsigned` なら最大値 4294967295 は 10 桁なので 10 です。
- **`char const* __p`**: 文字へのポインタ（メモリ上の位置）です。`*__p` でその位置の文字を読み、`__p++` で次の文字へ進みます。
- **参照 `type& __a`**: 引数に `&` を付けると、呼び出し側の変数そのものを受け取ります。関数の中で書き換えると、呼び出し側の変数が変わります。戻り値以外に結果を返す方法です。
- **`*__p - '0'`**: 文字 `'7'` から `'0'` を引くと数値 7 になります。数字の文字コードが連続していることを使った定番の書き方です。
- **`__mul_overflowed(a, b, r)`**: `a * b` を `r` に入れ、桁あふれしたら `true` を返す内部関数です（Clang/GCC の `__builtin_mul_overflow` を使っています）。

## 何をしているか

32 ビットの `unsigned` で `"1234"` を読む場合を追います。`digits = 10` です。

### 1. 数字を配列に逆順でためる

```cpp:line-numbers=118
    type __cprod[digits];
    int __j = digits - 1;
    int __i = digits;
    do {
      if (*__p < '0' || *__p > '9')
        break;
      __cprod[--__i] = *__p++ - '0';
    } while (__p != __ep && __i != 0);
```

`__cprod` は 10 要素の配列で、後ろから埋めていきます。

```
'1' → __cprod[9] = 1
'2' → __cprod[8] = 2
'3' → __cprod[7] = 3
'4' → __cprod[6] = 4    （ここで終端、__i = 6）
```

数字でない文字、文字列の終わり、配列が満杯（10 桁）のどれかで止まります。

### 2. 最上位以外の桁で値を作る

```cpp:line-numbers=127
    __a = __inner_product(__cprod + __i + 1, __cprod + __j, __pow() + 1, __cprod[__i]);
```

`__inner_product`は「対応する要素を掛けて足す」内積です。初期値に最下位の桁 `__cprod[6] = 4` を置き、`__cprod[7], __cprod[8]` に `10, 100` を掛けて足します。

```
__a = 4 + 3×10 + 2×100 = 234
```

範囲の終わりが `__cprod + __j`（`__j = 9`）なので、最上位の桁 `__cprod[9]` はここには入りません。

### 3. 最上位の桁だけ別に掛ける

```cpp:line-numbers=128
    if (__itoa::__mul_overflowed(__cprod[__j], __pow()[__j - __i], __b))
      --__p;
```

`__b = __cprod[9] × __pow()[9 - 6] = 1 × 1000 = 1000` です。この掛け算だけが桁あふれを検査されます。あふれたら `--__p` で読み位置を 1 つ戻し、呼び出し側に「まだ数字が残っている（＝範囲外）」と判断させます。

呼び出し側（`from_chars_integral.h`）は、`__a + __b` が型の最大値を超えないことを確かめてから `1234` を値として書き込みます。

### 1 桁だけのとき

`"7"` なら `__i = __j = 9` です。内積の範囲は空で `__a = 7`、`__b = 7 × __pow()[0]` です。表の先頭が **0** なので `__b = 0` になり、同じ桁を二重に数えません。

## ここがすごい

素直な実装は `value = value * 10 + digit` を 1 文字ずつ繰り返し、毎回あふれを検査します。この関数は次の観察を使っています。

- 型の最大値が 10 桁なら、**9 桁までは絶対にあふれない**。
- あふれる可能性があるのは、10 桁目（最上位）を掛けるときと、最後の足し算だけ。

そこで最上位の 1 桁だけを `__b` として切り離し、検査付きの掛け算にかけています。残りの桁の計算（`__a`）には検査が要りません。足し算のあふれは呼び出し側が `__m - __a >= __b` という **引き算の形** で確かめるので、検査そのものがあふれる心配もありません。

表の先頭を 0 にして 1 桁の場合を特別扱いしない点、桁数の上限で読むのを止めて「さらに数字が続く＝範囲外」を呼び出し側に委ねる点も、分岐を減らす工夫です。

## まとめ

- 整数パースの桁あふれは、「あふれうる箇所」を絞り込むと検査が少なくて済む。
- 最大桁の数字だけを別に計算すると、残りは安全に計算できる。
- `a + b <= max` は `max - a >= b` と書くと、検査の式自体があふれない。
- 表の先頭に番兵（0）を置くと、端のケースの分岐を消せる。
