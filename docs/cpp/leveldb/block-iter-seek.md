---
title: リスタート地点で二分探索し、残りは数件だけ順に読むブロック内検索
description: LevelDB のブロックの中で目的のキーを探す関数。全文が書かれたリスタート地点を二分探索で絞り込み、その後は前方圧縮されたエントリを順に読む。今の位置が使えるなら探索範囲も狭める。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: table/block.cc
lines: [164, 227]
function: Block::Iter::Seek
difficulty: 3
format: 2
tags: [探索, アルゴリズム, イテレータ]
---

## ひとことで

LevelDB のブロックでは、キーが「直前のキーとの差分」だけで書かれていて（前方圧縮）、16 件ごとに全文で書かれた「リスタートポイント」があります。
`Seek` は、指定したキー `target` 以上の最初のエントリに移動する関数です。まずリスタートポイントを **二分探索** し、そこから先は差分を復元しながら **順に読みます**。

## コード

::: code-group

```cpp:line-numbers=164 [日本語訳]
  void Seek(const Slice& target) override {
    // リスタート配列を二分探索して、キーが target より小さい
    // 最後のリスタートポイントを見つける
    uint32_t left = 0;
    uint32_t right = num_restarts_ - 1;
    int current_key_compare = 0;

    if (Valid()) {
      // すでに走査中なら、今の位置を出発点に使う。これは探すキーが
      // 今の位置より先にあるときに
      // 効果がある。
      current_key_compare = Compare(key_, target);
      if (current_key_compare < 0) {
        // key_ は target より小さい
        left = restart_index_;
      } else if (current_key_compare > 0) {
        right = restart_index_;
      } else {
        // すでにいるキーへのシークなので何もしない。
        return;
      }
    }

    while (left < right) {
      uint32_t mid = (left + right + 1) / 2;
      uint32_t region_offset = GetRestartPoint(mid);
      uint32_t shared, non_shared, value_length;
      const char* key_ptr =
          DecodeEntry(data_ + region_offset, data_ + restarts_, &shared,
                      &non_shared, &value_length);
      if (key_ptr == nullptr || (shared != 0)) {
        CorruptionError();
        return;
      }
      Slice mid_key(key_ptr, non_shared);
      if (Compare(mid_key, target) < 0) {
        // "mid" のキーは "target" より小さい。したがって
        // "mid" より前のブロックはすべて対象外。
        left = mid;
      } else {
        // "mid" のキーは "target" 以上。したがって "mid" 以降の
        // ブロックはすべて対象外。
        right = mid - 1;
      }
    }

    // 今のリスタート区間の中の現在位置を使えるかもしれない。
    // 目的のキーが今の区間にあり、しかも今のキーより
    // 後ろにあるとわかった場合がそれに当たる。
    assert(current_key_compare == 0 || Valid());
    bool skip_seek = left == restart_index_ && current_key_compare < 0;
    if (!skip_seek) {
      SeekToRestartPoint(left);
    }
    // 区間の中を線形に探し、target 以上の最初のキーを見つける
    while (true) {
      if (!ParseNextKey()) {
        return;
      }
      if (Compare(key_, target) >= 0) {
        return;
      }
    }
  }
```

```cpp:line-numbers=164 [原文]
  void Seek(const Slice& target) override {
    // Binary search in restart array to find the last restart point
    // with a key < target
    uint32_t left = 0;
    uint32_t right = num_restarts_ - 1;
    int current_key_compare = 0;

    if (Valid()) {
      // If we're already scanning, use the current position as a starting
      // point. This is beneficial if the key we're seeking to is ahead of the
      // current position.
      current_key_compare = Compare(key_, target);
      if (current_key_compare < 0) {
        // key_ is smaller than target
        left = restart_index_;
      } else if (current_key_compare > 0) {
        right = restart_index_;
      } else {
        // We're seeking to the key we're already at.
        return;
      }
    }

    while (left < right) {
      uint32_t mid = (left + right + 1) / 2;
      uint32_t region_offset = GetRestartPoint(mid);
      uint32_t shared, non_shared, value_length;
      const char* key_ptr =
          DecodeEntry(data_ + region_offset, data_ + restarts_, &shared,
                      &non_shared, &value_length);
      if (key_ptr == nullptr || (shared != 0)) {
        CorruptionError();
        return;
      }
      Slice mid_key(key_ptr, non_shared);
      if (Compare(mid_key, target) < 0) {
        // Key at "mid" is smaller than "target".  Therefore all
        // blocks before "mid" are uninteresting.
        left = mid;
      } else {
        // Key at "mid" is >= "target".  Therefore all blocks at or
        // after "mid" are uninteresting.
        right = mid - 1;
      }
    }

    // We might be able to use our current position within the restart block.
    // This is true if we determined the key we desire is in the current block
    // and is after than the current key.
    assert(current_key_compare == 0 || Valid());
    bool skip_seek = left == restart_index_ && current_key_compare < 0;
    if (!skip_seek) {
      SeekToRestartPoint(left);
    }
    // Linear search (within restart block) for first key >= target
    while (true) {
      if (!ParseNextKey()) {
        return;
      }
      if (Compare(key_, target) >= 0) {
        return;
      }
    }
  }
```

:::

## 前提知識

- **イテレータ**: データを 1 件ずつ順に辿るためのオブジェクトです。`Block::Iter` はブロックの中を辿るイテレータで、`key_` に今のキー、`restart_index_` に今いる区間の番号を持っています。
- **`override`**: 親クラス `Iterator` の仮想関数 `Seek` を上書きしていることを表します。
- **`Valid()`**: 今どこかのエントリを指しているかを返します。
- **`Compare(a, b)`**: キーを比べ、a が小さければ負、等しければ 0、大きければ正を返します。
- **`GetRestartPoint(i)`**: i 番目のリスタートポイントの、ブロック内での位置を返します。
- **`DecodeEntry`**: エントリの先頭から、共通部分の長さ・残りのキーの長さ・値の長さを読む関数です。
- **`ParseNextKey()`**: 次のエントリを読み、差分から `key_` を復元します。もう無ければ `false` です。

## 何をしているか

リスタートポイントが 4 つ（0〜3）あり、それぞれの先頭キーが `"a"`、`"g"`、`"m"`、`"t"` だとします。`target = "k"` を探します。

### 1. 今の位置を手がかりにする

```cpp:line-numbers=167
    uint32_t left = 0;
    uint32_t right = num_restarts_ - 1;
    int current_key_compare = 0;

    if (Valid()) {
      // すでに走査中なら、今の位置を出発点に使う。これは探すキーが
      // 今の位置より先にあるときに
      // 効果がある。
      current_key_compare = Compare(key_, target);
      if (current_key_compare < 0) {
        // key_ は target より小さい
        left = restart_index_;
      } else if (current_key_compare > 0) {
        right = restart_index_;
      } else {
        // すでにいるキーへのシークなので何もしない。
        return;
      }
    }
```
探索範囲は区間 0〜3 です。すでにどこかを指していれば、今のキー `key_` と `target` を比べます。
今のキーが小さければ、目的地は今の区間以降なので `left` を今の区間にします。大きければ `right` を今の区間にします。ちょうど同じなら何もしません。
ここでは何も指していないとします。

### 2. リスタートポイントを二分探索

```cpp:line-numbers=187
    while (left < right) {
      uint32_t mid = (left + right + 1) / 2;
      uint32_t region_offset = GetRestartPoint(mid);
      uint32_t shared, non_shared, value_length;
      const char* key_ptr =
          DecodeEntry(data_ + region_offset, data_ + restarts_, &shared,
                      &non_shared, &value_length);
      if (key_ptr == nullptr || (shared != 0)) {
        CorruptionError();
        return;
      }
      Slice mid_key(key_ptr, non_shared);
      if (Compare(mid_key, target) < 0) {
        // "mid" のキーは "target" より小さい。したがって
        // "mid" より前のブロックはすべて対象外。
        left = mid;
      } else {
        // "mid" のキーは "target" 以上。したがって "mid" 以降の
        // ブロックはすべて対象外。
        right = mid - 1;
      }
    }
```
目標は「先頭キーが `target` より小さい最後の区間」です。

- `left = 0, right = 3`: `mid = (0 + 3 + 1) / 2 = 2`。区間 2 の先頭 `"m"` は `"k"` 以上なので `right = 1`。
- `left = 0, right = 1`: `mid = 1`。区間 1 の先頭 `"g"` は `"k"` より小さいので `left = 1`。
- `left == right` で終了。区間 1 に決まりました。

リスタートポイントのエントリは全文で書かれているので、`DecodeEntry` で読んだキーをそのまま比べられます。`shared != 0` なら全文のはずの場所が壊れているので、エラーにします。

```cpp:line-numbers=194
      if (key_ptr == nullptr || (shared != 0)) {
        CorruptionError();
        return;
      }
```

### 3. 区間の中を順に読む

```cpp:line-numbers=210
    // 今のリスタート区間の中の現在位置を使えるかもしれない。
    // 目的のキーが今の区間にあり、しかも今のキーより
    // 後ろにあるとわかった場合がそれに当たる。
    assert(current_key_compare == 0 || Valid());
    bool skip_seek = left == restart_index_ && current_key_compare < 0;
    if (!skip_seek) {
      SeekToRestartPoint(left);
    }
    // 区間の中を線形に探し、target 以上の最初のキーを見つける
    while (true) {
      if (!ParseNextKey()) {
        return;
      }
      if (Compare(key_, target) >= 0) {
        return;
      }
    }
```
区間 1 の先頭に移り、`ParseNextKey()` でキーを 1 件ずつ復元します。`"k"` 以上のキーが出たらそこで止まります。区間は最大 16 件なので、読む量は限られます。
すでに同じ区間の手前にいたなら（`skip_seek`）、先頭に戻らず今の位置から読み進めます。

## ここがすごい

- **前方圧縮と二分探索の両立**: 差分だけで書かれたデータは途中から読めません。全文を書いた地点だけを二分探索の対象にすることで、圧縮の効果をほぼ保ったまま、O(log n) で目的の近くに飛べます。
- **`mid` を切り上げる理由**: `left = mid` と更新する二分探索で、`mid = (left + right) / 2`（切り捨て）にすると、`left + 1 == right` のとき `mid == left` となって永遠に進みません。`+ 1` で切り上げることで、必ず範囲が縮みます。
- **今の位置を再利用する**: 順に少しずつ先のキーを `Seek` する使い方では、探索範囲が狭まり、場合によっては区間の先頭に戻ることすら省けます。`Valid()` の分岐に付いたコメントにその狙いが書かれています。
- **壊れたデータを検出**: リスタートポイントなのに `shared != 0` というありえない状態を見つけたら、すぐにエラーにします。

## まとめ

- 圧縮されたデータを検索するには、圧縮していない「目印」を一定間隔で置き、目印で二分探索するとよい。
- `left = mid` 型の二分探索では、`mid` を切り上げないと無限ループになる。
- 連続した検索では、今の位置を手がかりに範囲を狭めると速くなる。
- 構造上ありえない値は、壊れたデータの兆候として検出する。
