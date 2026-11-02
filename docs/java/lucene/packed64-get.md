---
title: "途中で 64 ビットの境界をまたぐ値を、2 つの long から組み立てる"
description: "Apache Lucene の Packed64.get。決まったビット数（bitsPerValue）の値を、long の配列に詰めて格納し、1 つの値を取り出す。境界をまたぐ場合は 2 つの long を連結して読む。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/packed/Packed64.java
lines: [71, 85]
function: "Packed64.get"
difficulty: 3
format: 2
tags: [データ構造, ビット演算, メモリ管理]
---

## ひとことで

`Packed64.get(index)` は、「1 つあたり `bitsPerValue` ビットの値」を、`long` の配列に詰めて保存したものから、`index` 番目の値を取り出します。たとえば 5 ビットの値なら、1 つの `long` に 12 個強を詰められます。

Lucene は、検索インデックスの中の大量の整数を、必要なビット数だけで保存して省メモリにしています。この関数は、その詰め込みを読み出す部分です。

## コード

::: code-group

```java:line-numbers=71 [日本語訳]
  public long get(final int index) {
    // ビット列の中で、この値の先頭ビットが何ビット目にあるか
    final long majorBitPos = (long) index * bitsPerValue;
    // バッキング配列の中の添字
    final int elementPos = (int) (majorBitPos >>> BLOCK_BITS);
    // 2 つ目の long に入るビット数
    final long endBits = (majorBitPos & MOD_MASK) + bpvMinusBlockSize;

    if (endBits <= 0) { // 1 つの block に収まる
      return (blocks[elementPos] >>> -endBits) & maskRight;
    }
    // 2 つの block にまたがる
    return ((blocks[elementPos] << endBits) | (blocks[elementPos + 1] >>> (BLOCK_SIZE - endBits)))
        & maskRight;
  }
```

```java:line-numbers=71 [原文]
  public long get(final int index) {
    // The abstract index in a bit stream
    final long majorBitPos = (long) index * bitsPerValue;
    // The index in the backing long-array
    final int elementPos = (int) (majorBitPos >>> BLOCK_BITS);
    // The number of value-bits in the second long
    final long endBits = (majorBitPos & MOD_MASK) + bpvMinusBlockSize;

    if (endBits <= 0) { // Single block
      return (blocks[elementPos] >>> -endBits) & maskRight;
    }
    // Two blocks
    return ((blocks[elementPos] << endBits) | (blocks[elementPos + 1] >>> (BLOCK_SIZE - endBits)))
        & maskRight;
  }
```

:::

このクラスでは、次の定数とマスクを使います。

```java:line-numbers=37
  static final int BLOCK_SIZE = 64; // 32 = int, 64 = long
  static final int BLOCK_BITS = 6; // The #bits representing BLOCK_SIZE
  static final int MOD_MASK = BLOCK_SIZE - 1; // x % BLOCK_SIZE
```

```java:line-numbers=62
    maskRight = ~0L << (BLOCK_SIZE - bitsPerValue) >>> (BLOCK_SIZE - bitsPerValue);
    bpvMinusBlockSize = bitsPerValue - BLOCK_SIZE;
```

## 前提知識

- **`bitsPerValue`**: 1 つの値に使うビット数です。値の最大値に合わせて決まります。たとえば最大が 7 なら 3 ビットで足ります。
- **ブロック（block）**: `long` の配列の 1 要素、64 ビットのまとまりです。値は、ブロックの境界をまたぐことがあります。
- **`>>>`（符号なし右シフト）と `<<`（左シフト）**: 目的のビットを取り出すため、右や左へずらします。
- **マスク `maskRight`**: 下位 `bitsPerValue` ビットだけを残すマスクです。取り出した値の余分な上位ビットを消します。
- **ビット位置の計算**: 値の先頭ビットの通し番号は `index * bitsPerValue` です。64 で割った商がブロックの番号、余りがブロック内の位置です。

## 何をしているか

### 1. 値の先頭ビットの位置を求める

```java:line-numbers=73
    final long majorBitPos = (long) index * bitsPerValue;
    // バッキング配列の中の添字
    final int elementPos = (int) (majorBitPos >>> BLOCK_BITS);
```

`majorBitPos` は、ビット列の中で、この値の先頭ビットの通し番号です。64 で割ると、それを含むブロックの番号が得られます。ビットシフトで 6 ビット右へずらしているのは、その 64 での割り算です。

### 2. 値がブロックのどこから始まるかを求める

```java:line-numbers=76
    // 2 つ目の long に入るビット数
    final long endBits = (majorBitPos & MOD_MASK) + bpvMinusBlockSize;
```

`endBits` は、ブロックの末尾で切れた後に、次のブロックへ続くビット数を表します。負なら、値は 1 つのブロックに収まっています。正なら、2 つのブロックにまたがっています。

### 3. 1 つのブロックに収まる場合

```java:line-numbers=79
    if (endBits <= 0) { // 1 つの block に収まる
      return (blocks[elementPos] >>> -endBits) & maskRight;
    }
```

値が 1 つのブロックの中にあるなら、`-endBits` ビットだけ右へずらして、下位の余分を消します。マスクで値だけを取り出して返します。

### 4. 2 つのブロックにまたがる場合

```java:line-numbers=82
    // 2 つの block にまたがる
    return ((blocks[elementPos] << endBits) | (blocks[elementPos + 1] >>> (BLOCK_SIZE - endBits)))
        & maskRight;
```

前のブロックの下位の部分を `endBits` だけ上へずらし、次のブロックの上位の部分を `64 - endBits` だけ下へずらします。2 つを `|` で組み合わせ、マスクで値の幅だけを残します。

## ここがすごい

- **割り算を使わない**: ブロックの番号も、位置も、シフトとマスクだけで求まります。ビット列の中の位置を、速く計算できます。
- **場合分けは 2 つだけ**: 値が 1 ブロックに収まるか、2 ブロックにまたがるか。その 2 つを `endBits` の符号で判定します。
- **シフト量を正に保つ**: 1 ブロックのとき、`-endBits` でシフト量を正にしています。Java のシフト量は 0 から 63 の範囲で使うので、符号を反転して正の量にします。
- **2 つの long をつなぐ**: 境界をまたぐ値も、2 つの long を組み合わせれば、1 回の計算で取り出せます。配列の中で値が途切れても、読み手は気にしなくて済みます。

## まとめ

- 値の先頭ビットの通し番号から、ブロックの番号と、ブロック内の位置を求める。
- 値が 1 つのブロックに収まるか、2 つにまたがるかを `endBits` の符号で判定する。
- シフトとマスクで値を取り出し、省メモリな詰め込みを速く読み出せる。
