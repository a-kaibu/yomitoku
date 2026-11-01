---
title: 「最初の 0 を探す」を、語を反転して「最初の 1 を探す」に変える
description: BitVector::find_first_in は区間 [Begin, End) で最初に立っている（または立っていない）ビットを探します。両端の語はマスクで範囲外を消し、countr_zero で語の中の位置を一発で求めます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/BitVector.h
lines: [211, 244]
function: BitVector::find_first_in
difficulty: 2
format: 2
tags: [ビット演算, 探索, データ構造]
---

## ひとことで

`find_first_in(Begin, End, Set)` は、`BitVector`（ビットを詰めた配列）の区間 `[Begin, End)` で、**最初に 1 になっている（`Set = false` なら 0 になっている）ビットの番号** を返します。見つからなければ -1 です。
1 ビットずつではなく、64 ビットの語ごとにまとめて調べます。

## コード

::: code-group

```cpp:line-numbers=211 [日本語訳]
  /// \p Set に応じて、区間 [Begin, End) で最初に立っている／立っていないビットの
  /// 添字を返す。区間のビットがすべて立っていない／立っているなら -1 を返す。
  int find_first_in(unsigned Begin, unsigned End, bool Set = true) const {
    assert(Begin <= End && End <= Size);
    if (Begin == End)
      return -1;

    unsigned FirstWord = Begin / BITWORD_SIZE;
    unsigned LastWord = (End - 1) / BITWORD_SIZE;

    // 続く語を調べる。
    // 下のコードは、最初の「立っている」ビットを探す前提で書かれている。
    // 最初の「立っていない」ビットを探すときは、各語を使う前に
    // ビットを反転し、同じ方法を
    // 適用するだけでよい。
    for (unsigned i = FirstWord; i <= LastWord; ++i) {
      BitWord Copy = Bits[i];
      if (!Set)
        Copy = ~Copy;

      if (i == FirstWord) {
        unsigned FirstBit = Begin % BITWORD_SIZE;
        Copy &= maskTrailingZeros<BitWord>(FirstBit);
      }

      if (i == LastWord) {
        unsigned LastBit = (End - 1) % BITWORD_SIZE;
        Copy &= maskTrailingOnes<BitWord>(LastBit + 1);
      }
      if (Copy != 0)
        return i * BITWORD_SIZE + llvm::countr_zero(Copy);
    }
    return -1;
  }
```

```cpp:line-numbers=211 [原文]
  /// Returns the index of the first set/unset bit, depending on \p Set, in
  /// the range [Begin, End). Returns -1 if all bits in the range are unset/set.
  int find_first_in(unsigned Begin, unsigned End, bool Set = true) const {
    assert(Begin <= End && End <= Size);
    if (Begin == End)
      return -1;

    unsigned FirstWord = Begin / BITWORD_SIZE;
    unsigned LastWord = (End - 1) / BITWORD_SIZE;

    // Check subsequent words.
    // The code below is based on search for the first _set_ bit. If
    // we're searching for the first _unset_, we just take the
    // complement of each word before we use it and apply
    // the same method.
    for (unsigned i = FirstWord; i <= LastWord; ++i) {
      BitWord Copy = Bits[i];
      if (!Set)
        Copy = ~Copy;

      if (i == FirstWord) {
        unsigned FirstBit = Begin % BITWORD_SIZE;
        Copy &= maskTrailingZeros<BitWord>(FirstBit);
      }

      if (i == LastWord) {
        unsigned LastBit = (End - 1) % BITWORD_SIZE;
        Copy &= maskTrailingOnes<BitWord>(LastBit + 1);
      }
      if (Copy != 0)
        return i * BITWORD_SIZE + llvm::countr_zero(Copy);
    }
    return -1;
  }
```

:::

## 前提知識

- **語（BitWord）**: 64 ビット環境では 64 ビットの整数です。ビット番号 `n` は `n / 64` 番目の語の `n % 64` 番目のビットにあります。
- **`~x`**: 全ビットを反転します。
- **`maskTrailingZeros<T>(n)`**: 下位 `n` ビットが 0、それより上が 1 のマスクです。
- **`maskTrailingOnes<T>(n)`**: 下位 `n` ビットが 1、それより上が 0 のマスクです。
- **`llvm::countr_zero(x)`**: 下位から 0 が何個続くか、つまり最も下にある 1 の位置を返します。CPU の専用命令になることが多いです。
- **`bool Set = true`**: 省略すると `true` になる引数（デフォルト引数）です。
- **`const` メンバ関数**: 名前の後ろの `const` は、中身を変更しないという約束です。

## 何をしているか

### 1. 語の範囲を決める

```cpp:line-numbers=218
    unsigned FirstWord = Begin / BITWORD_SIZE;
    unsigned LastWord = (End - 1) / BITWORD_SIZE;
```

`Begin` と `End - 1` がそれぞれ何番目の語にあるかを求めます。`End` は含まないので `End - 1` を使います。

例: `find_first_in(70, 140)` なら、`FirstWord = 1`、`LastWord = 2` です。

### 2. 0 を探すなら反転

```cpp:line-numbers=227
      BitWord Copy = Bits[i];
      if (!Set)
        Copy = ~Copy;
```

語をコピーして、`Set` が偽なら反転します。こうすると「最初の 0」は「最初の 1」に変わり、以下の処理を共通にできます。

### 3. 範囲の外を消す

```cpp:line-numbers=231
      if (i == FirstWord) {
        unsigned FirstBit = Begin % BITWORD_SIZE;
        Copy &= maskTrailingZeros<BitWord>(FirstBit);
      }

      if (i == LastWord) {
        unsigned LastBit = (End - 1) % BITWORD_SIZE;
        Copy &= maskTrailingOnes<BitWord>(LastBit + 1);
      }
```

- 最初の語では、`Begin % 64 = 6` より下のビットは範囲外です。`maskTrailingZeros(6)` を AND して消します。
- 最後の語では、`(End - 1) % 64 = 11` より上は範囲外です。`maskTrailingOnes(12)` を AND して、ビット 0〜11 だけ残します。

`FirstWord == LastWord` のときは、両方のマスクが同じ語にかかります。

### 4. 1 があれば位置を計算

```cpp:line-numbers=240
      if (Copy != 0)
        return i * BITWORD_SIZE + llvm::countr_zero(Copy);
```

マスク後の語が 0 でなければ、`countr_zero` で語の中の最初の 1 の位置がわかります。`i * 64 + 位置` が答えです。
0 なら次の語へ進みます。

例: 語 1 のマスク後が `...0100 0000`（ビット 6）なら、答えは `1 * 64 + 6 = 70` です。

## ここがすごい

- **反転で処理を共通化**: 「1 を探す」と「0 を探す」で別々のループを書かず、語を反転するだけで同じコードを使っています。`find_first_unset_in`はこれを `Set = false` で呼ぶだけです。
- **語単位 + 専用命令**: 空の語は比較 1 回で飛ばせます。見つかった語の中の位置も `countr_zero` で一発です。1 ビットずつ調べる素直な実装と比べて、ループ回数が大きく減ります。
- **範囲外はマスクで消す**: 端の語の範囲外ビットを、分岐ではなく AND で消すので、ループの中の処理が単純です。
- **元のデータを壊さない**: `Copy` にコピーしてから反転・マスクするので、`const` 関数のまま実装できています。

## まとめ

- 「0 を探す」は、反転すれば「1 を探す」と同じ処理にできる。
- 区間の端は、マスクの AND で範囲外を消してから調べる。
- 語の中で最初の 1 の位置は、countr_zero（末尾の 0 の数）で求まる。
- 語ごとの判定にすると、何もない区間を高速に飛ばせる。

