---
title: 1 ビットだけ残してマスク 6 回、末尾の 0 を数える
description: 64 ビット整数の右端に 0 がいくつ続くかを数える関数。最下位の 1 だけを取り出し、6 種類のマスクでその位置の 2 進数を 1 ビットずつ決めていく。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2020 The Abseil Authors
file: absl/numeric/internal/bits.h
lines: [306, 336]
function: numeric_internal::CountTrailingZeroesNonzero64
difficulty: 3
tags: [ビット演算, 移植性, アルゴリズム]
---

## ひとことで

`CountTrailingZeroesNonzero64` は、0 でない 64 ビット整数の **右端から 0 がいくつ続くか**（count trailing zeros、ctz）を返します。
`40` は 2 進数で `101000` なので答えは 3 です。これは「いちばん下の 1 が何ビット目にあるか」と同じ意味です。

組み込み命令が使えない環境向けの最後の実装では、`x &= ~x + 1` で最下位の 1 だけを残し、**6 個のマスクとの AND で位置を 2 進数の 1 桁ずつ決めていく** という手品のような書き方をしています。

## コード

::: code-group

```cpp:line-numbers=306 [日本語訳]
ABSL_ATTRIBUTE_ALWAYS_INLINE ABSL_INTERNAL_CONSTEXPR_CTZ inline int
CountTrailingZeroesNonzero64(uint64_t x) {
#if ABSL_NUMERIC_INTERNAL_HAVE_BUILTIN_OR_GCC(__builtin_ctzll)
  static_assert(sizeof(unsigned long long) == sizeof(x),  // NOLINT(runtime/int)（long long 型を使うことへの lint 警告を抑止）
                "__builtin_ctzll does not take 64-bit arg");
  return __builtin_ctzll(x);
#elif defined(_MSC_VER) && !defined(__clang__) && \
    (defined(_M_X64) || defined(_M_ARM64))
  unsigned long result = 0;  // NOLINT(runtime/int)（long 型を使うことへの lint 警告を抑止）
  _BitScanForward64(&result, x);
  return result;
#elif defined(_MSC_VER) && !defined(__clang__)
  unsigned long result = 0;  // NOLINT(runtime/int)（long 型を使うことへの lint 警告を抑止）
  if (static_cast<uint32_t>(x) == 0) {
    _BitScanForward(&result, static_cast<unsigned long>(x >> 32));
    return result + 32;
  }
  _BitScanForward(&result, static_cast<unsigned long>(x));
  return result;
#else
  int c = 63;
  x &= ~x + 1;
  if (x & 0x00000000FFFFFFFF) c -= 32;
  if (x & 0x0000FFFF0000FFFF) c -= 16;
  if (x & 0x00FF00FF00FF00FF) c -= 8;
  if (x & 0x0F0F0F0F0F0F0F0F) c -= 4;
  if (x & 0x3333333333333333) c -= 2;
  if (x & 0x5555555555555555) c -= 1;
  return c;
#endif
}
```

```cpp:line-numbers=306 [原文]
ABSL_ATTRIBUTE_ALWAYS_INLINE ABSL_INTERNAL_CONSTEXPR_CTZ inline int
CountTrailingZeroesNonzero64(uint64_t x) {
#if ABSL_NUMERIC_INTERNAL_HAVE_BUILTIN_OR_GCC(__builtin_ctzll)
  static_assert(sizeof(unsigned long long) == sizeof(x),  // NOLINT(runtime/int)
                "__builtin_ctzll does not take 64-bit arg");
  return __builtin_ctzll(x);
#elif defined(_MSC_VER) && !defined(__clang__) && \
    (defined(_M_X64) || defined(_M_ARM64))
  unsigned long result = 0;  // NOLINT(runtime/int)
  _BitScanForward64(&result, x);
  return result;
#elif defined(_MSC_VER) && !defined(__clang__)
  unsigned long result = 0;  // NOLINT(runtime/int)
  if (static_cast<uint32_t>(x) == 0) {
    _BitScanForward(&result, static_cast<unsigned long>(x >> 32));
    return result + 32;
  }
  _BitScanForward(&result, static_cast<unsigned long>(x));
  return result;
#else
  int c = 63;
  x &= ~x + 1;
  if (x & 0x00000000FFFFFFFF) c -= 32;
  if (x & 0x0000FFFF0000FFFF) c -= 16;
  if (x & 0x00FF00FF00FF00FF) c -= 8;
  if (x & 0x0F0F0F0F0F0F0F0F) c -= 4;
  if (x & 0x3333333333333333) c -= 2;
  if (x & 0x5555555555555555) c -= 1;
  return c;
#endif
}
```

:::

## 前提知識

- **`#if` / `#elif`**: コンパイラや CPU の種類でコードを切り替えるプリプロセッサの条件分岐です。
- **`__builtin_ctzll`**: GCC/Clang の組み込み関数で、CPU の専用命令（x86 の `tzcnt` など）になります。引数 0 では結果が未定義なので、関数名に `Nonzero`（0 以外専用）と付いています。
- **`_BitScanForward64`**: MSVC の組み込み関数で、最下位の 1 の位置を返します。
- **`~x`**: すべてのビットを反転する演算子です。
- **2 の補数**: 符号なし整数でも `~x + 1` は「`-x` と同じビット列」になります。
- **`static_cast<T>(v)`**: 型を明示的に変換する書き方です。

## 何をしているか

### 1. 組み込み関数・MSVC 版

```cpp:line-numbers=308
#if ABSL_NUMERIC_INTERNAL_HAVE_BUILTIN_OR_GCC(__builtin_ctzll)
  static_assert(sizeof(unsigned long long) == sizeof(x),  // NOLINT(runtime/int)（long long 型を使うことへの lint 警告を抑止）
                "__builtin_ctzll does not take 64-bit arg");
  return __builtin_ctzll(x);
#elif defined(_MSC_VER) && !defined(__clang__) && \
    (defined(_M_X64) || defined(_M_ARM64))
  unsigned long result = 0;  // NOLINT(runtime/int)（long 型を使うことへの lint 警告を抑止）
  _BitScanForward64(&result, x);
  return result;
#elif defined(_MSC_VER) && !defined(__clang__)
  unsigned long result = 0;  // NOLINT(runtime/int)（long 型を使うことへの lint 警告を抑止）
  if (static_cast<uint32_t>(x) == 0) {
    _BitScanForward(&result, static_cast<unsigned long>(x >> 32));
    return result + 32;
  }
  _BitScanForward(&result, static_cast<unsigned long>(x));
  return result;
```

GCC/Clang なら `__builtin_ctzll` を呼ぶだけです。64 ビットの MSVC なら `_BitScanForward64` を使います。
32 ビットの MSVC には 64 ビット版がないので、下位 32 ビットが 0 なら上位 32 ビットを調べて 32 を足す、という 2 段構えにしています。

### 2. 最下位の 1 だけを残す

```cpp:line-numbers=326
  int c = 63;
  x &= ~x + 1;
```

`x &= ~x + 1` は有名なビット演算のイディオムです。`x = 101000` で確かめます。

```
x        = …0101000
~x       = …1010111
~x + 1   = …1011000   ← 繰り上がりが最下位の 1 のところで止まる
x & 上   = …0001000   ← 最下位の 1 だけが残る
```

これで `x` は「1 が 1 個だけある数」になりました。あとはその 1 の位置を求めればよいのです。

### 3. マスクで位置を決める

```cpp:line-numbers=328
  if (x & 0x00000000FFFFFFFF) c -= 32;
  if (x & 0x0000FFFF0000FFFF) c -= 16;
  if (x & 0x00FF00FF00FF00FF) c -= 8;
  if (x & 0x0F0F0F0F0F0F0F0F) c -= 4;
  if (x & 0x3333333333333333) c -= 2;
  if (x & 0x5555555555555555) c -= 1;
  return c;
```

`c = 63`（2 進数で `111111`）から始め、マスクに当たるたびに 32, 16, 8, 4, 2, 1 を引きます。

- `0x00000000FFFFFFFF` は下位 32 ビット。ここに 1 があれば、位置は 32 未満です。
- `0x0000FFFF0000FFFF` は「各 32 ビットの下半分」。当たれば、位置の 16 の位が 0 です。
- 以下同様に、`0x5555…` は偶数番目のビットだけが 1 のマスクで、当たれば位置は偶数です。

つまり各マスクは、**位置を 2 進数で書いたときの 1 つの桁が 0 かどうか** を調べています。`x = 0b1000`（位置 3）で追うと次のとおりです。

| マスク | 当たる？ | c |
| --- | --- | --- |
| `…FFFFFFFF` | はい | 31 |
| `…0000FFFF` | はい | 15 |
| `…00FF00FF` | はい | 7 |
| `…0F0F0F0F` | はい | 3 |
| `…33333333` | いいえ（`1000 & 0011`） | 3 |
| `…55555555` | いいえ（`1000 & 0101`） | 3 |

答えは 3 です。

## ここがすごい

- **分岐が「答えの 1 桁」にきっちり対応している**: ループで 1 ビットずつ右にずらして調べると、最悪 63 回の繰り返しが必要です。ここでは 1 ビットだけ残したおかげで、6 回の AND で必ず答えが決まります。
- **`if` の中身が単純な引き算だけ**: 各行は「当たったら定数を引く」だけなので、コンパイラが条件付き移動などの分岐しない命令に変えやすい形です。
- **`~x + 1` を使う理由**: 符号なし整数に `-x` と書くと、コンパイラによっては警告が出ます。`~x + 1` はビット列としては同じで、意図もはっきりします。
- **0 を受け付けない設計**: 0 の扱いを呼び出し側（`CountTrailingZeroes`）に任せ、この関数は「0 以外」に特化しています。組み込み命令の制約と関数の約束をそろえる設計です。

## まとめ

- `x & (~x + 1)`（= `x & -x`）で最下位の 1 だけを取り出せる。
- 1 が 1 個しかない数なら、マスクとの AND で位置の 2 進数を 1 桁ずつ決められる。
- 分岐の回数はビット数の log2 で済む（64 ビットなら 6 回）。
- 組み込み関数が使えない環境向けに、同じ意味の汎用実装を用意しておくと移植性が上がる。
