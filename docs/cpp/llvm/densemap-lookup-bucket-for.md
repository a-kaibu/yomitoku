---
title: 見つからなければ「入れる場所」を返す DenseMap の探索
description: LLVM の DenseMap は線形探査のハッシュ表です。LookupBucketFor は、キーがあればその場所を、なければ挿入に使える空きバケツを 1 回の探索で返します。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/DenseMap.h
lines: [1289, 1323]
function: DenseMapBase::LookupBucketFor
difficulty: 2
format: 2
tags: [ハッシュ, データ構造, 探索]
---

## ひとことで

`DenseMap` は LLVM で最もよく使われる連想配列（キーから値を引く表）です。`LookupBucketFor` はその中心となる探索関数で、
**キーが見つかれば `true` とその場所を、見つからなければ `false` と「ここに入れればよい空き場所」** を返します。
検索と挿入位置の決定を 1 回の探索で兼ねているのが特徴です。

## コード

::: code-group

```cpp:line-numbers=1289 [日本語訳]
  /// Val に対応するバケツを探し、FoundBucket に入れて返す。バケツに
  /// キーと値が入っていれば true を返す。そうでなければ
  /// 空きの印が付いたバケツを返し、false を返す。
  template <typename LookupKeyT>
  bool LookupBucketFor(const LookupKeyT &Val, BucketT *&FoundBucket) {
    auto [CBuckets, U, NumBuckets] = getRep();
    if (NumBuckets == 0) {
      FoundBucket = nullptr;
      return false;
    }
    // getRep() は const ポインタを返すが、このオブジェクトは非 const なので、
    // 書き換え可能なバケツのポインタに戻しても安全（非 const 版の getBuckets() と同じ）。
    BucketT *BucketsPtr = const_cast<BucketT *>(CBuckets);

    const unsigned Mask = NumBuckets - 1;
    unsigned BucketNo = KeyInfoT::getHashValue(Val) & Mask;
    while (true) {
      BucketT *ThisBucket = BucketsPtr + BucketNo;
      // 空きバケツが見つかったら、キーは集合の中にない。
      // そこを挿入位置として返す。
      if (LLVM_LIKELY(!llvm::densemap::detail::used(U, BucketNo))) {
        FoundBucket = ThisBucket;
        return false;
      }

      // Val のバケツが見つかった? それならそれを返す。
      if (LLVM_LIKELY(KeyInfoT::isEqual(Val, ThisBucket->getFirst()))) {
        FoundBucket = ThisBucket;
        return true;
      }

      // ハッシュの衝突: 線形探査を続ける。
      BucketNo = (BucketNo + 1) & Mask;
    }
  }
```

```cpp:line-numbers=1289 [原文]
  /// Lookup the appropriate bucket for Val, returning it in FoundBucket. If the
  /// bucket contains the key and a value, this returns true, otherwise it
  /// returns a bucket with an empty marker and returns false.
  template <typename LookupKeyT>
  bool LookupBucketFor(const LookupKeyT &Val, BucketT *&FoundBucket) {
    auto [CBuckets, U, NumBuckets] = getRep();
    if (NumBuckets == 0) {
      FoundBucket = nullptr;
      return false;
    }
    // getRep() yields const pointers; this object is non-const, so recovering
    // a mutable bucket pointer is safe (mirrors the non-const getBuckets()).
    BucketT *BucketsPtr = const_cast<BucketT *>(CBuckets);

    const unsigned Mask = NumBuckets - 1;
    unsigned BucketNo = KeyInfoT::getHashValue(Val) & Mask;
    while (true) {
      BucketT *ThisBucket = BucketsPtr + BucketNo;
      // If we found an empty bucket, the key doesn't exist in the set.
      // Return it as the insertion point.
      if (LLVM_LIKELY(!llvm::densemap::detail::used(U, BucketNo))) {
        FoundBucket = ThisBucket;
        return false;
      }

      // Found Val's bucket?  If so, return it.
      if (LLVM_LIKELY(KeyInfoT::isEqual(Val, ThisBucket->getFirst()))) {
        FoundBucket = ThisBucket;
        return true;
      }

      // Hash collision: continue linear probing.
      BucketNo = (BucketNo + 1) & Mask;
    }
  }
```

:::

## 前提知識

- **バケツ（bucket）**: ハッシュ表の 1 マスのことです。DenseMap はキーと値の組をバケツの配列に直接並べます。
- **線形探査**: ハッシュ値の位置がふさがっていたら、となり、そのとなり…と空きが見つかるまで進む方式です。
- **ポインタの参照 `BucketT *&FoundBucket`**: 「ポインタ変数そのもの」を参照で受け取ります。関数の中で代入すると、呼び出し側の変数が書き換わります。戻り値を 2 つ返す代わりの書き方です。
- **構造化束縛 `auto [A, B, C] = ...`**: 3 つの値をまとめて返す構造体を、一度に 3 つの変数へ分解します（C++17）。
- **`const_cast`**: `const`（書き換え禁止）の印を外すキャストです。乱用は危険ですが、ここでは理由がコメントに書かれています。
- **`& Mask`**: バケツ数が 2 のべき乗なので、`x % 個数` を `x & (個数 - 1)` という速いビット演算で代用できます。

## 何をしているか

### 1. 空の表なら即終了

```cpp:line-numbers=1294
    auto [CBuckets, U, NumBuckets] = getRep();
    if (NumBuckets == 0) {
      FoundBucket = nullptr;
      return false;
    }
```

`getRep()` は、バケツ配列・使用中フラグの配列・バケツ数をまとめて取り出します。
バケツが 0 個なら、入れる場所もないので `nullptr` と `false` を返します。

### 2. 最初に見る場所を決める

```cpp:line-numbers=1303
    const unsigned Mask = NumBuckets - 1;
    unsigned BucketNo = KeyInfoT::getHashValue(Val) & Mask;
```

バケツが 8 個なら `Mask = 7`（2 進数 `111`）です。ハッシュ値が `29` なら `29 & 7 = 5` で、5 番から探し始めます。

### 3. 空きか、一致か、次へ

```cpp:line-numbers=1305
    while (true) {
      BucketT *ThisBucket = BucketsPtr + BucketNo;
      // 空きバケツが見つかったら、キーは集合の中にない。
      // そこを挿入位置として返す。
      if (LLVM_LIKELY(!llvm::densemap::detail::used(U, BucketNo))) {
        FoundBucket = ThisBucket;
        return false;
      }

      // Val のバケツが見つかった? それならそれを返す。
      if (LLVM_LIKELY(KeyInfoT::isEqual(Val, ThisBucket->getFirst()))) {
        FoundBucket = ThisBucket;
        return true;
      }

      // ハッシュの衝突: 線形探査を続ける。
      BucketNo = (BucketNo + 1) & Mask;
    }
```

ループの中で見るのは 3 通りだけです。

1. **空きバケツ**: 線形探査では、キーは必ず「最初の位置から空きまでの連続した区間」のどこかにあります。空きに当たったら、キーは存在しないと確定します。そしてこの空きこそ、挿入するならここ、という場所です。
2. **キーが一致**: 見つかったので `true` を返します。
3. **それ以外**: 別のキーが居座っているので、`(BucketNo + 1) & Mask` で次へ。`& Mask` のおかげで、7 番の次は 0 番に戻ります。

例: 5 番に別のキー、6 番が空き。探すキーがなければ、6 番を `FoundBucket` にして `false` を返します。

## ここがすごい

- **探索と挿入位置探しを兼ねる**: `insert` は、まずこの関数で探し、`false` なら返ってきた空きにそのまま入れます。2 回探す必要がありません。
- **墓石（tombstone）がない**: 古い DenseMap は、削除した場所に「削除済み」の印を置いていました。今の実装は削除時に後ろの要素を詰め直す方式（`eraseFromFilledBucket`）なので、探索ループは「空き」と「一致」の 2 判定だけで済み、とても単純です。挿入側の `findBucketForInsertion` のコメントにもその設計が書かれています。
- **空き判定はビット配列で**: 空きかどうかを、キーと比べるのではなく、別に持つ使用中フラグ（`used(U, BucketNo)`）で調べます。特別な「空きキー」の値を型ごとに用意しなくてよくなります。
- **`const_cast` の理由を明記**: `const_cast` の直前のコメントで、このオブジェクト自体は書き換え可能なので安全だと説明しています。

## まとめ

- 「見つからなかった」ときに挿入位置を返すと、検索と挿入を 1 回の探索にまとめられる。
- 表の大きさを 2 のべき乗にすると、剰余をビット AND に置き換えられる。
- 線形探査では、空きに当たった時点で「存在しない」と言い切れる。
- 削除の方式を工夫すると、探索ループそのものが単純になる。

