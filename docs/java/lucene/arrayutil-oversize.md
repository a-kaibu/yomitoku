---
title: "配列を 8 分の 1 ずつ増やし、メモリの境界に合わせて切り上げる"
description: "Lucene の ArrayUtil.oversize。配列を広げるときの新しい大きさを決める。1/8 ずつ指数的に増やして、コピーの回数とメモリの無駄の両方を抑え、JVM のヘッダの大きさに合わせて切り上げる。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/ArrayUtil.java
lines: [133, 205]
function: "ArrayUtil.oversize"
difficulty: 3
format: 2
tags: [データ構造, メモリ管理, 最適化]
---

## ひとことで

`ArrayUtil.oversize(minTargetSize, bytesPerElement)` は、配列を広げるときに **新しい配列の大きさ** を決めます。最低でも `minTargetSize` は必要で、その上に少し余分な領域を付けて返します。

配列を 1 要素ずつ広げると、そのたびにコピーが起きて遅くなります。そこで、少し多めに確保しておくのが普通です。この関数は、その「どれくらい多めにするか」を、メモリの使い方まで考えて決めています。

## コード

::: code-group

```java:line-numbers=133 [日本語訳]
  public static int oversize(int minTargetSize, int bytesPerElement) {

    if (minTargetSize < 0) {
      // int であふれてしまった引数を、ここで見つける
      throw new IllegalArgumentException("invalid array size " + minTargetSize);
    }

    if (minTargetSize == 0) {
      // 少なくとも 1 要素が要求されるまで待つ
      return 0;
    }

    if (minTargetSize > MAX_ARRAY_LENGTH) {
      throw new IllegalArgumentException(
          "requested array size "
              + minTargetSize
              + " exceeds maximum array in java ("
              + MAX_ARRAY_LENGTH
              + ")");
    }

    // 1/8 ずつ指数的に増やす。
    // CPU を少し余分に使ってでも、
    // メモリを無駄に抱えすぎない方を選ぶ。
    int extra = minTargetSize >> 3;

    if (extra < 3) {
      // 非常に小さい配列では、再確保の固定の費用が相対的に大きいので、
      // 速く大きくする
      // 速く
      extra = 3;
    }

    int newSize = minTargetSize + extra;

    // 以下のバイト境界の調整に備えて、最悪ケースの 7 を足す
    if (newSize + 7 < 0 || newSize + 7 > MAX_ARRAY_LENGTH) {
      // int が溢れたか、最大配列長を超えたので
      return MAX_ARRAY_LENGTH;
    }

    if (Constants.JRE_IS_64BIT) {
      // 64 ビット環境では 8 バイト境界に切り上げる
      return switch (bytesPerElement) {
        // 2 の倍数に切り上げ
        case 4 -> (newSize + 1) & 0x7ffffffe;
        // 4 の倍数に切り上げ
        case 2 -> (newSize + 3) & 0x7ffffffc;
        // 8 の倍数に切り上げ
        case 1 -> (newSize + 7) & 0x7ffffff8;
        // 切り上げなし
        case 8 -> newSize;
        // 奇数の（無効かもしれない）サイズ
        default -> newSize;
      };
    } else {
      // 32 ビットの JVM では、まだ 8 バイト境界だが、
      // 配列のヘッダが 12 バイトなので 8 の倍数ではない。
      // だから 4, 12, 20, 28… バイトのデータに揃えるのが最も効率がよい。
      return switch (bytesPerElement) {
        // 4, 12, 20, 28… に合わせる
        case 1 -> ((newSize + 3) & 0x7ffffff8) + 4;
        // 6, 10, 14, 18… に合わせる
        case 2 -> ((newSize + 1) & 0x7ffffffc) + 2;
        // 5, 7, 9, 11… に合わせる
        case 4 -> (newSize & 0x7ffffffe) + 1;
        // 処理は不要
        case 8 -> newSize;
        // 奇数の（無効かもしれない）サイズ
        default -> newSize;
      };
    }
  }
```

```java:line-numbers=133 [原文]
  public static int oversize(int minTargetSize, int bytesPerElement) {

    if (minTargetSize < 0) {
      // catch usage that accidentally overflows int
      throw new IllegalArgumentException("invalid array size " + minTargetSize);
    }

    if (minTargetSize == 0) {
      // wait until at least one element is requested
      return 0;
    }

    if (minTargetSize > MAX_ARRAY_LENGTH) {
      throw new IllegalArgumentException(
          "requested array size "
              + minTargetSize
              + " exceeds maximum array in java ("
              + MAX_ARRAY_LENGTH
              + ")");
    }

    // asymptotic exponential growth by 1/8th, favors
    // spending a bit more CPU to not tie up too much wasted
    // RAM:
    int extra = minTargetSize >> 3;

    if (extra < 3) {
      // for very small arrays, where constant overhead of
      // realloc is presumably relatively high, we grow
      // faster
      extra = 3;
    }

    int newSize = minTargetSize + extra;

    // add 7 to allow for worst case byte alignment addition below:
    if (newSize + 7 < 0 || newSize + 7 > MAX_ARRAY_LENGTH) {
      // int overflowed, or we exceeded the maximum array length
      return MAX_ARRAY_LENGTH;
    }

    if (Constants.JRE_IS_64BIT) {
      // round up to 8 byte alignment in 64bit env
      return switch (bytesPerElement) {
        // round up to multiple of 2
        case 4 -> (newSize + 1) & 0x7ffffffe;
        // round up to multiple of 4
        case 2 -> (newSize + 3) & 0x7ffffffc;
        // round up to multiple of 8
        case 1 -> (newSize + 7) & 0x7ffffff8;
        // no rounding
        case 8 -> newSize;
        // odd (invalid?) size
        default -> newSize;
      };
    } else {
      // In 32bit jvm, it's still 8-byte aligned,
      // but the array header is 12 bytes, not a multiple of 8.
      // So saving 4,12,20,28... bytes of data is the most cost-effective.
      return switch (bytesPerElement) {
        // align with size of 4,12,20,28...
        case 1 -> ((newSize + 3) & 0x7ffffff8) + 4;
        // align with size of 6,10,14,18...
        case 2 -> ((newSize + 1) & 0x7ffffffc) + 2;
        // align with size of 5,7,9,11...
        case 4 -> (newSize & 0x7ffffffe) + 1;
        // no processing required
        case 8 -> newSize;
        // odd (invalid?) size
        default -> newSize;
      };
    }
  }
```

:::

## 前提知識

- **配列の再確保**: Java の配列は、大きさを変えられません。広げたいときは、新しい大きい配列を作って、中身をコピーします。
- **償却（しょうきゃく）**: 配列を増やすコピーは時々しか起きないので、1 要素あたりの平均のコストは小さく保てる、という考え方です。
- **ビットの AND での切り上げ**: `(x + 7) & ~7` のように、下位のビットを消して 8 の倍数に揃える書き方です。`0x7ffffff8` は、下位 3 ビットが 0 のマスクです。
- **JVM のヘッダ**: 配列の先頭には、型や長さを表す管理情報（ヘッダ）があります。その大きさは 64 ビットと 32 ビットの JVM で違います。
- **`switch` 式**: `->` を使う新しい書き方で、値を直接返します。

## 何をしているか

### 1. 入力の確認

```java:line-numbers=135
    if (minTargetSize < 0) {
      // int であふれてしまった引数を、ここで見つける
      throw new IllegalArgumentException("invalid array size " + minTargetSize);
    }

    if (minTargetSize == 0) {
      // 少なくとも 1 要素が要求されるまで待つ
      return 0;
    }

    if (minTargetSize > MAX_ARRAY_LENGTH) {
      throw new IllegalArgumentException(
          "requested array size "
              + minTargetSize
              + " exceeds maximum array in java ("
              + MAX_ARRAY_LENGTH
              + ")");
    }
```

負の数、0、最大長を超える数を、ここで処理します。0 なら、まだ要素を必要としないので 0 を返します。

### 2. 1/8 ずつ増やす

```java:line-numbers=154
    // 1/8 ずつ指数的に増やす。
    // CPU を少し余分に使ってでも、
    // メモリを無駄に抱えすぎない方を選ぶ。
    int extra = minTargetSize >> 3;

    if (extra < 3) {
      // 非常に小さい配列では、再確保の固定の費用が相対的に大きいので、
      // 速く大きくする
      // 速く
      extra = 3;
    }

    int newSize = minTargetSize + extra;
```

`extra` は、要求された大きさの 8 分の 1 です。小さい配列では、最低 3 を足して、早めに大きくします。増やす割合を一定にすると、コピーの回数が対数で済み、1 要素あたりの平均コストが小さく保たれます。同時に、無駄に確保する領域も全体の約 8 分の 1 に抑えられます。

### 3. 境界への切り上げ

```java:line-numbers=168
    // 以下のバイト境界の調整に備えて、最悪ケースの 7 を足す
    if (newSize + 7 < 0 || newSize + 7 > MAX_ARRAY_LENGTH) {
      // int が溢れたか、最大配列長を超えたので
      return MAX_ARRAY_LENGTH;
    }
```

まず、`int` があふれないか、最大配列長を超えていないかを確かめます。そのうえで、要素のバイト数に応じて、メモリの境界に揃えます。

```java:line-numbers=174
    if (Constants.JRE_IS_64BIT) {
      // 64 ビット環境では 8 バイト境界に切り上げる
      return switch (bytesPerElement) {
        // 2 の倍数に切り上げ
        case 4 -> (newSize + 1) & 0x7ffffffe;
        // 4 の倍数に切り上げ
        case 2 -> (newSize + 3) & 0x7ffffffc;
        // 8 の倍数に切り上げ
        case 1 -> (newSize + 7) & 0x7ffffff8;
        // 切り上げなし
        case 8 -> newSize;
        // 奇数の（無効かもしれない）サイズ
        default -> newSize;
      };
```

64 ビット環境では、1 バイトなら 8 の倍数、2 バイトなら 4 の倍数、4 バイトなら 2 の倍数に切り上げます。こうすると、配列の実際の使用量が、メモリの区切りに合います。

### 4. 具体的な値で追う

`oversize(10, 1)`（1 バイトの要素を 10 個）を計算します。

- `extra = 10 >> 3 = 1`。3 より小さいので `3` にする。
- `newSize = 13`。
- 64 ビット環境で 1 バイトの要素なので、`(13 + 7) & 0x7ffffff8 = 20 & ~7 = 16`。

答えは `16` です。10 個が必要なので、6 個分の余裕ができます。

## ここがすごい

- **1/8 という割合の選び方**: 増やす割合が大きいと、無駄なメモリが増えます。小さいと、コピーが増えます。1/8 は、その両方が釣り合う、実用的な選択です。
- **小さい配列を速く大きくする**: 小さいうちは、再確保の固定の費用が相対的に大きいので、最低 3 を足して一気に広げます。
- **プラットフォームごとの最適化**: 32 ビットの JVM では、配列のヘッダが 12 バイトなので、8 の倍数ではなく、4, 12, 20… に揃えるほうが無駄がありません。コメントに、その理由が丁寧に書かれています。
- **オーバーフローの検出**: `newSize + 7 < 0` の確認で、`int` があふれた場合を見つけます。大きすぎる配列を黙って作るより、安全に上限を返す設計です。

## まとめ

- 配列を広げるときは、割合を決めて多めに確保すると、コピーの回数が減る。
- 増やす割合は、コピーの回数と無駄なメモリのバランスで決める。
- メモリの境界や JVM の仕様に合わせて切り上げると、無駄を減らせる。
