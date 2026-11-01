---
title: 割り算を使わずにシフトと引き算で最大公約数を求める
description: C++17 の std::gcd。最初に 1 回だけ剰余を取ったあとは、末尾の 0 の数え上げと右シフトと引き算だけで最大公約数を求める二進 GCD。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__numeric/gcd_lcm.h
lines: [49, 95]
function: std::gcd
difficulty: 3
format: 2
tags: [数値計算, ビット演算, アルゴリズム]
---

## ひとことで

`std::gcd(m, n)` は、2 つの整数の **最大公約数**（両方を割り切る最大の数）を返す関数です。`gcd(48, 18)` は `6` です。

教科書の「ユークリッドの互除法」は `a % b`（割り算の余り）を何度も繰り返します。ところが割り算は CPU にとって重い命令です。libc++ の実装は、**最初に 1 回だけ余りを取り、あとはビットのシフトと引き算だけ** で答えを出す「二進 GCD」を使っています。

## コード

::: code-group

```cpp:line-numbers=49 [日本語訳]
template <class _Tp, class _Up>
[[nodiscard]] constexpr _LIBCPP_HIDE_FROM_ABI common_type_t<_Tp, _Up> gcd(_Tp __m, _Up __n) {
  static_assert(is_integral<_Tp>::value && is_integral<_Up>::value, "Arguments to gcd must be integer types");
  static_assert(!is_same<__remove_cv_t<_Tp>, bool>::value, "First argument to gcd cannot be bool");
  static_assert(!is_same<__remove_cv_t<_Up>, bool>::value, "Second argument to gcd cannot be bool");
  using _Rp = common_type_t<_Tp, _Up>;
  using _Wp = make_unsigned_t<_Rp>;

  // 二進 GCD アルゴリズム https://en.wikipedia.org/wiki/Binary_GCD_algorithm を使う。実装は次を元にしている:
  // https://lemire.me/blog/2024/04/13/greatest-common-divisor-the-extended-euclidean-algorithm-and-speed/
  //
  // 2 のべき乗が両方を割り切るなら、それをくくり出せる。
  // - gcd( 2^x * a, 2^x * b) = 2^x * gcd(a, b)
  //
  // ちょうど一方だけが偶数のとき（そのときに限り）、その数をそのべき乗で割ってよい。
  // - a, b が奇数なら gcd(2^x * a, b) = gcd(a, b)
  //
  // あとは、剰余の代わりに引き算を使う標準的な gcd のアルゴリズム。

  auto __a = static_cast<_Wp>(std::__abs_in_type<_Rp>(__m));
  auto __b = static_cast<_Wp>(std::__abs_in_type<_Rp>(__n));

  if (__a < __b) {
    _Wp __tmp = __b;
    __b       = __a;
    __a       = __tmp;
  }
  if (__b == 0)
    return static_cast<_Rp>(__a);
  __a %= __b; // 2 つの引数を同じくらいの大きさにし、簡単な場合は早めに答えを出す。
  if (__a == 0)
    return static_cast<_Rp>(__b);

  _Wp __c     = __a | __b;
  int __shift = std::__countr_zero(__c);
  __a >>= std::__countr_zero(__a);
  do {
    _Wp __t = __b >> std::__countr_zero(__b);
    if (__a > __t) {
      __b = __a - __t;
      __a = __t;
    } else {
      __b = __t - __a;
    }
  } while (__b != 0);
  return static_cast<_Rp>(__a << __shift);
}
```

```cpp:line-numbers=49 [原文]
template <class _Tp, class _Up>
[[nodiscard]] constexpr _LIBCPP_HIDE_FROM_ABI common_type_t<_Tp, _Up> gcd(_Tp __m, _Up __n) {
  static_assert(is_integral<_Tp>::value && is_integral<_Up>::value, "Arguments to gcd must be integer types");
  static_assert(!is_same<__remove_cv_t<_Tp>, bool>::value, "First argument to gcd cannot be bool");
  static_assert(!is_same<__remove_cv_t<_Up>, bool>::value, "Second argument to gcd cannot be bool");
  using _Rp = common_type_t<_Tp, _Up>;
  using _Wp = make_unsigned_t<_Rp>;

  // Using Binary GCD algorithm https://en.wikipedia.org/wiki/Binary_GCD_algorithm, based on an implementation
  // from https://lemire.me/blog/2024/04/13/greatest-common-divisor-the-extended-euclidean-algorithm-and-speed/
  //
  // If power of two divides both numbers, we can push it out.
  // - gcd( 2^x * a, 2^x * b) = 2^x * gcd(a, b)
  //
  // If and only if exactly one number is even, we can divide that number by that power.
  // - if a, b are odd, then gcd(2^x * a, b) = gcd(a, b)
  //
  // And standard gcd algorithm where instead of modulo, minus is used.

  auto __a = static_cast<_Wp>(std::__abs_in_type<_Rp>(__m));
  auto __b = static_cast<_Wp>(std::__abs_in_type<_Rp>(__n));

  if (__a < __b) {
    _Wp __tmp = __b;
    __b       = __a;
    __a       = __tmp;
  }
  if (__b == 0)
    return static_cast<_Rp>(__a);
  __a %= __b; // Make both argument of the same size, and early result in the easy case.
  if (__a == 0)
    return static_cast<_Rp>(__b);

  _Wp __c     = __a | __b;
  int __shift = std::__countr_zero(__c);
  __a >>= std::__countr_zero(__a);
  do {
    _Wp __t = __b >> std::__countr_zero(__b);
    if (__a > __t) {
      __b = __a - __t;
      __a = __t;
    } else {
      __b = __t - __a;
    }
  } while (__b != 0);
  return static_cast<_Rp>(__a << __shift);
}
```

:::

## 前提知識

- **関数テンプレート**: `template <class _Tp, class _Up>` は、2 つの引数の型をあとから決める関数のひな形です。`gcd(48, 18L)` のように型が違う整数どうしでも呼べます。
- **`common_type_t<_Tp, _Up>`**: 2 つの型を両方表せる共通の型です。`int` と `long` なら `long` です。戻り値はこの型になります。
- **`make_unsigned_t<_Rp>`**: 同じ大きさの符号なし整数型です。計算は負の数を気にしなくてよい符号なしで行います。
- **`static_assert(条件, メッセージ)`**: コンパイル時に条件を調べ、偽ならメッセージ付きでコンパイルを止めます。ここでは「整数型でなければだめ」「`bool` はだめ」をはじいています。
- **`constexpr`**: コンパイル時にも実行できる関数です。`[[nodiscard]]` は戻り値を捨てると警告を出す印です。
- **`std::__countr_zero(x)`**: `x` を 2 進数で見て、下から続く `0` の個数です。`12`（`1100`）なら `2` です。多くの CPU に専用命令があります。
- **`>>=` と `|`**: `x >>= k` は `x` を右に `k` ビットずらす（2 の `k` 乗で割る）、`a | b` はビットごとの OR です。

## 何をしているか

`gcd(48, 18)` で追います。

### 1. 絶対値にして、大きい方を a に

```cpp:line-numbers=68
  auto __a = static_cast<_Wp>(std::__abs_in_type<_Rp>(__m));
  auto __b = static_cast<_Wp>(std::__abs_in_type<_Rp>(__n));

  if (__a < __b) {
    _Wp __tmp = __b;
    __b       = __a;
    __a       = __tmp;
  }
```

`__abs_in_type` は、共通の型で絶対値を取る同じファイルの補助関数です。`a = 48`、`b = 18` で、すでに `a >= b` なので入れ替えはありません。

### 2. 1 回だけ余りを取る

```cpp:line-numbers=76
  if (__b == 0)
    return static_cast<_Rp>(__a);
  __a %= __b; // 2 つの引数を同じくらいの大きさにし、簡単な場合は早めに答えを出す。
  if (__a == 0)
    return static_cast<_Rp>(__b);
```

`b` が 0 なら答えは `a` です（`gcd(x, 0) = x`）。そうでなければ `a %= b` で `a = 48 % 18 = 12` にします。コメントにあるとおり、これで 2 つの数を同じくらいの大きさにそろえ、割り切れたなら（`a == 0`）その場で `b` を返します。

### 3. 共通の 2 のべき乗をくくり出す

```cpp:line-numbers=82
  _Wp __c     = __a | __b;
  int __shift = std::__countr_zero(__c);
  __a >>= std::__countr_zero(__a);
```

`a = 12`（`01100`）と `b = 18`（`10010`）の OR は `11110` で、末尾の `0` は 1 個です。つまり **両方に共通する 2 の因子は 2^1** で、これを `__shift = 1` として覚えておきます。
次に `a` から 2 の因子をすべて取り除きます。`12` の末尾の `0` は 2 個なので `a = 3`（奇数）です。

`a | b` の末尾の 0 が「共通の 2 の因子の数」になるのは、OR の結果のある桁が 0 なのは、両方のその桁が 0 のときだけだからです。

### 4. 引き算で縮めていく

```cpp:line-numbers=85
  do {
    _Wp __t = __b >> std::__countr_zero(__b);
    if (__a > __t) {
      __b = __a - __t;
      __a = __t;
    } else {
      __b = __t - __a;
    }
  } while (__b != 0);
```

- 1 周目: `b = 18` から 2 の因子を除いて `t = 9`。`a = 3` は `9` より大きくないので `b = 9 - 3 = 6`。
- 2 周目: `t = 6 >> 1 = 3`。`3 > 3` ではないので `b = 3 - 3 = 0`。

`b` が 0 になったので終わりです。このとき `a = 3` が「2 の因子を除いた最大公約数」です。

### 5. くくり出した 2 のべき乗を戻す

```cpp:line-numbers=94
  return static_cast<_Rp>(__a << __shift);
```

`3 << 1 = 6` を返します。

## ここがすごい

- **割り算を 1 回に減らす**: 互除法は、ループのたびに割り算（余り）をします。二進 GCD は、奇数どうしの差は必ず偶数になることを使い、「引き算 → 末尾の 0 をまとめて削る」を繰り返します。末尾の 0 の数え上げもシフトも、多くの CPU では軽い命令です。
- **最初の 1 回の `%` が効く**: `gcd(1000000, 3)` のように大きさがかけ離れていると、引き算だけでは何度も回ってしまいます。最初に 1 回だけ余りを取ることで、2 つの数を同じくらいの大きさにしてから二進 GCD に入ります。コメントの「Make both argument of the same size」はこのことです。
- **ループの中で 2 の因子を一気に削る**: 古い二進 GCD は「偶数なら 2 で割る」を 1 ビットずつ繰り返していました。`__countr_zero` で末尾の 0 の数を一発で求めれば、何ビットでも 1 回のシフトで削れます。
- **出典を明記**: コメントには、アルゴリズムの説明（Wikipedia）と、元にした実装（Daniel Lemire 氏のブログ記事）の URL が書かれています。数式でのアイデアの説明もあり、読む人が検証しやすくなっています。
- **型の取り違えをコンパイル時に防ぐ**: `bool` や浮動小数点数を渡すと `static_assert` でコンパイルエラーになります。

## まとめ

- 二進 GCD は「共通の 2 の因子をくくり出す」「奇数どうしは引き算する」の 2 つの性質で、割り算を使わずに最大公約数を求める。
- `a | b` の末尾の 0 の数が、共通の 2 の因子の数になる。
- 末尾の 0 の数え上げ（`countr_zero`）があれば、2 で何回割れるかを一発で求められる。
- 最初に 1 回だけ重い演算をして、残りを軽い演算にする組み合わせ方もある。
