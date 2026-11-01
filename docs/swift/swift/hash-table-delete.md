---
title: "墓石を使わず、後ろの要素を詰めて穴を埋める削除"
description: "オープンアドレス法のハッシュテーブルで、要素を消したあとに後続の要素を移動させ、探索が壊れない状態に戻す delete(at:with:)。墓石（tombstone）を使わない方式。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/HashTable.swift
lines: [465, 508]
function: "_HashTable.delete(at:with:)"
difficulty: 3
tags: [ハッシュ, データ構造, アルゴリズム, 標準ライブラリ]
format: 2
---
## ひとことで

オープンアドレス法のハッシュテーブルでは、要素を消すのが意外と難しい問題です。単に枠を空けると、その先にあった要素が探索で見つからなくなります。その要素は「この枠が埋まっていたから先へ進んだ」からです。よくある解決策は「削除済み」の目印（墓石、tombstone）を置くことです。しかし Swift の `Dictionary` と `Set` は墓石を使いません。この関数は、消した場所に後ろの要素を詰め直して、墓石なしの正しい状態を保ちます。

## コード

::: code-group

```swift:line-numbers=465 [日本語訳]
  @inline(__always)
  @inlinable
  internal func delete<D: _HashTableDelegate>(
    at bucket: Bucket,
    with delegate: D
  ) {
    unsafe _internalInvariant(isOccupied(bucket))

    // 連続した要素の塊の中に穴ができると、
    // 穴より後ろの要素の一部は、新しい穴の位置に属しているかもしれません。

    var hole = bucket
    var candidate = unsafe self.bucket(wrappedAfter: hole)

    guard unsafe _isOccupied(candidate) else {
      // 高速パス: 何もすることがなければ、先頭の枠は取得しません。
      unsafe words[hole.word].uncheckedRemove(hole.bit)
      return
    }

    // 削除した要素を含む、連続した塊の先頭の枠を探します。
    // 削除した要素を含む塊の先頭です。
    let start = unsafe self.bucket(wrappedAfter: previousHole(before: bucket))

    // 塊の中で本来の場所にない要素を移動し、塊の終わりに着くまで繰り返します。
    // 塊の終わりまで繰り返します。
    while unsafe _isOccupied(candidate) {
      let candidateHash = delegate.hashValue(at: candidate)
      let ideal = unsafe idealBucket(forHashValue: candidateHash)

      // この要素は start と hole の間に属するべきでしょうか。2 つの判定が必要です。
      // 判定は、[start, hole] の範囲がストレージの終わりをまたぐかどうかで変わります。
      // ストレージの終わりをまたぐかどうかで、判定を分けます。
      let c0 = ideal >= start
      let c1 = ideal <= hole
      if start <= hole ? (c0 && c1) : (c0 || c1) {
        delegate.moveEntry(from: candidate, to: hole)
        hole = candidate
      }
      candidate = unsafe self.bucket(wrappedAfter: candidate)
    }

    unsafe words[hole.word].uncheckedRemove(hole.bit)
  }
```

```swift:line-numbers=465 [原文]
  @inline(__always)
  @inlinable
  internal func delete<D: _HashTableDelegate>(
    at bucket: Bucket,
    with delegate: D
  ) {
    unsafe _internalInvariant(isOccupied(bucket))

    // If we've put a hole in a chain of contiguous elements, some element after
    // the hole may belong where the new hole is.

    var hole = bucket
    var candidate = unsafe self.bucket(wrappedAfter: hole)

    guard unsafe _isOccupied(candidate) else {
      // Fast path: Don't get the first bucket when there's nothing to do.
      unsafe words[hole.word].uncheckedRemove(hole.bit)
      return
    }

    // Find the first bucket in the contiguous chain that contains the entry
    // we've just deleted.
    let start = unsafe self.bucket(wrappedAfter: previousHole(before: bucket))

    // Relocate out-of-place elements in the chain, repeating until we get to
    // the end of the chain.
    while unsafe _isOccupied(candidate) {
      let candidateHash = delegate.hashValue(at: candidate)
      let ideal = unsafe idealBucket(forHashValue: candidateHash)

      // Does this element belong between start and hole?  We need two
      // separate tests depending on whether [start, hole] wraps around the
      // end of the storage.
      let c0 = ideal >= start
      let c1 = ideal <= hole
      if start <= hole ? (c0 && c1) : (c0 || c1) {
        delegate.moveEntry(from: candidate, to: hole)
        hole = candidate
      }
      candidate = unsafe self.bucket(wrappedAfter: candidate)
    }

    unsafe words[hole.word].uncheckedRemove(hole.bit)
  }
```

:::

## 前提知識

- **線形探索（linear probing）**: 理想の枠が埋まっていたら、1 つ後ろ、また 1 つ後ろと、空きが見つかるまで進んで入れる方式です。探すときも同じ順に進み、空きに当たったら「見つからない」と判断します。
- **連続した塊**: 空きと空きの間の、埋まった枠が連続している部分です。
- **`_HashTableDelegate`**: 枠の中身（キーや値）の操作を受け持つ相手です。このテーブルは占有状況のビットだけを管理し、要素の移動は delegate に頼みます。
- **`bucket(wrappedAfter:)`**: 次の枠を返します。最後の枠の次は、0 番に戻ります。
- **`previousHole(before:)`**: その枠より前にある、最初の空き枠です。
- **`idealBucket(forHashValue:)`**: そのハッシュ値の、理想の枠です。

## 何をしているか

枠 2 から 5 が埋まっていて、枠 2 の要素 A の理想の枠が 2、枠 3 の B が 2、枠 4 の C が 4、枠 5 の D が 3 だとします。A を消す場合を追います。

### 1. 次の枠が空なら、消すだけで済む

次の枠が空なら、消した要素の後ろに続く要素はありません。ビットを下ろして終わりです。この近道で、ほとんどの削除は速く終わります。

```swift:line-numbers=476
    var hole = bucket
    var candidate = unsafe self.bucket(wrappedAfter: hole)

    guard unsafe _isOccupied(candidate) else {
      // 高速パス: 何もすることがなければ、先頭の枠は取得しません。
      unsafe words[hole.word].uncheckedRemove(hole.bit)
      return
    }
```
### 2. 連続した塊の先頭を探す

削除した枠より前にある最初の空きの次が、塊の先頭です。ここでは、枠 1 が空きなので、塊の先頭は枠 2 になります。

```swift:line-numbers=485
    // 削除した要素を含む、連続した塊の先頭の枠を探します。
    // 削除した要素を含む塊の先頭です。
    let start = unsafe self.bucket(wrappedAfter: previousHole(before: bucket))
```
### 3. 後ろの要素を、穴へ詰める

穴を枠 2 として、塊を後ろへ順にたどります。候補の理想の枠が「先頭から穴まで」の範囲にあれば、その要素を穴へ移し、穴を候補の位置へ動かします。B（理想は 2）は範囲に入るので穴へ移ります。C（理想は 4）は範囲の外なので、そのまま残ります。D（理想は 3）は範囲に入るので、穴へ移ります。

```swift:line-numbers=489
    // 塊の中で本来の場所にない要素を移動し、塊の終わりに着くまで繰り返します。
    // 塊の終わりまで繰り返します。
    while unsafe _isOccupied(candidate) {
      let candidateHash = delegate.hashValue(at: candidate)
      let ideal = unsafe idealBucket(forHashValue: candidateHash)

      // この要素は start と hole の間に属するべきでしょうか。2 つの判定が必要です。
      // 判定は、[start, hole] の範囲がストレージの終わりをまたぐかどうかで変わります。
      // ストレージの終わりをまたぐかどうかで、判定を分けます。
      let c0 = ideal >= start
      let c1 = ideal <= hole
      if start <= hole ? (c0 && c1) : (c0 || c1) {
        delegate.moveEntry(from: candidate, to: hole)
        hole = candidate
      }
      candidate = unsafe self.bucket(wrappedAfter: candidate)
    }
```
### 4. 最後の穴を空ける

最後に残った穴のビットを下ろします。結果は、枠 2 が B、枠 3 が D、枠 4 が C、枠 5 が空きです。どの要素も、理想の枠から空きを挟まずに見つかります。

```swift:line-numbers=507
    unsafe words[hole.word].uncheckedRemove(hole.bit)
```
## ここがすごい

- **墓石がないので探索が速いまま**: 墓石方式では、削除を繰り返すと墓石が増え、探索が長くなります。そのため、定期的に作り直す必要があります。この方式では、削除のたびにテーブルが最初から入れ直したのと同じ形に戻るので、性能が落ちません。
- **移動してよい要素の条件**: 要素を穴へ動かしてよいのは、その要素の理想の枠が「塊の先頭から穴まで」にあるときだけです。穴より後ろが理想の要素を前へ動かすと、理想の枠より前に来てしまい、探索で見つからなくなります。この条件 1 つで正しさが保たれています。
- **円状のテーブルでの判定**: 範囲がテーブルの終わりをまたぐと、「先頭以上かつ穴以下」という判定は成り立ちません。そのときは「先頭以上、または穴以下」で判定します。
- **よくある場合の近道**: 負荷率が低ければ、消した枠の次が空いていることが多いです。その場合は、塊の先頭を探すことすらせずに終わります。

## まとめ

- オープンアドレス法の削除は、単に空けると探索が壊れる。
- 後ろの要素を「理想の枠が穴より前にあれば」詰めていけば、墓石なしで正しい状態に戻せる。
- 円状のテーブルでは、範囲が折り返すかどうかで判定式を変える。
