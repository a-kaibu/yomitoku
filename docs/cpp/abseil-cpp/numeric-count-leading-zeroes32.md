---
title: 文字列リテラルを表引きに使う「先頭の 0 の数え方」
description: 32 ビット整数の上位に 0 がいくつ並ぶかを数える関数。組み込み命令が使えない環境では、二分探索と 16 バイトの文字列リテラルによる表引きで答えを出す。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2020 The Abseil Authors
file: absl/numeric/internal/bits.h
lines: [164, 198]
function: numeric_internal::CountLeadingZeroes32
difficulty: 2
tags: [ビット演算, 移植性, ハック]
---

## ひとことで

`CountLeadingZeroes32` は、32 ビットの整数を 2 進数で書いたとき、**左端から 0 がいくつ続くか**（count leading zeros、略して clz）を返します。
たとえば `1` は `000…0001` なので 31、`0x80000000` は 0 です。

コンパイラごとに使える命令が違うので、3 通りの実装を `#if` で切り替えています。最後の汎用版では、`"\4\3\2\2…"` という **文字列リテラルをそのまま配列として表引き** する、ちょっと驚く書き方が出てきます。

## コード

::: code-group

```cpp:line-numbers=164 [日本語訳]
ABSL_ATTRIBUTE_ALWAYS_INLINE ABSL_INTERNAL_CONSTEXPR_CLZ inline int
CountLeadingZeroes32(uint32_t x) {
#if ABSL_NUMERIC_INTERNAL_HAVE_BUILTIN_OR_GCC(__builtin_clz)
  // __builtin_clz を使う。これは次の命令になる:
  // x86: bsr, lzcnt
  // ARM64: clz
  // PPC: cntlzd

  static_assert(sizeof(unsigned int) == sizeof(x),
                "__builtin_clz does not take 32-bit arg");
  // __builtin_clz(0) は未定義なので、0 は特別扱いする。
  return x == 0 ? 32 : __builtin_clz(x);
#elif defined(_MSC_VER) && !defined(__clang__)
  unsigned long result = 0;  // NOLINT(runtime/int)（long 型を使うことへの lint 警告を抑止）
  if (_BitScanReverse(&result, x)) {
    return 31 - result;
  }
  return 32;
#else
  int zeroes = 28;
  if (x >> 16) {
    zeroes -= 16;
    x >>= 16;
  }
  if (x >> 8) {
    zeroes -= 8;
    x >>= 8;
  }
  if (x >> 4) {
    zeroes -= 4;
    x >>= 4;
  }
  return "\4\3\2\2\1\1\1\1\0\0\0\0\0\0\0"[x] + zeroes;
#endif
}
```

```cpp:line-numbers=164 [原文]
ABSL_ATTRIBUTE_ALWAYS_INLINE ABSL_INTERNAL_CONSTEXPR_CLZ inline int
CountLeadingZeroes32(uint32_t x) {
#if ABSL_NUMERIC_INTERNAL_HAVE_BUILTIN_OR_GCC(__builtin_clz)
  // Use __builtin_clz, which uses the following instructions:
  //  x86: bsr, lzcnt
  //  ARM64: clz
  //  PPC: cntlzd

  static_assert(sizeof(unsigned int) == sizeof(x),
                "__builtin_clz does not take 32-bit arg");
  // Handle 0 as a special case because __builtin_clz(0) is undefined.
  return x == 0 ? 32 : __builtin_clz(x);
#elif defined(_MSC_VER) && !defined(__clang__)
  unsigned long result = 0;  // NOLINT(runtime/int)
  if (_BitScanReverse(&result, x)) {
    return 31 - result;
  }
  return 32;
#else
  int zeroes = 28;
  if (x >> 16) {
    zeroes -= 16;
    x >>= 16;
  }
  if (x >> 8) {
    zeroes -= 8;
    x >>= 8;
  }
  if (x >> 4) {
    zeroes -= 4;
    x >>= 4;
  }
  return "\4\3\2\2\1\1\1\1\0\0\0\0\0\0\0"[x] + zeroes;
#endif
}
```

:::

## 前提知識

- **`#if` / `#elif` / `#else` / `#endif`**: プリプロセッサの条件分岐です。コンパイルの前に、条件に合う部分だけが残ります。ここではコンパイラの種類によって使うコードを切り替えています。
- **`__builtin_clz`**: GCC と Clang が持つ組み込み関数です。CPU の専用命令（x86 の `lzcnt` など）1 つに置き換わります。ただし引数が 0 のときの結果は **未定義** です。
- **`_BitScanReverse`**: MSVC（Microsoft のコンパイラ）の組み込み関数で、いちばん上の 1 のビット位置を返します。
- **`uint32_t`**: ちょうど 32 ビットの符号なし整数型です。
- **文字列リテラル**: `"abc"` のような書き方は、C++ では `char` の配列です。末尾には自動で `'\0'`（値 0 の文字）が付きます。`"abc"[1]` と書けば `'b'` が取り出せます。
- **`"\4"`**: バックスラッシュと数字は 8 進数のエスケープで、値 4 の文字（`char` の 4）を表します。文字 `'4'` ではありません。

## 何をしているか

### 1. 組み込み関数があるとき

```cpp:line-numbers=166
#if ABSL_NUMERIC_INTERNAL_HAVE_BUILTIN_OR_GCC(__builtin_clz)
  // __builtin_clz を使う。これは次の命令になる:
  // x86: bsr, lzcnt
  // ARM64: clz
  // PPC: cntlzd

  static_assert(sizeof(unsigned int) == sizeof(x),
                "__builtin_clz does not take 32-bit arg");
  // __builtin_clz(0) は未定義なので、0 は特別扱いする。
  return x == 0 ? 32 : __builtin_clz(x);
```

`__builtin_clz` を呼ぶだけです。ただし 0 を渡すと結果が未定義なので、`x == 0 ? 32 : …` で 0 だけ先に処理します。
この分岐の `static_assert` は、`unsigned int` が 32 ビットであること、つまりこの組み込み関数に渡して大丈夫なことを確認しています。

### 2. MSVC のとき

```cpp:line-numbers=176
#elif defined(_MSC_VER) && !defined(__clang__)
  unsigned long result = 0;  // NOLINT(runtime/int)（long 型を使うことへの lint 警告を抑止）
  if (_BitScanReverse(&result, x)) {
    return 31 - result;
  }
  return 32;
```

`_BitScanReverse` は最上位の 1 の位置（0〜31）を返すので、`31 - result` が先頭の 0 の数になります。1 が無ければ 32 です。

### 3. 汎用版: 二分探索

```cpp:line-numbers=183
  int zeroes = 28;
  if (x >> 16) {
    zeroes -= 16;
    x >>= 16;
  }
  if (x >> 8) {
    zeroes -= 8;
    x >>= 8;
  }
  if (x >> 4) {
    zeroes -= 4;
    x >>= 4;
  }
```

`x = 0x00012345` で追ってみます。答えは 15 になるはずです（最上位の 1 は 16 ビット目）。

- `zeroes = 28` から始めます。
- `x >> 16` は `1` で 0 でないので、上半分に 1 があります。`zeroes = 12`、`x = 0x0001` にします。
- `x >> 8` は 0 なので何もしません。
- `x >> 4` も 0 なので何もしません。

この時点で `x` は必ず 0〜15（4 ビット）に収まっています。

### 4. 汎用版: 最後の 4 ビットは表引き

```cpp:line-numbers=196
  return "\4\3\2\2\1\1\1\1\0\0\0\0\0\0\0"[x] + zeroes;
```

`"\4\3\2\2\1\1\1\1\0\0\0\0\0\0\0"[x]` は、4 ビットの値に対する先頭の 0 の数の表です。

| x | 2 進数 | 表の値 |
| --- | --- | --- |
| 0 | 0000 | 4 |
| 1 | 0001 | 3 |
| 2〜3 | 001x | 2 |
| 4〜7 | 01xx | 1 |
| 8〜15 | 1xxx | 0 |

`x = 1` なので表の値は 3、答えは `3 + 12 = 15` です。`x` が最初から 0 なら `4 + 28 = 32` になり、0 の特別扱いもいりません。

## ここがすごい

- **終端の `'\0'` まで表の一部にしている**: リテラルに書かれているのは 15 個だけです。16 個目（`x = 15` のとき）には、自動で付く終端文字 `'\0'`、つまり値 0 が入ります。`x = 15` の答えはちょうど 0 なので、これで正しく動きます。
- **配列変数を用意しない**: 文字列リテラルは読み取り専用の領域に置かれるので、別に `static const char table[16] = {…}` と書くのと同じ働きを 1 行で済ませています。
- **ループを使わない二分探索**: 32 回ループする代わりに、16→8→4 と幅を半分にしながら 3 回の比較で範囲を絞ります。残り 4 ビットを表で引くことで、比較をもう 2 回減らしています。
- **0 の扱いが実装ごとにきちんと違う**: 組み込み命令版は 0 が未定義なので明示的に分岐し、汎用版は表の性質で自然に 32 を返します。それぞれの道具の性質に合わせて書き分けています。

## まとめ

- 文字列リテラルは `char` 配列なので、小さな表として `[]` で直接引ける。
- 終端の `'\0'` も配列の要素として使える。
- 幅を半分ずつにする二分探索で、ビット位置探しのループを消せる。
- 組み込み関数の「0 は未定義」のような制約は、呼ぶ側で必ずガードする。
