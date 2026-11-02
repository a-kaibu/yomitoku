---
title: "先頭の 0 の数で値の大きさの区分を決める"
description: "HdrHistogram の AbstractHistogram.getBucketIndex。値の最上位ビットの位置から、対数的な区分（バケット）の番号を一度の計算で求める。"
language: java
project: HdrHistogram
repo: https://github.com/HdrHistogram/HdrHistogram
license: CC0-1.0
copyright: "Written by Gil Tene of Azul Systems, and released to the public domain, as explained at http://creativecommons.org/publicdomain/zero/1.0/"
commit: "de84b0a7de2378abfc405da503bf4898e84ea98e"
file: src/main/java/org/HdrHistogram/AbstractHistogram.java
lines: [2423, 2427]
function: "AbstractHistogram.getBucketIndex"
difficulty: 3
format: 2
tags: [ビット演算, データ構造, 数値計算]
---

## ひとことで

`getBucketIndex(value)` は、値がどの「バケット」（区分）に入るかを番号で返します。HdrHistogram は、値の範囲を 2 の累乗ごとの区分に分けて記録するヒストグラムです。その区分の番号を、ループを使わず一度の計算で求めます。

値が小さいうちは細かく、大きくなると粗く記録するので、遅延の分布を少ないメモリで正確に表せます。この関数は、その「どの区分か」を決める心臓部です。

## コード

::: code-group

```java:line-numbers=2423 [日本語訳]
    int getBucketIndex(final long value) {
        // 2 のべき乗の数で、値が bucket 0 に入る最大の値よりどれだけ大きいかを求めている
        // 各バケットは、前のバケットの 2 倍まで値を入れられるので、その数がバケットの番号になる
        // マスクにより、小さい値はすべて bucket 0 に入る
        return leadingZeroCountBase - Long.numberOfLeadingZeros(value | subBucketMask);
```

```java:line-numbers=2423 [原文]
    int getBucketIndex(final long value) {
        // Calculates the number of powers of two by which the value is greater than the biggest value that fits in
        // bucket 0. This is the bucket index since each successive bucket can hold a value 2x greater.
        // The mask maps small values to bucket 0.
        return leadingZeroCountBase - Long.numberOfLeadingZeros(value | subBucketMask);
```

:::

このメソッドは、同じクラスで次の 2 つのフィールドを使います。`leadingZeroCountBase` と `subBucketMask` は、ヒストグラムの作成時に決まる値です。

## 前提知識

- **ヒストグラム**: 値がどの範囲にどれだけ現れたかを数えた表です。ここでは遅延（処理にかかった時間）の分布を記録します。
- **バケット**: ヒストグラムの区分です。値の範囲ごとに 1 つのバケットがあります。
- **`Long.numberOfLeadingZeros(x)`**: `long` の先頭にある 0 の個数です。値の桁数を数えるのに使われます。
- **`|`（OR）**: 同じ桁のどちらかが 1 なら 1 になります。ここでは、小さい値を一定の桁に揃えるマスクとして使われます。
- **2 の累乗**: 1, 2, 4, 8 のように 2 を何回掛けた値かです。バケットは、この倍々の境界で分かれています。

## 何をしているか

### 1. 小さい値を同じバケットにまとめる

```java:line-numbers=2426
        // マスクにより、小さい値はすべて bucket 0 に入る
        return leadingZeroCountBase - Long.numberOfLeadingZeros(value | subBucketMask);
```

`value | subBucketMask` で、`subBucketMask` より下の桁を全部 1 にします。これにより、その範囲の値は同じ桁数として数えられ、bucket 0 に入ります。細かく記録する必要がない小さい値をまとめる仕組みです。

### 2. 先頭の 0 の数から桁数を求める

`Long.numberOfLeadingZeros` は、先頭の 0 の数を返します。`64 - 先頭の 0 の数` で、値の桁数が分かります。`leadingZeroCountBase` は、この計算の基準になる値です。

### 3. 桁数の差がバケット番号になる

基準の桁数との差が、2 の累乗を何回超えたかを表します。それがそのままバケット番号です。値が 2 倍になるごとに、バケットが 1 つ進みます。

## ここがすごい

- **対数をループなしで求める**: 値が 2 倍ごとにバケットが進むので、対数を取る計算を、先頭の 0 を数える 1 命令で済ませています。
- **マスクで小さい値をまとめる**: `subBucketMask` を OR するだけで、小さい値をすべて同じ区分に入れられます。分岐を書かずに、精度の下限を表しています。
- **メモリを節約できる**: 大きい値の区分は、粗い間隔で記録されます。その代わり、同じ区分の中の値は、ある誤差の範囲で表されます。
- **前提の値を一度だけ計算する**: `leadingZeroCountBase` や `subBucketMask` は、作成時に決めて使い回します。毎回の記録で余計な計算をしません。

## まとめ

- 値の桁数の差が、そのまま対数的なバケット番号になる。
- `subBucketMask` の OR で、小さい値は bucket 0 にまとめる。
- ループを使わず、先頭の 0 を数える一回の計算で区分が決まる。
