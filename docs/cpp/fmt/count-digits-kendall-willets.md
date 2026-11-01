---
title: 足し算 1 回の繰り上がりで桁数を数える 32 ビット版の魔法
description: 32 ビット整数の 10 進桁数を「表の値を足して上位 32 ビットを取るだけ」で求める関数。比較すら使わず、足し算の繰り上がりに判定を任せる。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1327, 1348]
function: detail::do_count_digits (uint32_t 版)
difficulty: 3
format: 2
tags: [ビット演算, 最適化, マクロ, ハック]
---

## ひとことで

32 ビットの符号なし整数 `n` が 10 進で何桁かを返す関数です。`9` なら 1、`10` なら 2、`4294967295` なら 10 です。

64 ビット版は「表引き → 比較 → 1 を引く」でしたが、この 32 ビット版は **比較すらしません**。表の値を `n` に足して、上位 32 ビットを取り出すだけで答えになります。

## コード

::: code-group

```cpp:line-numbers=1327 [日本語訳]
// count_digits の一部にせず別関数にしているのは、constexpr 関数の中で
// static constexpr が使えない制限を回避するため。
FMT_INLINE auto do_count_digits(uint32_t n) -> int {
// Kendall Willets による最適化（https://bit.ly/3uOIQrB）。
// T 以上の値が足されると上位 32 ビット（log10(T) - 1）が 1 増える。
#  define FMT_INC(T) (((sizeof(#T) - 1ull) << 32) - T)
  static constexpr uint64_t table[] = {
      FMT_INC(0),          FMT_INC(0),          FMT_INC(0),           // 8
      FMT_INC(10),         FMT_INC(10),         FMT_INC(10),          // 64
      FMT_INC(100),        FMT_INC(100),        FMT_INC(100),         // 512
      FMT_INC(1000),       FMT_INC(1000),       FMT_INC(1000),        // 4096
      FMT_INC(10000),      FMT_INC(10000),      FMT_INC(10000),       // 32k
      FMT_INC(100000),     FMT_INC(100000),     FMT_INC(100000),      // 256k
      FMT_INC(1000000),    FMT_INC(1000000),    FMT_INC(1000000),     // 2048k
      FMT_INC(10000000),   FMT_INC(10000000),   FMT_INC(10000000),    // 16M
      FMT_INC(100000000),  FMT_INC(100000000),  FMT_INC(100000000),   // 128M
      FMT_INC(1000000000), FMT_INC(1000000000), FMT_INC(1000000000),  // 1024M
      FMT_INC(1000000000), FMT_INC(1000000000)                        // 4B
  };
  auto inc = table[FMT_BUILTIN_CLZ(n | 1) ^ 31];
  return static_cast<int>((n + inc) >> 32);
}
```

```cpp:line-numbers=1327 [原文]
// It is a separate function rather than a part of count_digits to workaround
// the lack of static constexpr in constexpr functions.
FMT_INLINE auto do_count_digits(uint32_t n) -> int {
// An optimization by Kendall Willets from https://bit.ly/3uOIQrB.
// This increments the upper 32 bits (log10(T) - 1) when >= T is added.
#  define FMT_INC(T) (((sizeof(#T) - 1ull) << 32) - T)
  static constexpr uint64_t table[] = {
      FMT_INC(0),          FMT_INC(0),          FMT_INC(0),           // 8
      FMT_INC(10),         FMT_INC(10),         FMT_INC(10),          // 64
      FMT_INC(100),        FMT_INC(100),        FMT_INC(100),         // 512
      FMT_INC(1000),       FMT_INC(1000),       FMT_INC(1000),        // 4096
      FMT_INC(10000),      FMT_INC(10000),      FMT_INC(10000),       // 32k
      FMT_INC(100000),     FMT_INC(100000),     FMT_INC(100000),      // 256k
      FMT_INC(1000000),    FMT_INC(1000000),    FMT_INC(1000000),     // 2048k
      FMT_INC(10000000),   FMT_INC(10000000),   FMT_INC(10000000),    // 16M
      FMT_INC(100000000),  FMT_INC(100000000),  FMT_INC(100000000),   // 128M
      FMT_INC(1000000000), FMT_INC(1000000000), FMT_INC(1000000000),  // 1024M
      FMT_INC(1000000000), FMT_INC(1000000000)                        // 4B
  };
  auto inc = table[FMT_BUILTIN_CLZ(n | 1) ^ 31];
  return static_cast<int>((n + inc) >> 32);
}
```

:::

## 前提知識

- **`#define` とマクロ**: `FMT_INC(T)` はプリプロセッサのマクロで、使った場所にテキストとして展開されます。関数ではないので、引数の「書かれた文字」そのものを扱えます。
- **`#T`（文字列化）**: マクロの中で `#T` と書くと、引数を文字列リテラルにします。`FMT_INC(1000)` の中の `#T` は `"1000"` になります。
- **`sizeof` と文字列リテラル**: `sizeof("1000")` は末尾のヌル文字を含めた **5** です。だから `sizeof(#T) - 1` は「T を 10 進で書いたときの文字数」＝桁数になります。
- **`<<` と `>>`**: ビットシフトです。`x << 32` は `x` を上位 32 ビットへ移す操作、`y >> 32` は上位 32 ビットを取り出す操作です。
- **`ull`**: unsigned long long（64 ビット以上の符号なし整数）の定数を表す接尾辞です。
- **`FMT_BUILTIN_CLZ(n | 1) ^ 31`**: `n` のいちばん上の 1 のビットの位置（0〜31）を求めます。CLZ は先頭の 0 の数を数える CPU 命令です。

## 何をしているか

### 1. 表の 1 要素の正体

```cpp:line-numbers=1332
#  define FMT_INC(T) (((sizeof(#T) - 1ull) << 32) - T)
```

`FMT_INC(T)` は `(Tの桁数 << 32) - T` という 64 ビット値です。たとえば `FMT_INC(10)` は `(2 << 32) - 10` です。

これに `n` を足すと `(2 << 32) + (n - 10)` になります。

- `n >= 10` なら `n - 10` は 0 以上なので、上位 32 ビットは **2** のまま。
- `n < 10` なら `n - 10` は負なので、上位から 1 借りてきて、上位 32 ビットは **1** になります。

つまり **「T 以上かどうか」の判定を、引き算の繰り下がりにやらせている** のです。

### 2. どの T を使うかを最上位ビットで選ぶ

```cpp:line-numbers=1346
  auto inc = table[FMT_BUILTIN_CLZ(n | 1) ^ 31];
```

表は最上位ビットの位置（0〜31）で引きます。最上位ビットが同じ数は 10 進で高々 2 通りの桁数なので、その境目の 10 のべき乗を T として持っておけばよいわけです。

行末のコメント `// 64` などは「この行の数は 64 未満」という目安です。最上位ビットが 3〜5（8〜63）の行の T は 10 です。

### 3. 具体例で追う

```cpp:line-numbers=1347
  return static_cast<int>((n + inc) >> 32);
```

- `n = 9`: 最上位ビットは 3 → `FMT_INC(10)`。`9 + (2<<32) - 10 = (1<<32) + 0xFFFFFFFF` なので上位は **1**。
- `n = 42`: 最上位ビットは 5 → `FMT_INC(10)`。`(2<<32) + 32` で **2**。
- `n = 5`: 最上位ビットは 2 → `FMT_INC(0)` は `1 << 32`。足せば上位は必ず **1**。

最後の 2 行（最上位ビット 30, 31）は T = 10 億で、10 桁か 9 桁かを見分けます。

## ここがすごい

- **比較も分岐もない**: 足し算 1 回とシフト 1 回で答えが出ます。CPU が分岐予測を外す心配もありません。
- **マクロで桁数を数える**: `sizeof(#T) - 1` は、数値を文字列化して長さを測るというコンパイル時のハックです。表に 32 個並ぶ定数を手で計算せずに済み、書き間違いも起きません。
- **出典が明記されている**: 関数の先頭のコメントのとおり、Kendall Willets による最適化です。良いアイデアを取り込みつつ、出所を残しています。
- **素直な方法との比較**: 「10 で割り続ける」方法は最大 10 回の割り算、64 ビット版の方法でも比較が 1 回必要です。この版は比較を算術に置き換え、さらに短くしています。

## まとめ

- 「x が T 以上か」は、`x - T` の繰り下がりとして算術で表せる。
- 判定結果を上位ビットに「仕込んでおく」と、足すだけで答えが取り出せる。
- マクロの文字列化 `#` と `sizeof` で、コンパイル時に数字の桁数を数えられる。
- 2 進の桁数で場合分けすると、10 進の桁数の候補は 2 つに絞れる。
