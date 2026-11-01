---
title: MSVC で「先頭の 0 の数」を作る、31 との XOR の小技
description: GCC や Clang の __builtin_clz がない MSVC 向けに、ビット位置を返す _BitScanReverse から先頭の 0 の個数を作る関数。32 ビット環境では 64 ビット値を 2 回に分けて調べる。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [210, 232]
function: detail::clz / detail::clzll
difficulty: 2
format: 2
tags: [ビット演算, 移植性, 低レイヤ]
---

## ひとことで

CLZ（count leading zeros）は、整数を 2 進で書いたとき **先頭に 0 が何個続くか** を数える操作です。{fmt} は桁数を数えるのにこれを多用します。

GCC や Clang には `__builtin_clz` という組み込み関数がありますが、MSVC（Microsoft のコンパイラ）にはありません。そこで MSVC の `_BitScanReverse`（最上位の 1 のビットの位置を返す命令）から CLZ を組み立てているのが、この 2 つの関数です。

## コード

::: code-group

```cpp:line-numbers=210 [日本語訳]
inline auto clz(uint32_t x) -> int {
  FMT_ASSERT(x != 0, "");
  unsigned long r = 0;
  _BitScanReverse(&r, x);
  return 31 ^ static_cast<int>(r);
}
#  define FMT_BUILTIN_CLZ(n) detail::clz(n)

inline auto clzll(uint64_t x) -> int {
  FMT_ASSERT(x != 0, "");
  unsigned long r = 0;
#  ifdef _WIN64
  _BitScanReverse64(&r, x);
#  else
  // 上位 32 ビットを調べる。
  if (_BitScanReverse(&r, static_cast<uint32_t>(x >> 32)))
    return 63 ^ static_cast<int>(r + 32);
  // 下位 32 ビットを調べる。
  _BitScanReverse(&r, static_cast<uint32_t>(x));
#  endif
  return 63 ^ static_cast<int>(r);
}
#  define FMT_BUILTIN_CLZLL(n) detail::clzll(n)
```

```cpp:line-numbers=210 [原文]
inline auto clz(uint32_t x) -> int {
  FMT_ASSERT(x != 0, "");
  unsigned long r = 0;
  _BitScanReverse(&r, x);
  return 31 ^ static_cast<int>(r);
}
#  define FMT_BUILTIN_CLZ(n) detail::clz(n)

inline auto clzll(uint64_t x) -> int {
  FMT_ASSERT(x != 0, "");
  unsigned long r = 0;
#  ifdef _WIN64
  _BitScanReverse64(&r, x);
#  else
  // Scan the high 32 bits.
  if (_BitScanReverse(&r, static_cast<uint32_t>(x >> 32)))
    return 63 ^ static_cast<int>(r + 32);
  // Scan the low 32 bits.
  _BitScanReverse(&r, static_cast<uint32_t>(x));
#  endif
  return 63 ^ static_cast<int>(r);
}
#  define FMT_BUILTIN_CLZLL(n) detail::clzll(n)
```

:::

## 前提知識

- **組み込み関数（intrinsic）**: `_BitScanReverse` は普通の関数に見えますが、コンパイラが CPU の専用命令（x86 の `bsr`）に直接置き換えます。
- **ポインタ引数で結果を受け取る**: `_BitScanReverse(&r, x)` は、見つけたビット位置を `r` に書き込みます。`&r` は変数 `r` のアドレスです。戻り値は「1 のビットがあったか」を表します。
- **`unsigned long`**: Windows では 32 ビットの符号なし整数です。
- **`FMT_ASSERT`**: デバッグ時に条件を確かめるマクロです。`x = 0` だと最上位ビットが存在しないので、呼んではいけない約束になっています。
- **`#ifdef _WIN64`**: 64 ビット Windows 向けにコンパイルするときだけ定義されるマクロです。
- **`#define FMT_BUILTIN_CLZ(n) detail::clz(n)`**: 以降のコードが `FMT_BUILTIN_CLZ` と書けば、環境に関係なく CLZ が呼べるようにしています。

## 何をしているか

### 1. ビット位置から CLZ へ

```cpp:line-numbers=210
inline auto clz(uint32_t x) -> int {
  FMT_ASSERT(x != 0, "");
  unsigned long r = 0;
  _BitScanReverse(&r, x);
  return 31 ^ static_cast<int>(r);
}
```

`_BitScanReverse` が返すのは最上位ビットの **位置** `r`（0〜31）です。CLZ は `31 - r` です。

たとえば `x = 1000`（2 進 `1111101000`）なら `r = 9`、CLZ は `31 - 9 = 22` です。コードでは `31 ^ r` と書いています。

`r` が 0〜31 のとき、`31` は 2 進で `11111` なので、XOR は各ビットを反転するだけで `31 - r` と一致します。`9` は `01001`、反転すると `10110` = 22 です。

### 2. 64 ビット版

```cpp:line-numbers=218
inline auto clzll(uint64_t x) -> int {
  FMT_ASSERT(x != 0, "");
  unsigned long r = 0;
#  ifdef _WIN64
  _BitScanReverse64(&r, x);
#  else
  // 上位 32 ビットを調べる。
  if (_BitScanReverse(&r, static_cast<uint32_t>(x >> 32)))
    return 63 ^ static_cast<int>(r + 32);
  // 下位 32 ビットを調べる。
  _BitScanReverse(&r, static_cast<uint32_t>(x));
#  endif
  return 63 ^ static_cast<int>(r);
}
```

64 ビット Windows なら `_BitScanReverse64` を 1 回呼び、`63 ^ r` を返します。

32 ビット Windows にはこの命令がないので、2 回に分けます。

1. まず上位 32 ビット（`x >> 32`）を調べる。1 があれば、その位置に 32 を足すと 64 ビット全体での位置になる。
2. 上位がすべて 0 なら、下位 32 ビットを調べる。

`x = 1 << 40` なら上位の 8 ビット目に 1 があり、`r + 32 = 40`、CLZ は `63 - 40 = 23` です。

## ここがすごい

- **環境の差を 1 か所に閉じ込める**: `FMT_BUILTIN_CLZ` / `FMT_BUILTIN_CLZLL` というマクロを用意し、GCC/Clang では組み込み関数、MSVC ではこの関数を指すようにしています。ほかのコードは環境を気にせず CLZ を使えます。
- **引き算ではなく XOR**: 0〜31 の範囲なら `31 - r` と `31 ^ r` は同じ値です。XOR は「先頭の 0 の数」と「ビット位置」が互いに反転の関係であることを素直に表しています。
- **32 ビット環境への配慮**: 64 ビットの命令がない環境でも、32 ビット命令 2 回で同じ結果を出します。分岐は 1 回だけです。
- **前提条件を明示**: `x = 0` は答えが定義できない入力です。`FMT_ASSERT` で約束を書き、呼び出し側（`n | 1` を渡すなど）で守っています。

## まとめ

- 「最上位ビットの位置」と「先頭の 0 の数」は `(ビット幅 - 1) - 位置` の関係にある。
- 0〜(2^k - 1) の範囲では、`(2^k - 1) - r` は `(2^k - 1) ^ r` と同じ。
- コンパイラごとの違いはマクロで包んで、使う側からは隠す。
- 大きな値を扱う命令がなければ、上半分と下半分に分けて調べればよい。
