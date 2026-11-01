---
title: マクロで型を量産し、bit_cast で float のバイト順も入れ替える
description: エンディアン変換の土台 EndianInt。マクロで 8〜64 ビットのバイトスワップ関数とサイズ→型の対応表を生成し、std::bit_cast で浮動小数点数も安全に扱う。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/lang/Bits.h
lines: [354, 394]
function: folly::detail::EndianInt
difficulty: 3
format: 2
tags: [ビット演算, マクロ, 移植性, 型システム]
---

## ひとことで

`EndianInt<T>` は、整数や浮動小数点数の **バイトの並び順を入れ替える** ための小さな構造体です。
ネットワークでは「ビッグエンディアン（上位バイトが先）」で数値を送るのが慣習なので、x86 のようなリトルエンディアンの CPU では送受信のたびにバイト順の変換が必要になります。`Endian::big32(x)` などの公開 API は、この構造体の上に作られています。

## コード

::: code-group

```cpp:line-numbers=354 [日本語訳]
template <size_t Size>
struct uint_types_by_size;

#define FB_GEN(sz, fn)                                      \
  static inline uint##sz##_t byteswap_gen(uint##sz##_t v) { \
    return fn(v);                                           \
  }                                                         \
  template <>                                               \
  struct uint_types_by_size<sz / 8> {                       \
    using type = uint##sz##_t;                              \
  };

FB_GEN(8, uint8_t)
#ifdef _MSC_VER
FB_GEN(64, _byteswap_uint64)
FB_GEN(32, _byteswap_ulong)
FB_GEN(16, _byteswap_ushort)
#else
FB_GEN(64, __builtin_bswap64)
FB_GEN(32, __builtin_bswap32)
FB_GEN(16, __builtin_bswap16)
#endif

#undef FB_GEN

template <class T>
struct EndianInt {
  static_assert(
      (std::is_integral<T>::value && !std::is_same<T, bool>::value) ||
          std::is_floating_point<T>::value,
      "template type parameter must be non-bool integral or floating point");
  static T swap(T x) {
    // bit_cast で実装している。C++ で動作が定義されているから
    // bit_cast の呼び出しはコンパイラが最適化で消してくれることを当てにしている
    constexpr auto s = sizeof(T);
    using B = typename uint_types_by_size<s>::type;
    return std::bit_cast<T>(byteswap_gen(std::bit_cast<B>(x)));
  }
  static T big(T x) { return kIsLittleEndian ? EndianInt::swap(x) : x; }
  static T little(T x) { return kIsBigEndian ? EndianInt::swap(x) : x; }
};
```

```cpp:line-numbers=354 [原文]
template <size_t Size>
struct uint_types_by_size;

#define FB_GEN(sz, fn)                                      \
  static inline uint##sz##_t byteswap_gen(uint##sz##_t v) { \
    return fn(v);                                           \
  }                                                         \
  template <>                                               \
  struct uint_types_by_size<sz / 8> {                       \
    using type = uint##sz##_t;                              \
  };

FB_GEN(8, uint8_t)
#ifdef _MSC_VER
FB_GEN(64, _byteswap_uint64)
FB_GEN(32, _byteswap_ulong)
FB_GEN(16, _byteswap_ushort)
#else
FB_GEN(64, __builtin_bswap64)
FB_GEN(32, __builtin_bswap32)
FB_GEN(16, __builtin_bswap16)
#endif

#undef FB_GEN

template <class T>
struct EndianInt {
  static_assert(
      (std::is_integral<T>::value && !std::is_same<T, bool>::value) ||
          std::is_floating_point<T>::value,
      "template type parameter must be non-bool integral or floating point");
  static T swap(T x) {
    // we implement this with bit_cast because that is defined behavior in C++
    // we rely on compilers to optimize away the bit_cast calls
    constexpr auto s = sizeof(T);
    using B = typename uint_types_by_size<s>::type;
    return std::bit_cast<T>(byteswap_gen(std::bit_cast<B>(x)));
  }
  static T big(T x) { return kIsLittleEndian ? EndianInt::swap(x) : x; }
  static T little(T x) { return kIsBigEndian ? EndianInt::swap(x) : x; }
};
```

:::

## 前提知識

- **エンディアン**: 複数バイトの数値をメモリに置く順番です。`0x11223344` を `11 22 33 44` と置くのがビッグエンディアン、`44 33 22 11` と置くのがリトルエンディアンです。
- **マクロ `#define`**: コンパイル前に文字列を置き換える仕組みです。`FB_GEN(32, __builtin_bswap32)` と書くと、`sz` が `32`、`fn` が `__builtin_bswap32` に置き換わったコードが展開されます。行末の `\` は「次の行に続く」という意味です。
- **`##`（トークン連結）**: マクロの中で `uint##sz##_t` と書くと、`sz` が 32 のとき `uint32_t` という 1 つの名前になります。
- **テンプレートの特殊化**: `template <size_t Size> struct uint_types_by_size;` と宣言だけしておき、`template <> struct uint_types_by_size<4> { using type = uint32_t; };` のように「この値のときはこう」と個別に定義できます。ここでは「バイト数 → 同じ大きさの符号なし整数型」の対応表になっています。
- **`std::bit_cast<T>(x)`**（C++20）: `x` のビット列をそのまま型 `T` として読み直します。`float` の中身を `uint32_t` として見る、といった操作を **未定義動作なしで** 行えます。
- **`__builtin_bswap32`**: GCC/Clang の組み込み関数で、32 ビット整数のバイト順を反転します。MSVC では `_byteswap_ulong` が同じ役目です。
- **`static`メンバ関数**: オブジェクトを作らずに `EndianInt<int>::swap(x)` の形で呼べる関数です。

## 何をしているか

### 1. マクロで「スワップ関数」と「対応表」を同時に作る

```cpp:line-numbers=357
#define FB_GEN(sz, fn)                                      \
  static inline uint##sz##_t byteswap_gen(uint##sz##_t v) { \
    return fn(v);                                           \
  }                                                         \
  template <>                                               \
  struct uint_types_by_size<sz / 8> {                       \
    using type = uint##sz##_t;                              \
  };

FB_GEN(8, uint8_t)
#ifdef _MSC_VER
FB_GEN(64, _byteswap_uint64)
FB_GEN(32, _byteswap_ulong)
FB_GEN(16, _byteswap_ushort)
#else
FB_GEN(64, __builtin_bswap64)
FB_GEN(32, __builtin_bswap32)
FB_GEN(16, __builtin_bswap16)
#endif

#undef FB_GEN
```

`FB_GEN(32, __builtin_bswap32)` は次の 2 つに展開されます。

- `uint32_t` を受け取り `__builtin_bswap32` を呼ぶ `byteswap_gen` 関数
- `uint_types_by_size<4>` の特殊化（`type` は `uint32_t`）

これを 8・16・32・64 ビットについて並べています。8 ビットは 1 バイトしかないので、反転は何もしない操作です。`fn` に `uint8_t` を渡し、`uint8_t(v)` という単なる変換にしているのが面白いところです。
MSVC かどうかで呼ぶ組み込み関数を切り替え、使い終わったマクロは `#undef` で消しています。

### 2. bit_cast で整数に化けさせてから反転する

```cpp:line-numbers=385
  static T swap(T x) {
    // we implement this with bit_cast because that is defined behavior in C++
    // we rely on compilers to optimize away the bit_cast calls
    constexpr auto s = sizeof(T);
    using B = typename uint_types_by_size<s>::type;
    return std::bit_cast<T>(byteswap_gen(std::bit_cast<B>(x)));
  }
```

`T = float`（4 バイト）で追います。

- `s = sizeof(float)` = `4`
- `B = uint_types_by_size<4>::type` = `uint32_t`
- `std::bit_cast<uint32_t>(x)` で `float` のビット列を整数として取り出す
- `byteswap_gen` でバイト順を反転（オーバーロードにより `uint32_t` 版が選ばれる）
- `std::bit_cast<float>(...)` で `float` に戻す

### 3. big / little は「必要なときだけ swap」

```cpp:line-numbers=392
  static T big(T x) { return kIsLittleEndian ? EndianInt::swap(x) : x; }
  static T little(T x) { return kIsBigEndian ? EndianInt::swap(x) : x; }
```

`big(x)` は「この CPU の表現とビッグエンディアンを相互変換する」関数です。リトルエンディアンの CPU なら `swap`、ビッグエンディアンの CPU なら何もしません。`kIsLittleEndian` はコンパイル時定数なので、不要な側は最適化で消えます。

## ここがすごい

- **対応表と関数をマクロで一括生成**: サイズごとに「関数」と「型の対応」を別々に書くと、片方だけ追加し忘れる事故が起きます。1 つのマクロにまとめて、必ずセットで定義されるようにしています。
- **`bit_cast` で浮動小数点数も扱う**: `float` のバイト順を変えるのに、ポインタを `uint32_t*` に変換して読む方法は、C++ では型の別名規則に違反する未定義動作です。コメントのとおり、`bit_cast` は定義された動作で、しかもコンパイラが最適化で消してくれます。
- **サイズから型を引く**: `T` が `int64_t` でも `double` でも、「8 バイト」という情報だけで `uint64_t` 版のスワップに行き着きます。型ごとに関数を書く必要がありません。
- **`static_assert` で対象を限定**: `bool` や構造体のような、バイト順の反転に意味がない型はコンパイル時に拒否されます。

## まとめ

- 関連する定義をまとめて生成するマクロは、追加漏れを防ぐ。
- テンプレートの特殊化は「値 → 型」の対応表として使える。
- 型の中身を別の型として読み直すなら `std::bit_cast` を使う。ポインタのキャストは未定義動作になりうる。
- コンパイル時定数で分岐すれば、実行時のコストは残らない。
