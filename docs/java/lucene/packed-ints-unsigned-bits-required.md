---
title: "値を表すのに必要な最小のビット数を、先頭の 0 を数えて求める"
description: "Apache Lucene の PackedInts.unsignedBitsRequired。値の先頭にある 0 のビット数を数えて、必要なビット数を求める。0 のときも 1 ビットとして扱う。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/packed/PackedInts.java
lines: [791, 793]
function: "PackedInts.unsignedBitsRequired"
difficulty: 1
format: 2
tags: [ビット演算, 数値計算, 低レイヤ]
---

## ひとことで

Lucene は、整数の列を、必要な分だけのビットに詰めて保存します。たとえば、0 から 7 までしか入らない値なら、3 ビットで足ります。

`unsignedBitsRequired` は、その値を表すのに必要な最小のビット数を返すメソッドです。値を 2 進数で書いたとき、先頭の 0 を除いた桁数を求めます。

## コード

```java:line-numbers=791
  public static int unsignedBitsRequired(long bits) {
    return Math.max(1, 64 - Long.numberOfLeadingZeros(bits));
  }
```

## 前提知識

- **ビット数**: 2 進数で値を書いたときの桁数です。`5`（2 進数で `101`）は 3 ビットです。
- **先頭の 0**: 2 進数の一番上の位から、1 が現れるまでの 0 です。`Long.numberOfLeadingZeros` は、この 0 の個数を数えます。
- **符号なし（unsigned）**: 符号を考えず、ビットの並びをそのまま値として扱うことです。この関数の名前にある `unsigned` は、負の数も、ビットの並びとして数えることを表します。

## 何をしているか

### 1. 先頭の 0 の数を数える

```java:line-numbers=792
    return Math.max(1, 64 - Long.numberOfLeadingZeros(bits));
```

`Long.numberOfLeadingZeros(bits)` は、`bits` の先頭にある 0 の個数です。`64 - その数` が、1 が現れる位置までの桁数、つまり必要なビット数になります。

### 2. 最低 1 ビットにする

```java:line-numbers=792
    return Math.max(1, 64 - Long.numberOfLeadingZeros(bits));
```

値が 0 のときは、先頭の 0 が 64 個になり、`64 - 64 = 0` になります。しかし、0 を表すのにも 1 ビットは使うので、`Math.max(1, ...)` で下限を 1 にしています。

## ここがすごい

- **比較を使わずに数える**: 値を 2 で割り続けたり、大きさを比べたりせずに、1 回の命令でビット数が求まります。
- **負の数も扱える**: `-1` は 64 ビットのすべてが 1 なので、`64` が返ります。符号ビットも、ビットの並びとして数えます。
- **0 の特別扱いが 1 行に収まる**: `Math.max(1, ...)` で、0 を 1 ビットとして数えられます。
- **詰め込み保存の基礎**: 必要なビット数が決まれば、その幅で値を並べられます。この関数は、Lucene の詰め込み保存の幅を決める入り口になっています。

## まとめ

- `unsignedBitsRequired` は、先頭の 0 の数から、必要なビット数を求める。
- `64 - 先頭の 0 の数` が必要なビット数で、0 のときは 1 にそろえる。
- 負の数は、ビットの並びとして 64 ビットと数えられる。
