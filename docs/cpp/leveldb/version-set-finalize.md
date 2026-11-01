---
title: レベルごとの「詰まり具合」を点数にして次に整理する場所を決める
description: LevelDB で、次にコンパクション（ファイルの整理・統合）をすべきレベルを決める関数。レベル 0 はファイル数、それ以外は合計サイズを上限で割ったスコアで比べ、最も高いレベルを記録する。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: db/version_set.cc
lines: [1031, 1067]
function: VersionSet::Finalize
difficulty: 2
format: 2
tags: [アルゴリズム, ファイル, 設計パターン]
---

## ひとことで

LevelDB は、データをレベル 0〜6 の階層に分けて保存します。下のレベルほど大きく、あふれたら次のレベルへ統合（コンパクション）します。
`Finalize` は、新しいバージョン（ファイル構成）ができるたびに呼ばれ、**どのレベルがいちばん「詰まっているか」** を点数で比べて、次にコンパクションすべきレベルを決めておく関数です。

## コード

::: code-group

```cpp:line-numbers=1031 [日本語訳]
void VersionSet::Finalize(Version* v) {
  // 次のコンパクションに最適なレベルを前もって計算しておく
  int best_level = -1;
  double best_score = -1;

  for (int level = 0; level < config::kNumLevels - 1; level++) {
    double score;
    if (level == 0) {
      // レベル 0 は特別扱いし、バイト数ではなくファイル数で制限する。
      // 理由は 2 つ:
      //
      // (1) 書き込みバッファが大きいときに、レベル 0 のコンパクションを
      // あまり多くしたくない。
      //
      // (2) レベル 0 のファイルは読むたびにマージされるので、
      // 個々のファイルが小さいとき（書き込みバッファの設定が小さい、
      // 圧縮率がとても高い、上書きや削除が多い、などが原因で）に
      // ファイルが多くなりすぎるのを
      // 避けたい。
      score = v->files_[level].size() /
              static_cast<double>(config::kL0_CompactionTrigger);
    } else {
      // 今のサイズと上限の比を計算する。
      const uint64_t level_bytes = TotalFileSize(v->files_[level]);
      score =
          static_cast<double>(level_bytes) / MaxBytesForLevel(options_, level);
    }

    if (score > best_score) {
      best_level = level;
      best_score = score;
    }
  }

  v->compaction_level_ = best_level;
  v->compaction_score_ = best_score;
}
```

```cpp:line-numbers=1031 [原文]
void VersionSet::Finalize(Version* v) {
  // Precomputed best level for next compaction
  int best_level = -1;
  double best_score = -1;

  for (int level = 0; level < config::kNumLevels - 1; level++) {
    double score;
    if (level == 0) {
      // We treat level-0 specially by bounding the number of files
      // instead of number of bytes for two reasons:
      //
      // (1) With larger write-buffer sizes, it is nice not to do too
      // many level-0 compactions.
      //
      // (2) The files in level-0 are merged on every read and
      // therefore we wish to avoid too many files when the individual
      // file size is small (perhaps because of a small write-buffer
      // setting, or very high compression ratios, or lots of
      // overwrites/deletions).
      score = v->files_[level].size() /
              static_cast<double>(config::kL0_CompactionTrigger);
    } else {
      // Compute the ratio of current size to size limit.
      const uint64_t level_bytes = TotalFileSize(v->files_[level]);
      score =
          static_cast<double>(level_bytes) / MaxBytesForLevel(options_, level);
    }

    if (score > best_score) {
      best_level = level;
      best_score = score;
    }
  }

  v->compaction_level_ = best_level;
  v->compaction_score_ = best_score;
}
```

:::

各レベルの容量の上限は、同じファイルの `MaxBytesForLevel` で決まります。

```cpp:line-numbers=41
static double MaxBytesForLevel(const Options* options, int level) {
  // 注意: レベル 0 の結果は実際には使われない。レベル 0 の
  // コンパクションのしきい値はファイル数で決めているため。

  // レベル 0 とレベル 1 の両方の結果
  double result = 10. * 1048576.0;
  while (level > 1) {
    result *= 10;
    level--;
  }
  return result;
}
```

## 前提知識

- **コンパクション**: 複数のファイルを読み、キー順にまとめ直して新しいファイルに書く処理です。古い値や削除済みのデータを捨て、読み込み時に見るファイルを減らします。
- **`Version* v`**: ある時点のファイル構成を表すオブジェクトへのポインタです。`v->files_[level]` に、そのレベルのファイル一覧が入っています。
- **`config::kNumLevels`**: レベルの数で 7 です。`config::` は名前空間（名前のグループ）を表します。
- **`config::kL0_CompactionTrigger`**: レベル 0 のファイルがいくつになったらコンパクションするかの値で、4 です。
- **`static_cast<double>(x)`**: 整数を小数に変換します。整数同士の割り算だと小数点以下が切り捨てられるので、先に変換しています。

## 何をしているか

### 1. 最後のレベルを除いて調べる

```cpp:line-numbers=1036
  for (int level = 0; level < config::kNumLevels - 1; level++) {
```
レベル 6 はいちばん下で、その下に移す先がないので、0〜5 だけを調べます。

### 2. レベル 0 はファイル数で

```cpp:line-numbers=1038
    if (level == 0) {
      // レベル 0 は特別扱いし、バイト数ではなくファイル数で制限する。
      // 理由は 2 つ:
      //
      // (1) 書き込みバッファが大きいときに、レベル 0 のコンパクションを
      // あまり多くしたくない。
      //
      // (2) レベル 0 のファイルは読むたびにマージされるので、
      // 個々のファイルが小さいとき（書き込みバッファの設定が小さい、
      // 圧縮率がとても高い、上書きや削除が多い、などが原因で）に
      // ファイルが多くなりすぎるのを
      // 避けたい。
      score = v->files_[level].size() /
              static_cast<double>(config::kL0_CompactionTrigger);
```
レベル 0 のファイルが 6 個なら、スコアは `6 / 4 = 1.5` です。

### 3. それ以外は合計サイズで

```cpp:line-numbers=1052
    } else {
      // 今のサイズと上限の比を計算する。
      const uint64_t level_bytes = TotalFileSize(v->files_[level]);
      score =
          static_cast<double>(level_bytes) / MaxBytesForLevel(options_, level);
    }
```
上限はレベル 1 で 10MB、レベル 2 で 100MB と 10 倍ずつ増えます。レベル 2 に 130MB あれば、スコアは `130 / 100 = 1.3` です。

### 4. 最大のものを記録

```cpp:line-numbers=1059
    if (score > best_score) {
      best_level = level;
      best_score = score;
    }
  }

  v->compaction_level_ = best_level;
  v->compaction_score_ = best_score;
```
いちばん高いスコアのレベルと、その値を `v` に書きます。上の例ならレベル 0（1.5）が選ばれます。スコアが 1 以上なら、コンパクションが必要という意味です。

## ここがすごい

- **単位の違う量を比べられる**: レベル 0 は「個数」、他は「バイト数」で測りますが、どちらも「上限に対する割合」に直すことで、同じ物差しで比べられます。1.0 を超えたら上限オーバー、と意味もはっきりしています。
- **レベル 0 だけ個数で測る理由**: 関数内のコメントによると、レベル 0 のファイルは互いにキー範囲が重なるので、読むたびに全ファイルを調べる必要があります。ファイルが小さくても数が多いと読み込みが遅くなるので、サイズより個数で制限するほうが目的に合っています。
- **前もって計算しておく**: 新しいバージョンを作るときに 1 回だけ計算し、結果を `compaction_score_` に保存します。「コンパクションが必要か」を調べるたびに全レベルを数え直さずに済みます。
- **10 倍ずつの階層**: 上限が 10 倍ずつ増えるので、データ量が増えてもレベルの数は対数的にしか増えません。全体の容量のほとんどは最下層にあり、各レベルが次のレベルの約 10 分の 1 になります。

## まとめ

- 単位の違う量は「上限に対する割合」に直すと比べられる。
- 測る量は目的に合わせて選ぶ（読み込みの手間にはファイル数、容量にはバイト数）。
- 何度も参照する判定結果は、状態が変わったときに 1 回だけ計算して保存しておく。
