---
title: 「-8 は 2 のべき乗の符号反転か」を、先頭の 1 と末尾の 0 の数で判定
description: APInt の isPowerOf2 と isNegatedPowerOf2 です。負の 2 のべき乗は「上に 1 が並び、下に 0 が並ぶ」形なので、両方の個数の和がビット幅と一致するかで判定します。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/APInt.h
lines: [433, 453]
function: APInt::isNegatedPowerOf2
difficulty: 2
format: 2
tags: [ビット演算, 数値計算, コンパイラ]
---

## ひとことで

コンパイラは「8 で掛ける」を「3 ビット左シフト」に置き換えるような最適化をします。そのため、定数が 2 のべき乗かを調べる関数がよく使われます。
- `isPowerOf2` は、値が **1, 2, 4, 8…（2 のべき乗）** かを調べます。
- `isNegatedPowerOf2` は、値が **-1, -2, -4, -8…（2 のべき乗の符号を反転したもの）** かを調べます。

## コード

::: code-group

```cpp:line-numbers=433 [日本語訳]
  /// この APInt の値が 0 より大きい 2 のべき乗かどうかを調べる。
  ///
  /// \returns 引数の APInt の値が 0 より大きい 2 のべき乗なら true。
  bool isPowerOf2() const {
    if (LLVM_LIKELY(isSingleWord())) {
      assert(BitWidth && "zero width values not allowed");
      return isPowerOf2_64(U.VAL);
    }
    return isPowerOf2SlowCase();
  }

  /// この APInt の符号を反転した値が、0 より大きい 2 のべき乗かを調べる。
  bool isNegatedPowerOf2() const {
    assert(BitWidth && "zero width values not allowed");
    if (isNonNegative())
      return false;
    // NegatedPowerOf2 は、上位ビットに寄った連続マスクの形になる。
    unsigned LO = countl_one();
    unsigned TZ = countr_zero();
    return (LO + TZ) == BitWidth;
  }
```

```cpp:line-numbers=433 [原文]
  /// Check if this APInt's value is a power of two greater than zero.
  ///
  /// \returns true if the argument APInt value is a power of two > 0.
  bool isPowerOf2() const {
    if (LLVM_LIKELY(isSingleWord())) {
      assert(BitWidth && "zero width values not allowed");
      return isPowerOf2_64(U.VAL);
    }
    return isPowerOf2SlowCase();
  }

  /// Check if this APInt's negated value is a power of two greater than zero.
  bool isNegatedPowerOf2() const {
    assert(BitWidth && "zero width values not allowed");
    if (isNonNegative())
      return false;
    // NegatedPowerOf2 - shifted mask in the top bits.
    unsigned LO = countl_one();
    unsigned TZ = countr_zero();
    return (LO + TZ) == BitWidth;
  }
```

:::

## 前提知識

- **APInt**: LLVM の任意ビット幅の整数です。64 ビット以下なら値を 1 語に、それより大きければ配列に持ちます。`isSingleWord()` は前者かどうかを返します。
- **2 の補数**: 負の数の表し方です。`-x` は「`x` の全ビットを反転して 1 足す」です。8 ビットの `-8` は `1111 1000` です。
- **`countl_one()`**: 上位（左）から 1 が何個続くかです。
- **`countr_zero()`**: 下位（右）から 0 が何個続くかです。
- **`isNonNegative()`**: 0 以上（最上位ビットが 0）かどうかです。
- **`LLVM_LIKELY`**: 「たいていこちら」とコンパイラに伝えるマクロです。
- **`assert`**: 開発中だけ有効な確認です。

## 何をしているか

### 1. isPowerOf2: 1 語なら即判定

```cpp:line-numbers=436
  bool isPowerOf2() const {
    if (LLVM_LIKELY(isSingleWord())) {
      assert(BitWidth && "zero width values not allowed");
      return isPowerOf2_64(U.VAL);
    }
    return isPowerOf2SlowCase();
  }
```

64 ビット以下の値なら、`isPowerOf2_64`（`x != 0 && (x & (x - 1)) == 0` という定番の判定）に任せます。
大きな値のときだけ、別のファイルにある `isPowerOf2SlowCase` を呼びます。よく通る道と珍しい道を分けています。

### 2. isNegatedPowerOf2: 形で判定

```cpp:line-numbers=445
  bool isNegatedPowerOf2() const {
    assert(BitWidth && "zero width values not allowed");
    if (isNonNegative())
      return false;
    // NegatedPowerOf2 は、上位ビットに寄った連続マスクの形になる。
    unsigned LO = countl_one();
    unsigned TZ = countr_zero();
    return (LO + TZ) == BitWidth;
  }
```

2 のべき乗 `2^k` を符号反転すると、どんな形になるでしょうか。8 ビットで見てみます。

```
  8 = 0000 1000
 -8 = 1111 1000   ← 上に 1 が 5 個、下に 0 が 3 個
 -1 = 1111 1111   ← 上に 1 が 8 個、下に 0 が 0 個
-128= 1000 0000   ← 上に 1 が 1 個、下に 0 が 7 個
```

いつも **「上に 1 の並び、下に 0 の並び」だけ** でできていて、間に混じりものがありません。
だから、先頭から続く 1 の数（`LO`）と末尾から続く 0 の数（`TZ`）を足すと、ちょうどビット幅になります。

- `-8`: `5 + 3 = 8` → 真
- `-6`（`1111 1010`）: `LO = 5`、`TZ = 1` で `6` → 偽

### 3. 正の数を除く

```cpp:line-numbers=447
    if (isNonNegative())
      return false;
```

正の数、たとえば `0`（`0000 0000`）は `LO = 0`、`TZ = 8` で和が 8 になってしまいます。最初に `isNonNegative()` で正の数と 0 を除いておくことで、この誤判定を防いでいます。

## ここがすごい

- **符号反転しなくてよい**: 素直に書くと「`-x` を計算してから `isPowerOf2`」です。しかし APInt の符号反転は、大きな値ならメモリの確保を伴います。この方法なら、ビットを数えるだけで新しい値を作りません。
- **形の性質を使う判定**: 「1 の塊と 0 の塊だけ」という形の特徴を、2 つの数の和という簡単な式に落としています。コメントにある「shifted mask in the top bits（上位に寄ったマスク）」という言い方がこの形を表しています。
- **境界の値も自然に扱える**: `-1`（`2^0` の反転）や、最小の負の数 `-128`（`2^7` の反転とみなせる）も、特別扱いなしで真になります。
- **単一語の高速化**: `isPowerOf2` は、ほとんどの値が 64 ビット以下であることを前提に、その場合をインラインで高速に処理しています。

## まとめ

- 2 のべき乗は「1 が 1 つだけ」、その符号反転は「上に 1 の塊・下に 0 の塊」という形になる。
- 形の判定は「先頭の 1 の数 + 末尾の 0 の数 = 幅」のように、数の和で書ける。
- 新しい値を作る（符号反転など）より、ビットを数える方が安いことがある。
- 例外になる値（ここでは 0 以上）は、最初に除いておく。

