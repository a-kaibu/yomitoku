---
title: 「最大キーが目的以上の最初のファイル」を二分探索で見つける
description: LevelDB で、キー範囲が重ならずに並んだファイル一覧から、目的のキーが入りうるファイルを探す関数。各ファイルの最大キーだけを見て、境界を探す形の二分探索を行う。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: db/version_set.cc
lines: [87, 105]
function: FindFile
difficulty: 1
format: 2
tags: [探索, アルゴリズム, データ構造]
---

## ひとことで

LevelDB のデータは「レベル」ごとに複数のファイルに分かれています。レベル 1 以降では、各ファイルのキーの範囲が重ならず、キーの順に並んでいます。
`FindFile` は、その一覧から **最大キーが `key` 以上である最初のファイル** の番号を二分探索で求める関数です。`key` が入っている可能性があるのは、このファイルだけです。

## コード

::: code-group

```cpp:line-numbers=87 [日本語訳]
int FindFile(const InternalKeyComparator& icmp,
             const std::vector<FileMetaData*>& files, const Slice& key) {
  uint32_t left = 0;
  uint32_t right = files.size();
  while (left < right) {
    uint32_t mid = (left + right) / 2;
    const FileMetaData* f = files[mid];
    if (icmp.InternalKeyComparator::Compare(f->largest.Encode(), key) < 0) {
      // "mid.largest" のキーは "target" より小さい。したがって
      // "mid" 以前のファイルはすべて対象外。
      left = mid + 1;
    } else {
      // "mid.largest" のキーは "target" 以上。したがって
      // "mid" より後のファイルはすべて対象外。
      right = mid;
    }
  }
  return right;
}
```

```cpp:line-numbers=87 [原文]
int FindFile(const InternalKeyComparator& icmp,
             const std::vector<FileMetaData*>& files, const Slice& key) {
  uint32_t left = 0;
  uint32_t right = files.size();
  while (left < right) {
    uint32_t mid = (left + right) / 2;
    const FileMetaData* f = files[mid];
    if (icmp.InternalKeyComparator::Compare(f->largest.Encode(), key) < 0) {
      // Key at "mid.largest" is < "target".  Therefore all
      // files at or before "mid" are uninteresting.
      left = mid + 1;
    } else {
      // Key at "mid.largest" is >= "target".  Therefore all files
      // after "mid" are uninteresting.
      right = mid;
    }
  }
  return right;
}
```

:::

## 前提知識

- **`const std::vector<FileMetaData*>&`**: ファイル情報（`FileMetaData`）へのポインタを並べた可変長配列を、コピーせず読み取り専用で受け取っています。`FileMetaData` には、ファイルの最小キー `smallest` と最大キー `largest` が入っています。
- **`InternalKeyComparator`**: LevelDB 内部のキー（利用者のキー + 連番 + 種類）を比べる比較器です。
- **`icmp.InternalKeyComparator::Compare(...)`**: クラス名を付けて呼ぶと、仮想関数の仕組みを通らず、そのクラスの関数を直接呼びます。呼び出し先が決まっているので、コンパイラが最適化しやすくなります。
- **`f->largest.Encode()`**: 最大キーを、比較に使えるバイト列の形で返します。
- **`uint32_t`**: 32 ビットの符号なし整数です。

## 何をしているか

ファイルが 4 つあり、それぞれの最大キーが `"c"`、`"f"`、`"k"`、`"p"` だとします。`key = "h"` を探します。

### 1. 範囲を [0, 4] にする

```cpp:line-numbers=89
  uint32_t left = 0;
  uint32_t right = files.size();
```

`right` はファイル数の 4 です。「答えは `left` 以上 `right` 未満」ではなく、「答えは `left` 以上 `right` 以下」で、`right = 4` は「どのファイルにもない」を意味します。

### 2. 半分ずつ絞る

```cpp:line-numbers=91
  while (left < right) {
    uint32_t mid = (left + right) / 2;
    const FileMetaData* f = files[mid];
    if (icmp.InternalKeyComparator::Compare(f->largest.Encode(), key) < 0) {
      // "mid.largest" のキーは "target" より小さい。したがって
      // "mid" 以前のファイルはすべて対象外。
      left = mid + 1;
    } else {
      // "mid.largest" のキーは "target" 以上。したがって
      // "mid" より後のファイルはすべて対象外。
      right = mid;
    }
  }
```
- `mid = 2`: 最大キー `"k"` は `"h"` 以上なので、答えは 2 以下。`right = 2`。
- `mid = 1`: 最大キー `"f"` は `"h"` より小さいので、ファイル 0〜1 は対象外。`left = 2`。
- `left == right` なので終了。

### 3. 答えを返す

```cpp:line-numbers=104
  return right;
```
2 を返します。ファイル 2 の最大キーは `"k"` で、`"h"` が入っているならこのファイルです。
`key = "z"` なら、すべてのファイルの最大キーより大きいので、4（ファイル数）が返ります。呼び出し側は「見つからない」と判断できます。

## ここがすごい

- **境界を探す二分探索**: 「等しいものを探す」二分探索は、見つからないときの扱いが面倒です。ここでは「条件（最大キー ≥ key）を満たす最初の位置」を探すので、ループの中に「見つかった」分岐がありません。最後は必ず `left == right` で止まり、それが答えになります。
- **最大キーだけで足りる**: ファイルの範囲は重ならず昇順なので、「最大キーが `key` 以上の最初のファイル」より前のファイルには、`key` は絶対にありません。最小キーとの比較は、呼び出し側が必要なときにだけ行います。
- **見つからないを範囲外で表す**: `files.size()` を返すことで、特別な値（−1 など）を使わずに「該当なし」を表しています。C++ 標準の `std::lower_bound` と同じ約束です。
- **仮想呼び出しを避ける**: クラス名付きの呼び出しで、多くの比較を行うループの中のコストを抑えています。

## まとめ

- 重ならずに並んだ区間の一覧は、各区間の最大値だけで二分探索できる。
- 「条件を満たす最初の位置」を探す形にすると、二分探索がすっきり書ける。
- 「該当なし」を一覧の長さで表すと、特別な値がいらない。
