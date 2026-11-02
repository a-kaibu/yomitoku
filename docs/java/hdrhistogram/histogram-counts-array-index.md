---
title: "バケットとサブバケットの番号を、1 本の配列の位置にする"
description: "HdrHistogram の AbstractHistogram.countsArrayIndex。バケット番号とサブバケット番号の組を、1 次元の counts 配列の添字に変換する。バケットの重なりをどう扱うかも分かる。"
language: java
project: HdrHistogram
repo: https://github.com/HdrHistogram/HdrHistogram
license: CC0-1.0
copyright: "Written by Gil Tene of Azul Systems, and released to the public domain, as explained at http://creativecommons.org/publicdomain/zero/1.0/"
commit: "de84b0a7de2378abfc405da503bf4898e84ea98e"
file: src/main/java/org/HdrHistogram/AbstractHistogram.java
lines: [2406, 2418]
function: "AbstractHistogram.countsArrayIndex"
difficulty: 3
format: 2
tags: [データ構造, 数値計算, ビット演算]
---

## ひとことで

`countsArrayIndex(bucketIndex, subBucketIndex)` は、HdrHistogram の 2 段階の番号（バケットとサブバケット）を、1 本の配列の添字に変えます。HdrHistogram は、値の件数を `counts` という 1 次元の配列に入れて持つので、この変換が必要です。

値の範囲は、バケットごとに 2 倍ずつ広がります。その 2 段の区分を、重なりなく 1 本の配列に並べるのが、この関数の役目です。

## コード

::: code-group

```java:line-numbers=2406 [日本語訳]
    private int countsArrayIndex(final int bucketIndex, final int subBucketIndex) {
        assert(subBucketIndex < subBucketCount);
        assert(bucketIndex == 0 || (subBucketIndex >= subBucketHalfCount));
        // バケット内で最初に使われる要素の添字を計算する（subBucketCount の半分の位置）
        // バケット 0 では subBucketCount のすべての要素を使えるが、bucketBaseIndex は中央のままにする
        final int bucketBaseIndex = (bucketIndex + 1) << subBucketHalfCountMagnitude;
        // バケット内のずれを計算する。この引き算は、0 番目以外のバケットで正の値になる
        // 0 番目のバケットでは、値が 0 から subBucketCount の範囲の半分より小さいことがあるため
        // しかし、0 番目のバケットに 2 倍の領域を与えているので、この方法で問題ない
        final int offsetInBucket = subBucketIndex - subBucketHalfCount;
        // 次の式は、((subBucketIndex - subBucketHalfCount) + bucketBaseIndex と同じ
        return bucketBaseIndex + offsetInBucket;
    }
```

```java:line-numbers=2406 [原文]
    private int countsArrayIndex(final int bucketIndex, final int subBucketIndex) {
        assert(subBucketIndex < subBucketCount);
        assert(bucketIndex == 0 || (subBucketIndex >= subBucketHalfCount));
        // Calculate the index for the first entry that will be used in the bucket (halfway through subBucketCount).
        // For bucketIndex 0, all subBucketCount entries may be used, but bucketBaseIndex is still set in the middle.
        final int bucketBaseIndex = (bucketIndex + 1) << subBucketHalfCountMagnitude;
        // Calculate the offset in the bucket. This subtraction will result in a positive value in all buckets except
        // the 0th bucket (since a value in that bucket may be less than half the bucket's 0 to subBucketCount range).
        // However, this works out since we give bucket 0 twice as much space.
        final int offsetInBucket = subBucketIndex - subBucketHalfCount;
        // The following is the equivalent of ((subBucketIndex  - subBucketHalfCount) + bucketBaseIndex;
        return bucketBaseIndex + offsetInBucket;
    }
```

:::

## 前提知識

- **バケット（bucket）**: 値の大きさの区分です。バケットが 1 つ進むと、扱える値の範囲は 2 倍になります。
- **サブバケット（sub-bucket）**: バケットの中を、さらに等分した区分です。精度を決めます。
- **`subBucketHalfCount`**: サブバケットの数の半分です。バケット 0 以外では、各バケットの下半分は前のバケットと重なるので、上半分だけを使います。
- **`subBucketHalfCountMagnitude`**: `subBucketHalfCount` の 2 の対数です。シフトでバケットの基準位置を求めるために使われます。
- **`counts` 配列**: 各区分の件数を入れておく、1 次元の配列です。

## 何をしているか

### 1. バケットの基準位置を求める

```java:line-numbers=2411
        final int bucketBaseIndex = (bucketIndex + 1) << subBucketHalfCountMagnitude;
```

`(bucketIndex + 1) << subBucketHalfCountMagnitude` で、このバケットの最初の添字を求めます。バケットが 1 つ進むと、基準位置は `subBucketHalfCount` 個ぶん先へ進みます。

### 2. サブバケット内のずれを求める

```java:line-numbers=2415
        final int offsetInBucket = subBucketIndex - subBucketHalfCount;
```

サブバケットの番号から `subBucketHalfCount` を引いて、バケットの上半分の中での位置にします。バケット 0 以外では、サブバケットの番号は必ず上半分にあるので、この引き算は正の値になります。

### 3. 2 つを足して添字にする

```java:line-numbers=2417
        return bucketBaseIndex + offsetInBucket;
```

基準位置にずれを足すと、配列の添字になります。バケットごとに上半分だけを使うので、隣のバケットと同じ添字を取ることがありません。

## ここがすごい

- **重なりを上半分に寄せる**: バケットは 2 倍ずつ広がるので、下半分は前のバケットと値の範囲が重なります。その重なりを使わず、上半分だけを使うことで、配列に無駄な隙間もなく並べられます。
- **バケット 0 の特別扱い**: 最初のバケットだけは、下半分も使えるように作られています。コメントには、その理由と、2 倍の領域を与えている点が書かれています。
- **シフトと足し算だけ**: 基準位置はシフト、ずれは引き算、添字は足し算で求まります。割り算がないので、記録のたびに速く計算できます。
- **1 次元にまとめる**: 2 段の区分を 1 本の配列に並べるので、メモリが連続して使え、件数の読み書きも速くなります。

## まとめ

- バケット番号を基準位置に、サブバケットの上半分の位置をずれにして、添字を作る。
- バケットごとに上半分だけを使うので、重なりなく 1 本の配列に並べられる。
- シフトと足し算で添字が求まり、記録のたびに速く計算できる。
