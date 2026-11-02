---
title: "浮動小数点数のビットを、整数の大小順に並べ替える"
description: "Apache Lucene の NumericUtils.sortableFloatBits。float のビット列を、符号付き int として比べたときに数値の大小と同じ順になるよう変換する。同じ式で元に戻せる。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/NumericUtils.java
lines: [89, 91]
function: "NumericUtils.sortableFloatBits"
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, ソート]
---

## ひとことで

`sortableFloatBits` は、`float` のビット列を、別の形に変換するメソッドです。変換後の `int` は、普通の整数として大小を比べると、元の `float` の大小と同じ順になります。

検索エンジンの Lucene は、数値を索引に並べるときに、この変換を使います。整数の比較だけで範囲検索や並べ替えができるので、浮動小数点数の比較の仕組みを特別に扱う必要がなくなります。

## コード

```java:line-numbers=89
  public static int sortableFloatBits(int bits) {
    return bits ^ (bits >> 31) & 0x7fffffff;
  }
```

## 前提知識

- **IEEE 754 の形式**: `float` は、符号ビット 1 つ、指数 8 ビット、仮数 23 ビットで作られています。符号ビットが 1 なら負の数です。
- **符号付き `int` の比較**: Java の `int` は、最上位ビットが 1 のとき負の数として比べられます。
- **`Float.floatToIntBits`**: `float` のビット列を `int` として取り出すメソッドです。NaN は、1 つの値にまとめられます。
- **`>>` と `&`**: `bits >> 31` は、符号ビットを全部のビットに広げた値（正なら 0、負なら -1）を作ります。`& 0x7fffffff` は、符号ビット以外のビットを取り出します。

## 何をしているか

### 1. 変換の式

```java:line-numbers=89
  public static int sortableFloatBits(int bits) {
    return bits ^ (bits >> 31) & 0x7fffffff;
  }
```

`bits >> 31` は、負の数なら全部 1、正の数なら全部 0 になります。`& 0x7fffffff` で、負の数のときだけ、符号ビット以外の 31 ビットが 1 になります。その値と `bits` を `^`（排他的論理和）で合わせると、負の数のときだけ、符号以外のビットが反転します。

### 2. 正の数はそのまま

正の数では、`bits >> 31` が 0 になるので、マスクも 0 です。`bits ^ 0` は `bits` と同じなので、値は変わりません。大きい数ほど、ビット列の値も大きくなるので、整数の比較と同じ順になります。

### 3. 負の数は、順序を逆にする

負の数では、ビット列の値は大きいほど、数としては小さくなります。たとえば `-2.0` のビットは `-1.0` のビットより大きい値になってしまいます。符号以外のビットを反転すると、この逆転が直り、`-2.0` が `-1.0` より小さい値になります。

### 4. 元に戻す

```java:line-numbers=70
  public static int floatToSortableInt(float value) {
    return sortableFloatBits(Float.floatToIntBits(value));
  }
```

`floatToSortableInt` は、この変換を `float` のビットに対して使います。逆方向の変換も、同じ式です。符号ビットは変えないので、2 回使うと元の値に戻ります。

## ここがすごい

- **分岐のない変換**: `if` で正負を調べず、シフト、マスク、`^` だけで変換しています。
- **整数の比較で範囲を扱える**: 変換後の値を比べるだけで、浮動小数点数の範囲検索ができます。索引の仕組みを、整数と同じように作れます。
- **同じ式で戻せる**: 符号ビットを残すので、変換を 2 回かけると元に戻ります。保存と読み出しで、同じメソッドを使えます。
- **0 と -0 の扱い**: `-0.0` は、変換後に `0` より小さい値になります。区別したくない場合は、それを考慮して使う必要があります。

## まとめ

- `sortableFloatBits` は、負の数の符号以外のビットを反転して、整数の大小と浮動小数点数の大小を一致させる。
- 正の数は変わらず、負の数は順序が逆になるので、その逆転を直す。
- 同じ式で元に戻せるので、保存と読み出しの両方に使える。
