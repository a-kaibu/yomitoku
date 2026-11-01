---
title: 4 桁を 1 つの 32 ビット整数の中で同時に割り算する
description: 1〜9999 の整数を ASCII にする関数。上 2 桁と下 2 桁を 16 ビットずつに詰めて「並列に」10 で割り、先頭のゼロは countr_zero で一気に取り除く。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/strings/numbers.cc
lines: [191, 215]
function: EncodeTenThousand
difficulty: 3
tags: [ビット演算, 最適化, 文字列処理]
---

## ひとことで

`EncodeTenThousand` は、1〜9999 の整数を「`123`」や「`4567`」のような ASCII 文字列にして書き込む関数です。
普通は 10 で割る・余りを取るを 4 回繰り返します。この関数は、**4 桁を 1 つの 32 ビット整数の 4 バイトに詰め、各桁を同時に計算** します。さらに、先頭のいらない `0` を **ビットを数える命令 1 つで** 取り除きます。

## コード

::: code-group

```cpp:line-numbers=191 [日本語訳]
inline char* EncodeTenThousand(uint32_t n, char* absl_nonnull out_str) {
  // n の下 2 桁と上 2 桁を、2 バイトずつの連続したブロックに分ける。
  // 123 -> [\0\1][\0\23]。両方のブロックを 10 で割り
  // （割り算 1 回 + 上位ビットのゼロ化）、10 の余りも「並列に」
  // 計算する。そして両方の結果を合わせて 4 つの ASCII 数字を作り、
  // 末尾のゼロを取り除き、ASCII の '0000' を足して返す。
  uint32_t div100 = (n * kDivisionBy100Mul) / kDivisionBy100Div;
  uint32_t mod100 = n - 100ull * div100;
  uint32_t hundreds = (mod100 << 16) + div100;
  uint32_t tens = (hundreds * kDivisionBy10Mul) / kDivisionBy10Div;
  tens &= (0xFull << 16) | 0xFull;
  tens += (hundreds - 10ull * tens) << 8;
  ABSL_ASSUME(tens != 0);
  // 結果には末尾にゼロのビットが含まれうるので、最終的な表現で
  // 最初の意味のあるバイトまで取り除く必要がある。たとえば n = 123 なら
  // tens は \0\1\2\3 という表現になる。`& -8` で 8 の倍数に切り下げ、
  // ゼロのビットすべてではなく、ゼロのバイトだけを取り除く。
  // countr_zero を使う。
  // MSVC を満足させるため 0 から 8 を引く形にしている。
  uint32_t zeroes = static_cast<uint32_t>(absl::countr_zero(tens)) & (0 - 8u);
  tens += kFourZeroBytes;
  tens >>= zeroes;
  little_endian::Store32(out_str, tens);
  return out_str + sizeof(tens) - zeroes / 8;
}
```

```cpp:line-numbers=191 [原文]
inline char* EncodeTenThousand(uint32_t n, char* absl_nonnull out_str) {
  // We split lower 2 digits and upper 2 digits of n into 2 byte consecutive
  // blocks. 123 ->  [\0\1][\0\23]. We divide by 10 both blocks
  // (it's 1 division + zeroing upper bits), and compute modulo 10 as well "in
  // parallel". Then we combine both results to have both ASCII digits,
  // strip trailing zeros, add ASCII '0000' and return.
  uint32_t div100 = (n * kDivisionBy100Mul) / kDivisionBy100Div;
  uint32_t mod100 = n - 100ull * div100;
  uint32_t hundreds = (mod100 << 16) + div100;
  uint32_t tens = (hundreds * kDivisionBy10Mul) / kDivisionBy10Div;
  tens &= (0xFull << 16) | 0xFull;
  tens += (hundreds - 10ull * tens) << 8;
  ABSL_ASSUME(tens != 0);
  // The result can contain trailing zero bits, we need to strip them to a first
  // significant byte in a final representation. For example, for n = 123, we
  // have tens to have representation \0\1\2\3. We do `& -8` to round
  // to a multiple to 8 to strip zero bytes, not all zero bits.
  // countr_zero to help.
  // 0 minus 8 to make MSVC happy.
  uint32_t zeroes = static_cast<uint32_t>(absl::countr_zero(tens)) & (0 - 8u);
  tens += kFourZeroBytes;
  tens >>= zeroes;
  little_endian::Store32(out_str, tens);
  return out_str + sizeof(tens) - zeroes / 8;
}
```

:::

## 前提知識

- **ASCII の数字**: `'0'` は `0x30`、`'1'` は `0x31` … です。数字 `d` の文字は `'0' + d` です。
- **リトルエンディアン**: 整数をメモリに書くとき、下位バイトが先（低いアドレス）に来る並べ方です。`0x33323130` を書くと、メモリには `30 31 32 33`、つまり `"0123"` の順に入ります。
- **掛け算による割り算**: `kDivisionBy100Mul` / `kDivisionBy100Div` は「10486 倍して 2^20 で割る」、`kDivisionBy10Mul` / `kDivisionBy10Div` は「103 倍して 2^10 で割る」で、それぞれ 9999 以下を 100 で、99 以下を 10 で割るのと同じ結果になります（同じファイルの上で定義）。
- **`absl::countr_zero(x)`**: `x` の右端（下位）から 0 のビットがいくつ続くかを数える関数です。CPU の専用命令 1 つになることが多いです。
- **`ABSL_ASSUME(cond)`**: 「この条件は必ず成り立つ」とコンパイラに教えて、最適化を助けるマクロです。
- **`0 - 8u`**: 符号なしの `-8` です。2 進数では下位 3 ビットだけが 0 の値になり、`& (0 - 8u)` は「8 の倍数に切り下げる」意味になります。
- **`kFourZeroBytes`**: 4 バイトとも `'0'`（`0x30`）が入った定数です。

## 何をしているか

`n = 123` で追います。答えは `"123"` の 3 文字です。

### 1. 上 2 桁と下 2 桁に分けて詰める

```cpp:line-numbers=197
  uint32_t div100 = (n * kDivisionBy100Mul) / kDivisionBy100Div;
  uint32_t mod100 = n - 100ull * div100;
  uint32_t hundreds = (mod100 << 16) + div100;
```

- `div100 = 1`（上 2 桁）、`mod100 = 23`（下 2 桁）です。
- `hundreds = (23 << 16) + 1` なので、下位 16 ビットに `1`、上位 16 ビットに `23` が入ります。

メモリの並びで書くと `[1][23]` です（16 ビットずつ）。

### 2. 2 つの 16 ビットを同時に 10 で割る

```cpp:line-numbers=200
  uint32_t tens = (hundreds * kDivisionBy10Mul) / kDivisionBy10Div;
  tens &= (0xFull << 16) | 0xFull;
  tens += (hundreds - 10ull * tens) << 8;
```

`hundreds * 103 / 1024` で、2 つの区画を同時に 10 で割ります。各区画の値は 99 以下なので、掛け算の結果が区画からあふれません。ただし右シフトで上の区画のビットが下の区画にはみ出してくるので、`& ((0xF << 16) | 0xF)` で各区画の下位 4 ビット（十の位、0〜9）だけを残します。

- 下の区画: `1 / 10 = 0`
- 上の区画: `23 / 10 = 2`

次の行で、余り `hundreds - 10 * tens` を 8 ビット左にずらして足します。各区画の 2 バイト目に一の位が入ります。

- 下の区画: 十の位 0、一の位 1
- 上の区画: 十の位 2、一の位 3

32 ビットの値は `0x03020100` で、バイトの並びは `[0][1][2][3]`、つまり 4 桁で書いた `0123` そのものです。

### 3. 先頭のゼロを取り除く

```cpp:line-numbers=210
  uint32_t zeroes = static_cast<uint32_t>(absl::countr_zero(tens)) & (0 - 8u);
  tens += kFourZeroBytes;
  tens >>= zeroes;
```

`0x03020100` の右端から 0 のビットは 8 個続きます。`& (0 - 8u)` で 8 の倍数に切り下げると 8 です（ゼロの **バイト** の数 × 8）。

`kFourZeroBytes` を足すと `0x33323130`（`"0123"`）になり、8 ビット右にずらすと `0x00333231`（`"123"` と末尾の 0）になります。

### 4. 書き込んで長さを返す

```cpp:line-numbers=213
  little_endian::Store32(out_str, tens);
  return out_str + sizeof(tens) - zeroes / 8;
```

4 バイトを書き込み、`4 - 8 / 8 = 3` 文字ぶん進めた位置を返します。

## ここがすごい

- **1 つの整数を小さな箱の集まりとして使う**: 32 ビット整数を 16 ビットの箱 2 つ、さらに 8 ビットの箱 4 つとして扱い、1 回の掛け算で複数の割り算を同時に行っています。こうした手法は SWAR（SIMD Within A Register、レジスタ内 SIMD）と呼ばれます。
- **「末尾のゼロ」＝「先頭の数字のゼロ」**: リトルエンディアンでは、文字列の先頭が整数の下位バイトです。だから先頭のいらない `0` は、整数の **下位のゼロのバイト** になります。それを `countr_zero` で数え、右シフトで消せます。ループで 1 文字ずつ確かめる必要がありません。
- **ゼロのビットではなくゼロのバイト**: `countr_zero` は 1 ビット単位で数えるので、`& (0 - 8u)` で 8 の倍数に丸めています。`'1'` の 1 バイトに含まれる下位の 0 のビットまで消してしまわないための工夫です。
- **前提を `ABSL_ASSUME` で伝える**: `tens` が 0 だと `countr_zero` は 32 を返し、32 ビットのシフトは未定義動作になります。この関数は 1 以上の値でしか呼ばれないので、それをコンパイラに伝えて、0 の場合の余分な処理を省かせています。

## まとめ

- 整数を「小さな区画の集まり」と見ると、1 回の演算で複数の桁を同時に計算できる（SWAR）。
- 区画のはみ出しは、マスクで取り除く。
- リトルエンディアンでは、文字列の先頭のゼロは整数の下位のゼロのバイトになり、`countr_zero` で数えられる。
- ビット数をバイト数にそろえたいときは `& ~7`（ここでは `& (0 - 8u)`）で 8 の倍数に丸める。
