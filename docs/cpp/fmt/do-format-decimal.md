---
title: 割り算を掛け算に化かして 2 桁ずつ書く整数→文字列変換
description: 符号なし整数を 10 進文字列に変える {fmt} の中心的な関数。右から 2 桁ずつ書き、32 ビットでは割り算を掛け算とシフトに置き換え、128 ビットは 19 桁ずつに分割する。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1434, 1483]
function: detail::do_format_decimal
difficulty: 3
format: 2
tags: [最適化, 数値計算, 文字列処理, ビット演算]
---

## ひとことで

`do_format_decimal(out, value, size)` は、符号なし整数 `value` を 10 進の文字列にして `out` に書き込みます。`size` はあらかじめ数えておいた桁数です。

`12345` なら `out` に `"12345"` が書かれます。工夫は 3 つあります。**右から 2 桁ずつ書く**、**32 ビットでは割り算を掛け算に置き換える**、**128 ビットは 19 桁ずつに分けて処理する** です。

## コード

::: code-group

```cpp:line-numbers=1434 [日本語訳]
// 符号なし整数 value を 10 進で、指定サイズのバッファを指す out に書き込む。
// バッファが十分大きいことは呼び出し側が保証しなければならない。
template <typename Char, typename UInt>
FMT_CONSTEXPR20 auto do_format_decimal(Char* out, UInt value, int size)
    -> Char* {
  FMT_ASSERT(size >= count_digits(value), "invalid digit count");
#if FMT_USE_INT128
  // 遅い 128 ビットの割り算を避けるため、19 桁ずつの 64 ビットの塊で書く。
  if (!is_constant_evaluated() && num_bits<UInt>() == 128) {
    const uint64_t pow10_19 = 10000000000000000000ULL;
    auto v = static_cast<native_uint128>(value);
    unsigned pos = to_unsigned(size);
    while ((v >> 64) != 0) {
      auto chunk = static_cast<uint64_t>(v % pow10_19);
      v /= pow10_19;
      pos -= 19;
      fill_n(out + pos, 19, Char('0'));
      do_format_decimal(out + pos, chunk, 19);
    }
    auto top = static_cast<uint64_t>(v);
    int top_digits = count_digits(top);
    pos -= to_unsigned(top_digits);
    do_format_decimal(out + pos, top, top_digits);
    return out + pos;
  }
#endif  // FMT_USE_INT128
  unsigned n = to_unsigned(size);
  while (value >= 100) {
    n -= 2;
    if (!is_constant_evaluated() && num_bits<UInt>() == 32) {
      auto p = value * static_cast<uint64_t>((1ull << 39) / 100 + 1);
      write2digits_i(out + n, p >> (39 - 7) & ((1 << 7) - 1));
      value = static_cast<UInt>(p >> 39) +
              (static_cast<UInt>(value >= (100u << 25)) << 25);
    } else {
      // 整数の割り算は遅いので、1 桁ごとではなく 2 桁のまとまりごとに
      // 割る。このアイデアは Alexandrescu の講演
      // "Three Optimization Tips for C++" による。比較は speed-test を参照。
      write2digits(out + n, static_cast<unsigned>(value % 100));
      value /= 100;
    }
  }
  if (value >= 10) {
    n -= 2;
    write2digits(out + n, static_cast<unsigned>(value));
  } else {
    out[--n] = static_cast<Char>('0' + value);
  }
  return out + n;
}
```

```cpp:line-numbers=1434 [原文]
// Formats a decimal unsigned integer value writing to out pointing to a buffer
// of specified size. The caller must ensure that the buffer is large enough.
template <typename Char, typename UInt>
FMT_CONSTEXPR20 auto do_format_decimal(Char* out, UInt value, int size)
    -> Char* {
  FMT_ASSERT(size >= count_digits(value), "invalid digit count");
#if FMT_USE_INT128
  // Avoid slow 128-bit division by formatting 64-bit chunks of 19 digits each.
  if (!is_constant_evaluated() && num_bits<UInt>() == 128) {
    const uint64_t pow10_19 = 10000000000000000000ULL;
    auto v = static_cast<native_uint128>(value);
    unsigned pos = to_unsigned(size);
    while ((v >> 64) != 0) {
      auto chunk = static_cast<uint64_t>(v % pow10_19);
      v /= pow10_19;
      pos -= 19;
      fill_n(out + pos, 19, Char('0'));
      do_format_decimal(out + pos, chunk, 19);
    }
    auto top = static_cast<uint64_t>(v);
    int top_digits = count_digits(top);
    pos -= to_unsigned(top_digits);
    do_format_decimal(out + pos, top, top_digits);
    return out + pos;
  }
#endif  // FMT_USE_INT128
  unsigned n = to_unsigned(size);
  while (value >= 100) {
    n -= 2;
    if (!is_constant_evaluated() && num_bits<UInt>() == 32) {
      auto p = value * static_cast<uint64_t>((1ull << 39) / 100 + 1);
      write2digits_i(out + n, p >> (39 - 7) & ((1 << 7) - 1));
      value = static_cast<UInt>(p >> 39) +
              (static_cast<UInt>(value >= (100u << 25)) << 25);
    } else {
      // Integer division is slow so do it for a group of two digits instead
      // of for every digit. The idea comes from the talk by Alexandrescu
      // "Three Optimization Tips for C++". See speed-test for a comparison.
      write2digits(out + n, static_cast<unsigned>(value % 100));
      value /= 100;
    }
  }
  if (value >= 10) {
    n -= 2;
    write2digits(out + n, static_cast<unsigned>(value));
  } else {
    out[--n] = static_cast<Char>('0' + value);
  }
  return out + n;
}
```

:::

## 前提知識

- **テンプレート `<typename Char, typename UInt>`**: `Char` は文字の型（`char` や `wchar_t`）、`UInt` は整数の型（32 / 64 / 128 ビット）です。型ごとに別の関数が作られます。
- **`Char* out`**: 書き込み先の先頭を指すポインタです。`out + n` は n 文字先の位置、`out[--n] = ...` は「n を 1 減らしてから、その位置に書く」です。
- **`#if FMT_USE_INT128`**: 128 ビット整数が使える環境だけ、その部分をコンパイルします。
- **`is_constant_evaluated()`**: 今コンパイル時に実行されているかを返します。コンパイル時は単純な方法、実行時は速い方法、と切り替えるのに使います。
- **`num_bits<UInt>()`**: 型のビット数を返す {fmt} の関数です。テンプレートの型が決まればコンパイル時に定数になるので、使わない分岐は消えます。
- **`static_cast<T>(x)`**: 型を明示的に変換します。
- **`1ull << 39`**: 2 の 39 乗です。

## 何をしているか

### 1. 128 ビットは 19 桁ずつに割る

```cpp:line-numbers=1440
#if FMT_USE_INT128
  // 遅い 128 ビットの割り算を避けるため、19 桁ずつの 64 ビットの塊で書く。
  if (!is_constant_evaluated() && num_bits<UInt>() == 128) {
    const uint64_t pow10_19 = 10000000000000000000ULL;
    auto v = static_cast<native_uint128>(value);
    unsigned pos = to_unsigned(size);
    while ((v >> 64) != 0) {
      auto chunk = static_cast<uint64_t>(v % pow10_19);
      v /= pow10_19;
      pos -= 19;
      fill_n(out + pos, 19, Char('0'));
      do_format_decimal(out + pos, chunk, 19);
    }
    auto top = static_cast<uint64_t>(v);
    int top_digits = count_digits(top);
    pos -= to_unsigned(top_digits);
    do_format_decimal(out + pos, top, top_digits);
    return out + pos;
  }
```

128 ビット整数の割り算は、ライブラリ関数を呼ぶ遅い処理です。そこで、64 ビットに収まる最大の 10 のべき乗 `10^19` で割り、19 桁ずつの 64 ビットの塊にしてから、それぞれを 64 ビット版で書きます。`fill_n` で先に `'0'` を詰めるのは、塊の中の先頭の 0（たとえば `0000…42`）を残すためです。

### 2. 右から 2 桁ずつ書く

```cpp:line-numbers=1460
  unsigned n = to_unsigned(size);
  while (value >= 100) {
    n -= 2;
    if (!is_constant_evaluated() && num_bits<UInt>() == 32) {
      auto p = value * static_cast<uint64_t>((1ull << 39) / 100 + 1);
      write2digits_i(out + n, p >> (39 - 7) & ((1 << 7) - 1));
      value = static_cast<UInt>(p >> 39) +
              (static_cast<UInt>(value >= (100u << 25)) << 25);
    } else {
      // 整数の割り算は遅いので、1 桁ごとではなく 2 桁のまとまりごとに
      // 割る。このアイデアは Alexandrescu の講演
      // "Three Optimization Tips for C++" による。比較は speed-test を参照。
      write2digits(out + n, static_cast<unsigned>(value % 100));
      value /= 100;
    }
  }
```

`n` は「次に書く位置」で、最初は桁数 `size` です。`value >= 100` の間、`n` を 2 減らして下 2 桁を書き、`value` を 100 で割ります。64 ビットではそのまま `value % 100` と `value / 100` を使います。

```cpp:line-numbers=1472
      write2digits(out + n, static_cast<unsigned>(value % 100));
      value /= 100;
```

### 3. 32 ビットでは割り算を掛け算に置き換える

```cpp:line-numbers=1463
    if (!is_constant_evaluated() && num_bits<UInt>() == 32) {
      auto p = value * static_cast<uint64_t>((1ull << 39) / 100 + 1);
      write2digits_i(out + n, p >> (39 - 7) & ((1 << 7) - 1));
      value = static_cast<UInt>(p >> 39) +
              (static_cast<UInt>(value >= (100u << 25)) << 25);
```

`value = 12345` で追います。

- `(1ull << 39) / 100 + 1` は `5497558139`。これは「`2^39 / 100` を少し切り上げた数」です。
- `p = 12345 × 5497558139`。`p` を `2^39` で割ると、ほぼ `123.45` になります。
- `p >> 39` は整数部分 **123**（= 12345 / 100）。
- `p >> 32 & 127` は、`123.45` の小数部分を 7 ビット（128 段階）で表した値 **57** です（0.45 × 128 ≒ 57.6）。

小数部分 57 から「45」を引くのが `digits2_i` です。128 通りの値それぞれに対応する 2 桁を並べた表で、57 番目には `"45"` が入っています。こうして **商と余りが 1 回の掛け算から同時に出る** のです。

`value` を更新する式の後半 `(… value >= (100u << 25)) << 25` は桁あふれの補正です。`value` が大きいと `p` が 64 ビットを超え、`2^64` 分が消えます。それを `2^39` で割った `2^25` を商に足し戻しています。

### 4. 残りの 1〜2 桁

```cpp:line-numbers=1476
  if (value >= 10) {
    n -= 2;
    write2digits(out + n, static_cast<unsigned>(value));
  } else {
    out[--n] = static_cast<Char>('0' + value);
  }
  return out + n;
```

`value = 1` になったら 1 桁だけ書きます。こうして `"1"` `"23"` `"45"` が並び、`"12345"` が完成します。

## ここがすごい

- **割り算は遅い**: 整数の割り算は掛け算よりずっと重い命令です。「定数で割る」を「定数を掛けてシフト」に変えるのは定番の高速化ですが、ここでは **小数部分から余りまで取り出す** ところまで踏み込んでいます。
- **2 桁ずつ**: 表を使って 2 桁ずつ書くので、ループの回数も半分です。
- **型ごとに最適な道**: 32 ビット、64 ビット、128 ビットで別々の工夫をしつつ、`num_bits<UInt>()` が定数なので不要な分岐は実行ファイルに残りません。
- **コンパイル時にも動く**: `is_constant_evaluated()` で、コンパイル時には素直な方法に切り替えます。速さと `constexpr` 対応を両立しています。

## まとめ

- 整数→文字列は「桁数を先に数えて、右から書く」と無駄がない。
- 定数での割り算は、掛け算とシフトに置き換えられる。
- 掛け算の結果の「小数部分」にあたるビットから、余りも取り出せる。
- 遅い 128 ビット演算は、64 ビットに収まる大きさに分けて避ける。
