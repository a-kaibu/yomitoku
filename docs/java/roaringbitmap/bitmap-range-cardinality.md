---
title: "範囲の中の 1 の個数を、両端のマスクと popcount で数える"
description: "RoaringBitmap の Util.cardinalityInBitmapRange。64 ビットの語の並びで、範囲の端だけをマスクで切り、中の語は Long.bitCount でまとめて数える。"
language: java
project: RoaringBitmap
repo: https://github.com/RoaringBitmap/RoaringBitmap
license: Apache-2.0
copyright: "Copyright 2013-2016 the RoaringBitmap authors"
commit: "1add1bd95854f18346375bff46b3c57b3dfb467a"
file: roaringbitmap/src/main/java/org/roaringbitmap/Util.java
lines: [422, 437]
function: "Util.cardinalityInBitmapRange"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 数値計算]
---

## ひとことで

RoaringBitmap は、整数の集合を、ビットの並び（64 ビットの語の配列）で持つことがあります。`cardinalityInBitmapRange` は、その中で、`start` から `end` までの範囲に入っているビット（要素）の個数を数えるメソッドです。

語を 1 つずつ見るのではなく、中の語は 1 つの命令でまとめて数え、範囲の両端の語だけをマスクで切ります。

## コード

```java:line-numbers=422
  public static int cardinalityInBitmapRange(long[] bitmap, int start, int end) {
    if (start >= end) {
      return 0;
    }
    int firstword = start / 64;
    int endword = (end - 1) / 64;
    if (firstword == endword) {
      return Long.bitCount(bitmap[firstword] & ((~0L << start) & (~0L >>> -end)));
    }
    int answer = Long.bitCount(bitmap[firstword] & (~0L << start));
    for (int i = firstword + 1; i < endword; i++) {
      answer += Long.bitCount(bitmap[i]);
    }
    answer += Long.bitCount(bitmap[endword] & (~0L >>> -end));
    return answer;
  }
```

## 前提知識

- **語（word）**: 64 ビットをまとめた `long` の 1 つです。ビット番号 `i` は、`bitmap[i / 64]` の `i % 64` 番目のビットになります。
- **popcount**: 1 の個数を数える操作です。Java では `Long.bitCount` が、この操作を 1 命令で行います。
- **マスク**: 必要なビットだけを残すための数です。`&` と組み合わせて使います。
- **符号なしの右シフト `>>>`**: 左から 0 を入れて、ビットを右へずらします。`~0L >>> k` は、下位 `64 - k` ビットだけが 1 の値になります。
- **シフト量は 64 で割った余り**: Java の `long` のシフトは、シフト量の下位 6 ビットだけを使います。そのため、`-end` は、`end` を 64 で割った余りに対して `64 - 余り` として働きます。

## 何をしているか

### 1. 範囲が 1 つの語に収まる場合

```java:line-numbers=426
    int firstword = start / 64;
    int endword = (end - 1) / 64;
    if (firstword == endword) {
      return Long.bitCount(bitmap[firstword] & ((~0L << start) & (~0L >>> -end)));
    }
```

`firstword` と `endword` は、範囲の両端がある語の番号です。両端が同じ語なら、その語だけを数えれば十分です。

`~0L << start` は、`start` より下のビットを 0 にします。`~0L >>> -end` は、`end` より上のビットを 0 にします。両方を `&` で合わせると、範囲の中のビットだけが残り、`Long.bitCount` が 1 の個数を返します。

### 2. 範囲が複数の語にまたがる場合

```java:line-numbers=431
    int answer = Long.bitCount(bitmap[firstword] & (~0L << start));
    for (int i = firstword + 1; i < endword; i++) {
      answer += Long.bitCount(bitmap[i]);
    }
    answer += Long.bitCount(bitmap[endword] & (~0L >>> -end));
    return answer;
```

最初の語は、`start` より上のビットだけを残します。間にある語は全部のビットが範囲に入るので、そのまま `Long.bitCount` で数えて足します。最後の語は、`end` より下のビットだけを残します。

範囲の始まりと終わりを、マスクで切ってから数えるので、語の中を 1 ビットずつ見る必要がありません。

## ここがすごい

- **端だけをマスクで切る**: 範囲の中に入る語は、全体を数えるだけで済みます。端の語だけ、必要なビットを残します。
- **シフトの性質を使う**: `-end` は、`end` の端数を、シフト量として使える形にしています。`end` が 64 の倍数のときも、`~0L >>> 0` で全部のビットが残るので、特別な分岐は要りません。
- **空の範囲は即座に 0**: `start >= end` のときは、ループに入る前に 0 を返します。
- **全体との差で数える場面**: `BitmapContainer.java` の `cardinalityInRange` は、範囲が半分より大きいとき、両端の外側だけを数えて、キャッシュしてある全体の個数から引きます。そうすると、数える語の数が減ります（このファイルは本文に引用していません）。

## まとめ

- 範囲の両端の語は、`~0L << start` と `~0L >>> -end` でマスクして数える。
- 中の語は、`Long.bitCount` で全部のビットを数えて足す。
- シフト量が 64 で割った余りになる性質を使い、`end` の端数を分岐なしで扱う。
