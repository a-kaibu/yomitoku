---
title: 4 分の 1 の確率で 1 段ずつ伸ばすスキップリストの高さ決め
description: LevelDB のスキップリストで、新しいノードの高さをランダムに決める関数。分岐係数 4 で、平均的な検索コストとメモリ量のバランスを取っている。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: db/skiplist.h
lines: [239, 250]
function: SkipList::RandomHeight
difficulty: 1
format: 2
tags: [データ構造, 乱数, アルゴリズム]
---

## ひとことで

スキップリストは、連結リスト（要素が「次」へのリンクでつながった列）を何段にも重ねて、検索を速くしたデータ構造です。下の段ほど要素が多く、上の段ほどまばらです。
`RandomHeight` は、新しく入れる要素を **何段目まで載せるか** を、コインを投げるように乱数で決めます。LevelDB では 4 分の 1 の確率で 1 段ずつ高くなります。

## コード

::: code-group

```cpp:line-numbers=239 [日本語訳]
template <typename Key, class Comparator>
int SkipList<Key, Comparator>::RandomHeight() {
  // 1/kBranching の確率で高さを増やす
  static const unsigned int kBranching = 4;
  int height = 1;
  while (height < kMaxHeight && rnd_.OneIn(kBranching)) {
    height++;
  }
  assert(height > 0);
  assert(height <= kMaxHeight);
  return height;
}
```

```cpp:line-numbers=239 [原文]
template <typename Key, class Comparator>
int SkipList<Key, Comparator>::RandomHeight() {
  // Increase height with probability 1 in kBranching
  static const unsigned int kBranching = 4;
  int height = 1;
  while (height < kMaxHeight && rnd_.OneIn(kBranching)) {
    height++;
  }
  assert(height > 0);
  assert(height <= kMaxHeight);
  return height;
}
```

:::

## 前提知識

- **`template <typename Key, class Comparator>`**: テンプレートです。どんなキーの型・比較方法でも使えるように、型を後から埋める設計図として書かれています。
- **`SkipList<Key, Comparator>::RandomHeight()`**: `::` は「`SkipList` クラスに属する」という意味です。テンプレートのクラスなので、型引数付きで書きます。
- **`static const unsigned int`**: 関数の中で使う定数です。`unsigned` は符号なし（0 以上）の整数です。
- **`kMaxHeight`**: クラス内で `enum { kMaxHeight = 12 };` と定義された定数です。`enum` をこのように使うと、メモリを使わない整数定数が作れます。
- **`rnd_.OneIn(n)`**: LevelDB の乱数生成器 `Random` のメソッドで、だいたい n 回に 1 回 `true` を返します。
- **`assert`**: デバッグ時に条件を確認し、成り立たなければ止めます。

## 何をしているか

### 1. 高さ 1 から始める

```cpp:line-numbers=242
  static const unsigned int kBranching = 4;
  int height = 1;
```
すべてのノードは最低でもいちばん下の段（全要素がつながる段）に載るので、高さは 1 から始めます。分岐係数 `kBranching` は 4 です。

### 2. 4 分の 1 の確率で伸ばす

```cpp:line-numbers=244
  while (height < kMaxHeight && rnd_.OneIn(kBranching)) {
    height++;
  }
```
`OneIn(4)` が `true` の間、高さを 1 ずつ増やします。上限は 12 です。
確率で見ると、高さ 1 で止まるのは 3/4、高さ 2 は 3/16、高さ 3 は 3/64 です。高さ k 以上になる確率は (1/4)^(k−1) です。
たとえば 1 回目の `OneIn` が `true`、2 回目が `false` なら高さは 2 になります。

### 3. 範囲を確認して返す

```cpp:line-numbers=247
  assert(height > 0);
  assert(height <= kMaxHeight);
  return height;
```
高さが 1〜12 にあることを `assert` で確かめてから返します。

## ここがすごい

- **バランスを乱数に任せる**: 平衡二分木（赤黒木など）は、挿入のたびに回転などの複雑な操作で形を整えます。スキップリストは、各要素の高さを乱数で決めるだけで、平均して O(log n)（要素数の対数に比例する手間）の検索ができます。実装がずっと単純で、並行読み出しにも向いています。
- **分岐係数 4 の意味**: よく使われる 2 にすると、段の数が増えて検索は少し速くなりますが、1 ノードあたりのリンク数の平均は 2 本になります。4 だと平均は 4/3 本で、メモリが節約できます。そのぶん各段で横に進む回数が増えます。LevelDB はメモリを抑える側を選んでいます。
- **上限 12 の意味**: 各段で要素が約 4 分の 1 になるので、12 段あれば 4^11、つまり約 400 万個の要素までうまく働く計算です。MemTable は書き込みバッファ（既定 4MB）がいっぱいになると入れ替えられるので、十分な大きさです。上限があることで `prev[kMaxHeight]` のような固定長の配列も使えます。

## まとめ

- スキップリストは、各要素の高さを乱数で決めるだけで平衡が保たれる。
- 分岐係数を大きくするとメモリが減り、小さくすると検索が少し速くなる。
- 最大の高さは、想定する要素数の対数から決められる。
- 上限を決めると、固定長の配列が使えて実装が楽になる。
