---
title: 任意ビット幅の整数で、最上位の語の「余りビット」を必ず 0 にする
description: APInt は 64 ビットの語を並べて任意幅の整数を表します。70 ビットなら最後の語は 6 ビットしか使いません。clearUnusedBits はその余りを毎回 0 に掃除します。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/APInt.h
lines: [1997, 2017]
function: APInt::clearUnusedBits
difficulty: 2
format: 2
tags: [ビット演算, 数値計算, 防御的プログラミング]
---

## ひとことで

`APInt`（Arbitrary Precision Integer）は、LLVM がコンパイラ内部で使う **任意のビット幅の整数** です。`i7` や `i128` のような幅の整数を表せます。
中身は 64 ビットの語（word）の並びなので、たとえば 70 ビットの整数は 2 語（128 ビット）を使い、最後の語のうち 6 ビットだけが本物です。
`clearUnusedBits` は、**使っていない上位の余りビットを 0 にする** 掃除係です。

## コード

::: code-group

```cpp:line-numbers=1997 [日本語訳]
  /// 使っていない上位ビットを消す
  ///
  /// APInt が使っていない、最上位の語の上側 "N" ビットを消すための
  /// 内部用メソッド。最上位の語に値を代入したあと、
  /// それらのビットが 0 になっていることを保証するために
  /// 必要になる。
  APInt &clearUnusedBits() {
    // 最後の語で何ビット使っているかを計算する。
    unsigned WordBits = ((BitWidth - 1) % APINT_BITS_PER_WORD) + 1;

    // 上位ビットをマスクで消す。
    uint64_t mask = WORDTYPE_MAX >> (APINT_BITS_PER_WORD - WordBits);
    if (LLVM_UNLIKELY(BitWidth == 0))
      mask = 0;

    if (LLVM_LIKELY(isSingleWord()))
      U.VAL &= mask;
    else
      U.pVal[getNumWords() - 1] &= mask;
    return *this;
  }
```

```cpp:line-numbers=1997 [原文]
  /// Clear unused high order bits
  ///
  /// This method is used internally to clear the top "N" bits in the high order
  /// word that are not used by the APInt. This is needed after the most
  /// significant word is assigned a value to ensure that those bits are
  /// zero'd out.
  APInt &clearUnusedBits() {
    // Compute how many bits are used in the final word.
    unsigned WordBits = ((BitWidth - 1) % APINT_BITS_PER_WORD) + 1;

    // Mask out the high bits.
    uint64_t mask = WORDTYPE_MAX >> (APINT_BITS_PER_WORD - WordBits);
    if (LLVM_UNLIKELY(BitWidth == 0))
      mask = 0;

    if (LLVM_LIKELY(isSingleWord()))
      U.VAL &= mask;
    else
      U.pVal[getNumWords() - 1] &= mask;
    return *this;
  }
```

:::

## 前提知識

- **語（word）**: CPU が一度に扱う整数の単位です。ここでは 64 ビット（`APINT_BITS_PER_WORD` = 64）です。
- **共用体 `union`**: 同じメモリを複数の型で使い分けます。APInt は 64 ビット以下なら値を `U.VAL` に直接持ち、それより大きければ配列へのポインタ `U.pVal` を持ちます。
- **`WORDTYPE_MAX`**: 64 ビットすべてが 1 の値です。
- **`APInt &` を返す**: 自分自身への参照を返すので、`return clearUnusedBits();` のように続けて書けます。
- **`%`**: 割った余りです。
- **シフトの未定義動作**: C++ では、64 ビットの値を 64 ビット以上シフトすると未定義動作（何が起きても文句を言えない状態）になります。

## 何をしているか

### 1. 最後の語で使うビット数

```cpp:line-numbers=2005
    unsigned WordBits = ((BitWidth - 1) % APINT_BITS_PER_WORD) + 1;
```

`WordBits = ((BitWidth - 1) % 64) + 1` です。

- `BitWidth = 70`: `(69 % 64) + 1 = 6`
- `BitWidth = 64`: `(63 % 64) + 1 = 64`
- `BitWidth = 7`: `(6 % 64) + 1 = 7`

素直に `BitWidth % 64` と書くと、64 のときに 0 になってしまいます。「1 引いてから余りを取って 1 足す」ことで、ちょうど割り切れるときに 64 を返せます。

### 2. マスクを作る

```cpp:line-numbers=2008
    uint64_t mask = WORDTYPE_MAX >> (APINT_BITS_PER_WORD - WordBits);
```

`WORDTYPE_MAX >> (64 - WordBits)` で、下位 `WordBits` ビットだけが 1 のマスクを作ります。

- `WordBits = 6`: 58 ビット右へずらして `0b111111`
- `WordBits = 64`: 0 ビットずらして、全部 1

左シフトで `(1 << WordBits) - 1` と作ると、`WordBits = 64` で未定義動作になります。全部 1 の値を **右へ** ずらす方法なら、シフト量は 0〜63 に収まり安全です。

### 3. 幅 0 の特別扱い

```cpp:line-numbers=2009
    if (LLVM_UNLIKELY(BitWidth == 0))
      mask = 0;
```

`BitWidth = 0` だと `BitWidth - 1` が符号なしの巻き戻りで大きな数になり、計算上 `WordBits` は 64 になります。幅 0 なら値は 0 しかありえないので、マスクも 0 にします。

### 4. 最後の語にかける

```cpp:line-numbers=2012
    if (LLVM_LIKELY(isSingleWord()))
      U.VAL &= mask;
    else
      U.pVal[getNumWords() - 1] &= mask;
```

1 語に収まる幅なら `U.VAL` に、複数語なら配列の最後の語 `U.pVal[getNumWords() - 1]` にマスクを AND します。

## ここがすごい

- **不変条件を守る係を 1 か所に**: APInt には「余りビットは常に 0」という約束があります。これが守られていれば、比較は語ごとの `==` で済み、`popcount` なども余計な補正なしで数えられます。整数の代入、OR、左シフト、全ビット反転など、余りビットを汚しうる操作のあとでこの関数を呼ぶことで、約束を守っています。
- **未定義動作を避けるマスクの作り方**: 「全部 1 を右へずらす」方法は、幅がちょうど語の大きさのときにも安全な、定番のやり方です。
- **よく通る道に印**: `LLVM_LIKELY(isSingleWord())` で、64 ビット以下が普通の場合であることをコンパイラに伝えています。コンパイラが扱う整数のほとんどは 64 ビット以下だからです。

## まとめ

- 任意幅の整数を語の並びで表すと、最上位の語に「余りビット」が生まれる。
- 余りを常に 0 に保つ約束を作ると、比較や集計が単純になる。
- 「1 引いて余りを取り 1 足す」で、割り切れる場合に 0 ではなく最大値を得られる。
- 下位 n ビットのマスクは「全部 1 を右へずらす」と、n が語の幅でも安全に作れる。

