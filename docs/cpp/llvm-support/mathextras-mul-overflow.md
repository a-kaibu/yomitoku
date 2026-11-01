---
title: 負の側が 1 つ広い非対称を割り算 1 回で正しく扱う、掛け算のあふれ検出
description: 符号付き整数の掛け算があふれたかを返す MulOverflow。絶対値を符号なしで掛け、答えが負なら許容範囲を 1 広げて判定する。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [772, 814]
function: llvm::MulOverflow
difficulty: 3
tags: [数値計算, 防御的プログラミング, 移植性]
format: 2
---

## ひとことで

`MulOverflow(X, Y)` は、符号付き整数の掛け算 `X * Y` を計算し、**「結果」と「あふれたか」の組**を返します。

`int8_t`（-128〜127）で考えると、

- `MulOverflow(-16, 8)` → 結果 `-128`、あふれ `false`（ちょうど最小値）
- `MulOverflow(16, 8)` → 結果 `-128`、あふれ `true`（本来 128 は入らない）

同じビット列になる 2 つを、正しく見分けられるのがポイントです。

## コード

::: code-group

```cpp:line-numbers=772 [日本語訳]
/// 2 つの符号付き整数を掛け、2 の補数で切り詰めた結果を計算して、
/// 組 {result, overflow} を返す。"overflow" は
/// あふれが起きたかどうかを示す真偽値。
template <typename T>
constexpr std::enable_if_t<std::is_signed_v<T>, std::pair<T, bool>>
MulOverflow(T X, T Y) {
  // 絶対値どうしを符号なしで掛ける。
  using U = std::make_unsigned_t<T>;
  const U UX = X < 0 ? (0 - static_cast<U>(X)) : static_cast<U>(X);
  const U UY = Y < 0 ? (0 - static_cast<U>(Y)) : static_cast<U>(Y);
  const U UResult = UX * UY;

  // 符号付きに変換する。
  const bool IsNegative = (X < 0) ^ (Y < 0);
  auto Result = IsNegative ? (0 - UResult) : UResult;

  // どちらかの引数が 0 なら、結果は 0 であふれは起きない。
  if (UX == 0 || UY == 0)
    return {Result, false};

  // UX と UY は [1, 2^n] の範囲にある（n は桁数）。
  // 許される最大の絶対値（負なら 2^n、正なら 2^(n-1)）を
  // 一方の引数で割り、もう一方と比べる。
  bool Overflow =
      IsNegative
          ? UX > (static_cast<U>(std::numeric_limits<T>::max()) + U(1)) / UY
          : UX > (static_cast<U>(std::numeric_limits<T>::max())) / UY;

  return {Result, Overflow};
}

/// 2 つの符号付き整数を掛け、2 の補数で切り詰めた結果を計算して、
/// 結果を計算し、あふれが起きたら true を返す。
template <typename T>
std::enable_if_t<std::is_signed_v<T>, bool> MulOverflow(T X, T Y, T &Result) {
#if __has_builtin(__builtin_mul_overflow)
  return __builtin_mul_overflow(X, Y, &Result);
#else
  auto [Res, Ovf] = MulOverflow(X, Y);
  Result = Res;
  return Ovf;
#endif
}
```

```cpp:line-numbers=772 [原文]
/// Multiply two signed integers, computing the two's complement truncated
/// result, returning a pair {result, overflow}, where "overflow" is a
/// boolean value indicating whether an overflow occurred.
template <typename T>
constexpr std::enable_if_t<std::is_signed_v<T>, std::pair<T, bool>>
MulOverflow(T X, T Y) {
  // Perform the unsigned multiplication on absolute values.
  using U = std::make_unsigned_t<T>;
  const U UX = X < 0 ? (0 - static_cast<U>(X)) : static_cast<U>(X);
  const U UY = Y < 0 ? (0 - static_cast<U>(Y)) : static_cast<U>(Y);
  const U UResult = UX * UY;

  // Convert to signed.
  const bool IsNegative = (X < 0) ^ (Y < 0);
  auto Result = IsNegative ? (0 - UResult) : UResult;

  // If any of the args was 0, result is 0 and no overflow occurs.
  if (UX == 0 || UY == 0)
    return {Result, false};

  // UX and UY are in [1, 2^n], where n is the number of digits.
  // Check how the max allowed absolute value (2^n for negative, 2^(n-1) for
  // positive) divided by an argument compares to the other.
  bool Overflow =
      IsNegative
          ? UX > (static_cast<U>(std::numeric_limits<T>::max()) + U(1)) / UY
          : UX > (static_cast<U>(std::numeric_limits<T>::max())) / UY;

  return {Result, Overflow};
}

/// Multiply two signed integers, computing the two's complement truncated
/// result, returning true if an overflow occurred.
template <typename T>
std::enable_if_t<std::is_signed_v<T>, bool> MulOverflow(T X, T Y, T &Result) {
#if __has_builtin(__builtin_mul_overflow)
  return __builtin_mul_overflow(X, Y, &Result);
#else
  auto [Res, Ovf] = MulOverflow(X, Y);
  Result = Res;
  return Ovf;
#endif
}
```

:::

## 前提知識

- **`std::pair<T, bool>`**: 2 つの値の組です。`{Result, false}` のように波かっこで作れます。
- **`using U = std::make_unsigned_t<T>;`**: `T` の符号なし版に `U` という名前を付けています。
- **`0 - static_cast<U>(X)`**: 負の `X` を符号なしにしてから 0 から引くと、絶対値になります。符号なしの引き算は一周が許されるので、`X` が最小値（-128）でも安全に `128` が得られます。
- **`^`（XOR）**: `(X < 0) ^ (Y < 0)` は、片方だけが負のとき `true` です。つまり「積が負になるか」です。
- **2 の補数の非対称**: `int8_t` は -128 から 127 まで。**負の側のほうが 1 つ広い**ので、積の絶対値の上限は、答えが負なら 128、正なら 127 です。
- **`__builtin_mul_overflow`**: GCC/Clang の組み込み関数で、あふれ判定つきの掛け算を効率よく行います。

## 何をしているか

### 1. 絶対値を符号なしで掛ける

```cpp:line-numbers=779
  using U = std::make_unsigned_t<T>;
  const U UX = X < 0 ? (0 - static_cast<U>(X)) : static_cast<U>(X);
  const U UY = Y < 0 ? (0 - static_cast<U>(Y)) : static_cast<U>(Y);
  const U UResult = UX * UY;
```

`X = -16, Y = 8`（`int8_t`）の場合、`UX = 16, UY = 8`、`UResult = 128` です。
符号なしで計算するので、ここであふれても未定義動作にはなりません。

### 2. 符号を付け直す

```cpp:line-numbers=785
  const bool IsNegative = (X < 0) ^ (Y < 0);
  auto Result = IsNegative ? (0 - UResult) : UResult;
```

片方だけが負なので `IsNegative = true`。`0 - 128` を符号なしで計算すると、ビット列は `1000 0000`、`int8_t` として読むと `-128` です。

### 3. 0 なら即「あふれなし」

```cpp:line-numbers=789
  if (UX == 0 || UY == 0)
    return {Result, false};
```

どちらかが 0 なら積は 0 です。次の判定で 0 による割り算をしないためにも、ここで抜けます。

### 4. 上限を割って比べる

```cpp:line-numbers=795
  bool Overflow =
      IsNegative
          ? UX > (static_cast<U>(std::numeric_limits<T>::max()) + U(1)) / UY
          : UX > (static_cast<U>(std::numeric_limits<T>::max())) / UY;
```

積の絶対値 `UX * UY` が上限 `Limit` を超えるかを、**`UX > Limit / UY`** で調べます。掛け算をせずに割り算で比べるので、判定そのものがあふれません。

```
X = -16, Y = 8:  負なので Limit = 127 + 1 = 128
                 128 / 8 = 16、UX = 16 > 16 ? → false（あふれなし）

X = 16, Y = 8:   正なので Limit = 127
                 127 / 8 = 15、UX = 16 > 15 ? → true（あふれ）
```

`a > ⌊L / b⌋` は、正の整数では `a * b > L` と同じ意味になります。

### 5. 組み込み関数版

```cpp:line-numbers=805
template <typename T>
std::enable_if_t<std::is_signed_v<T>, bool> MulOverflow(T X, T Y, T &Result) {
#if __has_builtin(__builtin_mul_overflow)
  return __builtin_mul_overflow(X, Y, &Result);
#else
  auto [Res, Ovf] = MulOverflow(X, Y);
  Result = Res;
  return Ovf;
#endif
}
```

使えれば `__builtin_mul_overflow` に任せ、使えなければ上の汎用版を呼びます。

## ここがすごい

素直に「掛けてから割り戻して確かめる」（`R = X * Y; if (X != 0 && R / X != Y)`）と書くと、符号付きの掛け算があふれた瞬間に未定義動作です。しかも `-1 * INT_MIN` のような組み合わせでは割り戻しの割り算自体があふれます。

この実装は、

- **絶対値を符号なしで扱う**ことで、すべての計算を定義された動作の範囲に収め、
- **積が負になるときだけ上限を 1 広げる**ことで、2 の補数の非対称（最小値は表せるが、その絶対値は正の側に無い）を正確に反映し、
- **割り算 1 回の比較**であふれを判定します。

`Overflow` の計算の上にあるコメントは、「絶対値は `[1, 2^n]`（n は符号を除いた桁数。`int8_t` なら 7）に入り、許される上限は負なら `2^n`」という根拠を簡潔に述べています。正の側の上限は、コードのとおり型の最大値 `2^n - 1` です。境界をコードとコメントの両方で丁寧に詰めている好例です。

## まとめ

- 符号付きの掛け算は、絶対値を符号なしで掛けて、符号を後から付けると安全。
- 2 の補数では負の側が 1 つ広い。積が負なら上限を 1 増やして判定する。
- `a * b > L` は `a > L / b` と言い換えると、判定自体があふれない。
- 0 を先に処理しておくと、割り算の 0 除算も防げる。
