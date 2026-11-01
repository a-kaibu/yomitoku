---
title: 最上位ビットの位置から 10 進の桁数を一発で求める
description: 64 ビット整数が 10 進で何桁かを、割り算を一度も使わず「表引き 2 回と比較 1 回」で求める関数。2 進の桁数と 10 進の桁数の関係をうまく使う。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1266, 1283]
function: detail::do_count_digits (uint64_t 版)
difficulty: 3
format: 2
tags: [ビット演算, 最適化, 数値計算]
---

## ひとことで

整数を文字列にするとき、{fmt} は最初に「何桁になるか」を数えます。桁数がわかれば、出力先を先に確保して右から一気に数字を書けるからです。

`do_count_digits` は 64 ビット整数 `n` の 10 進の桁数を、**割り算を使わずに** 求めます。たとえば `1000` なら `4`、`999` なら `3` を返します。

## コード

::: code-group

```cpp:line-numbers=1266 [日本語訳]
// count_digits の一部にせず別関数にしているのは、constexpr 関数の中で
// static constexpr が使えない制限を回避するため。
inline auto do_count_digits(uint64_t n) -> int {
  // Kendall Willets 版と同程度の性能だが
  // (https://github.com/fmtlib/format-benchmark/blob/master/digits10)
  // 表はより小さい。
  // bsr(n) を ceil(log10(pow(2, bsr(n) + 1) - 1)) に対応させる。
  static constexpr uint8_t bsr2log10[] = {
      1,  1,  1,  2,  2,  2,  3,  3,  3,  4,  4,  4,  4,  5,  5,  5,
      6,  6,  6,  7,  7,  7,  7,  8,  8,  8,  9,  9,  9,  10, 10, 10,
      10, 11, 11, 11, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 15, 15,
      15, 16, 16, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19, 19, 19, 20};
  auto t = bsr2log10[FMT_BUILTIN_CLZLL(n | 1) ^ 63];
  static constexpr uint64_t zero_or_powers_of_10[] = {
      0, 0, FMT_POWERS_OF_10(1U), FMT_POWERS_OF_10(1000000000ULL),
      10000000000000000000ULL};
  return t - (n < zero_or_powers_of_10[t]);
}
```

```cpp:line-numbers=1266 [原文]
// It is a separate function rather than a part of count_digits to workaround
// the lack of static constexpr in constexpr functions.
inline auto do_count_digits(uint64_t n) -> int {
  // This has comparable performance to the version by Kendall Willets
  // (https://github.com/fmtlib/format-benchmark/blob/master/digits10)
  // but uses smaller tables.
  // Maps bsr(n) to ceil(log10(pow(2, bsr(n) + 1) - 1)).
  static constexpr uint8_t bsr2log10[] = {
      1,  1,  1,  2,  2,  2,  3,  3,  3,  4,  4,  4,  4,  5,  5,  5,
      6,  6,  6,  7,  7,  7,  7,  8,  8,  8,  9,  9,  9,  10, 10, 10,
      10, 11, 11, 11, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 15, 15,
      15, 16, 16, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19, 19, 19, 20};
  auto t = bsr2log10[FMT_BUILTIN_CLZLL(n | 1) ^ 63];
  static constexpr uint64_t zero_or_powers_of_10[] = {
      0, 0, FMT_POWERS_OF_10(1U), FMT_POWERS_OF_10(1000000000ULL),
      10000000000000000000ULL};
  return t - (n < zero_or_powers_of_10[t]);
}
```

:::

`FMT_POWERS_OF_10` は同じファイルにある次のマクロで、`factor * 10` から `factor * 1000000000` までの 9 個の値に展開されます。

```cpp:line-numbers=1211
#define FMT_POWERS_OF_10(factor)                                  \
  factor * 10, (factor) * 100, (factor) * 1000, (factor) * 10000, \
      (factor) * 100000, (factor) * 1000000, (factor) * 10000000, \
      (factor) * 100000000, (factor) * 1000000000
```

## 前提知識

- **`uint64_t` / `uint8_t`**: 符号なしの 64 ビット整数と 8 ビット整数です。`ULL` を末尾に付けた数値は「unsigned long long 型の定数」という意味です。
- **`static constexpr` な配列**: `constexpr` は「コンパイル時に値が決まる」という印です。`static` を付けると関数を呼ぶたびに作り直されず、プログラムに 1 つだけ埋め込まれた表になります。
- **`FMT_BUILTIN_CLZLL`**: コンパイラ組み込みの「先頭から 0 が何個続くか（count leading zeros）」を数える命令を呼ぶマクロです。多くの CPU では 1 命令で終わります。
- **`^`（XOR）**: ビットごとの排他的論理和です。0〜63 の値 `x` に対しては `x ^ 63` が `63 - x` と同じになります。
- **`bool` から整数への変換**: C++ では比較結果 `true` / `false` を足し引きに使うと `1` / `0` として扱われます。
- **`#ifdef`**: プリプロセッサ（コンパイル前に動くテキスト置換）の条件分岐です。組み込み命令が使えない環境では、この関数ごと消えます。

## 何をしているか

### 1. 最上位ビットの位置を求める

```cpp:line-numbers=1278
  auto t = bsr2log10[FMT_BUILTIN_CLZLL(n | 1) ^ 63];
```

`FMT_BUILTIN_CLZLL(n | 1) ^ 63` は、`n` の **いちばん上にある 1 のビットの位置**（0 始まり）です。

- `n = 1000` は 2 進で `1111101000`。先頭の 0 は 54 個なので、`54 ^ 63 = 9`。
- `n | 1` は、`n = 0` のとき CLZ の結果が未定義になるのを避けるための工夫です。0 は 1 と同じ扱いになります。

### 2. 表で「だいたいの桁数」を引く

```cpp:line-numbers=1273
  static constexpr uint8_t bsr2log10[] = {
      1,  1,  1,  2,  2,  2,  3,  3,  3,  4,  4,  4,  4,  5,  5,  5,
      6,  6,  6,  7,  7,  7,  7,  8,  8,  8,  9,  9,  9,  10, 10, 10,
      10, 11, 11, 11, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 15, 15,
      15, 16, 16, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19, 19, 19, 20};
  auto t = bsr2log10[FMT_BUILTIN_CLZLL(n | 1) ^ 63];
```

`bsr2log10[i]` には「最上位ビットが i 番目の数のうち、**最大の数** の桁数」が入っています。i = 9 の数は 512〜1023 なので、最大の 1023 の桁数 **4** が入っています。

ただし 512〜999 は 3 桁です。表の値は「多めに見積もった桁数」で、正解かそれより 1 大きいかのどちらかです。

### 3. 境目と比べて 1 を引く

```cpp:line-numbers=1279
  static constexpr uint64_t zero_or_powers_of_10[] = {
      0, 0, FMT_POWERS_OF_10(1U), FMT_POWERS_OF_10(1000000000ULL),
      10000000000000000000ULL};
  return t - (n < zero_or_powers_of_10[t]);
```

`zero_or_powers_of_10[t]` は `10^(t-1)` です（t = 4 なら 1000）。`n` がこれ未満なら桁数は 1 少ないので、比較結果の `true`（= 1）を引きます。

- `n = 1000`: t = 4、`1000 < 1000` は false → **4**
- `n = 999`: t = 4、`999 < 1000` は true → **3**
- `n = 0`: `n | 1 = 1` で t = 1、表の値は 0、`0 < 0` は false → **1**

表の先頭 2 つが 0 なのは、t = 1（0〜1 の数）のときに絶対に 1 を引かないためです。

## ここがすごい

- **割り算ゼロ**: 素直に書くと「10 で割れなくなるまで割る」ループになり、20 桁なら 20 回の割り算です。割り算は CPU にとって重い命令です。この関数は CLZ 1 回、表引き 2 回、比較 1 回で終わります。
- **2 進の桁数から 10 進の桁数はほぼ決まる**: 2 進で同じ長さの数は、10 進では高々 2 通りの桁数にしかなりません。だから「表で見当をつけて 1 回だけ補正」で正確な答えになります。
- **小さな表**: コメントにあるとおり、Kendall Willets 版と同等の速さで、表を小さくした版です。64 要素の `uint8_t` 表なので 64 バイトで済みます。
- **別関数にした理由**: 関数の直前のコメントのとおり、`constexpr` 関数の中では `static constexpr` 変数が使えない（古い規格の制限）ため、表を持つ部分だけを独立させています。

## まとめ

- 2 進の桁数（最上位ビットの位置）は CLZ 命令で一瞬で求まる。
- 「表で見積もってから 1 回だけ補正する」と、ループも割り算も消せる。
- `bool` を数として足し引きすると、分岐なしで補正できる。
- `n | 1` のような小さな工夫で、未定義動作になる入力を避けられる。
