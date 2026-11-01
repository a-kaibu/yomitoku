---
title: "墓石を使わない、オープンアドレス法の削除"
description: "線形探索のハッシュテーブルから要素を消す関数。削除でできた穴に、後ろの要素のうち本来その穴より前に入るべきものを詰めていく「後退シフト削除」で、目印（墓石）を残さない。"
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
---
## ひとことで

オープンアドレス法のハッシュテーブルでは、要素を消すのが意外と難しい問題です。単に枠を空けると、その先に「ここが埋まっていたから先へ進んだ」要素が見つからなくなるからです。
よくある解決策は「削除済み」の目印（墓石、tombstone）を置くことですが、Swift の `Dictionary` と `Set` は墓石を使いません。この関数は、消した場所に **後ろの要素を詰め直して**、テーブルを墓石なしの正しい状態に保ちます。

## コード

```swift:line-numbers=465
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

## 前提知識

- **線形探索（linear probing）**: キーの理想の枠が埋まっていたら、1 つ後ろ、また 1 つ後ろ…と空き枠が見つかるまで進んで入れる方式です。探すときも同じ順に進み、空き枠に当たったら「見つからない」と判断します。
- **チェーン（連続した塊）**: 空き枠と空き枠の間の、埋まった枠が連続した部分です。
- **`<D: _HashTableDelegate>`**: 枠の中身（キーや値）の操作を受け持つ相手です。このハッシュテーブル型は占有状況のビットだけを管理し、要素の移動は `delegate` に頼みます。
- **`bucket(wrappedAfter:)`**: 次の枠。最後の枠の次は 0 番に戻ります。
- **`previousHole(before:)`**: その枠より前にある最初の空き枠です。
- **`idealBucket(forHashValue:)`**: そのハッシュ値の理想の枠です。
- **三項演算子 `条件 ? A : B`**:この部分、範囲が折り返しているかどうかで判定式を切り替えています。

## 何をしているか

枠 0〜7 のテーブルで、枠 2〜5 が埋まっているとします。理想の枠は、枠 2 の要素 A が 2、枠 3 の B が 2、枠 4 の C が 4、枠 5 の D が 3 です。A を消す場合を追います。

### 1. 次が空なら、消すだけ（この部分）

`candidate`（枠 3）は埋まっているので、この近道は使えません。もし空なら、チェーンの最後なので、ビットを下ろして終わりです。

### 2. チェーンの始まりを探す（この部分）

枠 2 より前の空きは枠 1。その次の枠 2 が `start` です。

### 3. 後ろの要素を穴に詰める（この部分）

`hole = 2` から始めます。

- `candidate = 3`（B、理想は 2）: 理想の枠が `start`〜`hole`（2〜2）の範囲内なので、穴へ移動。`hole = 3`。
- `candidate = 4`（C、理想は 4）: 範囲 2〜3 の外なので、そのまま。
- `candidate = 5`（D、理想は 3）: 範囲 2〜3 の中なので、穴へ移動。`hole = 5`。
- `candidate = 6` は空なので終了。

### 4. 最後の穴を空ける（この部分）

枠 5 のビットを下ろします。結果は 枠 2: B、3: D、4: C、5: 空。どの要素も、理想の枠から空き枠を挟まずにたどり着けます。

### 折り返しの判定（この部分）

範囲 `start`〜`hole` がテーブルの終わりをまたぐ（たとえば 6, 7, 0, 1）と、「`start` 以上かつ `hole` 以下」が成り立たなくなります。そのときは「`start` 以上 **または** `hole` 以下」で判定します。

## ここがすごい

- **墓石がないので探索が速いまま**: 墓石方式では、削除を繰り返すと墓石だらけになり、探索が長くなります。そのため定期的な作り直しが必要です。この方式では削除のたびにテーブルが「最初から入れ直した」のと同じ形に戻るので、性能が劣化しません。
- **移動してよい要素の条件**: 要素を穴へ動かしてよいのは、その要素の理想の枠が「チェーンの始まりから穴まで」にあるときだけです。穴より後ろが理想の要素を前へ動かすと、理想の枠より前に来てしまい、探索で見つからなくなります。この条件 1 つで正しさが保たれています。
- **よくある場合を近道に**: 負荷率が低ければ、消した枠の次が空いていることが多いです。この部分近道で、チェーンの始まりを探すことすらせずに終わります。

## まとめ

- オープンアドレス法の削除は、単に空けると探索が壊れる。
- 後ろの要素を「理想の枠が穴より前なら詰める」と移していけば、墓石なしで正しい状態に戻せる。
- 円状のテーブルでは、範囲が折り返すかどうかで判定式を変える。
