---
title: ビットの並びを逆にする――3 回の入れ替えとバイトスワップ
description: 整数のビット順を左右反転する bitReverse。組み込み関数があればそれを使い、無ければ「隣同士の入れ替え」を 1・2・4 ビット単位で行ってからバイト順を反転する。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/lang/Bits.h
lines: [629, 654]
function: folly::bitReverse
difficulty: 3
format: 2
tags: [ビット演算, 移植性, 最適化]
---

## ひとことで

`bitReverse(n)` は、整数 `n` の **ビットの並びを左右反転** した値を返します。
8 ビットの `00000110`（6）なら `01100000`（96）になります。FFT（高速フーリエ変換）の並べ替えや、一部のハッシュ・CRC の計算で使われる操作です。

Clang の組み込み関数があればそれを使い、無い環境では **「となり同士を入れ替える」操作を 3 回 + バイトの並べ替え 1 回** で実現します。

## コード

::: code-group

```cpp:line-numbers=629 [日本語訳]
template <typename T>
T bitReverseFallback(T n) {
  auto m = static_cast<typename std::make_unsigned<T>::type>(n);
  m = ((m & 0xAAAAAAAAAAAAAAAA) >> 1) | ((m & 0x5555555555555555) << 1);
  m = ((m & 0xCCCCCCCCCCCCCCCC) >> 2) | ((m & 0x3333333333333333) << 2);
  m = ((m & 0xF0F0F0F0F0F0F0F0) >> 4) | ((m & 0x0F0F0F0F0F0F0F0F) << 4);
  return static_cast<T>(Endian::swap(m));
}

} // namespace detail の終わり

template <typename T>
T bitReverse(T n) {
#if FOLLY_HAS_BUILTIN(__builtin_bitreverse64)
  if constexpr (sizeof(T) == 8) {
    return __builtin_bitreverse64(n);
  } else if constexpr (sizeof(T) == 4) {
    return __builtin_bitreverse32(n);
  } else if constexpr (sizeof(T) == 2) {
    return __builtin_bitreverse16(n);
  } else if constexpr (sizeof(T) == 1) {
    return __builtin_bitreverse8(n);
  }
#endif
  return detail::bitReverseFallback(n);
}
```

```cpp:line-numbers=629 [原文]
template <typename T>
T bitReverseFallback(T n) {
  auto m = static_cast<typename std::make_unsigned<T>::type>(n);
  m = ((m & 0xAAAAAAAAAAAAAAAA) >> 1) | ((m & 0x5555555555555555) << 1);
  m = ((m & 0xCCCCCCCCCCCCCCCC) >> 2) | ((m & 0x3333333333333333) << 2);
  m = ((m & 0xF0F0F0F0F0F0F0F0) >> 4) | ((m & 0x0F0F0F0F0F0F0F0F) << 4);
  return static_cast<T>(Endian::swap(m));
}

} // namespace detail

template <typename T>
T bitReverse(T n) {
#if FOLLY_HAS_BUILTIN(__builtin_bitreverse64)
  if constexpr (sizeof(T) == 8) {
    return __builtin_bitreverse64(n);
  } else if constexpr (sizeof(T) == 4) {
    return __builtin_bitreverse32(n);
  } else if constexpr (sizeof(T) == 2) {
    return __builtin_bitreverse16(n);
  } else if constexpr (sizeof(T) == 1) {
    return __builtin_bitreverse8(n);
  }
#endif
  return detail::bitReverseFallback(n);
}
```

:::

## 前提知識

- **テンプレート `template <typename T>`**: 型 `T` ごとに関数が作られます。`uint8_t` から `uint64_t` まで同じコードで扱えます。
- **`std::make_unsigned<T>::type`**: `T` に対応する符号なし整数型です。`int32_t` なら `uint32_t` になります。符号付きのまま右シフトすると、上位に符号ビットがコピーされてしまうため、先に符号なしに変えています。
- **マスク**: `0xAAAA…` は 2 進数で `1010…`、`0x5555…` は `0101…` です。`&` を取ると、奇数番目か偶数番目のビットだけを取り出せます。
- **`#if FOLLY_HAS_BUILTIN(...)`**: そのコンパイラに指定の組み込み関数があるかをプリプロセッサ（コンパイル前の置換処理）で調べます。
- **`if constexpr`**: コンパイル時に決まる条件分岐です。`sizeof(T) == 8` のように型の大きさで分けると、選ばれなかった分岐はコンパイルされません。
- **`Endian::swap(m)`**: 同じファイルにある関数で、整数のバイトの順番を逆にします（`0x11223344` → `0x44332211`）。CPU の 1 命令（x86 の `bswap` など）になります。

## 何をしているか

### 1. 組み込み関数があれば使う

```cpp:line-numbers=642
#if FOLLY_HAS_BUILTIN(__builtin_bitreverse64)
  if constexpr (sizeof(T) == 8) {
    return __builtin_bitreverse64(n);
  } else if constexpr (sizeof(T) == 4) {
    return __builtin_bitreverse32(n);
  } else if constexpr (sizeof(T) == 2) {
    return __builtin_bitreverse16(n);
  } else if constexpr (sizeof(T) == 1) {
    return __builtin_bitreverse8(n);
  }
#endif
```

Clang には `__builtin_bitreverse64` などがあり、ARM の `rbit` のような専用命令に変換されます。型の大きさに合わせて 8/16/32/64 ビット版を選びます。

### 2. フォールバック: 小さな単位から入れ替える

```cpp:line-numbers=630
T bitReverseFallback(T n) {
  auto m = static_cast<typename std::make_unsigned<T>::type>(n);
  m = ((m & 0xAAAAAAAAAAAAAAAA) >> 1) | ((m & 0x5555555555555555) << 1);
  m = ((m & 0xCCCCCCCCCCCCCCCC) >> 2) | ((m & 0x3333333333333333) << 2);
  m = ((m & 0xF0F0F0F0F0F0F0F0) >> 4) | ((m & 0x0F0F0F0F0F0F0F0F) << 4);
  return static_cast<T>(Endian::swap(m));
}
```

8 ビットの `m = 0000 0110`（b7…b0 の順）で追ってみます。

**1 ビット単位の入れ替え**: 奇数位置のビットを右へ、偶数位置のビットを左へ 1 つずらして合わせます。各ペア `(b1, b0)` が `(b0, b1)` になります。

```
00 00 01 10  →  00 00 10 01
```

**2 ビット単位の入れ替え**: 今度は 2 ビットの塊同士を入れ替えます。

```
0000 1001  →  0000 0110
```

**4 ビット単位の入れ替え**: 4 ビットの塊同士を入れ替えます。

```
0000 0110  →  0110 0000
```

ここで **各バイトの中のビット** が反転しました。8 ビットの例なら完成です（96 になりました）。

**バイト順の反転**: 64 ビットなら、あとは 8 個のバイトの並びを逆にすれば全体が反転します。この部分は `Endian::swap` に任せています。

## ここがすごい

- **分割統治**: 64 ビットを 1 ビットずつ移すと 64 回の処理が必要です。ここでは「1 → 2 → 4 ビット単位」と塊を倍々にして入れ替えるので、各段は数回の AND・シフト・OR だけです。
- **残りの段をバイトスワップに丸投げ**: 8・16・32 ビット単位の入れ替えも同じ方法で書けますが、それはまさに「バイト順の反転」です。CPU にはこれを 1 命令で行う `bswap` があるので、3 段ぶんの演算を 1 命令に置き換えています。
- **1 つの実装で全サイズに対応**: マスクは 64 ビット幅で書かれていますが、`m` が 32 ビットなら代入時に上位が切り捨てられるだけです。`Endian::swap` も型に合わせたバイト数を反転するので、テンプレート 1 つで全サイズが動きます。
- **速い道を優先**: 専用命令があるコンパイラでは、そもそもこのフォールバックは使われません。移植性と速度の両方を確保しています。

## まとめ

- ビット反転は「小さな塊の入れ替え」を倍々に繰り返すと、少ない演算でできる。
- 入れ替えの単位が 8 ビット以上になったら、バイトスワップ命令で代用できる。
- 右シフトの前に符号なし型へ変えると、符号ビットの混入を防げる。
- 組み込み関数の有無をプリプロセッサで調べ、無いときのための実装を用意しておく。
