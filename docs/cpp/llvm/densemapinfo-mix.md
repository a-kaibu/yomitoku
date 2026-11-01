---
title: 掛け算 1 回と xor-shift 1 回で済ませる低遅延ハッシュ
description: DenseMap がポインタや 64 ビット整数のハッシュに使う mix 関数です。splitmix64 の定数で掛け、上位ビットを下へ折り返して、下位ビットにも偏りなく情報を行き渡らせます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/DenseMapInfo.h
lines: [26, 44]
function: densemap::detail::mix
difficulty: 2
format: 2
tags: [ハッシュ, ビット演算, 最適化]
---

## ひとことで

`mix` は、64 ビットの値を **かき混ぜて（ミキシングして）ハッシュ値にする** 関数です。処理は「大きな奇数を掛ける」「右シフトした自分と XOR する」の 2 手だけです。
`combineHashValue` は、2 つの 32 ビットのハッシュを 1 つの 64 ビットに並べてから `mix` にかけ、1 つのハッシュにまとめます。

## コード

::: code-group

```cpp:line-numbers=26 [日本語訳]
namespace densemap::detail {
// 掛け算 1 回と xor-shift 1 回だけを使う、とても低遅延な
// ビットミキサー。定数は splitmix64 のもの。
inline uint64_t mix(uint64_t x) {
  x *= 0xbf58476d1ce4e5b9u;
  x ^= x >> 31;
  return x;
}
} // namespace densemap::detail の終わり

namespace detail {

/// 32 ビットのハッシュ値どうしを 32 ビットのハッシュ値にまとめる、単純な合成。
inline unsigned combineHashValue(unsigned a, unsigned b) {
  uint64_t x = (uint64_t)a << 32 | (uint64_t)b;
  return (unsigned)densemap::detail::mix(x);
}

} // namespace detail の終わり
```

```cpp:line-numbers=26 [原文]
namespace densemap::detail {
// A bit mixer with very low latency using one multiplications and one
// xor-shift. The constant is from splitmix64.
inline uint64_t mix(uint64_t x) {
  x *= 0xbf58476d1ce4e5b9u;
  x ^= x >> 31;
  return x;
}
} // namespace densemap::detail

namespace detail {

/// Simplistic combination of 32-bit hash values into 32-bit hash values.
inline unsigned combineHashValue(unsigned a, unsigned b) {
  uint64_t x = (uint64_t)a << 32 | (uint64_t)b;
  return (unsigned)densemap::detail::mix(x);
}

} // end namespace detail
```

:::

## 前提知識

- **`namespace`**: 名前の住所のようなものです。`densemap::detail::mix` は「densemap の中の detail の中の mix」です。`detail` は「内部用」という慣習的な名前です。
- **`uint64_t` の掛け算**: 符号なし整数の掛け算は、あふれた上位ビットが捨てられます（2^64 で割った余りになる）。エラーにはなりません。
- **`0xbf58...u`**: 16 進数の定数です。末尾の `u` は符号なしの印です。
- **`x ^= x >> 31`**: `x` を 31 ビット右へずらしたものと XOR（ビットごとの排他的論理和）をとって、`x` に戻します。
- **`(unsigned)` キャスト**: 64 ビットから 32 ビットへ変換すると、下位 32 ビットだけが残ります。

## 何をしているか

### 1. 掛け算で上へ広げる

```cpp:line-numbers=30
  x *= 0xbf58476d1ce4e5b9u;
```

大きな奇数を掛けると、ある下位ビットの変化が、それより上のビットへ次々に波及します。
ただし掛け算には弱点があります。**積の下位 k ビットは、入力の下位 k ビットだけで決まる** のです。上のビットの情報は下へ届きません。

### 2. xor-shift で下へ折り返す

```cpp:line-numbers=31
  x ^= x >> 31;
```

そこで `x ^= x >> 31` で、よく混ざった上位ビットを下位へ折り返します。これで下位ビットにも、入力全体の情報が入ります。

### 3. なぜ下位ビットが大事か

DenseMap はハッシュ値を `& Mask` で使います。つまり **下位ビットしか見ません**。
ポインタは 8 や 16 の倍数の住所であることが多く、下位 3〜4 ビットはいつも 0 です。

例: 住所 `0x1000`, `0x1010`, `0x1020` をそのまま `& 7` すると、全部 0 番バケツに集まってしまいます。
掛け算だけでも下位 4 ビットは 0 のままです。xor-shift で上位から折り返すことで、初めてばらけます。

### 4. 2 つのハッシュを合成

```cpp:line-numbers=39
inline unsigned combineHashValue(unsigned a, unsigned b) {
  uint64_t x = (uint64_t)a << 32 | (uint64_t)b;
  return (unsigned)densemap::detail::mix(x);
}
```

`combineHashValue(a, b)` は、`a` を上位 32 ビット、`b` を下位 32 ビットに並べた 64 ビット値を作り、`mix` してから下位 32 ビットを返します。
`a` と `b` の両方が結果に影響するので、`(1, 2)` と `(2, 1)` も別の値になります。

## ここがすごい

- **とにかく短い**: 関数の前のコメントにある通り、「掛け算 1 回と xor-shift 1 回」の低遅延な混ぜ方です。ハッシュ表の探索ごとに呼ばれるので、命令数の少なさが効きます。
- **定数は実績のあるものを借りる**: 定数 `0xbf58476d1ce4e5b9` は、乱数生成器 splitmix64 の仕上げ処理で使われる値です。よく混ざることが知られた定数を使うことで、自前で調整する手間とリスクを避けています。
- **用途に合わせて手を抜く**: 本家の splitmix64 の仕上げは掛け算 2 回と xor-shift 3 回ですが、ここでは用途を考えて大幅に短くしています。完璧な混ざり方よりも速さを優先した判断です。
- **掛け算の弱点を知ったうえでの順番**: 「掛けてから右シフト XOR」の順にすることで、掛け算が届かない下位ビットを補っています。

## まとめ

- 奇数の掛け算は下位ビットを上へ広げるが、上の情報を下へは運ばない。
- xor-shift で上位ビットを下へ折り返すと、下位ビットも混ざる。
- ハッシュ表がどのビットを使うか（ここでは下位）を意識して混ぜ方を選ぶ。
- 2 つの値は 1 つの大きな整数に並べてから混ぜると、簡単に合成できる。

