---
title: ビット列の区間 [I, E) を、両端だけマスクで中は語ごとに埋める
description: BitVector::set(I, E) は範囲のビットを 1 にします。1 ビットずつではなく、端の語はマスクの OR、間の語は全ビット 1 の代入でまとめて処理します。同じ語に収まる場合は引き算でマスクを作ります。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/BitVector.h
lines: [379, 406]
function: BitVector::set(unsigned, unsigned)
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

`BitVector` は、たくさんの真偽値を 1 ビットずつ詰めて持つ配列です。`set(I, E)` は、**I 番目から E 番目の手前まで（[I, E)）のビットをすべて 1 にします**。
例: `set(3, 7)` でビット 3, 4, 5, 6 が 1 になります。1 ビットずつ立てるのではなく、64 ビットの語をまとめて書き換えるので速く動きます。

## コード

::: code-group

```cpp:line-numbers=379 [日本語訳]
  /// [I, E) の範囲のビットを効率よく立てる
  BitVector &set(unsigned I, unsigned E) {
    assert(I <= E && "Attempted to set backwards range!");
    assert(E <= size() && "Attempted to set out-of-bounds range!");

    if (I == E) return *this;

    if (I / BITWORD_SIZE == E / BITWORD_SIZE) {
      BitWord EMask = BitWord(1) << (E % BITWORD_SIZE);
      BitWord IMask = BitWord(1) << (I % BITWORD_SIZE);
      BitWord Mask = EMask - IMask;
      Bits[I / BITWORD_SIZE] |= Mask;
      return *this;
    }

    BitWord PrefixMask = ~BitWord(0) << (I % BITWORD_SIZE);
    Bits[I / BITWORD_SIZE] |= PrefixMask;
    I = alignTo(I, BITWORD_SIZE);

    for (; I + BITWORD_SIZE <= E; I += BITWORD_SIZE)
      Bits[I / BITWORD_SIZE] = ~BitWord(0);

    BitWord PostfixMask = (BitWord(1) << (E % BITWORD_SIZE)) - 1;
    if (I < E)
      Bits[I / BITWORD_SIZE] |= PostfixMask;

    return *this;
  }
```

```cpp:line-numbers=379 [原文]
  /// Efficiently set a range of bits in [I, E)
  BitVector &set(unsigned I, unsigned E) {
    assert(I <= E && "Attempted to set backwards range!");
    assert(E <= size() && "Attempted to set out-of-bounds range!");

    if (I == E) return *this;

    if (I / BITWORD_SIZE == E / BITWORD_SIZE) {
      BitWord EMask = BitWord(1) << (E % BITWORD_SIZE);
      BitWord IMask = BitWord(1) << (I % BITWORD_SIZE);
      BitWord Mask = EMask - IMask;
      Bits[I / BITWORD_SIZE] |= Mask;
      return *this;
    }

    BitWord PrefixMask = ~BitWord(0) << (I % BITWORD_SIZE);
    Bits[I / BITWORD_SIZE] |= PrefixMask;
    I = alignTo(I, BITWORD_SIZE);

    for (; I + BITWORD_SIZE <= E; I += BITWORD_SIZE)
      Bits[I / BITWORD_SIZE] = ~BitWord(0);

    BitWord PostfixMask = (BitWord(1) << (E % BITWORD_SIZE)) - 1;
    if (I < E)
      Bits[I / BITWORD_SIZE] |= PostfixMask;

    return *this;
  }
```

:::

## 前提知識

- **語（BitWord）**: ビットを入れる単位です。`uintptr_t` なので、64 ビット環境では 64 ビットです。`BITWORD_SIZE` はその大きさです。
- **`Bits[i]`**: 語の配列です。ビット番号 `n` は、`n / BITWORD_SIZE` 番目の語の `n % BITWORD_SIZE` 番目のビットにあります。
- **半開区間 `[I, E)`**: `I` は含み、`E` は含まない範囲の書き方です。長さが `E - I` になり扱いやすいです。
- **`BitVector &` を返す**: 自分自身を返すので、`bv.set(0, 3).set(10, 12)` のようにつなげて書けます。
- **`alignTo(I, n)`**: `I` を `n` の倍数に切り上げます。
- **`~BitWord(0)`**: すべてのビットが 1 の語です。

## 何をしているか

### 1. 空の範囲なら何もしない

```cpp:line-numbers=384
    if (I == E) return *this;
```

### 2. 1 つの語に収まる場合

```cpp:line-numbers=386
    if (I / BITWORD_SIZE == E / BITWORD_SIZE) {
      BitWord EMask = BitWord(1) << (E % BITWORD_SIZE);
      BitWord IMask = BitWord(1) << (I % BITWORD_SIZE);
      BitWord Mask = EMask - IMask;
      Bits[I / BITWORD_SIZE] |= Mask;
      return *this;
    }
```

`I` と `E` が同じ語にあるなら、マスクを 1 つ作って OR するだけです。マスクは引き算で作ります。

`set(3, 7)` の場合:
```
EMask = 1 << 7 = 1000 0000
IMask = 1 << 3 = 0000 1000
Mask  = EMask - IMask = 0111 1000   ← ビット 3〜6 が 1
```

`2^7 - 2^3` は「ビット 3 からビット 6 までの 1 の並び」になります。シフト 2 回と引き算 1 回で、任意の区間のマスクが作れます。

### 3. 複数の語にまたがる場合

```cpp:line-numbers=394
    BitWord PrefixMask = ~BitWord(0) << (I % BITWORD_SIZE);
    Bits[I / BITWORD_SIZE] |= PrefixMask;
    I = alignTo(I, BITWORD_SIZE);

    for (; I + BITWORD_SIZE <= E; I += BITWORD_SIZE)
      Bits[I / BITWORD_SIZE] = ~BitWord(0);

    BitWord PostfixMask = (BitWord(1) << (E % BITWORD_SIZE)) - 1;
    if (I < E)
      Bits[I / BITWORD_SIZE] |= PostfixMask;
```

64 ビット語で `set(60, 200)` を例にします。

1. **先頭の語**: `~0 << (60 % 64)` で、ビット 60 から語の終わりまでを 1 にするマスクを OR します。その後 `I` を 64 に切り上げます。
2. **間の語**: `I = 64, 128` の語は丸ごと範囲に入るので、`~0` を代入します。OR すら不要です。`I = 192` では `192 + 64 > 200` なのでループを抜けます。
3. **末尾の語**: `(1 << (200 % 64)) - 1`、つまり下位 8 ビットのマスクを、192 番から始まる語に OR します。

### 4. 末尾の `if (I < E)` の意味

```cpp:line-numbers=401
    BitWord PostfixMask = (BitWord(1) << (E % BITWORD_SIZE)) - 1;
    if (I < E)
      Bits[I / BITWORD_SIZE] |= PostfixMask;
```

`E` がちょうど語の境目（たとえば 192）だと、ループのあと `I == E` になり、末尾の語はありません。このとき `Bits[E / 64]` は配列の外かもしれないので、触らずに終えます。

## ここがすごい

- **語単位で処理**: 1 ビットずつなら 140 回のループですが、この方法なら先頭・中間 2 語・末尾の 4 回の書き込みで済みます。
- **引き算でマスク**: 同じ語の中の区間マスクを `(1 << E) - (1 << I)` で作るのは、ビット演算の定番の技です。ループも分岐もいりません。
- **境界の安全**: 1 つの語に収まる場合、`E % 64` が 0 になることはない（`I < E` で同じ語なので）ため、`1 << 64` のような未定義動作は起きません。複数語の場合も、末尾が語の境目なら書き込みを省いて範囲外アクセスを避けています。
- **assert で前提を明示**: 先頭の `assert` で、逆向きの範囲や範囲外を開発中に検出します。

## まとめ

- 区間の処理は「端は部分マスク、間は丸ごと」に分けると速い。
- `(1 << E) - (1 << I)` で、ビット I〜E-1 の連続した 1 が作れる。
- 半開区間 `[I, E)` を使うと、長さや境目の計算が素直になる。
- 末尾がちょうど境目の場合の範囲外アクセスに気をつける。

