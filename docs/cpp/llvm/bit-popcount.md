---
title: 掛け算 1 回で各バイトの合計を集める popcount の代替実装
description: 立っているビットの数を数える popcount です。組み込み関数がない環境では、2 ビット・4 ビット・8 ビットと集計していき、最後は 0x01010101 を掛けて全バイトを一度に足します。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/bit.h
lines: [153, 180]
function: llvm::popcount
difficulty: 3
format: 2
tags: [ビット演算, 最適化, 移植性]
---

## ひとことで

`popcount` は、整数を 2 進数で書いたときに **1 が何個あるか** を返します。例: `0xF000F000` なら 8 です。
GCC 系のコンパイラでは組み込み関数に任せ、それ以外ではループなしのビット演算で数えます。

## コード

::: code-group

```cpp:line-numbers=153 [日本語訳]
/// 値の中で立っているビットの数を数える。
/// 例: popcount(0xF000F000) = 8
/// Value が 0 なら 0 を返す。
template <typename T> [[nodiscard]] constexpr int popcount(T Value) noexcept {
  static_assert(std::is_unsigned_v<T>, "T must be an unsigned integer type");
  static_assert(sizeof(T) <= 8, "T must be 8 bytes or less");

  if constexpr (sizeof(T) <= 4) {
#if defined(__GNUC__)
    return (int)__builtin_popcount(Value);
#else
    uint32_t V = Value;
    V = V - ((V >> 1) & 0x55555555);
    V = (V & 0x33333333) + ((V >> 2) & 0x33333333);
    return int(((V + (V >> 4) & 0xF0F0F0F) * 0x1010101) >> 24);
#endif
  } else {
#if defined(__GNUC__)
    return (int)__builtin_popcountll(Value);
#else
    uint64_t V = Value;
    V = V - ((V >> 1) & 0x5555555555555555ULL);
    V = (V & 0x3333333333333333ULL) + ((V >> 2) & 0x3333333333333333ULL);
    V = (V + (V >> 4)) & 0x0F0F0F0F0F0F0F0FULL;
    return int((uint64_t)(V * 0x0101010101010101ULL) >> 56);
#endif
  }
}
```

```cpp:line-numbers=153 [原文]
/// Count the number of set bits in a value.
/// Ex. popcount(0xF000F000) = 8
/// Returns 0 if Value is zero.
template <typename T> [[nodiscard]] constexpr int popcount(T Value) noexcept {
  static_assert(std::is_unsigned_v<T>, "T must be an unsigned integer type");
  static_assert(sizeof(T) <= 8, "T must be 8 bytes or less");

  if constexpr (sizeof(T) <= 4) {
#if defined(__GNUC__)
    return (int)__builtin_popcount(Value);
#else
    uint32_t V = Value;
    V = V - ((V >> 1) & 0x55555555);
    V = (V & 0x33333333) + ((V >> 2) & 0x33333333);
    return int(((V + (V >> 4) & 0xF0F0F0F) * 0x1010101) >> 24);
#endif
  } else {
#if defined(__GNUC__)
    return (int)__builtin_popcountll(Value);
#else
    uint64_t V = Value;
    V = V - ((V >> 1) & 0x5555555555555555ULL);
    V = (V & 0x3333333333333333ULL) + ((V >> 2) & 0x3333333333333333ULL);
    V = (V + (V >> 4)) & 0x0F0F0F0F0F0F0F0FULL;
    return int((uint64_t)(V * 0x0101010101010101ULL) >> 56);
#endif
  }
}
```

:::

## 前提知識

- **`template <typename T>`**: どの整数型でも使えるようにする仕組みです。
- **`static_assert(std::is_unsigned_v<T>, ...)`**: 符号なし整数でなければコンパイルエラーにします。
- **`if constexpr (sizeof(T) <= 4)`**: コンパイル時に、32 ビット以下か 64 ビットかで処理を選びます。
- **`#if defined(__GNUC__)`**: GCC や Clang でコンパイルしているときだけ有効になる部分です。
- **16 進数のマスク**: `0x5` は 2 進数で `0101`、`0x3` は `0011`、`0xF` は `1111` です。
- **`ULL`**: 64 ビットの符号なし定数であることを示す接尾辞です。

## 何をしているか

32 ビット版を、8 ビットの `10110110`（1 が 5 個）で追います。

### 1. 2 ビットごとの個数

```cpp:line-numbers=165
    V = V - ((V >> 1) & 0x55555555);
```

`V - ((V >> 1) & 0x55...)` です。2 ビットの枠 `ab` の値は `2a + b` です。そこから上のビット `a` を引くと `a + b`、つまり **その枠の 1 の個数** になります。

```
10 11 01 10  → 01 10 01 01   （1, 2, 1, 1 個）
```

足し算ではなく引き算にすることで、マスクを 1 回減らしています。

### 2. 4 ビットごとの個数

```cpp:line-numbers=166
    V = (V & 0x33333333) + ((V >> 2) & 0x33333333);
```

`0x33...`（`0011` の繰り返し）で 2 ビット枠を 1 つおきに取り、ずらしたものと足します。

```
0110 0101 → 0011 0010   （3, 2 個）
```

### 3. 8 ビットごとの個数

最後の 1 行は、前半と後半で 2 つの仕事をしています。

```cpp:line-numbers=167
    return int(((V + (V >> 4) & 0xF0F0F0F) * 0x1010101) >> 24);
```

前半では `V + (V >> 4)` を `0x0F0F0F0F` でマスクして、各バイトにそのバイトの 1 の個数を入れます。例では `0000 0101`、つまり 5 です。

### 4. 掛け算で全バイトを合計

32 ビットでは 4 バイトぶんの個数を足す必要があります。`× 0x01010101` は、「自分」「8 ビットずらした自分」「16 ビット」「24 ビット」を全部足すのと同じです。
すると **最上位のバイトに 4 バイトの合計** が集まるので、`>> 24` で取り出します。

64 ビット版も同じ流れで、次の部分の最後で `0x0101010101010101` を掛けて `>> 56` します。

```cpp:line-numbers=173
    uint64_t V = Value;
    V = V - ((V >> 1) & 0x5555555555555555ULL);
    V = (V & 0x3333333333333333ULL) + ((V >> 2) & 0x3333333333333333ULL);
    V = (V + (V >> 4)) & 0x0F0F0F0F0F0F0F0FULL;
    return int((uint64_t)(V * 0x0101010101010101ULL) >> 56);
```

## ここがすごい

- **ループも分岐もない**: 32 回ループする代わりに、十数個の演算で終わります。入力によって速さが変わりません。
- **掛け算をまとめての足し算に使う**: 「8 ビットずつずらして足す」を 3 回する代わりに、掛け算 1 回で済ませています。各バイトの値は最大 8 なので、合計しても 1 バイトからあふれません。
- **引き算で 1 手省く**: 最初の段は `(V & 0x55) + ((V >> 1) & 0x55)` とも書けますが、`V - ((V >> 1) & 0x55)` ならマスクが 1 回で済みます。
- **組み込み関数を優先**: GCC 系では `__builtin_popcount` を使います。CPU に popcount 命令があれば 1 命令になり、なくてもコンパイラが最適な形にします。自前実装はそれが使えない環境の保険です。

## まとめ

- 1 つの整数を「小さな枠の集まり」とみなすと、多くの枠を同時に計算できる。
- 2 ビット枠の個数は `x - (x >> 1 & 0x55…)` で求まる。
- `0x0101…` を掛けると、全バイトの合計を最上位バイトに集められる。
- まずコンパイラの組み込み関数を使い、自前の実装は移植用に用意する。

