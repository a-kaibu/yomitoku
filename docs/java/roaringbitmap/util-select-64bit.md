---
title: "64 ビットの中から j 番目の 1 を、半分ずつ数えて探す"
description: "RoaringBitmap の Util.select。64 ビットの語の中で、下から j 番目（0 始まり）に立っているビットの位置を、ビット数の数え上げで半分ずつ絞り込んで求める。"
language: java
project: RoaringBitmap
repo: https://github.com/RoaringBitmap/RoaringBitmap
license: Apache-2.0
copyright: "Copyright 2013-2016 the RoaringBitmap authors"
commit: "1add1bd95854f18346375bff46b3c57b3dfb467a"
file: roaringbitmap/src/main/java/org/roaringbitmap/Util.java
lines: [569, 612]
function: "Util.select"
difficulty: 3
format: 2
tags: [ビット演算, データ構造, アルゴリズム]
---

## ひとことで

`Util.select(w, j)` は、64 ビットの値 `w` の中で、下から数えて `j` 番目（0 から数える）に 1 が立っているビットの位置を返します。RoaringBitmap では、ビット集合の中から「何番目の要素か」を探すときに使われます。

ビットを先頭から 1 つずつ数えると遅くなるので、この関数は、ビットの数を数える `bitCount` を使って、範囲を半分ずつに絞り込みます。

## コード

::: code-group

```java:line-numbers=569 [日本語訳]
  public static int select(long w, int j) {
    int seen = 0;
    // 64 ビットを 2 つに分ける
    int part = (int) w;
    int n = Integer.bitCount(part);
    if (n <= j) {
      part = (int) (w >>> 32);
      seen += 32;
      j -= n;
    }
    int ww = part;

    // 32 ビットを 2 つに分ける
    part = ww & 0xFFFF;

    n = Integer.bitCount(part);
    if (n <= j) {

      part = ww >>> 16;
      seen += 16;
      j -= n;
    }
    ww = part;

    // 16 ビットを 2 つに分ける
    part = ww & 0xFF;
    n = Integer.bitCount(part);
    if (n <= j) {
      part = ww >>> 8;
      seen += 8;
      j -= n;
    }
    ww = part;

    // 最後の 1 バイトの中を調べる
    int counter;
    for (counter = 0; counter < 8; counter++) {
      j -= (ww >>> counter) & 1;
      if (j < 0) {
        break;
      }
    }
    return seen + counter;
  }
```

```java:line-numbers=569 [原文]
  public static int select(long w, int j) {
    int seen = 0;
    // Divide 64bit
    int part = (int) w;
    int n = Integer.bitCount(part);
    if (n <= j) {
      part = (int) (w >>> 32);
      seen += 32;
      j -= n;
    }
    int ww = part;

    // Divide 32bit
    part = ww & 0xFFFF;

    n = Integer.bitCount(part);
    if (n <= j) {

      part = ww >>> 16;
      seen += 16;
      j -= n;
    }
    ww = part;

    // Divide 16bit
    part = ww & 0xFF;
    n = Integer.bitCount(part);
    if (n <= j) {
      part = ww >>> 8;
      seen += 8;
      j -= n;
    }
    ww = part;

    // Lookup in final byte
    int counter;
    for (counter = 0; counter < 8; counter++) {
      j -= (ww >>> counter) & 1;
      if (j < 0) {
        break;
      }
    }
    return seen + counter;
  }
```

:::

## 前提知識

- **ビットの数え上げ（popcount）**: 1 の個数を数えることです。`Integer.bitCount` は 32 ビットの中の 1 の数を返します。
- **`j` 番目の 1**: 下から数えて、ちょうど `j + 1` 個目に現れる 1 のことです。`j` は 0 から始まります。
- **`>>>`（符号なし右シフト）**: 上半分を下へ移すために使われます。
- **マスク `& 0xFFFF`、`& 0xFF`**: 下半分だけを残すための組み合わせです。
- **`seen`**: 範囲を絞るときに、どれだけ位置を進めたかを覚えておく変数です。

## 何をしているか

### 1. 64 ビットを上下 32 ビットに分ける

```java:line-numbers=572
    int part = (int) w;
    int n = Integer.bitCount(part);
    if (n <= j) {
      part = (int) (w >>> 32);
      seen += 32;
      j -= n;
    }
```

まず下位 32 ビットに 1 が何個あるかを数えます。その数が `j` 以下なら、目的の 1 は上位 32 ビットにあるので、上位へ移り、`j` から下位の個数を引きます。

### 2. 32 ビットを上下 16 ビットに分ける

```java:line-numbers=582
    part = ww & 0xFFFF;

    n = Integer.bitCount(part);
    if (n <= j) {

      part = ww >>> 16;
      seen += 16;
      j -= n;
    }
```

同じ考え方で、下位 16 ビットの個数を見て、上位へ移るかどうかを決めます。マスクで下位 16 ビットを取り出し、個数を比べます。

### 3. 16 ビットを上下 8 ビットに分ける

```java:line-numbers=594
    part = ww & 0xFF;
    n = Integer.bitCount(part);
    if (n <= j) {
      part = ww >>> 8;
      seen += 8;
      j -= n;
    }
    ww = part;
```

もう一段、8 ビットに絞ります。ここまでで、残りの範囲は 8 ビットです。

### 4. 最後の 8 ビットは 1 つずつ調べる

```java:line-numbers=605
    for (counter = 0; counter < 8; counter++) {
      j -= (ww >>> counter) & 1;
      if (j < 0) {
        break;
      }
    }
    return seen + counter;
```

8 ビットの中では、1 つずつ `j` を減らしながら調べます。`j` が負になった位置が、目的の 1 の位置です。`seen` に、上で進んだ分を足して返します。

## ここがすごい

- **半分ずつ絞る**: 64 ビットから 8 ビットまで、3 回の個数の判定で範囲を 8 分の 1 にできます。その後の調べる回数は 8 回以内に収まります。
- **個数を数えるだけ**: 目的の位置をすぐに求めるのではなく、「ここまでに 1 が何個あるか」だけを比べます。個数の計算は CPU の命令で速く行えます。
- **位置を積み上げる**: `seen` で、上の段で捨てた分の位置を覚えておき、最後に足します。どの段でも、元の値の中の正しい位置を指せます。
- **ループは短い**: 大きい単位から順に絞るので、最後に 1 つずつ調べる範囲が 8 ビットしかありません。全体を通して、1 ビットずつ数えるより速く終わります。

## まとめ

- 64 ビットの `j` 番目の 1 を、個数の判定で 32・16・8 ビットへと半分ずつ絞り込む。
- 最後の 8 ビットだけを 1 つずつ調べ、`seen` で位置を積み上げる。
- RoaringBitmap は、この仕組みで「何番目の要素か」から値を素早く取り出す。
