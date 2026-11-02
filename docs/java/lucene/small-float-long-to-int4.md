---
title: "大きな整数を、有効な 4 ビットと指数に丸める"
description: "Lucene の SmallFloat.longToInt4。値の上位 4 ビットだけを残し、下に切り捨てた桁数を指数として 3 ビット目より上に書く。大小の順序を保ったまま、小さな整数で表せる。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/SmallFloat.java
lines: [103, 122]
function: "SmallFloat.longToInt4"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 低レイヤ]
---

## ひとことで

Lucene は、文書の長さや重みのような値を、少ない領域に保存することがあります。大きな整数を、そのまま 32 ビットや 64 ビットで持つのは無駄なので、有効な桁だけを残す小さな形に丸めます。

`longToInt4` は、正の `long` を、有効な 4 ビットと、その桁数（指数）を組み合わせた小さな整数に変えます。浮動小数点数と同じ考え方で、値が大きいほど変換後の数も大きくなるように作られています。

## コード

::: code-group

```java:line-numbers=103 [日本語訳]
  public static int longToInt4(long i) {
    if (i < 0) {
      throw new IllegalArgumentException("Only supports positive values, got " + i);
    }
    int numBits = 64 - Long.numberOfLeadingZeros(i);
    if (numBits < 4) {
      // 値が 4 ビットに届かない小さな値（非正規化された値）
      return Math.toIntExact(i);
    } else {
      // 通常の値
      int shift = numBits - 4;
      // 上位 5 ビットだけを残す（コメントの数え方。実際に残るのは 4 ビット）
      int encoded = Math.toIntExact(i >>> shift);
      // 最上位のビットは暗黙の 1 なので、消す
      encoded &= 0x07;
      // 指数を書き込む。0 は非正規化の値に使うので、1 を足す
      encoded |= (shift + 1) << 3;
      return encoded;
    }
  }
```

```java:line-numbers=103 [原文]
  public static int longToInt4(long i) {
    if (i < 0) {
      throw new IllegalArgumentException("Only supports positive values, got " + i);
    }
    int numBits = 64 - Long.numberOfLeadingZeros(i);
    if (numBits < 4) {
      // subnormal value
      return Math.toIntExact(i);
    } else {
      // normal value
      int shift = numBits - 4;
      // only keep the 5 most significant bits
      int encoded = Math.toIntExact(i >>> shift);
      // clear the most significant bit, which is implicit
      encoded &= 0x07;
      // encode the shift, adding 1 because 0 is reserved for subnormal values
      encoded |= (shift + 1) << 3;
      return encoded;
    }
  }
```

:::

## 前提知識

- **有効桁**: 値の中で、意味のある上位の桁です。ここでは、上位 4 ビットだけを残します。
- **指数**: 切り捨てた桁数です。値の大きさを、桁数で表します。
- **非正規化（subnormal）の値**: 4 ビットに届かない小さな値です。指数を使わず、値をそのまま表します。
- **暗黙の 1**: 通常の値では、最上位のビットは常に 1 です。その 1 を保存せず、残りの 3 ビットだけを書きます。
- **`numberOfLeadingZeros`**: 最も上の 1 より上にある 0 の数です。`64 - この値` で、値のビットの長さが分かります。

## 何をしているか

### 1. 小さな値は、そのまま返す

```java:line-numbers=107
    int numBits = 64 - Long.numberOfLeadingZeros(i);
    if (numBits < 4) {
      // 値が 4 ビットに届かない小さな値（非正規化された値）
      return Math.toIntExact(i);
```

ビットの長さが 4 未満の値は、有効な桁だけで表せます。そのため、変換せずにそのままの値を返します。指数の欄は 0 のままなので、後で「小さな値」だと区別できます。

### 2. 大きな値は、上位 4 ビットと指数に分ける

```java:line-numbers=111
    } else {
      // 通常の値
      int shift = numBits - 4;
      // 上位 5 ビットだけを残す（コメントの数え方。実際に残るのは 4 ビット）
      int encoded = Math.toIntExact(i >>> shift);
      // 最上位のビットは暗黙の 1 なので、消す
      encoded &= 0x07;
      // 指数を書き込む。0 は非正規化の値に使うので、1 を足す
      encoded |= (shift + 1) << 3;
```

`shift = numBits - 4` で、下に切り捨てる桁数を決めます。`i >>> shift` は、上位 4 ビットだけを残します。その最上位のビットは必ず 1 なので、`encoded &= 0x07` で消して、下の 3 ビットだけを残します。

`(shift + 1) << 3` で、指数を 3 ビット目より上に書きます。指数に 1 を足しているのは、0 を小さな値の印として空けておくためです。

## ここがすごい

- **大小の順序が保たれる**: 指数が大きいほど、変換後の値も大きくなります。そのため、変換した値を比べても、元の大小関係が分かります。
- **有効な桁数が一定**: 値がどんなに大きくても、残るのは 4 ビットです。そのため、小さな領域で、大きさの幅を広く表せます。
- **小さな値は損失がない**: 4 ビットに届かない値は、指数なしでそのまま保存されるので、丸めの誤差が出ません。
- **コメントの数え方に注意**: `i >>> shift` の上にあるコメントは「上位 5 ビット」と書いていますが、実際に残るのは 4 ビットです。最上位の 1 は、続く行で消されます。コメントの数え方と、実際の動きに食い違いがあります。
- **復元は別のメソッドで**: 元に戻すのは、`int4ToLong` の役目です。このメソッドは丸めた値を、`(bits | 0x08) << shift` で、元の大きさに近い値へ戻します。

## まとめ

- `longToInt4` は、値の上位 4 ビットを残し、切り捨てた桁数を指数として書く。
- 最上位の 1 は暗黙の値として消し、指数は 1 を足して、小さな値の印と区別する。
- 値の大小関係は保たれるので、小さな整数の中で、比べたり並べたりできる。
