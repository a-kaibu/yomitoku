---
title: 削除した穴を後ろの要素で詰める、墓石のないハッシュ表の削除
description: DenseMap の削除は「削除済み」の印を置かず、Knuth の Algorithm R で後続の要素を穴へずらします。巡回する添字を引き算とマスクだけで比べる技も見どころです。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/DenseMap.h
lines: [1139, 1166]
function: DenseMapBase::eraseFromFilledBucket
difficulty: 3
format: 2
tags: [ハッシュ, アルゴリズム, データ構造]
---

## ひとことで

線形探査のハッシュ表から要素を消すと、そこに「穴」ができます。穴をそのままにすると、その先にあるキーが探索で見つからなくなります。
`eraseFromFilledBucket` は、**穴より後ろにある要素のうち、穴に移しても問題ないものを順に詰めていく** ことで、穴を表の外へ押し出します。
クヌースの名著『The Art of Computer Programming』6.4 節の Algorithm R をそのまま実装したものです。

## コード

::: code-group

```cpp:line-numbers=1139 [日本語訳]
  /// \p TheBucket の要素を消し、できた穴を Knuth の
  /// TAOCP 6.4 節 Algorithm R で詰める。
  LLVM_ATTRIBUTE_NOINLINE void eraseFromFilledBucket(BucketT *TheBucket) {
    incrementEpoch();
    TheBucket->getSecond().~ValueT();
    TheBucket->getFirst().~KeyT();
    decrementNumEntries();

    BucketT *BucketsPtr = getBuckets();
    UsedT *U = getUsed();
    const unsigned Mask = getNumBuckets() - 1;
    unsigned I = TheBucket - BucketsPtr;
    unsigned J = I;
    while (true) {
      J = (J + 1) & Mask;
      BucketT &BJ = BucketsPtr[J];
      if (!llvm::densemap::detail::used(U, J))
        break;
      auto Ideal = KeyInfoT::getHashValue(BJ.getFirst());
      // 穴 (I) が、ホームバケツ (Ideal) から J までの線形探査の道のりの上にあるなら、
      // J を穴へ移し、J を新しい穴にする。
      if (((I - Ideal) & Mask) < ((J - Ideal) & Mask)) {
        llvm::densemap::detail::relocateBucket(&BucketsPtr[I], &BJ);
        I = J;
      }
    }
    llvm::densemap::detail::unsetUsed(U, I);
  }
```

```cpp:line-numbers=1139 [原文]
  /// Erase the entry at \p TheBucket and close the resulting hole via Knuth
  /// TAOCP 6.4 Algorithm R.
  LLVM_ATTRIBUTE_NOINLINE void eraseFromFilledBucket(BucketT *TheBucket) {
    incrementEpoch();
    TheBucket->getSecond().~ValueT();
    TheBucket->getFirst().~KeyT();
    decrementNumEntries();

    BucketT *BucketsPtr = getBuckets();
    UsedT *U = getUsed();
    const unsigned Mask = getNumBuckets() - 1;
    unsigned I = TheBucket - BucketsPtr;
    unsigned J = I;
    while (true) {
      J = (J + 1) & Mask;
      BucketT &BJ = BucketsPtr[J];
      if (!llvm::densemap::detail::used(U, J))
        break;
      auto Ideal = KeyInfoT::getHashValue(BJ.getFirst());
      // If the hole (I) lies on the linear-probe chain from the home bucket
      // (Ideal) to J, shift J into the hole and make J the new hole.
      if (((I - Ideal) & Mask) < ((J - Ideal) & Mask)) {
        llvm::densemap::detail::relocateBucket(&BucketsPtr[I], &BJ);
        I = J;
      }
    }
    llvm::densemap::detail::unsetUsed(U, I);
  }
```

:::

## 前提知識

- **線形探査**: ハッシュ値の位置（ホーム）がふさがっていれば、となりへ進んで空きを探す方式です。探索は空きに当たったら終わります。
- **デストラクタ呼び出し `~ValueT()`**: オブジェクトの後始末を明示的に行います。メモリは解放せず、中身だけ片付けます。
- **`unsigned` の引き算**: 符号なし整数は負になりません。`2 - 5` は大きな正の数に「巻き戻り」ますが、下位ビットだけ見れば `mod 2^n` の正しい差になります。
- **`& Mask`**: バケツ数が 2 のべき乗なので、`& (個数 - 1)` で「個数で割った余り」になります。
- **`LLVM_ATTRIBUTE_NOINLINE`**: この関数をインライン展開しないよう指示するマクロです。呼び出し元を小さく保ちます。

## 何をしているか

### 1. 中身を片付ける

```cpp:line-numbers=1142
    incrementEpoch();
    TheBucket->getSecond().~ValueT();
    TheBucket->getFirst().~KeyT();
    decrementNumEntries();
```

`incrementEpoch()` は、デバッグ用に「イテレータが無効になった」ことを記録します。続いてキーと値を破棄し、要素数を 1 減らします。
この時点で `I` 番が穴です。

### 2. 後ろを順に見ていく

```cpp:line-numbers=1152
    while (true) {
      J = (J + 1) & Mask;
      BucketT &BJ = BucketsPtr[J];
      if (!llvm::densemap::detail::used(U, J))
        break;
```

`J` を 1 つずつ進め、空きバケツに当たったらループを抜けます。空きから先は、この穴の影響を受けないからです。

### 3. 移してよいかの判定

```cpp:line-numbers=1157
      auto Ideal = KeyInfoT::getHashValue(BJ.getFirst());
      // 穴 (I) が、ホームバケツ (Ideal) から J までの線形探査の道のりの上にあるなら、
      // J を穴へ移し、J を新しい穴にする。
      if (((I - Ideal) & Mask) < ((J - Ideal) & Mask)) {
        llvm::densemap::detail::relocateBucket(&BucketsPtr[I], &BJ);
        I = J;
      }
```

`Ideal` は `J` 番にいるキーのホーム（ハッシュ値の位置）です。そのキーは、探索のとき **ホームから `J` まで順に見て** 見つけられています。
穴 `I` がその道のりの途中にあるなら、穴のせいで探索が途切れてしまいます。だから `J` の要素を `I` へ移し、今度は `J` が新しい穴になります。

これを判定する式が `((I - Ideal) & Mask) < ((J - Ideal) & Mask)` です。両辺は「ホームから何歩先か」を表します。

8 マス（`Mask = 7`）で、穴 `I = 2`、ホーム 2 のキー B が 3 番にいる場合:
`(2-2)&7 = 0` < `(3-2)&7 = 1` なので、B を 2 番へ移します。穴は 3 番へ。

次に、ホーム 5 のキー D が 5 番にいる場合（穴は 4 番）:
`(4-5)&7 = 7` < `(5-5)&7 = 0` は偽です。D はホームにいるので動かす必要がありません。

### 4. 最後の穴を空きにする

```cpp:line-numbers=1165
    llvm::densemap::detail::unsetUsed(U, I);
```

ループを抜けた時点の `I` が最終的な穴です。使用中フラグを下ろして終わります。

## ここがすごい

- **墓石が要らない**: よくある方式は、削除した場所に「削除済み」の印（墓石）を置きます。墓石が増えると探索が長くなり、定期的な作り直しが必要です。この方式なら表はいつも「削除が一度もなかった」のと同じ形に保たれます。
- **巡回する添字の比較が 1 行**: 表の端で 0 番に戻るため、素直に `Ideal <= I < J` と書くと、折り返しの場合分けが 3 通り必要です。「ホームからの距離」を符号なしの引き算とマスクで求めると、折り返しを意識せずに 1 回の比較で済みます。
- **ハッシュ値を丸めずに使える**: `Ideal` はマスク前の値ですが、引き算のあとでマスクするので結果は同じです。
- **探索側も単純になる**: この削除のおかげで、`LookupBucketFor` は「空きか一致か」だけを見ればよくなっています。

## まとめ

- 線形探査の削除は、穴を後ろの要素で詰めると墓石なしで実現できる。
- 「移してよいか」は「穴がホームから現在地までの道のりにあるか」で決まる。
- 巡回する添字は、符号なしの差とマスクで「距離」にすると比較が簡単になる。
- 削除を少し賢くすると、頻度の高い探索がずっと単純になる。

