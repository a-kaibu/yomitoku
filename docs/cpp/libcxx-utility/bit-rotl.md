---
title: 負の回転数も受け付けるビット回転を、2 つの関数に分けて書く理由
description: std::rotl と std::rotr の実装。剰余で回転数を整え、0 回転を先に返してシフト幅の未定義動作を避ける。左右を別々に書くことで x86 の ROL/ROR 命令に変換されやすくしている。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__bit/rotate.h
lines: [22, 54]
function: std::rotl / std::rotr
difficulty: 2
format: 2
tags: [ビット演算, 標準ライブラリ, 最適化]
---
## ひとことで

`rotl` は整数のビット列を **左に回転** させる関数です。左端からはみ出したビットは、右端に回り込みます。
たとえば 8 ビットの `1000 0001` を左に 1 回転すると `0000 0011` になります。
`rotr` はその右回り版です。どちらも回転数に負の数を渡すと、逆向きに回ります。

## コード

::: code-group

```cpp:line-numbers=22 [日本語訳]
// rotl と rotr をそれぞれ完全な関数として書くほうが、コンパイラが
// 最適化しやすい。x86 ではこの関数は ROL 命令になり、
// rotr 関数は ROR 命令になる。

#if _LIBCPP_STD_VER >= 20

template <__unsigned_integer _Tp>
[[nodiscard]] constexpr _Tp rotl(_Tp __t, int __cnt) noexcept {
  const int __n = numeric_limits<_Tp>::digits;
  int __r       = __cnt % __n;

  if (__r == 0)
    return __t;

  if (__r > 0)
    return (__t << __r) | (__t >> (__n - __r));

  return (__t >> -__r) | (__t << (__n + __r));
}

template <__unsigned_integer _Tp>
[[nodiscard]] constexpr _Tp rotr(_Tp __t, int __cnt) noexcept {
  const int __n = numeric_limits<_Tp>::digits;
  int __r       = __cnt % __n;

  if (__r == 0)
    return __t;

  if (__r > 0)
    return (__t >> __r) | (__t << (__n - __r));

  return (__t << -__r) | (__t >> (__n + __r));
}
```

```cpp:line-numbers=22 [原文]
// Writing two full functions for rotl and rotr makes it easier for the compiler
// to optimize the code. On x86 this function becomes the ROL instruction and
// the rotr function becomes the ROR instruction.

#if _LIBCPP_STD_VER >= 20

template <__unsigned_integer _Tp>
[[nodiscard]] constexpr _Tp rotl(_Tp __t, int __cnt) noexcept {
  const int __n = numeric_limits<_Tp>::digits;
  int __r       = __cnt % __n;

  if (__r == 0)
    return __t;

  if (__r > 0)
    return (__t << __r) | (__t >> (__n - __r));

  return (__t >> -__r) | (__t << (__n + __r));
}

template <__unsigned_integer _Tp>
[[nodiscard]] constexpr _Tp rotr(_Tp __t, int __cnt) noexcept {
  const int __n = numeric_limits<_Tp>::digits;
  int __r       = __cnt % __n;

  if (__r == 0)
    return __t;

  if (__r > 0)
    return (__t >> __r) | (__t << (__n - __r));

  return (__t << -__r) | (__t >> (__n + __r));
}
```

:::

## 前提知識

- **`template <__unsigned_integer _Tp>`**: テンプレートに「符号なし整数型だけ」という制約（コンセプト）を付けています。`int` や `double` を渡すとコンパイルエラーになります。
- **`<<` と `>>`**: ビットを左右にずらすシフト演算です。はみ出したビットは消え、空いたところには 0 が入ります。
- **`|`**: ビットごとの OR です。どちらか一方が 1 の桁を 1 にします。
- **`%`**: 割り算の余りです。C++ では **負の数の余りは負** になります。`-3 % 8` は `-3` です。
- **シフト幅の未定義動作**: C++ では、型のビット数以上（またはマイナス）のシフトは **未定義動作**（何が起きても文句を言えない状態）です。32 ビット型を 32 ビットずらしてはいけません。
- **`numeric_limits<_Tp>::digits`**: 型のビット数です。`unsigned char` なら 8 です。

## 何をしているか

8 ビットの `__t = 1000 0001`（10 進で 129）を例に、`rotl` を追います。

### 1. 回転数を整える

```cpp:line-numbers=30
  const int __n = numeric_limits<_Tp>::digits;
  int __r       = __cnt % __n;
```

`__n = 8` です。回転は 8 回で一周するので、`__cnt % __n` で余分な周回を取り除きます。`__cnt = 9` なら `__r = 1`、`__cnt = -3` なら `__r = -3` です。

### 2. 0 回転なら何もしない

```cpp:line-numbers=33
  if (__r == 0)
    return __t;
```

`__r == 0` のときはそのまま返します。これは単なる近道ではありません。次の式で `__t >> (__n - 0)`、つまり **8 ビット型を 8 ビットずらす** ことになり、未定義動作になるのを避けるために必要です。

### 3. 正の回転

```cpp:line-numbers=36
  if (__r > 0)
    return (__t << __r) | (__t >> (__n - __r));
```

`__r = 1` のとき:

```
__t << 1         = 0000 0010   （左端の 1 は消える）
__t >> (8 - 1)   = 0000 0001   （左端の 1 が右端へ）
OR               = 0000 0011
```

左にずらした分と、右から回り込む分を OR で合わせれば回転になります。

### 4. 負の回転

```cpp:line-numbers=39
  return (__t >> -__r) | (__t << (__n + __r));
```

`__r = -3` のときは右に 3 回転です。`__t >> 3` と `__t << (8 - 3)` を OR します。`-__r` と `__n + __r` はどちらも 1〜7 の範囲に収まるので、シフト幅は常に安全です。

`rotr`は、`<<` と `>>` の向きを入れ替えただけの同じ形です。

## ここがすごい

関数の前に置かれたコメントが設計の理由を述べています。「`rotl` と `rotr` を **それぞれ完全な関数として書く** ほうが、コンパイラが最適化しやすい。x86 では `rotl` が ROL 命令に、`rotr` が ROR 命令になる」。

素直に書くなら `rotr(x, n)` を `rotl(x, -n)` と 1 行で済ませたくなります。コードは短くなりますが、コンパイラが「これは右回転だ」と見抜く手間が増えます。あえて重複を許し、**コンパイラが認識しやすい定型パターン**（`(x << r) | (x >> (n - r))`）をそのまま置いています。

もう 1 つは安全性です。回転を素直に `(x << r) | (x >> (n - r))` とだけ書くと、`r == 0` で未定義動作になります。この関数は剰余と 0 の早期リターンで、どんな `int` を渡されても安全なシフト幅だけを使います。

## まとめ

- ビット回転は「左シフト」と「反対側への右シフト」を OR で合わせて作れる。
- 型のビット数ちょうどのシフトは未定義動作なので、0 回転は別扱いにする。
- C++ の `%` は負の数に負の余りを返す。それを前提に分岐を組んでいる。
- コンパイラが認識しやすい形で書くと、1 命令に置き換えてもらえることがある。重複より最適化を選ぶ場面もある。
