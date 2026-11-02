---
title: "1 つの int に入れた 2 つの 16 ビットの値を、分けたり戻したりする"
description: "Apache Lucene の ForUtil の expand16 と collapse16。16 ビット以下の値を 2 つずつ 1 つの int に詰めて扱い、必要なときに上下の 16 ビットを取り出す。ビットの詰め替えの定番の形。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/codecs/lucene104/ForUtil.java
lines: [68, 80]
function: "ForUtil.expand16"
difficulty: 2
format: 2
tags: [ビット演算, 入出力, 最適化]
---

## ひとことで

`expand16` と `collapse16` は、1 つの `int` に、16 ビットずつの 2 つの値を詰めたり、逆に分けたりします。Lucene は、検索インデックスに保存する整数の列を圧縮するときに、この形の詰め替えを使います。

値が 16 ビット以下なら、2 つを 1 つの `int` に入れて扱うことで、メモリと処理の回数を減らせます。

## コード

```java:line-numbers=68
  static void expand16(int[] arr) {
    for (int i = 0; i < 128; ++i) {
      int l = arr[i];
      arr[i] = (l >>> 16) & 0xFFFF;
      arr[128 + i] = l & 0xFFFF;
    }
  }

  static void collapse16(int[] arr) {
    for (int i = 0; i < 128; ++i) {
      arr[i] = (arr[i] << 16) | arr[128 + i];
    }
  }
```

## 前提知識

- **`int` は 32 ビット**: 上位 16 ビットと下位 16 ビットに分けると、それぞれ 0 から 65535 の値を入れられます。
- **`<<`（左シフト）**: ビットを上の位置へずらします。16 ビット左へずらすと、下位の値を上半分に移せます。
- **`>>>`（符号なし右シフト）**: 上位の値を下へ取り出すときに使います。左端には 0 が入るので、負の数でも上半分の値を正しく取り出せます。
- **`0xFFFF`**: 下位 16 ビットだけを残すマスクです。2 進数で 16 個の 1 が並んでいます。
- **`|`（OR）**: 上位と下位の値を、重ならない位置で 1 つにまとめます。

## 何をしているか

### 1. 2 つの値を 1 つの int にまとめる

```java:line-numbers=76
  static void collapse16(int[] arr) {
    for (int i = 0; i < 128; ++i) {
      arr[i] = (arr[i] << 16) | arr[128 + i];
    }
```

`collapse16` は、配列の前半 `arr[i]` を上位 16 ビットに、後半 `arr[128 + i]` を下位 16 ビットに詰めます。`arr[i] << 16` で前半を上へずらし、`| arr[128 + i]` で後半を下に入れます。前半のデータは 128 個のまとまりとして、そのまま使えます。

### 2. 上位の値を取り出す

```java:line-numbers=69
    for (int i = 0; i < 128; ++i) {
      int l = arr[i];
      arr[i] = (l >>> 16) & 0xFFFF;
```

`expand16` は、まず `(l >>> 16) & 0xFFFF` で上位 16 ビットを取り出し、`arr[i]` に入れます。`>>>` で上位を下へ移し、マスクで余分なビットを消します。

### 3. 下位の値を取り出す

```java:line-numbers=72
      arr[128 + i] = l & 0xFFFF;
    }
```

`l & 0xFFFF` で、下位 16 ビットをそのまま取り出し、後半の配列に入れます。上と下の値が、元どおりに 2 つの配列へ分かれます。

## ここがすごい

- **配列の形を変えずに詰める**: 256 個の値を、前半と後半の 128 個ずつに分けて、1 つの `int` 配列の中で 2 つ分を扱います。新しい配列を作らず、同じ配列を書き換えます。
- **シフトとマスクだけ**: 詰めるのも、取り出すのも、シフトと OR、マスクです。ループの中の処理が単純なので、速く動きます。
- **符号を気にしない**: 上位の取り出しに `>>>` を使うので、上位の値が大きくても、符号に影響されません。
- **対になった関数**: `collapse16` と `expand16` は、互いに逆の操作です。詰めて、分けて、もとに戻る性質を保っています。

## まとめ

- 16 ビット以下の値は、2 つずつ 1 つの `int` に詰められる。
- 上位は `>>>` とマスク、下位はマスクで取り出す。
- 詰める関数と分ける関数は対になっていて、往復すると元に戻る。
