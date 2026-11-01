---
title: 32 ビットずつに割って掛ける、128 ビット整数の掛け算
description: 64 ビット整数 2 つで表した 128 ビット整数の掛け算。64×64 ビットの積の上位を得るために下位を 32 ビットずつに分け、繰り上がりは 128 ビットの足し算に任せる。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/numeric/int128.h
lines: [1035, 1057]
function: operator*(uint128, uint128)
difficulty: 3
tags: [数値計算, アルゴリズム, 移植性]
---

## ひとことで

`uint128` は、上位 64 ビットと下位 64 ビットの 2 つの整数で 128 ビットの数を表すクラスです。この `operator*` は、その掛け算を実装します。
難しいのは、64 ビット × 64 ビットの積は最大 128 ビットになるのに、C++ の普通の掛け算では **下位 64 ビットしか得られない** ことです。そこで、下位の数をさらに 32 ビットずつに分けて筆算をします。

## コード

::: code-group

```cpp:line-numbers=1035 [日本語訳]
#if !defined(ABSL_HAVE_INTRINSIC_INT128)
inline uint128 operator*(uint128 lhs, uint128 rhs) {
#if defined(_MSC_VER) && defined(_M_X64) && !defined(_M_ARM64EC)
  uint64_t carry;
  uint64_t low = _umul128(Uint128Low64(lhs), Uint128Low64(rhs), &carry);
  return MakeUint128(Uint128Low64(lhs) * Uint128High64(rhs) +
                         Uint128High64(lhs) * Uint128Low64(rhs) + carry,
                     low);
#else   // _MSC_VER の分岐（それ以外の環境）
  uint64_t a32 = Uint128Low64(lhs) >> 32;
  uint64_t a00 = Uint128Low64(lhs) & 0xffffffff;
  uint64_t b32 = Uint128Low64(rhs) >> 32;
  uint64_t b00 = Uint128Low64(rhs) & 0xffffffff;
  uint128 result =
      MakeUint128(Uint128High64(lhs) * Uint128Low64(rhs) +
                      Uint128Low64(lhs) * Uint128High64(rhs) + a32 * b32,
                  a00 * b00);
  result += uint128(a32 * b00) << 32;
  result += uint128(a00 * b32) << 32;
  return result;
#endif  // _MSC_VER の分岐ここまで
}
#endif  // ABSL_HAVE_INTRINSIC_INT128 の分岐ここまで
```

```cpp:line-numbers=1035 [原文]
#if !defined(ABSL_HAVE_INTRINSIC_INT128)
inline uint128 operator*(uint128 lhs, uint128 rhs) {
#if defined(_MSC_VER) && defined(_M_X64) && !defined(_M_ARM64EC)
  uint64_t carry;
  uint64_t low = _umul128(Uint128Low64(lhs), Uint128Low64(rhs), &carry);
  return MakeUint128(Uint128Low64(lhs) * Uint128High64(rhs) +
                         Uint128High64(lhs) * Uint128Low64(rhs) + carry,
                     low);
#else   // _MSC_VER
  uint64_t a32 = Uint128Low64(lhs) >> 32;
  uint64_t a00 = Uint128Low64(lhs) & 0xffffffff;
  uint64_t b32 = Uint128Low64(rhs) >> 32;
  uint64_t b00 = Uint128Low64(rhs) & 0xffffffff;
  uint128 result =
      MakeUint128(Uint128High64(lhs) * Uint128Low64(rhs) +
                      Uint128Low64(lhs) * Uint128High64(rhs) + a32 * b32,
                  a00 * b00);
  result += uint128(a32 * b00) << 32;
  result += uint128(a00 * b32) << 32;
  return result;
#endif  // _MSC_VER
}
#endif  // ABSL_HAVE_INTRINSIC_INT128
```

:::

## 前提知識

- **演算子オーバーロード**: `operator*` という名前の関数を定義すると、`a * b` と書いたときにその関数が呼ばれます。`uint128` を普通の整数のように使えるのはこのためです。
- **`Uint128High64(x)` / `Uint128Low64(x)`**: `uint128` の上位・下位 64 ビットを取り出す関数です。`MakeUint128(hi, lo)` はその逆で、2 つから `uint128` を作ります。
- **`uint64_t` の掛け算はあふれた分が捨てられる**: 符号なし整数の計算は 2 の 64 乗で割った余りになります。たとえば `2^40 × 2^40` の結果は 0 です。
- **`#if defined(_MSC_VER) && defined(_M_X64)`**: MSVC で 64 ビットの x86 向けにコンパイルするときだけ有効になる部分です。
- **`_umul128(a, b, &hi)`**: MSVC の組み込み関数で、64×64 ビットの積の下位を返し、上位を `hi` に書き込みます。
- **`inline`**: ヘッダに関数の本体を書くときに付けます。複数のファイルから読み込まれても定義が 1 つにまとめられます。

## 何をしているか

### 1. 数式で見る

`lhs = H1·2^64 + L1`、`rhs = H2·2^64 + L2` と書くと、積は次のようになります。

```
lhs × rhs = H1·H2·2^128 + (H1·L2 + L1·H2)·2^64 + L1·L2
```

128 ビットからはみ出す `H1·H2·2^128` は捨ててよいので、計算するのは残りの 2 項です。

- `H1·L2 + L1·H2` は上位 64 ビットに足すだけなので、64 ビットの掛け算（あふれは捨ててよい）で十分です。
- 問題は `L1·L2` です。これは 128 ビットぶんの結果が必要です。

### 2. MSVC の場合

```cpp:line-numbers=1037
#if defined(_MSC_VER) && defined(_M_X64) && !defined(_M_ARM64EC)
  uint64_t carry;
  uint64_t low = _umul128(Uint128Low64(lhs), Uint128Low64(rhs), &carry);
  return MakeUint128(Uint128Low64(lhs) * Uint128High64(rhs) +
                         Uint128High64(lhs) * Uint128Low64(rhs) + carry,
                     low);
```

`_umul128` が `L1·L2` の上位（`carry`）と下位（`low`）を一度に返してくれます。上位 64 ビットは `L1·H2 + H1·L2 + carry` です。

### 3. それ以外の場合: 32 ビットに分ける

```cpp:line-numbers=1044
  uint64_t a32 = Uint128Low64(lhs) >> 32;
  uint64_t a00 = Uint128Low64(lhs) & 0xffffffff;
  uint64_t b32 = Uint128Low64(rhs) >> 32;
  uint64_t b00 = Uint128Low64(rhs) & 0xffffffff;
  uint128 result =
      MakeUint128(Uint128High64(lhs) * Uint128Low64(rhs) +
                      Uint128Low64(lhs) * Uint128High64(rhs) + a32 * b32,
                  a00 * b00);
  result += uint128(a32 * b00) << 32;
  result += uint128(a00 * b32) << 32;
  return result;
```

`L1 = a32·2^32 + a00`、`L2 = b32·2^32 + b00` に分けます。32 ビット × 32 ビットの積は 64 ビットに必ず収まるので、あふれません。

```
L1·L2 = a32·b32·2^64 + (a32·b00 + a00·b32)·2^32 + a00·b00
```

- `a32 * b32` は `2^64` の位なので、上位 64 ビットに足します。
- `a00 * b00` はそのまま下位 64 ビットです。
- 残りの 2 つは `2^32` の位です。下位と上位にまたがるので、`uint128` に変換して 32 ビット左にずらし、128 ビットの足し算で加えます。

具体例として `L1 = L2 = 2^32 + 1` を考えます。`a32 = a00 = b32 = b00 = 1` なので、`a32*b32 = 1` が上位へ、`a00*b00 = 1` が下位へ入ります。最後に `1 << 32` を 2 回足して、`2^64 + 2·2^32 + 1` が得られます。これは `(2^32 + 1)^2` と一致します。

## ここがすごい

- **繰り上がりを自分で書かない**: `2^32` の位の 2 項は、足すと下位 64 ビットから上位へ繰り上がることがあります。それを手で追う代わりに、すでに正しく実装された `uint128` の `+=` に任せています。部品を再利用して、間違いやすい処理を 1 か所に閉じ込めています。
- **必要な掛け算だけを行う**: 128 ビットからはみ出す `H1·H2` は計算すらしません。また、上位 64 ビットにしか影響しない `H1·L2` と `L1·H2` は、あふれを気にせず 64 ビットの掛け算 1 回ずつで済ませています。32 ビットに分けて丁寧に計算するのは、本当に 128 ビットの精度が必要な `L1·L2` だけです。
- **使える道具があれば使う**: MSVC の x64 では、CPU が 64×64→128 ビットの掛け算命令を持っています。`_umul128` があればそれに任せ、なければ移植性のある書き方にします。
- この関数は `ABSL_HAVE_INTRINSIC_INT128` が未定義のとき、つまりコンパイラが 128 ビット整数を持たない環境だけで使われます。持っている環境では、すぐ下にある別の版がコンパイラ任せの掛け算をします。

## まとめ

- 型からはみ出す積は「半分の幅に分けて筆算」で正確に求められる。
- `2^128` 以上の位は捨ててよいので、必要な項だけを計算すれば掛け算の回数を減らせる。
- 繰り上がりのような細かい処理は、すでにある正しい演算に任せる。
- 環境ごとに最適な道具を `#if` で選び、ない環境向けの汎用版も用意する。
