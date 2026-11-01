---
title: 割り算を掛け算に変え、1 桁か 2 桁かを分岐なしで書き分ける
description: 0〜99 の整数を ASCII の数字にする関数。10 での割り算を「103 倍して 1024 で割る」に置き換え、桁数の違いもシフト量の計算だけで吸収する。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/strings/numbers.cc
lines: [163, 189]
function: EncodeHundred
difficulty: 3
tags: [ビット演算, 最適化, 文字列処理]
---

## ひとことで

`EncodeHundred` は、0〜99 の整数 `n` を「`7`」や「`42`」のような ASCII の数字に変換して書き込む関数です。整数を文字列にする `absl::StrCat` などの土台の 1 つです。

この 9 行には、高速化の小技が 3 つ詰まっています。**10 での割り算を掛け算とシフトにする**、**2 文字を 1 つの 16 ビット整数としてまとめて作る**、そして **1 桁か 2 桁かを if を使わずに書き分ける** ことです。

## コード

::: code-group

```cpp:line-numbers=163 [日本語訳]
// これらの定数は、'00'、'0000'、'00000000' という ASCII 文字列を
// 整数として表したもの。0〜9 をバイトとして書き込むなら、これを足せばよい。
// 0 <= i <= 9 について 'i' = '0' + i だからだ。
constexpr uint32_t kTwoZeroBytes = 0x0101 * '0';
constexpr uint64_t kFourZeroBytes = 0x01010101 * '0';
constexpr uint64_t kEightZeroBytes = 0x0101010101010101ull * '0';

// * 103 / 1024 は、0〜99 の値に対する 10 での割り算になる。さらに
// [k が 2 バイト][m が 2 バイト] という構造に * 103 / 1024 をすると
// [k / 10][m / 10] になる。つまり並列に割り算ができる。
constexpr uint64_t kDivisionBy10Mul = 103u;
constexpr uint64_t kDivisionBy10Div = 1 << 10;

// * 10486 / 1048576 は、0〜9999 の値に対する 100 での割り算になる。
constexpr uint64_t kDivisionBy100Mul = 10486u;
constexpr uint64_t kDivisionBy100Div = 1 << 20;

// Encode 系の関数は、入力 `n` を ASCII で `out_str` に書き込む。
inline char* EncodeHundred(uint32_t n, char* absl_nonnull out_str) {
  int num_digits = static_cast<int>(n - 10) >> 8;
  uint32_t div10 = (n * kDivisionBy10Mul) / kDivisionBy10Div;
  uint32_t mod10 = n - 10u * div10;
  uint32_t base = kTwoZeroBytes + div10 + (mod10 << 8);
  base >>= num_digits & 8;
  little_endian::Store16(out_str, static_cast<uint16_t>(base));
  return out_str + 2 + num_digits;
}
```

```cpp:line-numbers=163 [原文]
// These constants represent '00', '0000' and '00000000' as ascii strings in
// integers. We can add these numbers if we encode to bytes from 0 to 9. as
// 'i' = '0' + i for 0 <= i <= 9.
constexpr uint32_t kTwoZeroBytes = 0x0101 * '0';
constexpr uint64_t kFourZeroBytes = 0x01010101 * '0';
constexpr uint64_t kEightZeroBytes = 0x0101010101010101ull * '0';

// * 103 / 1024 is a division by 10 for values from 0 to 99. It's also a
// division of a structure [k takes 2 bytes][m takes 2 bytes], then * 103 / 1024
// will be [k / 10][m / 10]. It allows parallel division.
constexpr uint64_t kDivisionBy10Mul = 103u;
constexpr uint64_t kDivisionBy10Div = 1 << 10;

// * 10486 / 1048576 is a division by 100 for values from 0 to 9999.
constexpr uint64_t kDivisionBy100Mul = 10486u;
constexpr uint64_t kDivisionBy100Div = 1 << 20;

// Encode functions write the ASCII output of input `n` to `out_str`.
inline char* EncodeHundred(uint32_t n, char* absl_nonnull out_str) {
  int num_digits = static_cast<int>(n - 10) >> 8;
  uint32_t div10 = (n * kDivisionBy10Mul) / kDivisionBy10Div;
  uint32_t mod10 = n - 10u * div10;
  uint32_t base = kTwoZeroBytes + div10 + (mod10 << 8);
  base >>= num_digits & 8;
  little_endian::Store16(out_str, static_cast<uint16_t>(base));
  return out_str + 2 + num_digits;
}
```

:::

## 前提知識

- **ASCII の数字**: 文字 `'0'` は数値 48（16 進で `0x30`）、`'1'` は 49 … と並んでいます。だから数字 `i` の文字は `'0' + i` で作れます。
- **リトルエンディアン**: 多くの CPU は、複数バイトの整数をメモリに書くとき、**下位のバイトから先に** 並べます。16 ビット整数 `0x3234` を書くと、メモリには `0x34`, `0x32` の順に入ります。
- **`little_endian::Store16(p, v)`**: 16 ビットの値 `v` を、リトルエンディアンの順で `p` の位置に書き込む Abseil の関数です。CPU の種類に関係なく、必ず下位バイトが先になります。
- **`char* out_str`**: 文字を書き込む先を指すポインタです。`out_str + 2` は 2 文字先の位置です。
- **`static_cast<int>(n - 10)`**: `n` は符号なしなので、`n < 10` のとき `n - 10` は巨大な正の数に回り込みます。それを `int` に変換すると負の数になります。
- **`>>`（右シフト）と負の数**: 負の `int` を右シフトすると、主要なコンパイラでは左から 1 が入り、`-1 >> 8` は `-1` のままです（算術シフト）。
- **`constexpr`**: コンパイル時に決まる定数です。

## 何をしているか

### 1. 便利な定数

```cpp:line-numbers=166
constexpr uint32_t kTwoZeroBytes = 0x0101 * '0';
constexpr uint64_t kFourZeroBytes = 0x01010101 * '0';
constexpr uint64_t kEightZeroBytes = 0x0101010101010101ull * '0';
```

`0x0101 * '0'` は `0x3030`、つまり 2 バイトとも `'0'` が入った値です。ここに各バイトの数字（0〜9）を足せば、そのまま ASCII の数字になります。

```cpp:line-numbers=173
constexpr uint64_t kDivisionBy10Mul = 103u;
constexpr uint64_t kDivisionBy10Div = 1 << 10;
```

`n * 103 / 1024` は、0〜99 の範囲なら `n / 10` と同じ答えになります。たとえば `42 * 103 = 4326`、`4326 / 1024 = 4.22…` なので 4 です。`1024` は 2 の 10 乗なので、この割り算はコンパイラがシフト 1 回に変えられます。

### 2. 1 桁か 2 桁かを数で表す

```cpp:line-numbers=182
  int num_digits = static_cast<int>(n - 10) >> 8;
```

- `n = 42` なら `n - 10 = 32`。`32 >> 8 = 0` です。
- `n = 7` なら `n - 10` は負の数（`-3`）になり、`-3 >> 8 = -1` です。

つまり `num_digits` は 2 桁なら 0、1 桁なら -1 です。比較も分岐もしていません。

### 3. 十の位と一の位を 1 つの整数に詰める

```cpp:line-numbers=183
  uint32_t div10 = (n * kDivisionBy10Mul) / kDivisionBy10Div;
  uint32_t mod10 = n - 10u * div10;
  uint32_t base = kTwoZeroBytes + div10 + (mod10 << 8);
```

`n = 42` で追います。

- `div10 = 4`、`mod10 = 2` です。
- `base = 0x3030 + 4 + (2 << 8) = 0x3030 + 0x0004 + 0x0200 = 0x3234` です。

下位バイトが `0x34`（`'4'`）、上位バイトが `0x32`（`'2'`）です。リトルエンディアンで書けば `"42"` の順に並びます。

### 4. 1 桁なら 1 バイトずらす

```cpp:line-numbers=186
  base >>= num_digits & 8;
  little_endian::Store16(out_str, static_cast<uint16_t>(base));
  return out_str + 2 + num_digits;
```

`num_digits & 8` は、2 桁なら `0 & 8 = 0`、1 桁なら `-1 & 8 = 8` です。

`n = 7` の場合、`base = 0x3030 + 0 + 0x0700 = 0x3730` です。下位バイトは十の位の `'0'` なので、このままでは `"07"` になってしまいます。そこで 8 ビット右にずらして `0x0037` にすると、下位バイトが `'7'` になります。

最後に 2 バイトを書き込み、`out_str + 2 + num_digits`、つまり 2 桁なら 2 文字先、1 桁なら 1 文字先を返します。1 桁のときに余分に書いた 2 バイト目は、次に書く文字で上書きされるか、文字列の外側として無視されます。

## ここがすごい

- **割り算を避ける**: 整数の割り算は、CPU にとって掛け算よりずっと遅い命令です。範囲が 0〜99 と分かっているので、「103 倍して 1024 で割る」という掛け算とシフトで正確に代用しています。
- **表引きをやめた理由がコメントにある**: 少し上のコメントによると、以前は 0〜99 の 2 文字を並べた 200 バイトの表を引いていました。しかし表がキャッシュから追い出されると遅くなるため、計算だけで作る今の方式に切り替えたそうです。
- **分岐しない桁数処理**: 「10 未満なら 1 文字、そうでなければ 2 文字」は if で書くのが普通です。ここでは負の数の右シフトと AND で、桁数をシフト量に変えています。分岐予測が外れる心配がありません。
- **2 文字を 1 回で書く**: 1 文字ずつ書く代わりに、16 ビットの値を 1 回の書き込みで置いています。同じ考え方を 4 桁（`EncodeTenThousand`）や 8 桁（`PrepareEightDigits`）にも広げているのが、このファイルの面白いところです。

## まとめ

- 範囲が限られた定数での割り算は、「掛けてからシフト」に置き換えられる。
- 複数の文字は、1 つの整数の各バイトとしてまとめて組み立てられる。
- `'0'` をすべてのバイトに足せば、0〜9 の値が一度に ASCII の数字になる。
- 負の数の右シフトと AND を使うと、条件分岐を計算に置き換えられる。
