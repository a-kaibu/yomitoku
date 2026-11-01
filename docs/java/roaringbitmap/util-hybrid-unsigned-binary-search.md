---
title: "二分探索を途中でやめて、残りを順番に調べる"
description: "RoaringBitmap の配列探索。範囲が十分に狭くなるまで二分探索し、そこから先は 1 つずつ見る線形探索で仕上げる。キャッシュの大きさに合わせた切り替えの工夫。"
language: java
project: RoaringBitmap
repo: https://github.com/RoaringBitmap/RoaringBitmap
license: Apache-2.0
copyright: "Copyright 2013-2016 the RoaringBitmap authors"
commit: "1add1bd95854f18346375bff46b3c57b3dfb467a"
file: roaringbitmap/src/main/java/org/roaringbitmap/Util.java
lines: [448, 482]
function: "Util.hybridUnsignedBinarySearch"
difficulty: 3
format: 2
tags: [探索, アルゴリズム, 最適化]
---

## ひとことで

`Util.hybridUnsignedBinarySearch` は、ソート済みの `char` 配列の中から値 `k` を探します。見つかればその位置、なければ `-(挿入位置) - 1` を返します。

ふつうの二分探索は範囲を半分ずつ狭めていきますが、この関数は **範囲が 33 要素未満になったところで二分探索をやめ、残りを先頭から順に調べます**。二つの方法を組み合わせた「ハイブリッド」な探索です。

## コード

::: code-group

```java:line-numbers=448 [日本語訳]
  protected static int hybridUnsignedBinarySearch(
      final char[] array, final int begin, final int end, final char k) {
    // 次の行は、値が配列の末尾に入るような、よくある場合を速くする
    // （値が配列の末尾に挿入される場合）
    if ((end > 0) && ((array[end - 1]) < (int) k)) {
      return -end - 1;
    }
    int low = begin;
    int high = end - 1;
    // 次の行の 32 は、キャッシュラインの大きさに合わせた値
    while (low + 32 <= high) {
      final int middleIndex = (low + high) >>> 1;
      final int middleValue = (array[middleIndex]);

      if (middleValue < (int) k) {
        low = middleIndex + 1;
      } else if (middleValue > (int) k) {
        high = middleIndex - 1;
      } else {
        return middleIndex;
      }
    }
    // 残りは順番に調べる線形探索で仕上げる
    int x = low;
    for (; x <= high; ++x) {
      final int val = (array[x]);
      if (val >= (int) k) {
        if (val == (int) k) {
          return x;
        }
        break;
      }
    }
    return -(x + 1);
  }
```

```java:line-numbers=448 [原文]
  protected static int hybridUnsignedBinarySearch(
      final char[] array, final int begin, final int end, final char k) {
    // next line accelerates the possibly common case where the value would
    // be inserted at the end
    if ((end > 0) && ((array[end - 1]) < (int) k)) {
      return -end - 1;
    }
    int low = begin;
    int high = end - 1;
    // 32 in the next line matches the size of a cache line
    while (low + 32 <= high) {
      final int middleIndex = (low + high) >>> 1;
      final int middleValue = (array[middleIndex]);

      if (middleValue < (int) k) {
        low = middleIndex + 1;
      } else if (middleValue > (int) k) {
        high = middleIndex - 1;
      } else {
        return middleIndex;
      }
    }
    // we finish the job with a sequential search
    int x = low;
    for (; x <= high; ++x) {
      final int val = (array[x]);
      if (val >= (int) k) {
        if (val == (int) k) {
          return x;
        }
        break;
      }
    }
    return -(x + 1);
  }
```

:::

## 前提知識

- **ソート済みの配列**: 小さい順に並んでいる配列です。二分探索はこの前提で動きます。
- **`char`**: Java の 16 ビットの文字型です。ここでは 0〜65535 の小さい数として扱われます。
- **キャッシュライン**: CPU がメモリを読むときにまとめて運ぶ単位です。一般的な CPU では 64 バイトです。
- **`-(x + 1)`**: 見つからなかったときの返し方です。挿入すべき位置を負の数の形で表します。
- **`>>> 1`**: 2 で割ることと同じです（左に 0 を入れるので、負の数の影響を受けません）。

## 何をしているか

### 1. 末尾より大きいなら即座に答える

```java:line-numbers=452
    if ((end > 0) && ((array[end - 1]) < (int) k)) {
      return -end - 1;
    }
```

配列の最後の要素より `k` が大きければ、`k` は末尾に入るとすぐ分かります。二分探索を回さずに `-end - 1` を返します。よくある「末尾への追加」を速くする近道です。

### 2. 範囲が 33 要素以上の間は二分探索

```java:line-numbers=458
    while (low + 32 <= high) {
      final int middleIndex = (low + high) >>> 1;
      final int middleValue = (array[middleIndex]);

      if (middleValue < (int) k) {
        low = middleIndex + 1;
      } else if (middleValue > (int) k) {
        high = middleIndex - 1;
      } else {
        return middleIndex;
      }
    }
```

`low + 32 <= high` の間だけ、中央の値と比べて範囲を半分にします。`high - low + 1` が 33 以上ある間は、この二分探索が続きます。

### 3. 残りは順番に調べる

```java:line-numbers=471
    int x = low;
    for (; x <= high; ++x) {
      final int val = (array[x]);
      if (val >= (int) k) {
        if (val == (int) k) {
          return x;
        }
        break;
      }
    }
    return -(x + 1);
```

範囲が 32 要素以下に縮んだら、先頭から 1 つずつ見ます。途中で `k` 以上の値が出たら、その時点で判定できるので `break` します。

### 具体的な値で追う

`array = {1, 3, 5, …}` のように 100 要素の配列があり、`k = 7` を探すとします。

- 最初の範囲は `0〜99`。二分探索で `low` と `high` が縮んでいきます。
- 範囲が 33 要素を下回ったところで、二分探索は終了します。
- 残りの範囲を先頭から順に見て、`7` が見つかれば、その位置を返します。

## ここがすごい

- **キャッシュに合わせた切り替え**: `char` は 2 バイトなので、32 要素で 64 バイトです。これは一般的なキャッシュラインの大きさにほぼ一致します。範囲がその大きさに収まれば、1 回のメモリ読み込みで必要な要素がほとんどまとまって届きます。コメントに「キャッシュラインに合わせた」と書かれているのは、この理由です。
- **分岐予測との相性**: 二分探索は、比較の結果が予測しにくく、分岐の予測を外しがちです。小さな範囲では、順番に見る方が予測しやすく、速くなりやすいのです。
- **末尾の特別扱い**: 「末尾に追加する」は、データベースやログで非常によく起きる操作です。その場合に即座に答えを返すのは、目立たないけれど効く工夫です。
- **同じ戻り値の約束**: 見つかれば位置、見つからなければ負の挿入位置です。二分探索版（`branchyUnsignedBinarySearch`）と同じ形の答えを返すので、呼び出し側は実装を切り替えても困りません。

## まとめ

- 二分探索は範囲が小さくなると、順番に見る方が速いことがある。
- 切り替えの大きさは、データの型とキャッシュの大きさから決める。
- よくあるケース（末尾への挿入）は、先に特別扱いすると速くなる。
