---
title: 2 つのキーの「間」に入る最短の文字列を作って索引を小さくする
description: LevelDB のバイト比較器が、テーブルの索引に書くキーを短くするために使う関数。共通部分の次の 1 バイトを 1 増やして切り詰め、start 以上 limit 未満の短い区切りを作る。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/comparator.cc
lines: [31, 52]
function: BytewiseComparatorImpl::FindShortestSeparator
difficulty: 2
format: 2
tags: [文字列処理, 最適化, アルゴリズム]
---

## ひとことで

LevelDB のテーブルファイルは、データを 4KB ほどのブロックに分け、索引に「このブロックのキーはこの値以下」という区切りのキーを書きます。
`FindShortestSeparator` は、前のブロックの最後のキー `start` と、次のブロックの最初のキー `limit` の **間に入る、なるべく短い文字列** を作る関数です。区切りが短いほど、索引が小さくなります。

## コード

::: code-group

```cpp:line-numbers=31 [日本語訳]
  void FindShortestSeparator(std::string* start,
                             const Slice& limit) const override {
    // 共通の先頭部分の長さを求める
    size_t min_length = std::min(start->size(), limit.size());
    size_t diff_index = 0;
    while ((diff_index < min_length) &&
           ((*start)[diff_index] == limit[diff_index])) {
      diff_index++;
    }

    if (diff_index >= min_length) {
      // 一方が他方の先頭部分そのものなら短くしない
    } else {
      uint8_t diff_byte = static_cast<uint8_t>((*start)[diff_index]);
      if (diff_byte < static_cast<uint8_t>(0xff) &&
          diff_byte + 1 < static_cast<uint8_t>(limit[diff_index])) {
        (*start)[diff_index]++;
        start->resize(diff_index + 1);
        assert(Compare(*start, limit) < 0);
      }
    }
  }
```

```cpp:line-numbers=31 [原文]
  void FindShortestSeparator(std::string* start,
                             const Slice& limit) const override {
    // Find length of common prefix
    size_t min_length = std::min(start->size(), limit.size());
    size_t diff_index = 0;
    while ((diff_index < min_length) &&
           ((*start)[diff_index] == limit[diff_index])) {
      diff_index++;
    }

    if (diff_index >= min_length) {
      // Do not shorten if one string is a prefix of the other
    } else {
      uint8_t diff_byte = static_cast<uint8_t>((*start)[diff_index]);
      if (diff_byte < static_cast<uint8_t>(0xff) &&
          diff_byte + 1 < static_cast<uint8_t>(limit[diff_index])) {
        (*start)[diff_index]++;
        start->resize(diff_index + 1);
        assert(Compare(*start, limit) < 0);
      }
    }
  }
```

:::

## 前提知識

- **`std::string* start`**: 書き換え可能な文字列へのポインタです。この関数は `start` をその場で短く書き換えます。
- **`const Slice& limit`**: `Slice` は「バイト列の先頭と長さ」の組で、`const&` はコピーせず読み取り専用で受け取る指定です。
- **`(*start)[i]`**: ポインタ `start` の指す文字列の i 番目の文字です。`*start` で文字列そのものを取り出してから `[]` を使います。
- **`std::min(a, b)`**: 小さいほうを返す標準ライブラリの関数です。
- **`static_cast<uint8_t>(c)`**: 文字を 0〜255 の符号なしの数として扱います。`char` は環境によって符号付き（−128〜127）なので、大小比較の前にそろえています。
- **`resize(n)`**: 文字列の長さを n にします。短くすれば後ろが切り捨てられます。
- **`override` と `const`**: 親クラス `Comparator` の仮想関数を上書きしていること、オブジェクトの状態を変えないことを表します。

## 何をしているか

`start = "the quick brown fox"`、`limit = "the who"` で追います。

### 1. 共通の先頭部分を数える

```cpp:line-numbers=33
    // 共通の先頭部分の長さを求める
    size_t min_length = std::min(start->size(), limit.size());
    size_t diff_index = 0;
    while ((diff_index < min_length) &&
           ((*start)[diff_index] == limit[diff_index])) {
      diff_index++;
    }
```
先頭から 1 文字ずつ比べます。`"the "` までの 4 文字が同じで、5 文字目で `'q'` と `'w'` が違います。`diff_index = 4` です。

### 2. 一方が他方の先頭そのものなら何もしない

```cpp:line-numbers=41
    if (diff_index >= min_length) {
      // 一方が他方の先頭部分そのものなら短くしない
```
`start = "abc"`、`limit = "abcd"` のように、短いほうが全部一致したら、間に入る短い文字列は作れないので、そのままにします。

### 3. 違う 1 バイトを 1 増やして切る

```cpp:line-numbers=44
      uint8_t diff_byte = static_cast<uint8_t>((*start)[diff_index]);
      if (diff_byte < static_cast<uint8_t>(0xff) &&
          diff_byte + 1 < static_cast<uint8_t>(limit[diff_index])) {
        (*start)[diff_index]++;
        start->resize(diff_index + 1);
        assert(Compare(*start, limit) < 0);
      }
```
`'q'`（0x71）に 1 を足した `'r'`（0x72）は、`'w'`（0x77）より小さいので条件を満たします。
`start` の 5 文字目を `'r'` にして、長さを 5 に切り詰めます。結果は `"the r"` です。
`"the quick brown fox" <= "the r" < "the who"` が成り立ち、19 文字が 5 文字になりました。

条件が満たされない例も見ておきます。`start = "abc"`、`limit = "abd"` では `'c' + 1 = 'd'` が `limit` の文字と同じになり、`limit` 未満になりません。この場合は何もしません。差の 1 バイトが `0xff` のときも、1 を足すとあふれるので何もしません。

## ここがすごい

- **索引を小さくする**: テーブルの索引はブロックの数だけキーを持ち、読み込み時にメモリに載ります。長いキーをそのまま区切りに使う代わりに短い区切りを使えば、索引のサイズとメモリ使用量が減ります。区切りは「前のブロックの最後のキー以上、次のブロックの最初のキー未満」でありさえすれば、検索は正しく動きます。
- **失敗しても困らない設計**: 短くできないときは `start` をそのまま残します。それでも区切りとしては正しいので、関数は「できるときだけ最適化する」作りです。
- **自分を `assert` で確かめる**: 書き換えた直後に、作った区切りが本当に `limit` 未満かを確かめています。

```cpp:line-numbers=49
        assert(Compare(*start, limit) < 0);
```
- **比較器ごとに差し替えられる**: この関数は `Comparator` の仮想関数です。キーの並べ方を変える利用者は、自分の比較器に合った区切りの作り方を実装できます。

## まとめ

- 2 つのキーを分ける区切りは、どちらかのキーそのものでなくてもよい。
- 共通の先頭部分の次の 1 バイトを 1 増やして切れば、短い区切りが作れる。
- 最適化できないときは元のまま返せば、正しさは保たれる。
- バイトの大小比較では、`char` を符号なしにそろえてから比べる。
