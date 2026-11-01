---
title: memcpy で安全に型を読み替える、C++20 以前の bit_cast
description: float のビット列を整数として読むような「型の読み替え」を、未定義動作を避けて行う関数。C++20 の std::bit_cast がなくても使えるよう memcpy で実装している。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [261, 271]
function: detail::bit_cast
difficulty: 2
format: 2
tags: [型システム, 移植性, 低レイヤ, イディオム]
---

## ひとことで

`bit_cast<To>(from)` は、`from` のメモリ上のビット列をそのまま `To` 型の値として取り出す関数です。

たとえば `bit_cast<uint64_t>(1.0)` は `0x3FF0000000000000` を返します。{fmt} は浮動小数点数を文字列にするとき、符号・指数・仮数のビットを直接見る必要があるので、この関数を使います。

## コード

::: code-group

```cpp:line-numbers=261 [日本語訳]
// C++20 より前の環境向けの std::bit_cast の実装。
template <typename To, typename From, FMT_ENABLE_IF(sizeof(To) == sizeof(From))>
FMT_CONSTEXPR20 auto bit_cast(const From& from) -> To {
#ifdef __cpp_lib_bit_cast
  if (is_constant_evaluated()) return std::bit_cast<To>(from);
#endif
  auto to = To();
  // このキャストは GCC の誤った -Wclass-memaccess 警告を抑えるためのもの。
  memcpy(static_cast<void*>(&to), &from, sizeof(to));
  return to;
}
```

```cpp:line-numbers=261 [原文]
// Implementation of std::bit_cast for pre-C++20.
template <typename To, typename From, FMT_ENABLE_IF(sizeof(To) == sizeof(From))>
FMT_CONSTEXPR20 auto bit_cast(const From& from) -> To {
#ifdef __cpp_lib_bit_cast
  if (is_constant_evaluated()) return std::bit_cast<To>(from);
#endif
  auto to = To();
  // The cast suppresses a bogus -Wclass-memaccess on GCC.
  memcpy(static_cast<void*>(&to), &from, sizeof(to));
  return to;
}
```

:::

## 前提知識

- **テンプレート引数 `To` と `From`**: `bit_cast<uint64_t>(x)` と呼ぶと `To` は `uint64_t`、`From` は `x` の型から自動で決まります。
- **`FMT_ENABLE_IF(sizeof(To) == sizeof(From))`**: 条件を満たすときだけこの関数を候補にするマクロです（SFINAE と呼ばれる仕組み）。大きさの違う型どうしでは、同じファイルにある別の `bit_cast` が選ばれます。
- **`const From& from`**: 参照（`&`）は「コピーせず元の変数をそのまま使う」こと、`const` は「書き換えない」ことです。
- **`auto to = To();`**: `To` 型の値を 0 で初期化して作ります。
- **`memcpy(dst, src, n)`**: メモリを n バイトそのままコピーする C の関数です。
- **`#ifdef __cpp_lib_bit_cast`**: 標準ライブラリに `std::bit_cast` があるときだけ定義されるマクロです。
- **`static_cast<void*>(&to)`**: `to` のアドレスを「型のないポインタ」に変換しています。

## 何をしているか

### 1. コンパイル時なら標準の bit_cast

```cpp:line-numbers=264
#ifdef __cpp_lib_bit_cast
  if (is_constant_evaluated()) return std::bit_cast<To>(from);
#endif
```

`memcpy` はコンパイル時（`constexpr` の評価中）には使えません。そこで C++20 の `std::bit_cast` があって、しかもコンパイル時に実行されているときは、そちらを使います。

### 2. 実行時は memcpy

```cpp:line-numbers=267
  auto to = To();
  // このキャストは GCC の誤った -Wclass-memaccess 警告を抑えるためのもの。
  memcpy(static_cast<void*>(&to), &from, sizeof(to));
  return to;
```

`To` 型の入れ物 `to` を作り、`from` のバイト列を `sizeof(to)` バイトそのままコピーして返します。

`double` の `1.0` を `uint64_t` に読み替える例では、8 バイトがそのまま移り、`0x3FF0000000000000`（符号 0、指数 1023、仮数 0）が得られます。

## ここがすごい

- **ポインタのキャストは未定義動作**: 素直に書くと `*reinterpret_cast<uint64_t*>(&d)` ですが、これは C++ の「strict aliasing（型の違うポインタで同じメモリを読んではいけない）」規則に反し、最適化で壊れることがあります。`memcpy` を使うのが規格上正しい方法です。
- **memcpy は遅くない**: 8 バイト程度の固定サイズの `memcpy` は、主要なコンパイラが 1 回のレジスタ移動に置き換えるのが普通です。安全さと速さを両立できます。
- **大きさの一致を型で保証**: `FMT_ENABLE_IF` によって、サイズの違う型を渡すとこの関数は選ばれません。読み替えでバイトが足りない・余る、という事故をコンパイル時に防ぎます。
- **警告への配慮**: `memcpy` の直前のコメントのとおり、`void*` へのキャストは GCC の誤った警告（`-Wclass-memaccess`）を黙らせるためです。動作は変わりません。
- **新旧の規格の橋渡し**: C++20 以降ではコンパイル時にも動き、それ以前の規格でも実行時には動く、という形で古い環境を切り捨てずにいます。

## まとめ

- 型の読み替えはポインタのキャストではなく `memcpy`（C++20 なら `std::bit_cast`）で行う。
- 固定サイズの `memcpy` は、コンパイラがほぼ 0 コストにしてくれる。
- テンプレートの条件（`enable_if`）で、危険な使い方をコンパイル時に弾ける。
- 標準ライブラリの機能があるかはマクロで調べ、なければ自前の実装に切り替える。
