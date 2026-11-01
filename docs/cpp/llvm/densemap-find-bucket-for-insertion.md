---
title: 埋まり具合 3/4 を掛け算だけで判定して表を広げる
description: DenseMap に新しいキーを入れる直前の処理です。要素数が容量の 3/4 に達しそうなら表を 2 倍にし、挿入先を探し直します。割り算を使わない判定がポイントです。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/DenseMap.h
lines: [1237, 1261]
function: DenseMapBase::findBucketForInsertion
difficulty: 2
format: 2
tags: [ハッシュ, データ構造, 最適化]
---

## ひとことで

`findBucketForInsertion` は、DenseMap に新しいキーを入れる直前に呼ばれます。
**入れたあとの埋まり具合（負荷率）が 3/4 以上になるなら表を 2 倍に広げ**、挿入先のバケツを決めて「使用中」の印を付けます。
キーと値の実際の組み立ては、呼び出し元が行います。

## コード

::: code-group

```cpp:line-numbers=1237 [日本語訳]
  template <typename LookupKeyT>
  BucketT *findBucketForInsertion(const LookupKeyT &Lookup,
                                  BucketT *TheBucket) {
    incrementEpoch();

    // 挿入後に負荷率が 3/4 を超えるなら表を広げる。
    // 線形探査と、穴を詰める削除（Knuth Algorithm R）の組み合わせでは、
    // どの探索の道のりも詰まった状態に保たれ、空きバケツの数で長さが抑えられる。
    // そのため、墓石の数に応じた作り直しは必要ない。
    unsigned NewNumEntries = getNumEntries() + 1;
    unsigned NumBuckets = getNumBuckets();
    if (LLVM_UNLIKELY(NewNumEntries * 4 >= NumBuckets * 3)) {
      grow(NumBuckets * 2);
      LookupBucketFor(Lookup, TheBucket);
    }
    assert(TheBucket);

    // 使用中の印を付ける。生のキーと値は呼び出し元が配置 new で組み立てる。
    llvm::densemap::detail::setUsed(getUsed(), TheBucket - getBuckets());

    // バケツ領域を適切に広げ終えてから状態を更新する。こうすることで、
    // 拡張の最中も要素数が中身と食い違わない。
    incrementNumEntries();
    return TheBucket;
  }
```

```cpp:line-numbers=1237 [原文]
  template <typename LookupKeyT>
  BucketT *findBucketForInsertion(const LookupKeyT &Lookup,
                                  BucketT *TheBucket) {
    incrementEpoch();

    // Grow the table if the load factor would exceed 3/4 after insertion.
    // Linear probing with gap-closing deletion (Knuth Algorithm R) keeps
    // every chain compact and bounded by the table's empty-bucket count,
    // so no tombstone-driven resize is needed.
    unsigned NewNumEntries = getNumEntries() + 1;
    unsigned NumBuckets = getNumBuckets();
    if (LLVM_UNLIKELY(NewNumEntries * 4 >= NumBuckets * 3)) {
      grow(NumBuckets * 2);
      LookupBucketFor(Lookup, TheBucket);
    }
    assert(TheBucket);

    // Mark used. The caller will placement-construct the raw key/value.
    llvm::densemap::detail::setUsed(getUsed(), TheBucket - getBuckets());

    // Only update the state after we've grown our bucket space appropriately
    // so that when growing buckets we have self-consistent entry count.
    incrementNumEntries();
    return TheBucket;
  }
```

:::

## 前提知識

- **負荷率**: ハッシュ表の「要素数 ÷ バケツ数」です。高すぎると衝突が増えて探索が遅くなります。
- **`template <typename LookupKeyT>`**: 探すキーの型を自由にするテンプレートです。たとえば文字列のキーを、`std::string` を作らずに軽い文字列参照で探せます。
- **ポインタの引き算 `TheBucket - getBuckets()`**: 2 つの住所の差で「何番目のバケツか」がわかります。
- **`assert`**: 開発中だけ働く確認です。条件が偽なら停止します。リリース版では消えます。
- **`LLVM_UNLIKELY`**: 「この条件はめったに真にならない」とコンパイラに伝えます。

## 何をしているか

### 1. イテレータの世代を進める

```cpp:line-numbers=1240
    incrementEpoch();
```

`incrementEpoch()` は、デバッグ版で「表が変わった」ことを記録します。古いイテレータを使うと検出できます。

### 2. 3/4 を超えるかを掛け算で判定

```cpp:line-numbers=1246
    unsigned NewNumEntries = getNumEntries() + 1;
    unsigned NumBuckets = getNumBuckets();
    if (LLVM_UNLIKELY(NewNumEntries * 4 >= NumBuckets * 3)) {
```

「(要素数 + 1) / バケツ数 ≥ 3/4」を、両辺に `4 × バケツ数` を掛けて `NewNumEntries * 4 >= NumBuckets * 3` にしています。

例: バケツ 16 個、今 11 個入っているところへ 1 個足すと、`12 * 4 = 48`、`16 * 3 = 48` なので広げます。
10 個から 11 個にするときは `44 < 48` なので広げません。

バケツが 0 個（まだ何も確保していない）のときも `4 >= 0` が真になり、自然に確保へ進みます。

### 3. 広げたら探し直す

```cpp:line-numbers=1249
      grow(NumBuckets * 2);
      LookupBucketFor(Lookup, TheBucket);
```

`grow(NumBuckets * 2)` で表を 2 倍にすると、すべての要素が新しい表へ移り、バケツの住所も変わります。
呼び出し元が先に見つけておいた空きバケツ `TheBucket` は古い表のものなので、`LookupBucketFor` で探し直して上書きします。

### 4. 印を付けて数を増やす

```cpp:line-numbers=1255
    llvm::densemap::detail::setUsed(getUsed(), TheBucket - getBuckets());

    // バケツ領域を適切に広げ終えてから状態を更新する。こうすることで、
    // 拡張の最中も要素数が中身と食い違わない。
    incrementNumEntries();
    return TheBucket;
```

使用中フラグを立て、要素数を 1 増やします。コメントの通り、要素数を増やすのは **拡張が終わってから** です。拡張中の処理が、実際の中身と食い違った要素数を見ないようにするためです。

## ここがすごい

- **割り算を使わない**: 負荷率を小数で計算すると割り算や浮動小数点が必要です。両辺に掛け算をして整数の比較にすることで、速く、丸め誤差もありません。
- **珍しい道を外へ追い出す**: 拡張は `LLVM_UNLIKELY` で「まれ」と示され、`grow` 自体も `LLVM_ATTRIBUTE_NOINLINE`でインライン展開されません。よく通る挿入の道は短く保たれます。
- **墓石を数えなくてよい**: `grow` の判定の直前のコメントにある通り、削除時に要素を詰め直す方式なので、「削除済みの印が増えたから作り直す」という判定が要りません。条件が 1 つで済んでいます。
- **順序の注意をコメントで残す**: 要素数を更新するタイミングという、見落とすとバグになる点を明記しています。

## まとめ

- 比率の比較は、両辺に掛け算をして整数の比較にすると速くて正確。
- 表を作り直したら、古い表で得た住所は必ず取り直す。
- まれな処理は分岐予測のヒントとインライン抑止で「よく通る道」から外す。
- 状態を更新する順番に意味があるときは、コメントで理由を書いておく。

