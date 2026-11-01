---
title: 「結果が元より小さくなったら繰り上がり」で書く 128 ビット足し算
description: 64 ビット整数 2 つで作った 128 ビット整数の足し算。下位の和が足す前の値より小さければあふれた、という比較 1 回で繰り上がりを検出する。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/numeric/int128.h
lines: [989, 1010]
function: operator+(uint128, uint128)
difficulty: 1
tags: [数値計算, ビット演算, 移植性]
---

## ひとことで

`uint128` 同士の足し算です。上位と下位の 64 ビットをそれぞれ足し、下位で **繰り上がり**（キャリー）が起きたら上位に 1 を足します。
C++ には「繰り上がりフラグ」を直接読む手段がありません。そこでこのコードは、**下位の和が元の値より小さくなったかどうか** という比較 1 回で繰り上がりを見抜きます。

## コード

::: code-group

```cpp:line-numbers=989 [日本語訳]
#if !defined(ABSL_HAVE_INTRINSIC_INT128)
namespace int128_internal {
constexpr uint128 AddResult(uint128 result, uint128 lhs) {
  // 繰り上がりを確認する
  return (Uint128Low64(result) < Uint128Low64(lhs))
             ? MakeUint128(Uint128High64(result) + 1, Uint128Low64(result))
             : result;
}
}  // namespace int128_internal の終わり
#endif

constexpr uint128 operator+(uint128 lhs, uint128 rhs) {
#if defined(ABSL_HAVE_INTRINSIC_INT128)
  return static_cast<unsigned __int128>(lhs) +
         static_cast<unsigned __int128>(rhs);
#else
  return int128_internal::AddResult(
      MakeUint128(Uint128High64(lhs) + Uint128High64(rhs),
                  Uint128Low64(lhs) + Uint128Low64(rhs)),
      lhs);
#endif
}
```

```cpp:line-numbers=989 [原文]
#if !defined(ABSL_HAVE_INTRINSIC_INT128)
namespace int128_internal {
constexpr uint128 AddResult(uint128 result, uint128 lhs) {
  // check for carry
  return (Uint128Low64(result) < Uint128Low64(lhs))
             ? MakeUint128(Uint128High64(result) + 1, Uint128Low64(result))
             : result;
}
}  // namespace int128_internal
#endif

constexpr uint128 operator+(uint128 lhs, uint128 rhs) {
#if defined(ABSL_HAVE_INTRINSIC_INT128)
  return static_cast<unsigned __int128>(lhs) +
         static_cast<unsigned __int128>(rhs);
#else
  return int128_internal::AddResult(
      MakeUint128(Uint128High64(lhs) + Uint128High64(rhs),
                  Uint128Low64(lhs) + Uint128Low64(rhs)),
      lhs);
#endif
}
```

:::

## 前提知識

- **符号なし整数のあふれ**: `uint64_t` の計算結果が 64 ビットに収まらないとき、C++ では 2 の 64 乗で割った余りになります（ぐるっと 0 に戻る）。これは符号なし整数では正式に決められた動作で、未定義動作ではありません。
- **`constexpr`**: コンパイル時にも計算できる関数です。`uint128` の定数をコンパイル時に作れるようにしています。
- **`namespace int128_internal`**: 名前空間（名前の衝突を防ぐための箱）です。`internal` という名前は「利用者は直接使わないで」という慣習的な合図です。
- **`static_cast<unsigned __int128>(x)`**: `__int128` は GCC/Clang が持つ 128 ビット整数型です。使える環境ではそちらに変換して、コンパイラに計算を任せます。
- **`? :`**: 条件演算子です。`a ? b : c` は `a` が真なら `b`、偽なら `c` です。

## 何をしているか

### 1. コンパイラが 128 ビット整数を持つ場合

```cpp:line-numbers=1001
#if defined(ABSL_HAVE_INTRINSIC_INT128)
  return static_cast<unsigned __int128>(lhs) +
         static_cast<unsigned __int128>(rhs);
```

`unsigned __int128` に変換して普通に足すだけです。CPU の「繰り上がり付き足し算」命令をコンパイラが使ってくれます。

### 2. 持たない場合: まず別々に足す

```cpp:line-numbers=1005
  return int128_internal::AddResult(
      MakeUint128(Uint128High64(lhs) + Uint128High64(rhs),
                  Uint128Low64(lhs) + Uint128Low64(rhs)),
      lhs);
```

上位どうし、下位どうしを足して、いったん `MakeUint128` で 128 ビットの値を作ります。この時点では、下位から上位への繰り上がりがまだ反映されていません。

### 3. 繰り上がりを検出して直す

```cpp:line-numbers=991
constexpr uint128 AddResult(uint128 result, uint128 lhs) {
  // 繰り上がりを確認する
  return (Uint128Low64(result) < Uint128Low64(lhs))
             ? MakeUint128(Uint128High64(result) + 1, Uint128Low64(result))
             : result;
}
```

`AddResult(result, lhs)` は、`result` の下位が `lhs` の下位より小さければ、上位に 1 を足します。

なぜこれで分かるのでしょうか。8 ビットで考えてみます（最大値は 255）。

- `200 + 30 = 230`。結果 230 は元の 200 以上なので、繰り上がりはありません。
- `200 + 100 = 300` は 8 ビットに収まらず、`300 - 256 = 44` になります。結果 44 は元の 200 より小さくなりました。

足す数は 255 以下なので、あふれたときの結果は必ず「元の値 + 足す数 - 256」で、元の値より小さくなります。逆に、あふれなければ結果は元の値以上です。
つまり **「和 < 足される数」と「繰り上がりがあった」は同じ意味** なのです。

64 ビットでも同じ理屈なので、`Uint128Low64(result) < Uint128Low64(lhs)` で判定できます。

## ここがすごい

- **比較 1 回で繰り上がりが分かる**: 素直に考えると「下位の最上位ビット同士を見て…」と場合分けしたくなります。あふれの性質を使えば、比較 1 回で済みます。多くのコンパイラはこの形を見て、CPU の繰り上がり付き命令に変換できます。
- **判定を名前付きの関数に切り出す**: 繰り上がりの判定を `AddResult` という関数に分けているので、`operator+` の本体は「足して、繰り上がりを直す」という 1 つの式として読めます。どちらも `constexpr` なので、コンパイル時の計算にもそのまま使えます。
- **引き算も同じ形**: すぐ下の `operator-` では、引き算を同じ構造で書いています。下位で「引かれる数 < 引く数」なら借り（ボロー）が起きたと判定し、上位から 1 を引きます。足し算と引き算を対にして読むと理解が深まります。
- **未定義動作に頼らない**: 符号付き整数のあふれは未定義動作ですが、符号なし整数のあふれは定義された動作です。このトリックは符号なしだからこそ安全に使えます。

## まとめ

- 符号なし整数で `a + b` があふれたかどうかは、`(a + b) < a` で判定できる。
- 多倍長の足し算は「各桁を足す → 繰り上がりを次の桁へ」の繰り返しで書ける。
- 使えるならコンパイラ組み込みの 128 ビット型に任せ、ないときだけ自前で計算する。
- 符号付き整数ではこのトリックは使えない（あふれは未定義動作）。
