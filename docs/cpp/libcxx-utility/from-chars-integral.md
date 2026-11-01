---
title: 何桁までなら桁あふれしないかを log2 の表で見積もり、最後の 1 桁だけ慎重に読む
description: std::from_chars の 2〜36 進パース。型のビット数を log2(基数) で割って安全な桁数を求め、それまでは検査なしで掛け足しし、最後の 1 桁だけあふれ検出付きで処理する。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__charconv/from_chars_integral.h
lines: [171, 210]
function: std::__from_chars_integral
difficulty: 3
format: 2
tags: [パース, 数値計算, 防御的プログラミング]
---
## ひとことで

`__from_chars_integral` は、`"ff"` や `"777"` のような 2〜36 進の文字列を符号なし整数に変換する関数です。
桁あふれの検査を毎桁するのではなく、**「この桁数までは絶対にあふれない」** という見積もりを使って、検査を最後の 1 桁に絞っています。

## コード

::: code-group

```cpp:line-numbers=171 [日本語訳]
template <typename _Tp, __enable_if_t<is_unsigned<_Tp>::value, int> = 0>
inline _LIBCPP_CONSTEXPR_SINCE_CXX23 from_chars_result
__from_chars_integral(const char* __first, const char* __last, _Tp& __value, int __base) {
  if (__base == 10)
    return std::__from_chars_atoi(__first, __last, __value);

  return std::__subject_seq_combinator(
      __first,
      __last,
      __value,
      [](const char* __p, const char* __lastp, _Tp& __val, int __b) -> from_chars_result {
        using __tl = numeric_limits<_Tp>;
        // __base は常に 2 以上 36 以下。
        auto __digits = __tl::digits / __from_chars_log2f_lut[__b - 2];
        _Tp __x = __in_pattern(*__p++, __b).__val, __y = 0;

        for (int __i = 1; __p != __lastp; ++__i, ++__p) {
          if (auto __c = __in_pattern(*__p, __b)) {
            if (__i < __digits - 1)
              __x = __x * __b + __c.__val;
            else {
              if (!__itoa::__mul_overflowed(__x, __b, __x))
                ++__p;
              __y = __c.__val;
              break;
            }
          } else
            break;
        }

        if (__p == __lastp || !__in_pattern(*__p, __b)) {
          if (__tl::max() - __x >= __y) {
            __val = __x + __y;
            return {__p, {}};
          }
        }
        return {__p, errc::result_out_of_range};
      },
      __base);
}
```

```cpp:line-numbers=171 [原文]
template <typename _Tp, __enable_if_t<is_unsigned<_Tp>::value, int> = 0>
inline _LIBCPP_CONSTEXPR_SINCE_CXX23 from_chars_result
__from_chars_integral(const char* __first, const char* __last, _Tp& __value, int __base) {
  if (__base == 10)
    return std::__from_chars_atoi(__first, __last, __value);

  return std::__subject_seq_combinator(
      __first,
      __last,
      __value,
      [](const char* __p, const char* __lastp, _Tp& __val, int __b) -> from_chars_result {
        using __tl = numeric_limits<_Tp>;
        // __base is always between 2 and 36 inclusive.
        auto __digits = __tl::digits / __from_chars_log2f_lut[__b - 2];
        _Tp __x = __in_pattern(*__p++, __b).__val, __y = 0;

        for (int __i = 1; __p != __lastp; ++__i, ++__p) {
          if (auto __c = __in_pattern(*__p, __b)) {
            if (__i < __digits - 1)
              __x = __x * __b + __c.__val;
            else {
              if (!__itoa::__mul_overflowed(__x, __b, __x))
                ++__p;
              __y = __c.__val;
              break;
            }
          } else
            break;
        }

        if (__p == __lastp || !__in_pattern(*__p, __b)) {
          if (__tl::max() - __x >= __y) {
            __val = __x + __y;
            return {__p, {}};
          }
        }
        return {__p, errc::result_out_of_range};
      },
      __base);
}
```

:::

## 前提知識

- **`template <typename _Tp, __enable_if_t<is_unsigned<_Tp>::value, int> = 0>`**: 符号なし整数型のときだけ使われるテンプレートです（符号付き用はこの関数の後ろに別にあります）。
- **ラムダ式 `[](...) -> from_chars_result { ... }`**: その場で作る名前のない関数です。`[]` は外の変数を取り込まないことを示し、`->` の後ろは戻り値の型です。ここでは「数字列の読み取り本体」をラムダにして、共通部品 `__subject_seq_combinator` に渡しています。この部品が先頭の 0 を読み飛ばし、数字が 1 つもなければエラーにします。
- **`__in_pattern(c, base)`**: 文字 `c` が基数 `base` の数字として有効かと、その値を返します。`'a'` や `'A'` は 10 になります。
- **`if (auto __c = ...)`**: 変数を宣言しながら条件判定します。`__in_pattern` の戻り値は `bool` に変換でき（有効な数字なら真）、中身の値は `__c.__val` で取れます。
- **`__mul_overflowed(a, b, r)`**: `a * b` を `r` に入れ、桁あふれしたら `true` を返します。
- **`__from_chars_log2f_lut`**: 関数の直前にある、基数 2〜36 の log2 の値の表です（2 → 1、16 → 4、10 → 約 3.32 など）。

## 何をしているか

### 1. 10 進は専用の道へ

```cpp:line-numbers=174
  if (__base == 10)
    return std::__from_chars_atoi(__first, __last, __value);
```

基数 10 は最もよく使われるので、別の速い実装 `__from_chars_atoi` に任せます。

### 2. 安全な桁数を見積もる

```cpp:line-numbers=184
        auto __digits = __tl::digits / __from_chars_log2f_lut[__b - 2];
```

`__digits = 型のビット数 / log2(基数)` は「その型で表せる基数 b の桁数」の目安です。

- 32 ビット、16 進: `32 / 4 = 8` 桁
- 32 ビット、3 進: `32 / 1.585 ≈ 20.2` 桁

### 3. 安全なうちは検査なし

```cpp:line-numbers=185
        _Tp __x = __in_pattern(*__p++, __b).__val, __y = 0;

        for (int __i = 1; __p != __lastp; ++__i, ++__p) {
          if (auto __c = __in_pattern(*__p, __b)) {
            if (__i < __digits - 1)
              __x = __x * __b + __c.__val;
```

1 桁目を `__x` に入れ、`__i < __digits - 1` の間は `__x = __x * __b + 値` を検査せずに続けます。16 進 32 ビットなら 7 桁目まで、つまり最大 `0x0FFFFFFF` までで、確実に収まります。

### 4. 最後の 1 桁は慎重に

```cpp:line-numbers=191
            else {
              if (!__itoa::__mul_overflowed(__x, __b, __x))
                ++__p;
              __y = __c.__val;
              break;
            }
```

8 桁目に来たら、`__x * 16` を **桁あふれ検出付き** で計算します。あふれなければ読み位置を進め、8 桁目の値を `__y` に取っておいてループを抜けます。あふれたら読み位置を進めずに抜けます。

### 5. 最終確認

```cpp:line-numbers=201
        if (__p == __lastp || !__in_pattern(*__p, __b)) {
          if (__tl::max() - __x >= __y) {
            __val = __x + __y;
            return {__p, {}};
          }
        }
        return {__p, errc::result_out_of_range};
```

読み位置の次がもう数字でなく、さらに `max - __x >= __y`（足しても最大値を超えない）なら成功です。

8 ビットの `unsigned char` で 16 進を読む例で確かめます。`__digits = 8 / 4 = 2` です。

- `"ff"`: `__x = 15`。2 桁目で `15 × 16 = 240`（あふれない）、`__y = 15`。`255 - 240 >= 15` なので **255**。
- `"1ff"`: `__x = 1`。2 桁目で `16`、`__y = 15`。読み位置の次に `'f'` が残っているので **範囲外**。

## ここがすごい

素直な実装は、1 桁ごとに「`x * b + d` があふれないか」を確かめます。正しく書くには割り算を含む検査が要り、それが毎桁実行されます。

この関数は、数学的な見積もり **「n ビットの型には、b 進でおよそ n / log2(b) 桁が入る」** を使って、検査が必要な場所を最後の 1 桁だけに絞っています。それより前は掛け算と足し算だけで、検査のコストがかかりません。

log2 の値を実行時に計算せず、表にしているのも工夫です。表の直前には、その表を生成したプログラムがコメントとして残されています。値の出どころが明らかなので、検証も再生成もできます。

足し算の検査を `max - __x >= __y` と **引き算の形** で書いているのも定石です。`__x + __y <= max` と書くと、その足し算自体があふれてしまうからです。

## まとめ

- 「何桁までならあふれないか」を先に求めると、検査を最後の桁だけに減らせる。
- n ビットに入る b 進の桁数は、およそ n / log2(b)。
- 定数の表は、生成したコードをコメントに残しておくと信頼できる。
- 加算のあふれ検査は `max - a >= b` の形で書く。
