---
title: 64 ビット同士の掛け算を 128 ビットで受け取る 3 通りの方法
description: 64 ビット整数 2 つの積を、あふれさせずに 128 ビットで求める関数。128 ビット整数型、MSVC の組み込み関数、32 ビットに分けた筆算の 3 通りを環境で使い分ける。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1639, 1666]
function: detail::umul128
difficulty: 2
format: 2
tags: [数値計算, 移植性, ビット演算]
---

## ひとことで

64 ビット同士の掛け算の答えは、最大で 128 ビットになります。普通の `uint64_t` で掛けると上半分が捨てられてしまいます。

`umul128(x, y)` は、積を **上位 64 ビットと下位 64 ビットの組** として正確に返します。浮動小数点数を文字列にするアルゴリズム（Dragonbox）で、大きな定数との掛け算に使われます。

## コード

::: code-group

```cpp:line-numbers=1639 [日本語訳]
// 64 ビット符号なし整数 2 つの積を 128 ビットで求める。
FMT_INLINE auto umul128(uint64_t x, uint64_t y) noexcept -> uint128 {
#if FMT_USE_INT128
  auto p = static_cast<native_uint128>(x) * static_cast<native_uint128>(y);
  return {static_cast<uint64_t>(p >> 64), static_cast<uint64_t>(p)};
#elif defined(_MSC_VER) && defined(_M_AMD64)
  auto hi = uint64_t();
  auto lo = _umul128(x, y, &hi);
  return {hi, lo};
#else
  const uint64_t mask = static_cast<uint64_t>(max_value<uint32_t>());

  uint64_t a = x >> 32;
  uint64_t b = x & mask;
  uint64_t c = y >> 32;
  uint64_t d = y & mask;

  uint64_t ac = a * c;
  uint64_t bc = b * c;
  uint64_t ad = a * d;
  uint64_t bd = b * d;

  uint64_t intermediate = (bd >> 32) + (ad & mask) + (bc & mask);

  return {ac + (intermediate >> 32) + (ad >> 32) + (bc >> 32),
          (intermediate << 32) + (bd & mask)};
#endif
}
```

```cpp:line-numbers=1639 [原文]
// Computes 128-bit result of multiplication of two 64-bit unsigned integers.
FMT_INLINE auto umul128(uint64_t x, uint64_t y) noexcept -> uint128 {
#if FMT_USE_INT128
  auto p = static_cast<native_uint128>(x) * static_cast<native_uint128>(y);
  return {static_cast<uint64_t>(p >> 64), static_cast<uint64_t>(p)};
#elif defined(_MSC_VER) && defined(_M_AMD64)
  auto hi = uint64_t();
  auto lo = _umul128(x, y, &hi);
  return {hi, lo};
#else
  const uint64_t mask = static_cast<uint64_t>(max_value<uint32_t>());

  uint64_t a = x >> 32;
  uint64_t b = x & mask;
  uint64_t c = y >> 32;
  uint64_t d = y & mask;

  uint64_t ac = a * c;
  uint64_t bc = b * c;
  uint64_t ad = a * d;
  uint64_t bd = b * d;

  uint64_t intermediate = (bd >> 32) + (ad & mask) + (bc & mask);

  return {ac + (intermediate >> 32) + (ad >> 32) + (bc >> 32),
          (intermediate << 32) + (bd & mask)};
#endif
}
```

:::

## 前提知識

- **`uint128`**: {fmt} が自前で用意した 128 ビット整数のクラスです。`{上位, 下位}` の 2 つの 64 ビット値で作れます。
- **`native_uint128`**: GCC や Clang が持つ組み込みの 128 ビット整数型 `__uint128_t` の別名です。使える環境では `FMT_USE_INT128` が 1 になります。
- **`_umul128`**: MSVC（x64）の組み込み関数で、CPU の 64×64→128 ビット掛け算命令を直接使います。上位を第 3 引数のポインタに書き、下位を戻り値で返します。
- **`{a, b}` で返す**: 戻り値の型（`uint128`）のコンストラクタに `a`, `b` を渡して作る書き方です。
- **`noexcept`**: 例外を投げない約束です。
- **`max_value<uint32_t>()`**: 32 ビットの最大値 `0xFFFFFFFF` です。下位 32 ビットを取り出すマスクに使います。

## 何をしているか

### 1. 128 ビット型があれば素直に掛ける

```cpp:line-numbers=1641
#if FMT_USE_INT128
  auto p = static_cast<native_uint128>(x) * static_cast<native_uint128>(y);
  return {static_cast<uint64_t>(p >> 64), static_cast<uint64_t>(p)};
```

両方を 128 ビット型にしてから掛ければ、あふれません。上位は `p >> 64`、下位は `p` を 64 ビットに切り詰めた値です。

### 2. MSVC なら CPU 命令を呼ぶ

```cpp:line-numbers=1644
#elif defined(_MSC_VER) && defined(_M_AMD64)
  auto hi = uint64_t();
  auto lo = _umul128(x, y, &hi);
  return {hi, lo};
```

x64 の CPU には 64×64→128 の掛け算命令があり、`_umul128` で直接呼べます。

### 3. どちらもなければ筆算

```cpp:line-numbers=1648
#else
  const uint64_t mask = static_cast<uint64_t>(max_value<uint32_t>());

  uint64_t a = x >> 32;
  uint64_t b = x & mask;
  uint64_t c = y >> 32;
  uint64_t d = y & mask;

  uint64_t ac = a * c;
  uint64_t bc = b * c;
  uint64_t ad = a * d;
  uint64_t bd = b * d;

  uint64_t intermediate = (bd >> 32) + (ad & mask) + (bc & mask);

  return {ac + (intermediate >> 32) + (ad >> 32) + (bc >> 32),
          (intermediate << 32) + (bd & mask)};
```

64 ビットの数を 32 ビットずつに分けます。`x = a·2^32 + b`、`y = c·2^32 + d` とすると、

```
x·y = ac·2^64 + (ad + bc)·2^32 + bd
```

です。4 つの部分積 `ac`, `bc`, `ad`, `bd` はどれも 32×32 ビットなので、64 ビットに必ず収まります。

難しいのは真ん中の `(ad + bc)·2^32` の繰り上がりです。

```cpp:line-numbers=1659
  uint64_t bd = b * d;
```

`intermediate` は、

- `bd` の上位 32 ビット
- `ad` の下位 32 ビット
- `bc` の下位 32 ビット

を足した値で、「答えの 32〜63 ビット目に積もる量」です。それぞれ 32 ビット未満なので、3 つ足しても 64 ビットからあふれません。

- 上位 64 ビット = `ac` + `intermediate` の上位 + `ad` の上位 + `bc` の上位
- 下位 64 ビット = `intermediate` の下位 32 ビットを上に、`bd` の下位 32 ビットを下に並べたもの

たとえば `x = y = 2^32`（`a = c = 1`、`b = d = 0`）なら、`ac = 1`、ほかは 0 なので、上位 1・下位 0、つまり `2^64` です。

## ここがすごい

- **環境ごとに最速の道**: 128 ビット型や専用命令があれば 1 命令で済みます。どちらもない環境でも、正しい答えを出す筆算に落ちます。呼ぶ側は違いを気にしなくて済みます。
- **あふれない足し算の組み立て**: 筆算版は、どの足し算も 64 ビットに収まるように部分を切り分けています。繰り上がりのフラグを自分で管理しなくても正しい答えになります。
- **小学校の筆算と同じ発想**: 「大きな数を桁に分け、部分の積を足し合わせる」は、10 進の筆算と同じです。ここでは 1 桁が 32 ビットになっているだけです。

## まとめ

- 64×64 ビットの積は 128 ビットになるので、受け取る型を広げる必要がある。
- 使える環境では 128 ビット整数型や CPU の専用命令が最速。
- 筆算版は 32 ビットに分け、4 つの部分積と繰り上がりを足し合わせる。
- 足し算の順序を工夫すると、途中であふれない計算を組み立てられる。
