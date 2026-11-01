---
title: わざと「あふれさせる」ことでコンパイル時エラーにする bit_ceil
description: x 以上で最小の 2 のべき乗を求める bit_ceil の内部。狭い整数型が自動で広げられる性質を逆手にとり、結果が型に収まらないときは定数式として失敗させる。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2020 The Abseil Authors
file: absl/numeric/internal/bits.h
lines: [367, 390]
function: numeric_internal::BitCeilNonPowerOf2
difficulty: 3
tags: [ビット演算, 型システム, 防御的プログラミング]
---

## ひとことで

`bit_ceil(x)` は「`x` 以上で最小の 2 のべき乗」を返す関数です。`5` なら `8`、`17` なら `32` です。
ここで読む `BitCeilNonPowerOf2` は、`x` が 2 のべき乗でないときの計算を担当します。

ポイントは、`uint8_t` のような **狭い型でも、答えが型に収まらないときにきちんと「未定義」として扱われる** ようにしている点です。そのために、わざとシフト量を水増ししてから戻す、という不思議な計算をしています。

## コード

::: code-group

```cpp:line-numbers=367 [日本語訳]
// T が unsigned より狭いと、T{1} << bit_width は格上げ（昇格）される。
// ここでは強制的にあふれさせて、不正な値に対する bit_ceil が
// コア定数式にならないようにしたい。
template <class T>
ABSL_ATTRIBUTE_ALWAYS_INLINE
    ABSL_INTERNAL_CONSTEXPR_CLZ inline std::enable_if_t<std::is_unsigned_v<T>,
                                                        T>
    BitCeilPromotionHelper(T x, T promotion) {
  return (T{1} << (x + promotion)) >> promotion;
}

template <class T>
ABSL_ATTRIBUTE_ALWAYS_INLINE
    ABSL_INTERNAL_CONSTEXPR_CLZ inline std::enable_if_t<std::is_unsigned_v<T>,
                                                        T>
    BitCeilNonPowerOf2(T x) {
  // T が unsigned より狭いと、シフトのときに unsigned に格上げされる。
  // 広い型によって増えるビット数を計算する。
  return BitCeilPromotionHelper(
      static_cast<T>(std::numeric_limits<T>::digits - CountLeadingZeroes(x)),
      T{sizeof(T) >= sizeof(unsigned) ? 0
                                      : std::numeric_limits<unsigned>::digits -
                                            std::numeric_limits<T>::digits});
}
```

```cpp:line-numbers=367 [原文]
// If T is narrower than unsigned, T{1} << bit_width will be promoted.  We
// want to force it to wraparound so that bit_ceil of an invalid value are not
// core constant expressions.
template <class T>
ABSL_ATTRIBUTE_ALWAYS_INLINE
    ABSL_INTERNAL_CONSTEXPR_CLZ inline std::enable_if_t<std::is_unsigned_v<T>,
                                                        T>
    BitCeilPromotionHelper(T x, T promotion) {
  return (T{1} << (x + promotion)) >> promotion;
}

template <class T>
ABSL_ATTRIBUTE_ALWAYS_INLINE
    ABSL_INTERNAL_CONSTEXPR_CLZ inline std::enable_if_t<std::is_unsigned_v<T>,
                                                        T>
    BitCeilNonPowerOf2(T x) {
  // If T is narrower than unsigned, it undergoes promotion to unsigned when we
  // shift.  We calculate the number of bits added by the wider type.
  return BitCeilPromotionHelper(
      static_cast<T>(std::numeric_limits<T>::digits - CountLeadingZeroes(x)),
      T{sizeof(T) >= sizeof(unsigned) ? 0
                                      : std::numeric_limits<unsigned>::digits -
                                            std::numeric_limits<T>::digits});
}
```

:::

## 前提知識

- **整数昇格（integer promotion）**: C++ では `uint8_t` や `uint16_t` のように `int` より狭い整数で計算すると、計算の前に 32 ビット幅の整数に自動で広げられます。だから `uint8_t` の `1 << 8` は 0 にならず、256 になります。
- **未定義動作と定数式**: ビット幅以上のシフトは未定義動作です。そして `constexpr` の計算中に未定義動作が起きると、コンパイラはそれを定数式として認めず、**コンパイルエラー** にします。
- **`std::enable_if_t<条件, T>`**: 条件が真のときだけ型 `T` になり、偽なら関数そのものを候補から外す仕組みです。ここでは「`T` が符号なしのときだけ使える」と宣言しています。
- **`T{1}`**: 型 `T` の値 1 を作る書き方です（波かっこ初期化）。
- **`CountLeadingZeroes(x)`**: 上位に並ぶ 0 の個数を返す関数です。`digits - CountLeadingZeroes(x)` は「`x` を表すのに必要なビット数」（bit width）になります。
- **`? :`**: 条件演算子です。`a ? b : c` は `a` が真なら `b`、偽なら `c` です。

## 何をしているか

### 1. 必要なビット数を求める

```cpp:line-numbers=386
      static_cast<T>(std::numeric_limits<T>::digits - CountLeadingZeroes(x)),
```

`std::numeric_limits<T>::digits - CountLeadingZeroes(x)` で、`x` のビット幅を求めます。
`uint8_t` の `x = 5`（`00000101`）なら、先頭の 0 は 5 個なので、ビット幅は `8 - 5 = 3` です。答えは `1 << 3 = 8` になるはずです。

### 2. 広げられるぶんのビット数を求める

```cpp:line-numbers=387
      T{sizeof(T) >= sizeof(unsigned) ? 0
                                      : std::numeric_limits<unsigned>::digits -
                                            std::numeric_limits<T>::digits});
```

`T` が `unsigned` より狭いとき、シフトは 32 ビットの世界で行われます。その差を `promotion` として計算します。
`uint8_t` なら `32 - 8 = 24`、`uint32_t` や `uint64_t` なら 0 です。

### 3. 水増しして戻す

```cpp:line-numbers=375
  return (T{1} << (x + promotion)) >> promotion;
```

`(T{1} << (x + promotion)) >> promotion` を計算します。

- `x = 3`、`promotion = 24` なら、`1 << 27` を計算してから `>> 24` で戻すので、結果は `8` です。
- `uint8_t` で `x = 200` の場合、ビット幅は 8 です。`1 << 32` は 32 ビット幅のシフトとしてはみ出すので **未定義動作** になります。

## ここがすごい

素直に `T{1} << bit_width` と書いた場合と比べてみます。

- `uint32_t` で答えが収まらない場合（例: `0x80000001`）は、`1u << 32` が未定義動作になります。`constexpr` の文脈ならコンパイルエラーで気づけます。
- ところが `uint8_t` だと、整数昇格のせいで `1 << 8 = 256` は **正しく計算できてしまいます**。`uint8_t` に戻すと 0 になり、エラーにならずに黙って 0 を返してしまいます。

型によって「収まらないときのふるまい」が変わるのは困ります。そこでこの関数は、シフト量に `promotion` を足して **広げられた 32 ビットの端でちょうどあふれる** ようにしています。こうすると、どの型でも「答えが型に収まらない＝シフトがはみ出す＝定数式にならない」がそろいます。
C++20 の `std::bit_ceil` も、結果が表せない呼び出しは定数式にならないと定めています。Abseil はその性質を、標準ライブラリがない環境でも再現しているのです。

- **コメントで意図を残す**: 冒頭のコメントが「なぜこんな回り道をするのか」を説明しています。この 1 行がなければ、`<< a >> a` は無駄な計算に見えて消されてしまうかもしれません。

## まとめ

- `int` より狭い整数は計算の前に広げられるので、「型の端であふれる」とは限らない。
- `constexpr` の中の未定義動作はコンパイルエラーになる。これをチェックの道具として使える。
- 一見むだな「足してから戻す」計算に、型による違いを消す意味がある。
- 意図が読み取りにくいハックには、必ず理由のコメントを付ける。
