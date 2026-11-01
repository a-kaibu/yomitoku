---
title: 負の数は「マイナス方向に」積み上げて INT_MIN まで読む
description: 文字列を負の整数に変換する関数。正の数として読んでから符号を反転すると最小値が表せないので、最初から負の値として桁を積み上げる。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/strings/numbers.cc
lines: [1513, 1554]
function: safe_parse_negative_int
difficulty: 3
tags: [パース, 防御的プログラミング, 移植性]
---

## ひとことで

`safe_parse_negative_int` は、`"-123"` の符号を取り除いた `"123"` を受け取り、**負の整数 -123** を作る関数です。
ふつうは「123 として読んでから -1 を掛ける」と考えます。しかしそれでは `int32_t` の最小値 `-2147483648` が読めません。正の `2147483648` が `int32_t` に入らないからです。この関数は、**最初から負の方向に値を積み上げる** ことでこの問題を避けています。

## コード

::: code-group

```cpp:line-numbers=1513 [日本語訳]
template <typename IntType>
inline bool safe_parse_negative_int(absl::string_view text, int base,
                                    IntType* absl_nonnull value_p) {
  IntType value = 0;
  const IntType vmin = std::numeric_limits<IntType>::min();
  assert(vmin < 0);
  assert(vmin <= 0 - base);
  IntType vmin_over_base = LookupTables<IntType>::kVminOverBase[base];
  assert(base < 2 ||
         std::numeric_limits<IntType>::min() / base == vmin_over_base);
  // 2003 年の C++ 規格 [expr.mul]
  // 「… 余りの符号は処理系定義である」
  // ただし (vmin/base)*base + vmin%base は常に vmin になる。
  // 2011 年の C++ 規格は仕様を厳しくしたが、それに頼ることはできない。
  // TODO(junyer): これは表を生成するときに処理する。
  if (vmin % base > 0) {
    vmin_over_base += 1;
  }
  const char* start = text.data();
  const char* end = start + text.size();
  // 桁ごとにループする
  for (; start < end; ++start) {
    unsigned char c = static_cast<unsigned char>(start[0]);
    int digit = kAsciiToInt[c];
    if (digit >= base) {
      *value_p = value;
      return false;
    }
    if (value < vmin_over_base) {
      *value_p = vmin;
      return false;
    }
    value *= base;
    if (value < vmin + digit) {
      *value_p = vmin;
      return false;
    }
    value -= digit;
  }
  *value_p = value;
  return true;
}
```

```cpp:line-numbers=1513 [原文]
template <typename IntType>
inline bool safe_parse_negative_int(absl::string_view text, int base,
                                    IntType* absl_nonnull value_p) {
  IntType value = 0;
  const IntType vmin = std::numeric_limits<IntType>::min();
  assert(vmin < 0);
  assert(vmin <= 0 - base);
  IntType vmin_over_base = LookupTables<IntType>::kVminOverBase[base];
  assert(base < 2 ||
         std::numeric_limits<IntType>::min() / base == vmin_over_base);
  // 2003 c++ standard [expr.mul]
  // "... the sign of the remainder is implementation-defined."
  // Although (vmin/base)*base + vmin%base is always vmin.
  // 2011 c++ standard tightens the spec but we cannot rely on it.
  // TODO(junyer): Handle this in the lookup table generation.
  if (vmin % base > 0) {
    vmin_over_base += 1;
  }
  const char* start = text.data();
  const char* end = start + text.size();
  // loop over digits
  for (; start < end; ++start) {
    unsigned char c = static_cast<unsigned char>(start[0]);
    int digit = kAsciiToInt[c];
    if (digit >= base) {
      *value_p = value;
      return false;
    }
    if (value < vmin_over_base) {
      *value_p = vmin;
      return false;
    }
    value *= base;
    if (value < vmin + digit) {
      *value_p = vmin;
      return false;
    }
    value -= digit;
  }
  *value_p = value;
  return true;
}
```

:::

## 前提知識

- **2 の補数の非対称性**: `int32_t` の範囲は `-2147483648` 〜 `2147483647` です。負の側が 1 つ多いので、最小値の符号を反転した値は表せません。
- **符号付き整数のあふれは未定義動作**: 範囲を超える計算をしてはいけないので、計算の前に判定します。
- **`std::numeric_limits<IntType>::min()`**: その型の最小値です。
- **`LookupTables<IntType>::kVminOverBase[base]`**: 「最小値 ÷ 基数」をあらかじめ計算した表です。
- **`kAsciiToInt`**: 文字を数字の値（`'0'`〜`'9'` は 0〜9、英字は 10〜35、その他は 36）に変える表です。
- **負の数の割り算と余り**: C++11 以降は、割り算は 0 の方向に切り捨て、余りは割られる数と同じ符号になると決まっています。`-7 / 2 = -3`、`-7 % 2 = -1` です。古い規格では処理系によって違ってもよいことになっていました。

## 何をしているか

呼び出し元の `safe_int_internal` は、符号を読んだあとでこの関数と正の数版を使い分けています。

```cpp:line-numbers=1556
// Input format based on POSIX.1-2008 strtol
// http://pubs.opengroup.org/onlinepubs/9699919799/functions/strtol.html
template <typename IntType>
inline bool safe_int_internal(absl::string_view text,
                              IntType* absl_nonnull value_p, int base) {
  *value_p = 0;
  bool negative;
  if (!safe_parse_sign_and_base(&text, &base, &negative)) {
    return false;
  }
  if (!negative) {
    return safe_parse_positive_int(text, base, value_p);
  } else {
    return safe_parse_negative_int(text, base, value_p);
  }
}
```

`int32_t`、10 進数、入力 `"2147483648"`（`-2147483648` の符号を除いたもの）で追います。

### 1. 最小値 ÷ 基数を用意する

```cpp:line-numbers=1516
  IntType value = 0;
  const IntType vmin = std::numeric_limits<IntType>::min();
  assert(vmin < 0);
  assert(vmin <= 0 - base);
  IntType vmin_over_base = LookupTables<IntType>::kVminOverBase[base];
  assert(base < 2 ||
         std::numeric_limits<IntType>::min() / base == vmin_over_base);
  // 2003 年の C++ 規格 [expr.mul]
  // 「… 余りの符号は処理系定義である」
  // ただし (vmin/base)*base + vmin%base は常に vmin になる。
  // 2011 年の C++ 規格は仕様を厳しくしたが、それに頼ることはできない。
  // TODO(junyer): これは表を生成するときに処理する。
  if (vmin % base > 0) {
    vmin_over_base += 1;
  }
```

`vmin_over_base` は `-2147483648 / 10 = -214748364` です（0 の方向に切り捨て）。

もし処理系が「負の無限大の方向に切り捨てる」古い規格の動作をしていたら、表の値は `-214748365` になり、余り `vmin % base` は正の数 `2` になります。そのときは 1 を足して `-214748364` に直します。コメントにあるとおり、どちらの場合でも `(vmin/base)*base + vmin%base == vmin` が成り立つことを利用した補正です。

### 2. 掛け算の前に確かめる

```cpp:line-numbers=1541
    if (value < vmin_over_base) {
      *value_p = vmin;
      return false;
    }
    value *= base;
```

`value * 10` が最小値を下回るのは、`value < -214748364` のときです。9 文字目まで読んだ `value = -214748364` は等しいだけなので、掛け算をして `-2147483640` になります。

### 3. 足し算（引き算）の前に確かめる

```cpp:line-numbers=1546
    if (value < vmin + digit) {
      *value_p = vmin;
      return false;
    }
    value -= digit;
```

最後の桁 `8` を **引き** ます。引いた結果が最小値を下回るのは、`value < vmin + digit` のときです。

- `vmin + 8 = -2147483640` で、`value = -2147483640` は等しいだけなので通ります。
- `value -= 8` で `-2147483648` になり、ちょうど最小値が読めました。

入力が `"2147483649"` なら、`vmin + 9 = -2147483639` で、`-2147483640 < -2147483639` が真になります。あふれると判断して最小値を書き込み、`false` を返します。

## ここがすごい

- **正の数で読むと読めない値がある**: 「正で読んで反転」だと、`-2147483648` を読む途中で `2147483648` を作る必要があり、それは `int32_t` ではあふれ（未定義動作）です。負の側で積み上げれば、範囲の広い負の側で計算できるので、最小値までぴったり読めます。
- **正と負で関数を分ける**: 1 つの関数で符号を見ながら分岐するより、正の数版と負の数版を分けたほうが、ループの中に余計な分岐がありません。判定の不等号の向きが逆になるだけで、構造はそっくりです。
- **古い規格まで考えた補正**: C++11 より前は、負の数の割り算の丸め方が処理系次第でした。表の値がどちらの丸め方で作られても正しく動くよう、余りの符号を見て補正しています。移植性への徹底したこだわりです。
- **`assert(vmin <= 0 - base)`**: 最小値が基数より十分小さいことを確かめています。`0 - base` は、符号付きの「マイナス基数」を確実に作る書き方です。

## まとめ

- 2 の補数では最小値の絶対値が表せない。負の数は負の方向に積み上げて読む。
- あふれの判定は、掛け算の前と足し算（引き算）の前の 2 か所で、判定式自体があふれない形にする。
- 正と負で同じ構造の関数を分けると、ループが単純になる。
- 負の数の割り算と余りの丸め方は、古い規格では処理系依存だった。
