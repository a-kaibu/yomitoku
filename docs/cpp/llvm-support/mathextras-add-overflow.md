---
title: 符号付きの足し算を「符号なしで計算して符号で確かめる」あふれ検出
description: 符号付き整数の足し算があふれたかを返す AddOverflow。未定義動作を避けて符号なしで足し、正+正が負になったらあふれと判定する。使えればコンパイラ組み込みに任せる。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [698, 733]
function: llvm::AddOverflow
difficulty: 2
tags: [数値計算, 防御的プログラミング, 移植性]
format: 2
---

## ひとことで

`AddOverflow(X, Y)` は、符号付き整数 `X + Y` を計算し、**「結果」と「あふれたかどうか」の組**を返します。
`int8_t`（-128〜127）で `AddOverflow(100, 50)` なら、結果は一周した `-106`、あふれは `true` です。

「この足し算は安全か」を調べたい場面のための関数で、`constexpr` 版はコンパイル時の計算にも使えます。

## コード

::: code-group

```cpp:line-numbers=698 [日本語訳]
/// 2 つの符号付き整数を足し、2 の補数で切り詰めた結果を計算して、
/// 組 {result, overflow} を返す。"overflow" は
/// あふれが起きたかどうかを示す真偽値。
template <typename T>
constexpr std::enable_if_t<std::is_signed_v<T>, std::pair<T, bool>>
AddOverflow(T X, T Y) {
  // 符号なしで足し算する。
  using U = std::make_unsigned_t<T>;
  const U UX = static_cast<U>(X);
  const U UY = static_cast<U>(Y);
  const U UResult = UX + UY;

  // 符号付きに変換する。
  auto Result = static_cast<T>(UResult);

  // 正の数どうしを足したら、正の数になるはず。
  if (X > 0 && Y > 0)
    return {Result, Result <= 0};
  // 負の数どうしを足したら、負の数になるはず。
  if (X < 0 && Y < 0)
    return {Result, Result >= 0};
  return {Result, false};
}

/// 2 つの符号付き整数を足し、2 の補数で切り詰めた結果を計算して、
/// あふれが起きたら true を返す。
template <typename T>
std::enable_if_t<std::is_signed_v<T>, bool> AddOverflow(T X, T Y, T &Result) {
#if __has_builtin(__builtin_add_overflow)
  return __builtin_add_overflow(X, Y, &Result);
#else
  auto [Res, Ovf] = AddOverflow(X, Y);
  Result = Res;
  return Ovf;
#endif
}
```

```cpp:line-numbers=698 [原文]
/// Add two signed integers, computing the two's complement truncated result,
/// returning a pair {result, overflow}, where "overflow" is a boolean value
/// indicating whether an overflow occurred.
template <typename T>
constexpr std::enable_if_t<std::is_signed_v<T>, std::pair<T, bool>>
AddOverflow(T X, T Y) {
  // Perform the unsigned addition.
  using U = std::make_unsigned_t<T>;
  const U UX = static_cast<U>(X);
  const U UY = static_cast<U>(Y);
  const U UResult = UX + UY;

  // Convert to signed.
  auto Result = static_cast<T>(UResult);

  // Adding two positive numbers should result in a positive number.
  if (X > 0 && Y > 0)
    return {Result, Result <= 0};
  // Adding two negatives should result in a negative number.
  if (X < 0 && Y < 0)
    return {Result, Result >= 0};
  return {Result, false};
}

/// Add two signed integers, computing the two's complement truncated result,
/// returning true if overflow occurred.
template <typename T>
std::enable_if_t<std::is_signed_v<T>, bool> AddOverflow(T X, T Y, T &Result) {
#if __has_builtin(__builtin_add_overflow)
  return __builtin_add_overflow(X, Y, &Result);
#else
  auto [Res, Ovf] = AddOverflow(X, Y);
  Result = Res;
  return Ovf;
#endif
}
```

:::

## 前提知識

- **`std::enable_if_t<std::is_signed_v<T>, ...>`**: `T` が符号付き整数のときだけ有効にする書き方です。
- **`std::pair<T, bool>` と `{a, b}`**: 2 つの値の組です。`return {Result, true};` のように波かっこで作れます。
- **`using U = std::make_unsigned_t<T>;`**: `T` の符号なし版に `U` という短い名前を付けています。
- **`auto`**: 型を右辺から自動で決めます。`auto Result = static_cast<T>(UResult);` の `Result` は `T` 型になります。
- **構造化束縛 `auto [Res, Ovf] = ...`**: 組の中身を 2 つの変数に分けて受け取る書き方です。
- **符号付きのあふれは未定義動作**: `int8_t` で `100 + 50` を素直に計算すると、規格上は何が起きても文句が言えません。符号なし整数の一周は規格で決まっています。
- **`__builtin_add_overflow`**: GCC や Clang の組み込み関数で、あふれ判定つきの足し算を CPU のフラグを使って効率よく行います。

## 何をしているか

### 1. 符号なしで足す

```cpp:line-numbers=705
  using U = std::make_unsigned_t<T>;
  const U UX = static_cast<U>(X);
  const U UY = static_cast<U>(Y);
  const U UResult = UX + UY;
```

`int8_t` で `X = 100, Y = 50` を考えます。

```
UX = 100, UY = 50  （uint8_t）
UResult = 150
```

符号なしで計算すれば、あふれても単に一周するだけなので安全です。2 の補数では、符号付きと符号なしの足し算は**ビット列として同じ結果**になります。

### 2. 符号付きに戻す

```cpp:line-numbers=711
  auto Result = static_cast<T>(UResult);
```

`150` を `int8_t` として読むと `-106` です。

### 3. 符号を見てあふれを判定する

```cpp:line-numbers=714
  if (X > 0 && Y > 0)
    return {Result, Result <= 0};
  // 負の数どうしを足したら、負の数になるはず。
  if (X < 0 && Y < 0)
    return {Result, Result >= 0};
  return {Result, false};
```

- 正 + 正 の結果が 0 以下なら、あふれ。今回は `-106 <= 0` なので `true`。
- 負 + 負 の結果が 0 以上なら、あふれ。
- 符号が違う 2 つ（または 0 を含む）の和は、絶対に範囲を超えないので `false`。

たとえば `-100 + -50` は符号なしで `156 + 206 = 362 → 106`、`int8_t` で `106` です。負 + 負 が正になったのであふれです。

### 4. 組み込み関数があればそちらを使う

```cpp:line-numbers=724
template <typename T>
std::enable_if_t<std::is_signed_v<T>, bool> AddOverflow(T X, T Y, T &Result) {
#if __has_builtin(__builtin_add_overflow)
  return __builtin_add_overflow(X, Y, &Result);
#else
  auto [Res, Ovf] = AddOverflow(X, Y);
  Result = Res;
  return Ovf;
#endif
}
```

結果を参照で受け取る版です。`__builtin_add_overflow` が使えればそれに任せ、使えなければ上の汎用版を呼びます。

## ここがすごい

「足してからあふれを調べる」を素直に符号付きで書くと、あふれた瞬間に未定義動作です。コンパイラは「符号付きはあふれない」と仮定して最適化するので、`if (X + Y < X)` のような判定は**消されてしまう**ことすらあります。

この実装は、

- 計算は**定義された動作の範囲（符号なし）**で行い、
- 判定は「2 つの正の数の和は正のはず」という**符号のルール**で行う

ので、規格の上で完全に正しく動きます。

さらに、汎用版を `constexpr` で書いておきつつ、実行時に使う版では組み込み関数を優先しています。組み込み関数は CPU のあふれフラグを直接使えるので速く、汎用版はコンパイル時計算やコンパイラの違いに対する保険になります。**正しさの基準となる実装と、速い実装を並べて持つ**のは移植性の高いライブラリの定石です。

## まとめ

- 符号付きのあふれは未定義動作。判定のための計算は符号なしで行う。
- 2 の補数では、符号付きと符号なしの足し算はビット列として同じ。
- 「正 + 正 → 負」「負 + 負 → 正」になったらあふれ。符号が違えばあふれない。
- 組み込み関数を優先し、使えない環境には汎用版を用意する。
