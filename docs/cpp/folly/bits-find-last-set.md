---
title: XOR 1 回で「引き算」を消す、最上位ビットの位置の求め方
description: 整数のいちばん上に立っている 1 のビットが何桁目かを返す findLastSet。count leading zeros 命令の結果を引き算ではなく XOR で変換し、コンパイラの無駄な命令を消している。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/lang/Bits.h
lines: [125, 145]
function: folly::findLastSet
difficulty: 3
format: 2
tags: [ビット演算, 最適化, 低レイヤ]
---

## ひとことで

`findLastSet(v)` は、整数 `v` を 2 進数で書いたときに **いちばん左にある `1` が右から何桁目か**（1 始まり）を返します。
たとえば `20` は `10100` なので答えは `5`、`1` なら `1`、`0` なら `0` です。`v > 0` なら `1 + floor(log2(v))` と同じ値になります。

中身は CPU の「先頭の 0 を数える命令」を呼ぶだけですが、その結果の変換を **引き算ではなく XOR で書く** という一工夫が入っています。

## コード

::: code-group

```cpp:line-numbers=125 [日本語訳]
template <typename T>
FOLLY_ALWAYS_INLINE constexpr unsigned int findLastSet(T const v) {
  using U0 = unsigned int;
  using U1 = unsigned long int;
  using U2 = unsigned long long int;
  using detail::bits_to_unsigned;
  static_assert(sizeof(T) <= sizeof(U2), "over-sized type");
  static_assert(std::is_integral<T>::value, "non-integral type");
  static_assert(!std::is_same<T, bool>::value, "bool type");

  // X が 2 のべき乗なら X - Y = 1 + ((X - 1) ^ Y)。この変形をしておくと
  // GCC が bsr で clz を実装するときに足す自前の xor を消せる。
  // clang-format off
  constexpr auto size = constexpr_max(sizeof(T), sizeof(U0));
  return v ? 1u + static_cast<unsigned int>((8u * size - 1u) ^ (
      sizeof(T) <= sizeof(U0) ? __builtin_clz(bits_to_unsigned<U0>(v)) :
      sizeof(T) <= sizeof(U1) ? __builtin_clzl(bits_to_unsigned<U1>(v)) :
      sizeof(T) <= sizeof(U2) ? __builtin_clzll(bits_to_unsigned<U2>(v)) :
      0)) : 0u;
  // clang-format on
}
```

```cpp:line-numbers=125 [原文]
template <typename T>
FOLLY_ALWAYS_INLINE constexpr unsigned int findLastSet(T const v) {
  using U0 = unsigned int;
  using U1 = unsigned long int;
  using U2 = unsigned long long int;
  using detail::bits_to_unsigned;
  static_assert(sizeof(T) <= sizeof(U2), "over-sized type");
  static_assert(std::is_integral<T>::value, "non-integral type");
  static_assert(!std::is_same<T, bool>::value, "bool type");

  // If X is a power of two X - Y = 1 + ((X - 1) ^ Y). Doing this transformation
  // allows GCC to remove its own xor that it adds to implement clz using bsr.
  // clang-format off
  constexpr auto size = constexpr_max(sizeof(T), sizeof(U0));
  return v ? 1u + static_cast<unsigned int>((8u * size - 1u) ^ (
      sizeof(T) <= sizeof(U0) ? __builtin_clz(bits_to_unsigned<U0>(v)) :
      sizeof(T) <= sizeof(U1) ? __builtin_clzl(bits_to_unsigned<U1>(v)) :
      sizeof(T) <= sizeof(U2) ? __builtin_clzll(bits_to_unsigned<U2>(v)) :
      0)) : 0u;
  // clang-format on
}
```

:::

## 前提知識

- **`template <typename T>`**: テンプレートです。`T` には `int` や `uint64_t` など任意の型が入り、型ごとに別の関数がコンパイル時に作られます。
- **`constexpr`**: コンパイル時にも計算できる関数であることを示します。定数式の中でも呼べます。
- **`using U0 = unsigned int;`**: 型に別名を付ける書き方です。
- **`static_assert(条件, "メッセージ")`**: コンパイル時のチェックです。条件が偽ならコンパイルエラーになります。ここでは「64 ビットより大きい型」「整数でない型」「`bool`」を弾いています。
- **`sizeof(T)`**: 型 `T` が何バイトかを表します。コンパイル時に決まる定数です。
- **`__builtin_clz`**: GCC/Clang の組み込み関数で、count leading zeros（上位から続く 0 の個数）を返します。32 ビットの `20`（`000…010100`）なら `27` です。**引数が 0 のときの結果は未定義** です。`clzl`、`clzll` はそれぞれ `long`、`long long` 版です。
- **`a ? b : c`**: 三項演算子です。`a` が真なら `b`、偽なら `c` になります。
- **`^`**: ビットごとの XOR（排他的論理和）です。
- **`FOLLY_ALWAYS_INLINE`**: 「必ずインライン展開してほしい」とコンパイラに伝える Folly のマクロです。

## 何をしているか

### 1. 型のサイズに合った組み込み関数を選ぶ

```cpp:line-numbers=140
      sizeof(T) <= sizeof(U0) ? __builtin_clz(bits_to_unsigned<U0>(v)) :
      sizeof(T) <= sizeof(U1) ? __builtin_clzl(bits_to_unsigned<U1>(v)) :
      sizeof(T) <= sizeof(U2) ? __builtin_clzll(bits_to_unsigned<U2>(v)) :
```

`sizeof(T) <= sizeof(U0) ? __builtin_clz(...) : ...` という三項演算子の連鎖で、`T` の大きさに合う `clz` を選びます。
条件はすべてコンパイル時に決まる定数なので、実際に残るのは 1 つの呼び出しだけです。`bits_to_unsigned<U0>(v)` は `v` を符号なしの `unsigned int` に変換する Folly の補助関数です。

### 2. 0 を特別扱いする

```cpp:line-numbers=139
  return v ? 1u + static_cast<unsigned int>((8u * size - 1u) ^ (
```

`v ? ... : 0u` で、`v` が 0 なら即座に 0 を返します。`__builtin_clz(0)` は未定義なので、呼ぶ前に除外しているわけです。

### 3. clz の結果を「桁数」に変える

```cpp:line-numbers=138
  constexpr auto size = constexpr_max(sizeof(T), sizeof(U0));
  return v ? 1u + static_cast<unsigned int>((8u * size - 1u) ^ (
```

`size` は `T` と `unsigned int` の大きいほうのバイト数です。`char` などの小さい型も `unsigned int` に広げて数えるためです。
32 ビットの場合、`8u * size - 1u` は `31` になります。

`v = 20` で追ってみます。

- `__builtin_clz(20)` = `27`（上位に 0 が 27 個）
- `31 ^ 27` → `11111 ^ 11011` = `00100` = `4`
- `1u + 4` = `5`

素直に書けば `32 - clz(v)` です。`32 - 27 = 5` で同じ答えになります。

## ここがすごい

コメントにあるとおり、「`X` が 2 のべき乗なら `X - Y = 1 + ((X - 1) ^ Y)`」という恒等式を使っています。
`31` は 2 進数で `11111` と 1 が並んだ値なので、`0〜31` の `Y` について「`31 - Y`」と「`31 ^ Y`」は同じ結果です（どの桁でも繰り下がりが起きないため）。

なぜわざわざ XOR にするのか。x86 で GCC は `clz` を `bsr`（最上位ビットの **位置** を返す命令）で実装し、位置から「0 の個数」に戻すために自分で `xor 31` を足します。
こちらも `31 ^ clz` と書いておくと、**XOR が 2 回重なって打ち消し合う** ことにコンパイラが気づき、両方とも消してくれます。結果として `bsr` と `+1` だけが残ります。
引き算で書くと、この打ち消しは起きません。

ほかにも次の点がよくできています。

- `static_assert` で、意味のない型（`bool` など）を **コンパイル時に** 拒否しています。実行時に変な値を返すより親切です。
- 型ごとの関数選びを三項演算子で書いているので、`constexpr` 関数の中でもそのまま使えます。

## まとめ

- 最上位ビットの位置は「上位の 0 の個数（clz）」から計算できる。
- `2^k - 1` からの引き算は、XOR と同じ結果になる。
- 書き方をコンパイラの内部実装に合わせると、余計な命令が消えることがある。
- `clz(0)` のような未定義の入力は、呼ぶ前に分岐で除外する。
