---
title: "64 ビットずつ読んで、次の 1 を探す"
description: "Apache Lucene の FixedBitSet.nextSetBitInRange。long の配列を 64 ビット単位で読み、Long.numberOfTrailingZeros で最初の 1 の位置を一度に求める。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/FixedBitSet.java
lines: [411, 432]
function: "FixedBitSet.nextSetBitInRange"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

`nextSetBitInRange(start, upperBound)` は、ビット集合の中で `start` 以上にあって最初に 1 になっているビットの位置を返します。ビット集合は、Lucene の検索で「どの文書が条件に合うか」を、1 ビットずつ表すために使われます。

ビットを 1 つずつ調べると遅くなるので、この関数は 64 ビットずつまとめて読みます。1 語（long）の中に 1 があるかどうかを、一度の判定で確かめられます。

## コード

::: code-group

```java:line-numbers=411 [日本語訳]
  private int nextSetBitInRange(int start, int upperBound) {
    // 余分な上位ビット（ゴーストビット）が 0 になっていることが前提
    assert start >= 0 && start < numBits : "index=" + start + ", numBits=" + numBits;
    assert start < upperBound : "index=" + start + ", upperBound=" + upperBound;
    assert upperBound <= numBits : "upperBound=" + upperBound + ", numBits=" + numBits;
    int i = start >> 6;
    long word = bits[i] >> start; // 開始位置より右にあるビットを捨てる

    if (word != 0) {
      return start + Long.numberOfTrailingZeros(word);
    }

    int limit = upperBound == numBits ? numWords : bits2words(upperBound);
    while (++i < limit) {
      word = bits[i];
      if (word != 0) {
        return (i << 6) + Long.numberOfTrailingZeros(word);
      }
    }

    return DocIdSetIterator.NO_MORE_DOCS;
  }
```

```java:line-numbers=411 [原文]
  private int nextSetBitInRange(int start, int upperBound) {
    // Depends on the ghost bits being clear!
    assert start >= 0 && start < numBits : "index=" + start + ", numBits=" + numBits;
    assert start < upperBound : "index=" + start + ", upperBound=" + upperBound;
    assert upperBound <= numBits : "upperBound=" + upperBound + ", numBits=" + numBits;
    int i = start >> 6;
    long word = bits[i] >> start; // skip all the bits to the right of index

    if (word != 0) {
      return start + Long.numberOfTrailingZeros(word);
    }

    int limit = upperBound == numBits ? numWords : bits2words(upperBound);
    while (++i < limit) {
      word = bits[i];
      if (word != 0) {
        return (i << 6) + Long.numberOfTrailingZeros(word);
      }
    }

    return DocIdSetIterator.NO_MORE_DOCS;
  }
```

:::

## 前提知識

- **ビット集合（BitSet）**: 0 か 1 のビットを、順番に並べて持つデータ構造です。ビットが立っている位置を、番号で表します。
- **語（ワード）**: `long` 1 つ分の 64 ビットのまとまりです。`bits[i]` は、ビットの 64i 番目から 64i + 63 番目までを表します。
- **`>>` と `>>>`**: ビットを右へずらす演算です。ここでは右へのずらし量として `start` を使い、Java が下位 6 ビット（語の中での位置）だけを使います。その結果、開始位置より前のビットが捨てられます。
- **`Long.numberOfTrailingZeros(x)`**: 最も下位にある 1 の位置まで、下から数えた 0 の個数を返します。その位置が、最初に 1 になっているビットです。
- **`DocIdSetIterator.NO_MORE_DOCS`**: もう候補が無いことを示す値です。Lucene の反復処理で、終わりを表すために使われます。

## 何をしているか

### 1. 開始位置の語を読む

```java:line-numbers=416
    int i = start >> 6;
    long word = bits[i] >> start; // 開始位置より右にあるビットを捨てる
```

`start >> 6` は、`start` が入っている語の番号です（64 で割ったものと同じ）。その語を、語の中での位置（`start` を 64 で割った余り）だけ右へずらすと、`start` より前のビットが捨てられ、最初の 1 が最も下位へ来ます。

### 2. 同じ語に 1 があればすぐ返す

```java:line-numbers=419
    if (word != 0) {
      return start + Long.numberOfTrailingZeros(word);
    }
```

語が 0 でなければ、その中の最も下位の 1 の位置を `numberOfTrailingZeros` で求めます。`start` を足せば、元の番号になります。

### 3. 後ろの語を順に調べる

```java:line-numbers=423
    int limit = upperBound == numBits ? numWords : bits2words(upperBound);
    while (++i < limit) {
      word = bits[i];
      if (word != 0) {
        return (i << 6) + Long.numberOfTrailingZeros(word);
      }
    }
```

同じ語に 1 が無ければ、次の語へ進みます。語の番号に 6 ビット分（64 倍）を掛け、同じく `numberOfTrailingZeros` で位置を求めます。`limit` は、上限 `upperBound` が含まれる語までに制限します。

### 4. 見つからなければ終わり

```java:line-numbers=431
    return DocIdSetIterator.NO_MORE_DOCS;
```

どの語にも 1 が無ければ、`NO_MORE_DOCS` を返します。呼び出し側は、この値で終わりを判断します。

## ここがすごい

- **64 ビットを一度に調べる**: 1 ビットずつ見ていくと、疎なビット集合では多くの判定が必要です。語単位で 0 かどうかを確かめるので、空の範囲はすばやく飛ばせます。
- **位置を計算で求める**: 最も下位の 1 の位置を、`numberOfTrailingZeros` の 1 命令で得ています。ビットを順番に数えるループがありません。
- **開始位置の処理が簡潔**: 最初の語だけは、シフトで `start` より前を捨てます。残りの語は全部が対象なので、そのまま使えます。
- **上限を語単位で切る**: `limit` を使い、上限を超えた語を読まないようにしています。範囲の末尾でも、余分な語を読まずに済みます。

## まとめ

- ビット集合の次の 1 は、64 ビットずつの語を読み、最下位の 1 の位置を一度に求めて見つける。
- 開始位置より前のビットはシフトで捨て、残りは語の番号から位置を計算する。
- 空の語を飛ばせるので、疎なビット集合でも速く走査できる。
