---
title: x & -x で「両方を割り切る最大の 2 の累乗」を一発で出す
description: 整列済みのアドレスにオフセットを足したとき、まだ何バイト境界にそろっているかを求める MinAlign。最下位の 1 ビットを取り出す古典的ハックを使う。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [349, 364]
function: llvm::MinAlign
difficulty: 2
tags: [ビット演算, メモリ管理, 移植性]
format: 2
---

## ひとことで

`MinAlign(A, B)` は、`A` と `B` の**両方を割り切る最大の 2 の累乗**を返します。
たとえば `MinAlign(8, 12)` は `4`、`MinAlign(16, 32)` は `16` です。

使いみちは「アラインメント（メモリ上の住所が何の倍数か）」の計算です。8 の倍数の住所に 12 を足すと、結果は 4 の倍数であることまでしか保証できません。その「保証できる境界」を求めます。

## コード

::: code-group

```cpp:line-numbers=349 [日本語訳]
/// A と B はアラインメントかオフセット。2 つを足した後に仮定できる
/// 最小のアラインメントを返す。
template <typename U, typename V, typename T = common_uint<U, V>>
constexpr T MinAlign(U A, V B) {
  // A と B の両方を割り切る最大の 2 の累乗。
  //
  // MSVC の警告 C4146 を避けるため、下のコメント中のコードの
  // "-Value" を "1+~Value" に置き換えている
  //    return (A | B) & -(A | B);
  return (A | B) & (1 + ~(A | B));
}

/// 引数が整数型でないときの受け皿。
constexpr uint64_t MinAlign(uint64_t A, uint64_t B) {
  return (A | B) & (1 + ~(A | B));
}
```

```cpp:line-numbers=349 [原文]
/// A and B are either alignments or offsets. Return the minimum alignment that
/// may be assumed after adding the two together.
template <typename U, typename V, typename T = common_uint<U, V>>
constexpr T MinAlign(U A, V B) {
  // The largest power of 2 that divides both A and B.
  //
  // Replace "-Value" by "1+~Value" in the following commented code to avoid
  // MSVC warning C4146
  //    return (A | B) & -(A | B);
  return (A | B) & (1 + ~(A | B));
}

/// Fallback when arguments aren't integral.
constexpr uint64_t MinAlign(uint64_t A, uint64_t B) {
  return (A | B) & (1 + ~(A | B));
}
```

:::

## 前提知識

- **テンプレートの既定引数 `typename T = common_uint<U, V>`**: 戻り値の型 `T` を、引数 `U` と `V` から自動で決めています。`common_uint` は LLVM 内の別名で、「2 つの型を符号なしにして、広いほうに合わせた型」です。
- **`constexpr`**: コンパイル時にも計算できる関数です。
- **関数のオーバーロード**: 同じ名前で引数の型が違う関数を複数定義できます。下の `constexpr uint64_t MinAlign(uint64_t A, uint64_t B)` は、整数型以外（列挙型など）が渡されたときの受け皿です。
- **`~`（ビット反転）**: 全ビットの 0 と 1 を入れ替えます。
- **2 の補数**: 多くの CPU では負の数を「ビット反転して 1 足す」で表します。つまり `-x` と `~x + 1` は同じビット列です。

## 何をしているか

### 1. 両方を OR する

```cpp:line-numbers=358
  return (A | B) & (1 + ~(A | B));
```

`A = 8`、`B = 12` の例です。

```
A      = 01000
B      = 01100
A | B  = 01100   （12）
```

ある 2 の累乗 `2^k` が `A` と `B` の両方を割り切るのは、両方とも下位 `k` ビットが 0 のときです。OR を取ると、**どちらかに 1 がある最下位の桁**が、「両方を割り切れなくなる最初の桁」になります。

### 2. 最下位の 1 だけを取り出す

```cpp:line-numbers=358
  return (A | B) & (1 + ~(A | B));
```

`X = 01100` として:

```
~X        = 10011
1 + ~X    = 10100   （= -X）
X & -X    = 00100   （4）
```

`-X` を作ると、最下位の 1 とその下はそのまま、それより上は全部反転します。元の値と AND を取ると、**最下位の 1 だけ**が残ります。これは「`x & -x` で最下位ビットを取り出す」という有名なハックです。

答えは 4。8 の倍数の住所に 12 を足すと 4 の倍数になる、という結論と一致します。

### 3. `-` の代わりに `1 + ~` を書く理由

```cpp:line-numbers=355
  // MSVC の警告 C4146 を避けるため、下のコメント中のコードの
  // "-Value" を "1+~Value" に置き換えている
  //    return (A | B) & -(A | B);
```

コメントにある通り、素直に `(A | B) & -(A | B)` と書くと、MSVC（Microsoft のコンパイラ）が「符号なし整数に単項マイナスを付けた」という警告 C4146 を出します。符号なしの `-x` は規格上は正しい（2^N で一周する）のですが、警告を避けるために、同じ意味の `1 + ~x` に書き換えています。

## ここがすごい

素直に書くなら「`A` と `B` の最大公約数を求め、それ以下の最大の 2 の累乗を探す」ことになりますが、ループや割り算が必要です。

この実装は OR、反転、足し算、AND の **4 演算だけ**で、分岐もありません。`constexpr` なのでコンパイル時の定数計算にも使えます。

また、コメントに「本来書きたい式」を残したうえで、警告回避のための書き換えをしている点も読みやすさの工夫です。後から読んだ人が「なぜわざわざ `1 + ~` なのか」と迷わずに済みます。

## まとめ

- `x & -x` は最下位の 1 ビットだけを取り出す定番ハック。
- 2 つの値を OR してから最下位ビットを取ると、両方を割り切る最大の 2 の累乗になる。
- 2 の補数では `-x == ~x + 1`。警告回避に言い換えられる。
- 書き換えた理由はコメントに残すと、後の読者が迷わない。
