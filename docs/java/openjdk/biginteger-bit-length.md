---
title: "負の大きな整数のビット長で、2 の累乗だけ 1 小さくなる理由"
description: "Java 標準の BigInteger.bitLength()。負の数は符号を除いたビット数で数えるため、絶対値がちょうど 2 の累乗のときだけ、絶対値のビット長より 1 小さくなる。その判定を、2 つのビット演算で行う。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1996, 2025, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/math/BigInteger.java
lines: [3940, 3946]
function: "BigInteger.bitLength"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 低レイヤ]
---

## ひとことで

`BigInteger.bitLength()` は、その数を 2 の補数で表したとき、符号ビットと違うビットが何個あるかを返すメソッドです。正の数では、2 進数で表したときの桁数とほぼ同じです。たとえば `5` は `101` なので、3 を返します。

負の数では、少し特別な扱いが必要です。`-8` は、2 の補数で表すと `...11111000` で、符号ビットと違う部分は下の 3 ビットです。一方、絶対値の `8`（`1000`）は 4 ビットです。このように、絶対値が 2 の累乗のときだけ、結果が 1 小さくなります。

## コード

::: code-group

```java:line-numbers=3940 [日本語訳]
    public int bitLength() {
        return signum < 0
                // 絶対値が 2 の累乗かどうかを調べる
                && Integer.lowestOneBit(mag[0]) == mag[0]
                && numberOfTrailingZeroInts() == mag.length - 1
            ? magBitLength() - 1 : magBitLength();
    }
```

```java:line-numbers=3940 [原文]
    public int bitLength() {
        return signum < 0
                // Check if magnitude is a power of two
                && Integer.lowestOneBit(mag[0]) == mag[0]
                && numberOfTrailingZeroInts() == mag.length - 1
            ? magBitLength() - 1 : magBitLength();
    }
```

:::

## 前提知識

- **2 の補数**: 負の数を、ビットの列で表す方法です。Java の整数は、この形式で保存されます。
- **符号ビット**: 最上位のビットです。正なら 0、負なら 1 です。`bitLength` は、この符号と違うビットだけを数えます。
- **マグニチュード（`mag`）**: `BigInteger` の絶対値を、`int` の配列で持つ部分です。配列の先頭 `mag[0]` が、最上位の `int` です。
- **`Integer.lowestOneBit(x)`**: `x` の中で最も下にある 1 のビットだけを残した値です。`x` がちょうど 2 の累乗なら、結果は `x` と同じになります。
- **`magBitLength()`**: 絶対値のビット長を返す内部のメソッドです。

## 何をしているか

### 1. 負の数で、絶対値が 2 の累乗かを調べる

```java:line-numbers=3941
        return signum < 0
                // 絶対値が 2 の累乗かどうかを調べる
                && Integer.lowestOneBit(mag[0]) == mag[0]
                && numberOfTrailingZeroInts() == mag.length - 1
```

まず、符号が負（`signum < 0`）かを調べます。そのうえで、最上位の `int` である `mag[0]` が、ちょうど 2 の累乗であることを確かめます。`Integer.lowestOneBit(mag[0]) == mag[0]` は、その判定です。さらに `numberOfTrailingZeroInts() == mag.length - 1` で、ほかの下位の `int` が全部 0 であることを確かめます。この 2 つが満たされれば、絶対値は、1 つのビットだけが立った 2 の累乗です。

### 2. 該当するときだけ 1 小さくする

```java:line-numbers=3945
            ? magBitLength() - 1 : magBitLength();
```

条件が満たされれば、絶対値のビット長から 1 を引きます。そうでなければ、絶対値のビット長をそのまま返します。

## ここがすごい

- **2 の補数の性質を、そのまま使う**: `-8` の 2 の補数は `...11111000` で、符号と違う部分は `8` の `1000` より 1 ビット少ないです。この差を、条件分岐 1 つにまとめています。
- **判定がビット演算だけ**: 2 の累乗かどうかを、`lowestOneBit` の比較で判定します。割り算や対数の計算を使いません。
- **大きな数でも同じ式**: `mag` は配列なので、数が何万ビットあっても、判定は最上位の `int` と、下位の `int` が 0 かどうかだけで済みます。
- **コメントで意図を明示**: 判定の上に、「絶対値が 2 の累乗かを調べる」という説明が付いています。どの条件が何を意味するかが、読み手に分かるようになっています。

## まとめ

- `bitLength` は、負の数では符号を除いたビット数で数えるので、絶対値が 2 の累乗のときだけ 1 小さくなる。
- この判定は、最上位の `int` が 2 の累乗で、下位の `int` が全部 0 かどうかを、ビット演算で確かめる。
- 該当するときだけ、絶対値のビット長から 1 を引いて返す。
