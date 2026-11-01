---
title: 掛ける前に「あふれるか」を確かめる安全な整数パース
description: 文字列を整数に変換する関数の正の数版。桁を足すたびに、掛け算と足し算の前にあふれを判定し、あふれたら最大値を入れて失敗を返す。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/strings/numbers.cc
lines: [1476, 1511]
function: safe_parse_positive_int
difficulty: 2
tags: [パース, 防御的プログラミング, エラー処理]
---

## ひとことで

`safe_parse_positive_int` は、`"12345"` のような数字の列を整数に変換する関数です。`absl::SimpleAtoi` などの中で、正の数を読むときに使われます。
名前の「safe」のとおり、**途中で型の最大値を超えそうになったら、超える前に検出** します。あふれた場合は最大値を書き込んで `false` を返します。

## コード

::: code-group

```cpp:line-numbers=1476 [日本語訳]
template <typename IntType>
inline bool safe_parse_positive_int(absl::string_view text, int base,
                                    IntType* absl_nonnull value_p) {
  IntType value = 0;
  const IntType vmax = std::numeric_limits<IntType>::max();
  assert(vmax > 0);
  assert(base >= 0);
  const IntType base_inttype = static_cast<IntType>(base);
  assert(vmax >= base_inttype);
  const IntType vmax_over_base = LookupTables<IntType>::kVmaxOverBase[base];
  assert(base < 2 ||
         std::numeric_limits<IntType>::max() / base_inttype == vmax_over_base);
  const char* start = text.data();
  const char* end = start + text.size();
  // 桁ごとにループする
  for (; start < end; ++start) {
    unsigned char c = static_cast<unsigned char>(start[0]);
    IntType digit = static_cast<IntType>(kAsciiToInt[c]);
    if (digit >= base_inttype) {
      *value_p = value;
      return false;
    }
    if (value > vmax_over_base) {
      *value_p = vmax;
      return false;
    }
    value *= base_inttype;
    if (value > vmax - digit) {
      *value_p = vmax;
      return false;
    }
    value += digit;
  }
  *value_p = value;
  return true;
}
```

```cpp:line-numbers=1476 [原文]
template <typename IntType>
inline bool safe_parse_positive_int(absl::string_view text, int base,
                                    IntType* absl_nonnull value_p) {
  IntType value = 0;
  const IntType vmax = std::numeric_limits<IntType>::max();
  assert(vmax > 0);
  assert(base >= 0);
  const IntType base_inttype = static_cast<IntType>(base);
  assert(vmax >= base_inttype);
  const IntType vmax_over_base = LookupTables<IntType>::kVmaxOverBase[base];
  assert(base < 2 ||
         std::numeric_limits<IntType>::max() / base_inttype == vmax_over_base);
  const char* start = text.data();
  const char* end = start + text.size();
  // loop over digits
  for (; start < end; ++start) {
    unsigned char c = static_cast<unsigned char>(start[0]);
    IntType digit = static_cast<IntType>(kAsciiToInt[c]);
    if (digit >= base_inttype) {
      *value_p = value;
      return false;
    }
    if (value > vmax_over_base) {
      *value_p = vmax;
      return false;
    }
    value *= base_inttype;
    if (value > vmax - digit) {
      *value_p = vmax;
      return false;
    }
    value += digit;
  }
  *value_p = value;
  return true;
}
```

:::

## 前提知識

- **`template <typename IntType>`**: 型を引数にとるテンプレートです。`int32_t` でも `int64_t` でも `uint64_t` でも、同じコードから専用の関数が作られます。
- **`absl::string_view`**: 文字列の「先頭のポインタ」と「長さ」だけを持つ、コピーしない文字列の参照です。`text.data()` で先頭、`text.size()` で長さが得られます。
- **`IntType* value_p`**: 結果を書き込む先を指すポインタです。`*value_p = value;` で呼び出し元の変数に値が入ります。
- **`std::numeric_limits<IntType>::max()`**: その型の最大値です。`int32_t` なら 2147483647 です。
- **符号付き整数のあふれは未定義動作**: `int32_t` で 2147483647 を超える計算をすると、C++ では何が起きても文句が言えません。だから「あふれてから気づく」のではなく **「あふれる前に止める」** 必要があります。
- **`kAsciiToInt`**: 文字コード 256 通りに対応する表で、`'0'`〜`'9'` は 0〜9、`'a'`〜`'z'` と `'A'`〜`'Z'` は 10〜35、それ以外は 36 を返します（同じファイルの上で定義）。
- **`LookupTables<IntType>::kVmaxOverBase[base]`**: 「最大値 ÷ 基数」をあらかじめ計算しておいた表です。

## 何をしているか

`IntType = int32_t`、`base = 10` で考えます。最大値は `2147483647` です。

### 1. 準備

```cpp:line-numbers=1479
  IntType value = 0;
  const IntType vmax = std::numeric_limits<IntType>::max();
  assert(vmax > 0);
  assert(base >= 0);
  const IntType base_inttype = static_cast<IntType>(base);
  assert(vmax >= base_inttype);
  const IntType vmax_over_base = LookupTables<IntType>::kVmaxOverBase[base];
  assert(base < 2 ||
         std::numeric_limits<IntType>::max() / base_inttype == vmax_over_base);
```

`vmax_over_base` は `2147483647 / 10 = 214748364` です。毎回割り算をしないよう、表から引いています。`assert` は、表の値が実際の割り算の結果と一致することをデバッグ時に確かめています。

### 2. 1 文字を数字に変える

```cpp:line-numbers=1491
  for (; start < end; ++start) {
    unsigned char c = static_cast<unsigned char>(start[0]);
    IntType digit = static_cast<IntType>(kAsciiToInt[c]);
    if (digit >= base_inttype) {
      *value_p = value;
      return false;
    }
```

文字を表で数字に変え、それが基数以上なら数字ではないと判断します。10 進数で `'a'`（10）が来たら、ここで止まります。それまでに読んだ値を書き込んで `false` を返します。
数字以外の文字がすべて 36 になる表なので、「数字かどうか」と「基数の範囲内かどうか」の判定が比較 1 回で済みます。

### 3. 掛け算の前に確かめる

```cpp:line-numbers=1498
    if (value > vmax_over_base) {
      *value_p = vmax;
      return false;
    }
    value *= base_inttype;
```

`value * 10` があふれるのは、`value > 214748364` のときです。それを **掛ける前に** 比べます。

### 4. 足し算の前に確かめる

```cpp:line-numbers=1503
    if (value > vmax - digit) {
      *value_p = vmax;
      return false;
    }
    value += digit;
```

掛け算のあとで `value + digit` があふれるのは、`value > vmax - digit` のときです。これも **足す前に** 比べます。

`"2147483648"`（最大値 + 1）で追ってみます。

- 9 文字目までで `value = 214748364` です。
- 10 文字目の `'8'`: `214748364 > 214748364` は偽なので掛け算をし、`value = 2147483640` です。
- `2147483640 > 2147483647 - 8 = 2147483639` は真なので、あふれると判断します。`*value_p` に最大値を入れて `false` を返します。

`"2147483647"` なら最後の比較が `2147483640 > 2147483640` で偽になり、正しく最大値が得られます。

## ここがすごい

- **未定義動作を一度も起こさない**: すべての判定が「計算する前」に行われるので、符号付き整数でもあふれは起きません。あふれてから値が負になったかどうかを見る、という書き方は C++ では正しくありません。
- **判定の式自体もあふれない**: `value * base > vmax` と書くと、その掛け算自体があふれます。`value > vmax / base`、`value > vmax - digit` という形に変形することで、判定の計算もあふれない範囲に収めています。
- **割り算を表引きにする**: `vmax / base` は型と基数だけで決まるので、表にしておけます。ループの中はもちろん、関数の入口でも割り算をしません。
- **失敗しても役に立つ値を残す**: 数字以外の文字なら「そこまでの値」、あふれたら「最大値」を書き込みます。C の `strtol` がオーバーフロー時に最大値を返すのと同じ考え方です（呼び出し元の `safe_int_internal` のコメントでも、`strtol` の仕様を元にしていると書かれています）。

## まとめ

- 符号付き整数のあふれは未定義動作なので、計算する前に判定する。
- `a * b > max` は `a > max / b`、`a + b > max` は `a > max - b` に変形すれば、判定式があふれない。
- 型と基数で決まる値は表にして、実行時の割り算を省く。
- 「数字でない文字は大きな値」にする表を使うと、判定が比較 1 回にまとまる。
