---
title: 前のキーとの共通部分を省き、ときどき全文を書いて検索可能にする
description: LevelDB のテーブルのブロックにキーと値を追加する関数。直前のキーと重なる先頭部分を省く「前方圧縮」をしつつ、16 件ごとに全文を書く「リスタートポイント」で二分探索もできるようにする。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: table/block_builder.cc
lines: [71, 105]
function: BlockBuilder::Add
difficulty: 2
format: 2
tags: [データ構造, ファイル, 最適化]
---

## ひとことで

LevelDB のデータファイル（SSTable）は、キーを並べた 4KB ほどの「ブロック」の集まりです。並んだキーは、`user:1001`、`user:1002` のように先頭が似ていることがよくあります。
`BlockBuilder::Add` は、ブロックにキーと値を 1 組追加する関数で、**直前のキーと共通の先頭部分を省いて** 書きます（前方圧縮）。ただし一定件数ごとに省略しない「リスタートポイント」を置いて、ブロック内の検索が速くできるようにしています。

## コード

::: code-group

```cpp:line-numbers=71 [日本語訳]
void BlockBuilder::Add(const Slice& key, const Slice& value) {
  Slice last_key_piece(last_key_);
  assert(!finished_);
  assert(counter_ <= options_->block_restart_interval);
  assert(buffer_.empty()  // まだ値がない？
         || options_->comparator->Compare(key, last_key_piece) > 0);
  size_t shared = 0;
  if (counter_ < options_->block_restart_interval) {
    // 直前の文字列とどれだけ共有できるかを調べる
    const size_t min_length = std::min(last_key_piece.size(), key.size());
    while ((shared < min_length) && (last_key_piece[shared] == key[shared])) {
      shared++;
    }
  } else {
    // 圧縮をやり直す（リスタート）
    restarts_.push_back(buffer_.size());
    counter_ = 0;
  }
  const size_t non_shared = key.size() - shared;

  // "<shared><non_shared><value_size>" を buffer_ に足す
  PutVarint32(&buffer_, shared);
  PutVarint32(&buffer_, non_shared);
  PutVarint32(&buffer_, value.size());

  // キーの差分を buffer_ に足し、続けて値を足す
  buffer_.append(key.data() + shared, non_shared);
  buffer_.append(value.data(), value.size());

  // 状態を更新する
  last_key_.resize(shared);
  last_key_.append(key.data() + shared, non_shared);
  assert(Slice(last_key_) == key);
  counter_++;
}
```

```cpp:line-numbers=71 [原文]
void BlockBuilder::Add(const Slice& key, const Slice& value) {
  Slice last_key_piece(last_key_);
  assert(!finished_);
  assert(counter_ <= options_->block_restart_interval);
  assert(buffer_.empty()  // No values yet?
         || options_->comparator->Compare(key, last_key_piece) > 0);
  size_t shared = 0;
  if (counter_ < options_->block_restart_interval) {
    // See how much sharing to do with previous string
    const size_t min_length = std::min(last_key_piece.size(), key.size());
    while ((shared < min_length) && (last_key_piece[shared] == key[shared])) {
      shared++;
    }
  } else {
    // Restart compression
    restarts_.push_back(buffer_.size());
    counter_ = 0;
  }
  const size_t non_shared = key.size() - shared;

  // Add "<shared><non_shared><value_size>" to buffer_
  PutVarint32(&buffer_, shared);
  PutVarint32(&buffer_, non_shared);
  PutVarint32(&buffer_, value.size());

  // Add string delta to buffer_ followed by value
  buffer_.append(key.data() + shared, non_shared);
  buffer_.append(value.data(), value.size());

  // Update state
  last_key_.resize(shared);
  last_key_.append(key.data() + shared, non_shared);
  assert(Slice(last_key_) == key);
  counter_++;
}
```

:::

ファイル冒頭のコメントには、1 件のエントリの形式がこう書かれています。

```cpp:line-numbers=16
// 1 組のキーと値のエントリは次の形をとる:
//     shared_bytes: varint32（共通部分のバイト数）
//     unshared_bytes: varint32（共通でない部分のバイト数）
//     value_length: varint32（値の長さ）
//     key_delta: char[unshared_bytes]（キーの差分）
//     value: char[value_length]（値）
// リスタートポイントでは shared_bytes == 0。
```

## 前提知識

- **`const Slice&`**: `Slice` は「バイト列の先頭と長さ」の組です。`const&` で、コピーせず読み取り専用で受け取ります。
- **`Slice last_key_piece(last_key_);`**: `std::string` の `last_key_` を指す `Slice` を作っています。中身のコピーは起きません。
- **`options_->block_restart_interval`**: 何件ごとにリスタートポイントを置くかの設定で、既定は 16 です。
- **`PutVarint32(&buffer_, n)`**: 整数 n を varint（小さい数ほど少ないバイト数で書ける形式）で `buffer_` の末尾に足します。
- **`restarts_`**: リスタートポイントの位置（ブロック内のバイト位置）を記録する `std::vector` です。
- **`buffer_.append(p, n)`**: 文字列の末尾に、`p` から n バイトを足します。

## 何をしているか

直前のキーが `"apple"` で、次に `"applause"` と値 `"x"` を追加するとします。

### 1. 前提の確認

```cpp:line-numbers=72
  Slice last_key_piece(last_key_);
  assert(!finished_);
  assert(counter_ <= options_->block_restart_interval);
  assert(buffer_.empty()  // まだ値がない？
         || options_->comparator->Compare(key, last_key_piece) > 0);
```
ブロックがまだ閉じていないこと、キーが昇順に来ていること（直前のキーより大きいこと）を `assert` で確かめます。前方圧縮は、キーが並んでいるからこそ効きます。

### 2. 共通部分を数える

```cpp:line-numbers=77
  size_t shared = 0;
  if (counter_ < options_->block_restart_interval) {
    // 直前の文字列とどれだけ共有できるかを調べる
    const size_t min_length = std::min(last_key_piece.size(), key.size());
    while ((shared < min_length) && (last_key_piece[shared] == key[shared])) {
      shared++;
    }
```
まだリスタートの間隔に達していなければ、直前のキーと何バイト重なるかを数えます。`"apple"` と `"applause"` は `"appl"` の 4 バイトが共通なので、`shared = 4` です。

### 3. 間隔に達したら全文を書く

```cpp:line-numbers=84
  } else {
    // 圧縮をやり直す（リスタート）
    restarts_.push_back(buffer_.size());
    counter_ = 0;
  }
```
16 件ごとに、共通部分を使わず `shared = 0` のままにします。そしてこの位置を `restarts_` に記録し、カウンタを 0 に戻します。

### 4. エントリを書き込む

```cpp:line-numbers=89
  const size_t non_shared = key.size() - shared;

  // "<shared><non_shared><value_size>" を buffer_ に足す
  PutVarint32(&buffer_, shared);
  PutVarint32(&buffer_, non_shared);
  PutVarint32(&buffer_, value.size());

  // キーの差分を buffer_ に足し、続けて値を足す
  buffer_.append(key.data() + shared, non_shared);
  buffer_.append(value.data(), value.size());
```
`non_shared = 8 - 4 = 4` です。`4, 4, 1` を varint で 3 バイト書き、続けて共通でない部分 `"ause"` と値 `"x"` を書きます。キー本体は 8 バイトから 4 バイトに減りました。

### 5. 直前のキーを更新

```cpp:line-numbers=100
  // 状態を更新する
  last_key_.resize(shared);
  last_key_.append(key.data() + shared, non_shared);
  assert(Slice(last_key_) == key);
  counter_++;
```
`last_key_` を共通部分の長さで切り、残りを足して `"applause"` にします。全部コピーし直すより、共通部分を残して差分だけ足すほうが手間が少なく済みます。

## ここがすごい

- **似たキーの重複を省く**: 並べたキーは先頭が似ているので、差分だけを書くとブロックが大きく縮みます。圧縮ライブラリをかける前の段階で、安く容量を減らせます。
- **検索との両立**: 前方圧縮だけだと、あるキーを復元するには先頭から全部読む必要があります。16 件ごとに全文を書いた地点（リスタートポイント）を作り、その位置一覧をブロック末尾に置くことで、まず地点を二分探索し、その後は最大 16 件だけ順に読めば済みます。
- **間隔はトレードオフ**: 間隔を大きくすると圧縮が効きますが、検索で順に読む件数が増えます。小さくすると逆です。設定で変えられるようにしています。
- **3 つの長さを varint で**: 長さは多くが 128 未満なので、それぞれ 1 バイトで済みます。読み出し側（`DecodeEntry`）にも、3 つとも 1 バイトのときの速い経路があります。

## まとめ

- 並んだキーは、前のキーとの差分だけを書くと小さくなる（前方圧縮）。
- 差分だけだと途中から読めないので、一定間隔で全文を書く地点を作ると検索できる。
- 地点の間隔は「容量」と「検索の手間」のトレードオフ。
- 入力の前提（キーが昇順）は `assert` で確かめておく。
