---
title: "0 のビットの次の位置を、語ごとに反転させて探す"
description: "Java 標準の BitSet.nextClearBit。ビットの並びを 64 ビットずつ見て、反転した語の下位の 0 の数を数え、次の 0 の位置を求める。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1995, 2024, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/BitSet.java
lines: [745, 766]
function: "BitSet.nextClearBit"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 探索]
---

## ひとことで

`BitSet` は、ビットの並びを `long` の配列（語）に詰めて持つ集合です。`nextClearBit(i)` は、位置 `i` 以上で最初に 0 のビットの位置を返します。

「1 の次」を探す `nextSetBit` の逆版です。同じ仕組みを、ビットを反転して使うと実現できます。

## コード

::: code-group

```java:line-numbers=745 [日本語訳]
    public int nextClearBit(int fromIndex) {
        //         // 仕様も実装も、最大の長さのビットセットを扱えない。
        //         // 4816253 を参照。
        if (fromIndex < 0)
            throw new IndexOutOfBoundsException("fromIndex < 0: " + fromIndex);

        checkInvariants();

        int u = wordIndex(fromIndex);
        if (u >= wordsInUse)
            return fromIndex;

        long word = ~words[u] & (WORD_MASK << fromIndex);

        while (true) {
            if (word != 0)
                return (u * BITS_PER_WORD) + Long.numberOfTrailingZeros(word);
            if (++u == wordsInUse)
                return wordsInUse * BITS_PER_WORD;
            word = ~words[u];
        }
    }
```

```java:line-numbers=745 [原文]
    public int nextClearBit(int fromIndex) {
        // Neither spec nor implementation handle bitsets of maximal length.
        // See 4816253.
        if (fromIndex < 0)
            throw new IndexOutOfBoundsException("fromIndex < 0: " + fromIndex);

        checkInvariants();

        int u = wordIndex(fromIndex);
        if (u >= wordsInUse)
            return fromIndex;

        long word = ~words[u] & (WORD_MASK << fromIndex);

        while (true) {
            if (word != 0)
                return (u * BITS_PER_WORD) + Long.numberOfTrailingZeros(word);
            if (++u == wordsInUse)
                return wordsInUse * BITS_PER_WORD;
            word = ~words[u];
        }
    }
```

:::

## 前提知識

- **語（word）**: `long` 1 つで、64 ビットを表します。`BitSet` は、この語を並べて持ちます。
- **`~`（ビットの反転）**: 0 を 1 に、1 を 0 に変えます。0 を探すのは、反転した値で 1 を探すのと同じです。
- **`Long.numberOfTrailingZeros`**: 最も下の 1 までの 0 の個数です。反転後の語で最初に 1 になる位置が、最初の 0 のビットの位置になります。
- **`WORD_MASK << fromIndex`**: 語の中で、`fromIndex` より下のビットを 0 にするマスクです。探し始める位置より前を無視します。

## 何をしているか

### 1. 最初の語で、探し始める位置から探す

```java:line-numbers=753
        int u = wordIndex(fromIndex);
        if (u >= wordsInUse)
            return fromIndex;

        long word = ~words[u] & (WORD_MASK << fromIndex);

```

`wordIndex(fromIndex)` は、`fromIndex` の入っている語の番号です。その語を反転し、`fromIndex` より下のビットを `WORD_MASK << fromIndex` で無視します。`u` が使っている語の数以上なら、その先はすべて 0 なので、`fromIndex` をそのまま返します。

### 2. 0 が見つかるまで、語を進める

```java:line-numbers=759
        while (true) {
            if (word != 0)
                return (u * BITS_PER_WORD) + Long.numberOfTrailingZeros(word);
            if (++u == wordsInUse)
                return wordsInUse * BITS_PER_WORD;
            word = ~words[u];
        }
```

`word != 0` なら、その中の最も下の 1（反転前の 0）の位置を返します。見つからなければ次の語へ進み、その語を反転して同じ確認を続けます。使っている語をすべて見ても 0 がなければ、使用中のビット数の先頭を返します。

## ここがすごい

- **語ごとに 64 ビットを一度に見る**: 1 ビットずつ調べず、語の単位で `!= 0` を判定します。
- **反転で探索を同じ形にする**: `nextSetBit` と同じ構造で、語を反転するだけで 0 を探せます。
- **範囲を超えたら、すぐ返す**: 使っている語の先は、すべて 0 とみなせるので、探索を止めて位置を返せます。
- **1 回の数え上げで位置を求める**: `numberOfTrailingZeros` が、語の中の位置を 1 命令で返します。

## まとめ

- `nextClearBit` は、語を反転して、`fromIndex` 以上の語を順に見る。
- 反転後に 0 でない語が見つかれば、その最も下の 1 の位置が、最初の 0 のビットになる。
- 使っている語を超えた先は、すべて 0 とみなして、その位置を返す。
