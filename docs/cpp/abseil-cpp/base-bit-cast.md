---
title: 型の「ビットだけ」を写す bit_cast と memcpy の正しい使い方
description: float のビット列を int として読むような型の読み替えを、未定義動作なしで行う bit_cast。標準版がなければコンパイラ組み込み、それもなければ memcpy で実現する。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/base/casts.h
lines: [171, 199]
function: bit_cast
difficulty: 2
tags: [型システム, 低レイヤ, 移植性]
---

## ひとことで

`absl::bit_cast<Dest>(source)` は、`source` の **ビット列をそのまま** 別の型 `Dest` の値として取り出す関数です。
たとえば `float` の `3.14159265` を `bit_cast<int>` すると、IEEE 754 形式のビット列 `0x40490fdb` が整数として得られます（ファイル中のコメントにある例です）。

C++20 には `std::bit_cast` がありますが、それより前の環境向けに、コンパイラ組み込み関数か `memcpy` で同じことを実現しています。

## コード

::: code-group

```cpp:line-numbers=171 [日本語訳]
#if defined(__cpp_lib_bit_cast) && __cpp_lib_bit_cast >= 201806L

using std::bit_cast;

#else  // defined(__cpp_lib_bit_cast) && __cpp_lib_bit_cast >= 201806L（標準版がない場合）

template <typename Dest, typename Source,
          std::enable_if_t<sizeof(Dest) == sizeof(Source) &&
                               std::is_trivially_copyable_v<Source> &&
                               std::is_trivially_copyable_v<Dest>
#if !ABSL_HAVE_BUILTIN(__builtin_bit_cast)
                               && std::is_default_constructible_v<Dest>
#endif  // !ABSL_HAVE_BUILTIN(__builtin_bit_cast)（組み込み関数がない場合だけの条件）
                           ,
                           int> = 0>
#if ABSL_HAVE_BUILTIN(__builtin_bit_cast)
inline constexpr Dest bit_cast(const Source& source) {
  return __builtin_bit_cast(Dest, source);
}
#else  // ABSL_HAVE_BUILTIN(__builtin_bit_cast)（組み込み関数がない場合）
inline Dest bit_cast(const Source& source) {
  Dest dest;
  memcpy(static_cast<void*>(std::addressof(dest)),
         static_cast<const void*>(std::addressof(source)), sizeof(dest));
  return dest;
}
#endif  // ABSL_HAVE_BUILTIN(__builtin_bit_cast) の分岐ここまで

#endif  // defined(__cpp_lib_bit_cast) && __cpp_lib_bit_cast >= 201806L の分岐ここまで
```

```cpp:line-numbers=171 [原文]
#if defined(__cpp_lib_bit_cast) && __cpp_lib_bit_cast >= 201806L

using std::bit_cast;

#else  // defined(__cpp_lib_bit_cast) && __cpp_lib_bit_cast >= 201806L

template <typename Dest, typename Source,
          std::enable_if_t<sizeof(Dest) == sizeof(Source) &&
                               std::is_trivially_copyable_v<Source> &&
                               std::is_trivially_copyable_v<Dest>
#if !ABSL_HAVE_BUILTIN(__builtin_bit_cast)
                               && std::is_default_constructible_v<Dest>
#endif  // !ABSL_HAVE_BUILTIN(__builtin_bit_cast)
                           ,
                           int> = 0>
#if ABSL_HAVE_BUILTIN(__builtin_bit_cast)
inline constexpr Dest bit_cast(const Source& source) {
  return __builtin_bit_cast(Dest, source);
}
#else  // ABSL_HAVE_BUILTIN(__builtin_bit_cast)
inline Dest bit_cast(const Source& source) {
  Dest dest;
  memcpy(static_cast<void*>(std::addressof(dest)),
         static_cast<const void*>(std::addressof(source)), sizeof(dest));
  return dest;
}
#endif  // ABSL_HAVE_BUILTIN(__builtin_bit_cast)

#endif  // defined(__cpp_lib_bit_cast) && __cpp_lib_bit_cast >= 201806L
```

:::

## 前提知識

- **型の読み替え（type punning）と未定義動作**: `*reinterpret_cast<int*>(&f)` のように、`float` のメモリを `int` のポインタで読むのは、C++ の規格では **未定義動作** です。コンパイラは「違う型のポインタは同じ場所を指さない」と仮定して最適化するので、思わぬ結果になることがあります。
- **`memcpy(dst, src, n)`**: メモリの `n` バイトをコピーする C の関数です。バイト単位のコピーは、型の規則に違反しません。
- **トリビアルコピー可能（trivially copyable）**: バイトをそのままコピーしても正しく複製できる型のことです。`int` や `float`、単純な構造体が該当します。ポインタで別の領域を管理するような型は該当しません。
- **`std::enable_if_t<条件, int> = 0`**: テンプレート引数に置くと、条件を満たさない型ではこの関数が **最初から存在しない** 扱いになります（SFINAE と呼ばれる仕組み）。
- **`std::addressof(x)`**: `x` のアドレスを取ります。`&x` と違い、型が `&` 演算子を独自に定義していても本当のアドレスが得られます。
- **`using std::bit_cast;`**: 標準ライブラリの関数を `absl::bit_cast` という名前でも使えるようにする宣言です。

## 何をしているか

### 1. 標準版があればそれを使う

```cpp:line-numbers=171
#if defined(__cpp_lib_bit_cast) && __cpp_lib_bit_cast >= 201806L

using std::bit_cast;
```

`__cpp_lib_bit_cast` は、標準ライブラリが `std::bit_cast` を持っているときに定義されるマクロです。あれば `using` で名前を借りるだけで終わりです。

### 2. 使える型を絞る

```cpp:line-numbers=177
template <typename Dest, typename Source,
          std::enable_if_t<sizeof(Dest) == sizeof(Source) &&
                               std::is_trivially_copyable_v<Source> &&
                               std::is_trivially_copyable_v<Dest>
#if !ABSL_HAVE_BUILTIN(__builtin_bit_cast)
                               && std::is_default_constructible_v<Dest>
#endif  // !ABSL_HAVE_BUILTIN(__builtin_bit_cast)（組み込み関数がない場合だけの条件）
                           ,
                           int> = 0>
```

次の条件をすべて満たすときだけ関数が使えます。

- `sizeof(Dest) == sizeof(Source)`: 大きさが同じであること。4 バイトの `float` を 8 バイトの `double` に化けさせることはできません。
- 両方がトリビアルコピー可能であること。
- 組み込み関数がない場合は、`Dest` がデフォルト構築できること（後で `Dest dest;` と書くため）。

条件を満たさなければ、呼んだ時点でコンパイルエラーになります。

### 3. 組み込み関数を使う版

```cpp:line-numbers=186
#if ABSL_HAVE_BUILTIN(__builtin_bit_cast)
inline constexpr Dest bit_cast(const Source& source) {
  return __builtin_bit_cast(Dest, source);
}
```

`__builtin_bit_cast` は GCC や Clang が持つ組み込み関数で、`constexpr`、つまりコンパイル時にも使えます。

### 4. memcpy を使う版

```cpp:line-numbers=191
inline Dest bit_cast(const Source& source) {
  Dest dest;
  memcpy(static_cast<void*>(std::addressof(dest)),
         static_cast<const void*>(std::addressof(source)), sizeof(dest));
  return dest;
}
```

組み込み関数もない場合は、`Dest` の変数を作り、`source` のバイトを `memcpy` で写します。
`float f = 1.0f` なら、メモリ上の 4 バイト `00 00 80 3f`（リトルエンディアンの場合）がそのまま `int` の変数にコピーされ、`0x3f800000` が得られます。

## ここがすごい

- **`memcpy` は遅くない**: 「わざわざコピーするのは遅いのでは」と思うかもしれません。しかし大きさが定数の小さな `memcpy` は、多くのコンパイラがレジスタ間の移動 1 回に置き換えます。安全で、しかも速い書き方です。
- **3 段構えの移植性**: 標準版、コンパイラ組み込み版、`memcpy` 版の順に、使えるいちばん良いものを選びます。どの環境でも同じ名前・同じ意味で使えます。
- **条件をテンプレートで強制する**: 大きさが違う型や、バイトコピーで壊れる型の読み替えは、実行時ではなく **コンパイル時に** 弾かれます。間違った使い方がそもそも書けない API です。
- **`static_cast<void*>` を挟む理由**: `memcpy` に渡すポインタを明示的に `void*` にしています。クラス型のポインタを直接 `memcpy` に渡すとコンパイラの警告が出ることがあるので、意図的なバイトコピーであることを示しています。

ファイル中のコメントには「`*bit_cast<int*>(&f)` のようにポインタを `bit_cast` してから読むのは、`reinterpret_cast` と同じくらい間違い」とも書かれています。値そのものに使うのが正しい使い方です。

## まとめ

- 別の型のポインタでメモリを読むのは未定義動作。型の読み替えはバイトのコピーで行う。
- 小さな固定サイズの `memcpy` は、コンパイラが最適化して実質タダになる。
- 標準 → 組み込み → 汎用の順にフォールバックすると、移植性と性能を両立できる。
- 誤用をテンプレートの条件で弾くと、間違いがコンパイル時に見つかる。
