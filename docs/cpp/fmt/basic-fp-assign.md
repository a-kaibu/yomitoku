---
title: double をビットに分解して「仮数 × 2 の指数」に組み立て直す
description: IEEE 754 の浮動小数点数から仮数と指数を取り出し、f × 2^e の形に直す関数。隠れビットと非正規化数を正しく扱い、文字列化に必要な「前の値のほうが近いか」も同時に返す。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1831, 1855]
function: basic_fp::assign
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 低レイヤ]
---

## ひとことで

`basic_fp` は、浮動小数点数を **整数の仮数 `f` と指数 `e`** で `f × 2^e` と表す小さな構造体です。`assign(n)` は `double` や `float` をこの形に分解します。

`1.0` なら `f = 2^52`、`e = -52`（`2^52 × 2^-52 = 1`）になります。整数だけで扱える形にすると、正確な 10 進変換がしやすくなります。

## コード

::: code-group

```cpp:line-numbers=1831 [日本語訳]
  // n をこのオブジェクトに代入し、前の値のほうが次の値より近いときに限り true を返す。
  template <typename Float, FMT_ENABLE_IF(!is_double_double<Float>::value)>
  FMT_CONSTEXPR auto assign(Float n) -> bool {
    static_assert(std::numeric_limits<Float>::digits <= 113, "unsupported FP");
    // Float は [符号][指数][仮数] の形式だと仮定する。
    using carrier_uint = typename dragonbox::float_info<Float>::carrier_uint;
    const auto num_float_significand_bits =
        detail::num_significand_bits<Float>();
    const auto implicit_bit = carrier_uint(1) << num_float_significand_bits;
    const auto significand_mask = implicit_bit - 1;
    auto u = bit_cast<carrier_uint>(n);
    f = static_cast<F>(u & significand_mask);
    auto biased_e = static_cast<int>((u & exponent_mask<Float>()) >>
                                     num_float_significand_bits);
    // n が正規化された 2 のべき乗（f == 0）で、最小の正規化数（biased_e > 1）
    // ではないとき、前の値のほうが近い。
    auto is_predecessor_closer = f == 0 && biased_e > 1;
    if (biased_e == 0)
      biased_e = 1;  // 非正規化数はバイアス付き指数 1（最小の指数）を使う。
    else if (has_implicit_bit<Float>())
      f += static_cast<F>(implicit_bit);
    e = biased_e - exponent_bias<Float>() - num_float_significand_bits;
    if (!has_implicit_bit<Float>()) ++e;
    return is_predecessor_closer;
  }
```

```cpp:line-numbers=1831 [原文]
  // Assigns n to this and return true iff predecessor is closer than successor.
  template <typename Float, FMT_ENABLE_IF(!is_double_double<Float>::value)>
  FMT_CONSTEXPR auto assign(Float n) -> bool {
    static_assert(std::numeric_limits<Float>::digits <= 113, "unsupported FP");
    // Assume Float is in the format [sign][exponent][significand].
    using carrier_uint = typename dragonbox::float_info<Float>::carrier_uint;
    const auto num_float_significand_bits =
        detail::num_significand_bits<Float>();
    const auto implicit_bit = carrier_uint(1) << num_float_significand_bits;
    const auto significand_mask = implicit_bit - 1;
    auto u = bit_cast<carrier_uint>(n);
    f = static_cast<F>(u & significand_mask);
    auto biased_e = static_cast<int>((u & exponent_mask<Float>()) >>
                                     num_float_significand_bits);
    // The predecessor is closer if n is a normalized power of 2 (f == 0)
    // other than the smallest normalized number (biased_e > 1).
    auto is_predecessor_closer = f == 0 && biased_e > 1;
    if (biased_e == 0)
      biased_e = 1;  // Subnormals use biased exponent 1 (min exponent).
    else if (has_implicit_bit<Float>())
      f += static_cast<F>(implicit_bit);
    e = biased_e - exponent_bias<Float>() - num_float_significand_bits;
    if (!has_implicit_bit<Float>()) ++e;
    return is_predecessor_closer;
  }
```

:::

## 前提知識

- **IEEE 754 の `double`**: 64 ビットを「符号 1 ビット・指数 11 ビット・仮数 52 ビット」に分けて数を表します。値は（正規化数なら）`1.仮数 × 2^(指数 - 1023)` です。1023 を **バイアス** と呼びます。
- **隠れビット（implicit bit）**: 正規化数の先頭の `1.` はメモリに保存されていません。読み出すときに自分で足します。
- **非正規化数（subnormal）**: 指数のビットがすべて 0 の、ゼロに近いとても小さな数です。先頭は `0.` で、指数は最小値として扱います。
- **`bit_cast<carrier_uint>(n)`**: `double` のビット列をそのまま `uint64_t` として取り出します（同じファイルの `bit_cast` 関数）。
- **テンプレート `<typename Float, FMT_ENABLE_IF(...)>`**: `Float` に `float` や `double` を受け取ります。条件に合わない型（double-double）には、すぐ下にある別の `assign` が選ばれます。
- **`using carrier_uint = ...`**: 型に別名を付けています。`double` なら `uint64_t`、`float` なら `uint32_t` です。

## 何をしているか

`n = 1.0` で追います。ビット列は `0x3FF0000000000000` です。

### 1. マスクを用意する

```cpp:line-numbers=1837
    const auto num_float_significand_bits =
        detail::num_significand_bits<Float>();
    const auto implicit_bit = carrier_uint(1) << num_float_significand_bits;
    const auto significand_mask = implicit_bit - 1;
    auto u = bit_cast<carrier_uint>(n);
```

`double` の仮数は 52 ビットなので、`implicit_bit = 1 << 52`、`significand_mask = (1 << 52) - 1`（下位 52 ビットがすべて 1）です。

### 2. 仮数と指数を取り出す

```cpp:line-numbers=1842
    f = static_cast<F>(u & significand_mask);
    auto biased_e = static_cast<int>((u & exponent_mask<Float>()) >>
                                     num_float_significand_bits);
    // n が正規化された 2 のべき乗（f == 0）で、最小の正規化数（biased_e > 1）
```

- `f = u & significand_mask` → 下位 52 ビットは 0 なので `f = 0`。
- `biased_e` は指数部分の 11 ビット → `0x3FF` = 1023。

### 3. 「前の値のほうが近いか」を記録

```cpp:line-numbers=1846
    // ではないとき、前の値のほうが近い。
    auto is_predecessor_closer = f == 0 && biased_e > 1;
    if (biased_e == 0)
```

浮動小数点数は飛び飛びの値です。2 のべき乗ちょうど（`f == 0`）のときだけ、すぐ下の値までの間隔が、すぐ上の値までの間隔の半分になります。文字列化で「最短の表記」を探すときにこの情報が要るので、ここで計算して返します。`1.0` は 2 のべき乗なので `true` です。

### 4. 隠れビットと非正規化数

```cpp:line-numbers=1849
      biased_e = 1;  // 非正規化数はバイアス付き指数 1（最小の指数）を使う。
    else if (has_implicit_bit<Float>())
      f += static_cast<F>(implicit_bit);
    e = biased_e - exponent_bias<Float>() - num_float_significand_bits;
```

- 指数が 0（非正規化数）なら、指数を 1 として扱い、隠れビットは足しません。
- 正規化数なら `f` に `2^52` を足します → `f = 2^52`。

### 5. 指数を整える

```cpp:line-numbers=1853
    if (!has_implicit_bit<Float>()) ++e;
    return is_predecessor_closer;
```

`e = 1023 - 1023 - 52 = -52`。`f` を整数として扱うぶん、52 を引いています。結果は `2^52 × 2^-52 = 1.0` です。

80 ビットの `long double` のように隠れビットを持たない形式では、仮数の位置が 1 つずれるので `++e` で補正します。

## ここがすごい

- **型ごとの差を関数で吸収**: 仮数のビット数、バイアス、隠れビットの有無は `num_significand_bits` や `has_implicit_bit` などの小さな `constexpr` 関数で取り出しています。`float`、`double`、80 ビットや 128 ビットの浮動小数点数まで、1 つのコードで扱えます。
- **非正規化数を特別扱いしすぎない**: 指数を 1 にして隠れビットを足さないだけで、正規化数と同じ式に乗せています。
- **後で必要な情報をついでに返す**: 「前の値のほうが近いか」は、分解の途中で `f` と指数を見ればすぐわかります。別の関数でもう一度分解せずに済みます。
- **`bit_cast` で安全に読む**: ポインタのキャストではなく `memcpy` ベースの `bit_cast` を使い、型の規則違反を避けています。

## まとめ

- IEEE 754 の数は、符号・指数・仮数のビットに分けて取り出せる。
- 正規化数は隠れビットを足し、非正規化数は指数を最小値として扱う。
- 仮数を整数として扱うと、値は「整数 × 2 の整数乗」になり正確に計算できる。
- 型ごとの定数を小さな `constexpr` 関数にまとめると、多くの型を 1 つのコードで扱える。
