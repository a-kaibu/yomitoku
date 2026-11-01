---
title: "負荷率 3/4 を守るハッシュテーブルの大きさ計算"
description: "Dictionary や Set の内部テーブルを何個の枠で作るかを決める関数。負荷率 75% と「必ず空きを 1 つ残す」を満たす最小の 2 のべき乗を、対数で求める。"
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
---
## ひとことで

Swift の `Dictionary` と `Set` は、「オープンアドレス法」のハッシュテーブルです。要素を入れる枠（バケット）の数は常に 2 のべき乗で、その指数を `scale` と呼びます。`scale = 4` なら 16 個の枠です。
`scale(forCapacity:)` は、「`capacity` 個の要素を入れたい」と言われたときに、必要な `scale` を求める関数です。たとえば 100 個なら、枠は 256 個（`scale = 8`）になります。

## コード

```swift:line-numbers=72
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

## 前提知識

- **ハッシュテーブル**: キーのハッシュ値から入れる場所を決めるデータ構造です。オープンアドレス法では、その場所が埋まっていたら隣の枠を探します（線形探索）。
- **負荷率（load factor）**: 「要素数 ÷ 枠の数」のことです。高すぎると、隣を探す回数が増えて遅くなります。Swift は最大 3/4（75%）にしています（この部分）。
- **`private static var`**: 型に属する、このファイルの中だけで使える計算プロパティです。
- **`(1 as Int) &<< scale`**: 2 の `scale` 乗です。
- **`.rounded(.up)`**: 小数を切り上げます。
- **`_binaryLogarithm()`**: 整数の最上位ビットの位置（log₂ の切り捨て）を返すメソッドです。
- **`Int8`**: 8 ビットの符号付き整数です。`scale` は大きくても 63 なので、これで足ります。

## 何をしているか

### capacity(forScale:)（この部分）

逆の計算です。`scale = 8` なら枠は 256、その 3/4 の 192 個まで入れられます。

### scale(forCapacity:)（この部分）

`capacity = 100` で追います。

1.この部分: 必要な枠の最小数は `100 / 0.75 = 133.33…` を切り上げた 134。ただし `capacity + 1 = 101` より小さくはしません。結果は 134。
2.この部分: 134 以上の最小の 2 のべき乗の指数を求めます。`(134 - 1)._binaryLogarithm()` は 133 の最上位ビットの位置で 7（2⁷ = 128 ≤ 133 < 256）。それに 1 を足して **8**。
3.この部分: `capacity(forScale: 8) = 192 >= 100` を確かめて、8 を返します。

## ここがすごい

- **「n 以上の最小の 2 のべき乗」の定番**: `(n - 1)` の最上位ビットの位置に 1 を足すと、n 以上の最小の 2 のべき乗の指数になります。n がちょうど 2 のべき乗（たとえば 128）でも、`127` の最上位ビットは 6 なので、7（= 128）が正しく求まります。ループで 2 倍していく必要がありません。
- **必ず空きを 1 つ残す**:この部分コメントの通り、`capacity + 1` を下限にすることで、テーブルには必ず空き（穴）が残ります。オープンアドレス法の探索は「空きにたどり着いたら終わり」なので、空きが 1 つもないと無限ループになります。要素数が少ないとき（`capacity = 1` など）にこれが効きます。
- **2 のべき乗にする理由**: 枠の数が 2 のべき乗なら、「ハッシュ値 % 枠数」を「ハッシュ値 & (枠数 - 1)」で計算できます（同じファイルのこの部分）。割り算を使わずに入れる場所が決まります。
- **不変条件を確かめる**:この部分「本当に `capacity` 個入るか」をチェックしています。浮動小数点の計算を使っているので、丸めの誤差で足りなくならないことを保証しています。

## まとめ

- ハッシュテーブルは負荷率を一定以下に保たないと遅くなる。Swift の上限は 75%。
- n 以上の最小の 2 のべき乗は、`(n - 1)` の最上位ビットの位置 + 1 で求まる。
- オープンアドレス法では、必ず空きを 1 つ以上残す。
