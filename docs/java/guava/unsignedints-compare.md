---
title: "符号なし整数を符号付きの比較器に変えて比べる"
description: "符号なしの int 同士を比較する UnsignedInts.compare。両方の最上位ビットを反転してから既存の比較を呼ぶ、2 段の変換だけで完結する比較。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/primitives/UnsignedInts.java
lines: [70, 73]
function: "UnsignedInts.compare"
difficulty: 1
format: 2
tags: [ビット演算, 数値計算, 標準ライブラリ]
---

## ひとことで

`UnsignedInts.compare(a, b)` は、2 つの `int` を **符号なしの数** として大小を比べます。`a` が `b` より小さければ負、等しければ 0、大きければ正の値を返します。

実装は 1 行だけです。両方の値を `flip` で変換し、その結果を `Integer.compare` に渡します。`flip` の仕組みは前の記事で扱った通りです。

## コード

::: code-group

```java:line-numbers=70 [日本語訳]
  @SuppressWarnings("InlineMeInliner") // Integer.compare は GWT+J2CL では使えないため、このアノテーションで注意している
  public static int compare(int a, int b) {
    return Ints.compare(flip(a), flip(b));
  }
```

```java:line-numbers=70 [原文]
  @SuppressWarnings("InlineMeInliner") // Integer.compare unavailable under GWT+J2CL
  public static int compare(int a, int b) {
    return Ints.compare(flip(a), flip(b));
  }
```

:::

このメソッドが使う `flip` は、同じファイルで次のように定義されています。

```java:line-numbers=54
  static int flip(int value) {
    return value ^ Integer.MIN_VALUE;
  }
```

## 前提知識

- **`int a, int b`**: 2 つの 32 ビット整数を受け取る引数です。
- **`Integer.compare(x, y)`**: `x < y` なら負、等しければ 0、`x > y` なら正を返す、符号付きの比較です。
- **`@SuppressWarnings("InlineMeInliner")`**: コンパイラや静的解析ツールの警告を、この行だけ抑える注釈です。
- **`@Deprecated` ではない注意書き**: 元のコードには、Java 8 以降は `Integer.compareUnsigned` を使うべきという注記があります。

## 何をしているか

### 1. 両方を変換する

```java:line-numbers=72
    return Ints.compare(flip(a), flip(b));
```

`a` と `b` をそれぞれ `flip` で変換します。

### 2. 変換後の値で比べる

変換後の値は符号付きの順番で、元の符号なしの順番と一致しています。そのため、`Integer.compare` の結果は、そのまま符号なし比較の結果になります。

### 具体例

`a = -1`（符号なしでは `4294967295`）、`b = 1` で追います。

- `flip(-1) = 2147483647`
- `flip(1) = -2147483647`
- `Integer.compare(2147483647, -2147483647)` は正の値

正の値が返るので、`-1` の方が大きい、という正しい答えになりました。

## ここがすごい

- **変換と比較を分けて考える**: 符号なし比較のロジックを新たに書かず、「変換」と「既存の比較」に分けています。役割がはっきりして、読みやすい設計です。
- **同じ変換を 2 つの場所で使う**: `flip` は比較だけでなく、ほかのメソッドでも使われます。小さな関数を再利用する形になっています。
- **1 行の中の注意書き**: `@SuppressWarnings` の理由コメントに、GWT+J2CL で `Integer.compare` が使えないことが書かれています。環境ごとの制約をコードの近くに残す、良い習慣です。

## まとめ

- 符号なしの比較は、両方の最上位ビットを反転すれば符号付きの比較で代用できる。
- 変換と比較を分けると、それぞれの役割が読みやすくなる。
- 古い実装を残すときは、新しい代替（`Integer.compareUnsigned`）を注記しておくと親切。
