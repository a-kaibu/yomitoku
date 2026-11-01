---
title: 桁数を数えるだけで int のあふれを見抜く数値パーサ
description: 書式文字列の幅や精度などの数字を読む関数。符号なしで計算しながら桁数を数え、9 桁以下なら無条件で安全、10 桁ちょうどのときだけ 64 ビットで最後の 1 桁を確かめる。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/core.h
lines: [1306, 1329]
function: detail::parse_nonnegative_int
difficulty: 2
format: 2
tags: [パース, 防御的プログラミング, エラー処理]
---

## ひとことで

`fmt::format("{:10.3}", x)` の `10` や `3` のように、書式文字列の中の数字を読む関数です。`"123}"` を読めば 123 を返し、読み取り位置を `}` の手前まで進めます。

大きすぎて `int` に入らない数（`"99999999999"` など）なら、呼び出し側が指定した `error_value` を返します。そのあふれの判定がとても安上がりです。

## コード

::: code-group

```cpp:line-numbers=1306 [日本語訳]
// [begin, end) の範囲を符号なし整数として解析する。この関数は、範囲が
// 空でなく、最初の文字が数字であることを前提とする。
template <typename Char>
FMT_CONSTEXPR auto parse_nonnegative_int(const Char*& begin, const Char* end,
                                         int error_value) noexcept -> int {
  FMT_ASSERT(begin != end && '0' <= *begin && *begin <= '9', "");
  unsigned value = 0, prev = 0;
  auto p = begin;
  do {
    prev = value;
    value = value * 10 + unsigned(*p - '0');
    ++p;
  } while (p != end && '0' <= *p && *p <= '9');
  auto num_digits = p - begin;
  begin = p;
  int digits10 = int(sizeof(int) * CHAR_BIT * 3 / 10);
  if (num_digits <= digits10) return int(value);
  // あふれを調べる。
  unsigned max = INT_MAX;
  return num_digits == digits10 + 1 &&
                 prev * 10ull + unsigned(p[-1] - '0') <= max
             ? int(value)
             : error_value;
}
```

```cpp:line-numbers=1306 [原文]
// Parses the range [begin, end) as an unsigned integer. This function assumes
// that the range is non-empty and the first character is a digit.
template <typename Char>
FMT_CONSTEXPR auto parse_nonnegative_int(const Char*& begin, const Char* end,
                                         int error_value) noexcept -> int {
  FMT_ASSERT(begin != end && '0' <= *begin && *begin <= '9', "");
  unsigned value = 0, prev = 0;
  auto p = begin;
  do {
    prev = value;
    value = value * 10 + unsigned(*p - '0');
    ++p;
  } while (p != end && '0' <= *p && *p <= '9');
  auto num_digits = p - begin;
  begin = p;
  int digits10 = int(sizeof(int) * CHAR_BIT * 3 / 10);
  if (num_digits <= digits10) return int(value);
  // Check for overflow.
  unsigned max = INT_MAX;
  return num_digits == digits10 + 1 &&
                 prev * 10ull + unsigned(p[-1] - '0') <= max
             ? int(value)
             : error_value;
}
```

:::

## 前提知識

- **`const Char*& begin`**: 「ポインタへの参照」です。関数の中で `begin = p` とすると、呼び出し元のポインタ自体が進みます。読んだ文字数を別に返さなくて済みます。
- **`*p - '0'`**: 数字の文字コードから `'0'` を引くと、その数字の値（0〜9）になります。
- **`unsigned`**: 符号なし整数です。あふれても未定義動作にならず、2^32 で割った余りになる（巻き戻る）と決まっています。
- **`CHAR_BIT` / `INT_MAX`**: 1 バイトのビット数（普通 8）と、`int` の最大値（普通 2147483647）を表す標準のマクロです。
- **`p[-1]`**: ポインタ `p` の 1 つ手前の文字です。ここでは最後に読んだ数字です。
- **`10ull`**: 64 ビット以上の符号なし整数の定数です。これと掛けると計算が 64 ビットで行われます。

## 何をしているか

### 1. 数字が続く限り読む

```cpp:line-numbers=1312
  unsigned value = 0, prev = 0;
  auto p = begin;
  do {
    prev = value;
    value = value * 10 + unsigned(*p - '0');
    ++p;
  } while (p != end && '0' <= *p && *p <= '9');
```

`value` に 10 倍して足していきます。`prev` には「最後の 1 桁を足す前の値」を残しておきます。`unsigned` なので、桁数が多すぎて巻き戻っても問題は起きません（後で捨てるだけです）。

### 2. 9 桁以下なら必ず安全

```cpp:line-numbers=1319
  auto num_digits = p - begin;
  begin = p;
  int digits10 = int(sizeof(int) * CHAR_BIT * 3 / 10);
  if (num_digits <= digits10) return int(value);
```

`digits10` は `32 × 3 / 10 = 9` です。`int` の最大値は 10 桁の 2147483647 なので、9 桁以下の数は必ず収まります。ほとんどの入力はここで返ります。

### 3. 10 桁ちょうどのときだけ詳しく調べる

```cpp:line-numbers=1323
  // あふれを調べる。
  unsigned max = INT_MAX;
  return num_digits == digits10 + 1 &&
                 prev * 10ull + unsigned(p[-1] - '0') <= max
             ? int(value)
             : error_value;
```

`"2147483647"`（10 桁）を読んだ場合、`prev` は 214748364 です。`prev × 10 + 7` を **64 ビットで** 計算すると 2147483647 で、`INT_MAX` 以下なので OK です。

`"2147483648"` なら 2147483648 で `INT_MAX` を超えるので `error_value` を返します。11 桁以上は無条件でエラーです。

## ここがすごい

- **よくある場合は比較 1 回**: 幅や精度は普通 1〜2 桁です。「桁数が 9 以下か」だけで安全と判断でき、1 桁ごとのあふれチェックがいりません。
- **最後の 1 桁だけを 64 ビットで**: 10 桁の場合も、前の 9 桁は 32 ビットに確実に収まっています（`prev`）。最後の掛け算と足し算だけを 64 ビットで行えば、正確に判定できます。
- **符号なしで計算する理由**: 符号付きの `int` があふれると C++ では未定義動作です。`unsigned` で計算しておけば、あふれても決まった値になるので、「あとで捨てる」が安全にできます。
- **エラー値を呼び出し側が決める**: 幅なのか引数の番号なのかで、エラーの扱いは違います。`error_value` を受け取る設計にして、この関数は判定だけに専念しています。
- **型の大きさから計算**: `sizeof(int) * CHAR_BIT * 3 / 10` は、`int` が 32 ビットでない環境でも安全な桁数を求めます（log10(2) ≒ 0.3 を 3/10 で近似）。

## まとめ

- 「桁数が十分少なければ安全」とわかれば、あふれのチェックを省ける。
- 境目の桁数のときだけ、広い型で最後の 1 桁を確かめればよい。
- あふれる可能性のある計算は、符号なし整数で行うと未定義動作を避けられる。
- ポインタの参照を受け取ると、読み進めた位置を呼び出し元に返せる。
