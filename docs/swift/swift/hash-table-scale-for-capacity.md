---
title: "要素数から、必要な枠の数の指数（scale）を求める"
description: "ハッシュテーブルの要素数（capacity）から、負荷率 75% 以下を守れる最小の 2 のべき乗の枠数を決める scale(forCapacity:)。(n-1) の最上位ビットの位置を使って求める。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/HashTable.swift
lines: [72, 100]
function: "_HashTable.scale(forCapacity:)"
difficulty: 2
tags: [ハッシュ, データ構造, 数値計算, 標準ライブラリ]
format: 2
---
## ひとことで

Swift の `Dictionary` と `Set` は、オープンアドレス法のハッシュテーブルです。枠（バケット）の数は常に 2 のべき乗で、その指数を `scale` と呼びます。`scale` が 4 なら枠は 16 個です。`scale(forCapacity:)` は、「capacity 個の要素を入れたい」と言われたときに、必要な `scale` を求める関数です。たとえば 100 個なら、枠は 256 個（`scale` は 8）になります。

## コード

::: code-group

```swift:line-numbers=72 [日本語訳]
extension _HashTable {
  /// ハッシュテーブルの最大負荷率の逆数です。
  private static var maxLoadFactor: Double {
    @inline(__always) get { return 3 / 4 }
  }

  internal static func capacity(forScale scale: Int8) -> Int {
    let bucketCount = (1 as Int) &<< scale
    return Int(Double(bucketCount) * maxLoadFactor)
  }

  internal static func scale(forCapacity capacity: Int) -> Int8 {
    let capacity = Swift.max(capacity, 1)
    // 最大負荷率を満たすために、確保すべき要素の最小数を計算します。
    // `capacity + 1` の下限によって、必ず 1 つ以上の空きが残ります。
    // （ここまでの説明です）
    let minimumEntries = Swift.max(
      Int((Double(capacity) / maxLoadFactor).rounded(.up)),
      capacity + 1)
    // 実際に確保する要素数は、最小の要素数以上で最小の 2 のべき乗です。
    // 最小の要素数以上で最小の 2 のべき乗の指数を計算します。
    // （指数の計算です）
    let exponent = (Swift.max(minimumEntries, 2) - 1)._binaryLogarithm() + 1
    _internalInvariant(exponent >= 0 && exponent < Int.bitWidth)
    // scale は、枠の数に対応する指数です。
    let scale = Int8(truncatingIfNeeded: exponent)
    _internalInvariant(self.capacity(forScale: scale) >= capacity)
    return scale
  }
```

```swift:line-numbers=72 [原文]
extension _HashTable {
  /// The inverse of the maximum hash table load factor.
  private static var maxLoadFactor: Double {
    @inline(__always) get { return 3 / 4 }
  }

  internal static func capacity(forScale scale: Int8) -> Int {
    let bucketCount = (1 as Int) &<< scale
    return Int(Double(bucketCount) * maxLoadFactor)
  }

  internal static func scale(forCapacity capacity: Int) -> Int8 {
    let capacity = Swift.max(capacity, 1)
    // Calculate the minimum number of entries we need to allocate to satisfy
    // the maximum load factor. `capacity + 1` below ensures that we always
    // leave at least one hole.
    let minimumEntries = Swift.max(
      Int((Double(capacity) / maxLoadFactor).rounded(.up)),
      capacity + 1)
    // The actual number of entries we need to allocate is the lowest power of
    // two greater than or equal to the minimum entry count. Calculate its
    // exponent.
    let exponent = (Swift.max(minimumEntries, 2) - 1)._binaryLogarithm() + 1
    _internalInvariant(exponent >= 0 && exponent < Int.bitWidth)
    // The scale is the exponent corresponding to the bucket count.
    let scale = Int8(truncatingIfNeeded: exponent)
    _internalInvariant(self.capacity(forScale: scale) >= capacity)
    return scale
  }
```

:::

## 前提知識

- **ハッシュテーブル**: キーのハッシュ値から入れる場所を決めるデータ構造です。埋まっていたら隣の枠を探します。
- **負荷率（load factor）**: 「要素数 ÷ 枠の数」のことです。高すぎると隣を探す回数が増えて遅くなります。Swift の上限は 3/4（75%）です。
- **`(1 as Int) &<< scale`**: 1 を `scale` ビット左にずらす計算で、2 の `scale` 乗になります。
- **`.rounded(.up)`**: 小数を切り上げます。
- **`_binaryLogarithm()`**: 整数の最上位ビットの位置（log₂ の切り捨て）を返すメソッドです。前の記事で扱いました。

## 何をしているか

### 1. 必要な最小の枠数を求める

要素数を負荷率の上限で割り、切り上げます。さらに、少なくとも `capacity + 1` の枠を確保します。これで、テーブルには必ず空きが 1 つ残ります。たとえば capacity が 100 なら、100 ÷ 0.75 = 133.33 を切り上げた 134 が必要な枠数です。

```swift:line-numbers=84
    let capacity = Swift.max(capacity, 1)
    // 最大負荷率を満たすために、確保すべき要素の最小数を計算します。
    // `capacity + 1` の下限によって、必ず 1 つ以上の空きが残ります。
    // （ここまでの説明です）
    let minimumEntries = Swift.max(
      Int((Double(capacity) / maxLoadFactor).rounded(.up)),
      capacity + 1)
```
### 2. 2 のべき乗の指数を求める

必要な枠数以上で、最小の 2 のべき乗の指数を求めます。`(134 - 1)` の最上位ビットの位置は 7（2⁷ = 128 ≤ 133 < 256）なので、1 を足して 8 になります。`scale = 8` の枠数は 256 です。

```swift:line-numbers=91
    // 実際に確保する要素数は、最小の要素数以上で最小の 2 のべき乗です。
    // 最小の要素数以上で最小の 2 のべき乗の指数を計算します。
    // （指数の計算です）
    let exponent = (Swift.max(minimumEntries, 2) - 1)._binaryLogarithm() + 1
```
### 3. 本当に入るか確かめて返す

求めた `scale` で、`capacity(forScale:)` が要求された容量以上かを確かめてから返します。scale 8 の場合、入る容量は 256 × 3/4 = 192 で、100 以上なので正しいと分かります。

```swift:line-numbers=95
    _internalInvariant(exponent >= 0 && exponent < Int.bitWidth)
    // scale は、枠の数に対応する指数です。
    let scale = Int8(truncatingIfNeeded: exponent)
    _internalInvariant(self.capacity(forScale: scale) >= capacity)
    return scale
```
## ここがすごい

- **「n 以上の最小の 2 のべき乗」の定番**: `(n - 1)` の最上位ビットの位置に 1 を足すと、n 以上の最小の 2 のべき乗の指数になります。n がちょうど 2 のべき乗（たとえば 128）でも、127 の最上位ビットは 6 なので、7 が正しく求まります。ループで 2 倍していく必要がありません。
- **必ず空きを 1 つ残す**: コメントのとおり、`capacity + 1` を下限にすることで、テーブルには必ず空きが残ります。オープンアドレス法の探索は、空きに当たったら終わりです。空きが 1 つもないと無限ループになるので、要素数が少ない場合にもこの下限が効きます。
- **2 のべき乗にする理由**: 枠の数が 2 のべき乗なら、「ハッシュ値を枠数で割った余り」を「ハッシュ値と（枠数 - 1）のビット積」で計算できます。割り算を使わずに入れる場所が決まります。
- **不変条件を確かめる**: 浮動小数点の計算を使っているので、丸めの誤差で容量が足りなくならないことを、最後に確かめています。

## まとめ

- ハッシュテーブルは負荷率を一定以下に保たないと遅くなる。Swift の上限は 75%。
- n 以上の最小の 2 のべき乗は、(n - 1) の最上位ビットの位置に 1 を足すと求まる。
- オープンアドレス法では、必ず空きを 1 つ以上残す。
