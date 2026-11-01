---
title: 表の大きさから、入れられる要素の数を決める
description: hashbrown の bucket_mask_to_capacity。バケットの数から、入れてよい要素の上限を計算する。小さい表では 1 つ、大きい表では 12.5% を空きとして残す。
language: rust
project: hashbrown
repo: https://github.com/rust-lang/hashbrown
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 Amanieu d'Antras
commit: "f7bae3d165a3191d086a506ce6a39e516ffd5c67"
file: src/raw.rs
lines: [182, 194]
function: bucket_mask_to_capacity
difficulty: 2
format: 2
tags: [ハッシュ, データ構造, 数値計算]
---

## ひとことで

`bucket_mask_to_capacity` は、表の **バケットの数** から、そこに入れてよい **要素の数の上限（容量）** を計算する関数です。
ハッシュ表は、ほぼ満杯になると探索が遅くなります。そこで、すべてのバケットを埋めず、一定の割合を空けておく決まりになっています。この関数は、その決まりを数式で表しています。

## コード

::: code-group

```rust:line-numbers=182 [日本語訳]
fn bucket_mask_to_capacity(bucket_mask: usize) -> usize {
    if bucket_mask < 8 {
        // バケットが 1, 2, 4, 8 個の表では、空きを必ず 1 つ残す。
        // バケットのマスクは、バケット数より 1 少ない値であることに注意。
        bucket_mask
    } else {
        // `bucket_mask` は確保できる最大サイズで制限されるので、
        // `usize::MAX` にはならず、下の `+ 1` は溢れない。
        debug_assert!(bucket_mask != usize::MAX);
        // 大きい表では、スロットの 12.5% を空きとして残す。
        ((bucket_mask + 1) / 8) * 7
    }
}
```

```rust:line-numbers=182 [原文]
fn bucket_mask_to_capacity(bucket_mask: usize) -> usize {
    if bucket_mask < 8 {
        // For tables with 1/2/4/8 buckets, we always reserve one empty slot.
        // Keep in mind that the bucket mask is one less than the bucket count.
        bucket_mask
    } else {
        // `bucket_mask` is bounded by the maximum allocation size, so it can
        // never be `usize::MAX` and the `+ 1` below cannot overflow.
        debug_assert!(bucket_mask != usize::MAX);
        // For larger tables we reserve 12.5% of the slots as empty.
        ((bucket_mask + 1) / 8) * 7
    }
}
```

:::

引数の `bucket_mask` は、バケットの数から 1 を引いた値です。2 の冪のバケット数を使うと、`bucket_mask` は下のビットがすべて 1 のマスクになります。

## 前提知識

- **バケットとマスク**: バケットは要素を置く場所です。バケットの数が 2 の冪なら、「数 − 1」は下のビットがすべて 1 のマスクになり、`&` で添字を範囲に収められます。
- **満杯に近い表の問題**: 表がいっぱいになると、空いている場所を探すのに時間がかかります。空きを残しておくと、探索が速く終わります。
- **整数の割り算の切り捨て**: `(bucket_mask + 1) / 8` は、8 で割った商を求めます。小数点以下は捨てられます。
- **`debug_assert!`**: デバッグビルドでだけ、前提の条件を確かめます。
- **`usize::MAX`**: 使える最大の値です。これより 1 大きい値は表せないので、`+ 1` が溢れないことを確かめる必要があります。

## 何をしているか

### 1. 小さい表では空きを 1 つ残す

```rust:line-numbers=183
    if bucket_mask < 8 {
        // For tables with 1/2/4/8 buckets, we always reserve one empty slot.
        // Keep in mind that the bucket mask is one less than the bucket count.
        bucket_mask
```

`bucket_mask` が 8 より小さい（バケットが 1, 2, 4, 8 個の）表では、容量を `bucket_mask` そのものにします。バケット数が `bucket_mask + 1` なので、容量はバケット数より 1 少なくなり、空きが必ず 1 つ残ります。
空きが残っていれば、探索はいつか空いた場所に着いて、見つからないことを確かめられます。

### 2. 大きい表では 12.5% を空ける

```rust:line-numbers=188
        // `bucket_mask` is bounded by the maximum allocation size, so it can
        // never be `usize::MAX` and the `+ 1` below cannot overflow.
        debug_assert!(bucket_mask != usize::MAX);
        // For larger tables we reserve 12.5% of the slots as empty.
        ((bucket_mask + 1) / 8) * 7
```

それ以外の大きい表では、`(bucket_mask + 1) / 8 * 7` で、バケットの 7 / 8 を容量にします。空きは残りの 12.5% です。
デバッグビルドでは、`bucket_mask` が `usize::MAX` でないことを確かめています。そうでないと、`+ 1` が溢れてしまうからです。

## ここがすごい

- **割り算とかけ算で割合を表す**: `/ 8 * 7` で 7/8 を求めています。割合を 1 つの定数で書けるので、後から変えやすくなっています。
- **小さい表と大きい表で決まりを分ける**: 小さい表では 1 つの空きを確実に残し、大きい表では割合で残します。サイズに応じて、無駄の少ない設計になっています。
- **2 の冪の性質を利用する**: バケット数が 2 の冪であることを前提に、マスクを使って添字を作ります。その前提が、この関数の引数の意味を決めています。
- **溢れの前提をコメントで示す**: `bucket_mask` は確保できるサイズで制限されるので、`+ 1` は溢れません。その理由がコメントで書かれています。
- **計算が 1 回の割り算で済む**: 容量の計算は、割り算とかけ算だけです。表を作るときに 1 回だけ呼ばれるので、速さの心配がありません。

## まとめ

- 容量は、バケット数から 1 を引いた値（小さい表）か、バケットの 7/8（大きい表）で決まる。
- 小さい表では必ず空きを 1 つ残し、探索が終わることを保証する。
- 大きい表では、12.5% の空きを残して、探索の速さを保つ。
