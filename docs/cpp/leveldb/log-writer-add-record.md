---
title: 32KB のブロックをまたぐレコードを First・Middle・Last に分けて書く
description: LevelDB の書き込みログにレコードを追加する関数。固定長ブロックに収まらないレコードを断片に分け、それぞれに種類を付けて書くことで、壊れた箇所があっても次のブロックから読み直せるようにする。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: db/log_writer.cc
lines: [34, 80]
function: log::Writer::AddRecord
difficulty: 2
format: 2
tags: [ファイル, 入出力, 防御的プログラミング]
---

## ひとことで

LevelDB は、書き込みを受け付けるたびに、その内容をまずログファイルに追記します。クラッシュしても、このログから復元できます。
ログファイルは **32KB の固定長ブロック** の並びです。`AddRecord` は、1 件のレコードをブロックに書き込む関数で、ブロックに入りきらないときは断片に分け、`First`・`Middle`・`Last` という種類を付けて書きます。

## コード

::: code-group

```cpp:line-numbers=34 [日本語訳]
Status Writer::AddRecord(const Slice& slice) {
  const char* ptr = slice.data();
  size_t left = slice.size();

  // 必要ならレコードを断片に分けて書き出す。なお slice が空でも、
  // 長さ 0 のレコードを 1 つ書き出すために
  // ループは 1 回まわしたい
  Status s;
  bool begin = true;
  do {
    const int leftover = kBlockSize - block_offset_;
    assert(leftover >= 0);
    if (leftover < kHeaderSize) {
      // 新しいブロックに切り替える
      if (leftover > 0) {
        // ブロックの残りを埋める（下のリテラルは kHeaderSize が 7 であることに依存）
        static_assert(kHeaderSize == 7, "");
        dest_->Append(Slice("\x00\x00\x00\x00\x00\x00", leftover));
      }
      block_offset_ = 0;
    }

    // 不変条件: ブロックに kHeaderSize 未満のバイトを残すことはない。
    assert(kBlockSize - block_offset_ - kHeaderSize >= 0);

    const size_t avail = kBlockSize - block_offset_ - kHeaderSize;
    const size_t fragment_length = (left < avail) ? left : avail;

    RecordType type;
    const bool end = (left == fragment_length);
    if (begin && end) {
      type = kFullType;
    } else if (begin) {
      type = kFirstType;
    } else if (end) {
      type = kLastType;
    } else {
      type = kMiddleType;
    }

    s = EmitPhysicalRecord(type, ptr, fragment_length);
    ptr += fragment_length;
    left -= fragment_length;
    begin = false;
  } while (s.ok() && left > 0);
  return s;
}
```

```cpp:line-numbers=34 [原文]
Status Writer::AddRecord(const Slice& slice) {
  const char* ptr = slice.data();
  size_t left = slice.size();

  // Fragment the record if necessary and emit it.  Note that if slice
  // is empty, we still want to iterate once to emit a single
  // zero-length record
  Status s;
  bool begin = true;
  do {
    const int leftover = kBlockSize - block_offset_;
    assert(leftover >= 0);
    if (leftover < kHeaderSize) {
      // Switch to a new block
      if (leftover > 0) {
        // Fill the trailer (literal below relies on kHeaderSize being 7)
        static_assert(kHeaderSize == 7, "");
        dest_->Append(Slice("\x00\x00\x00\x00\x00\x00", leftover));
      }
      block_offset_ = 0;
    }

    // Invariant: we never leave < kHeaderSize bytes in a block.
    assert(kBlockSize - block_offset_ - kHeaderSize >= 0);

    const size_t avail = kBlockSize - block_offset_ - kHeaderSize;
    const size_t fragment_length = (left < avail) ? left : avail;

    RecordType type;
    const bool end = (left == fragment_length);
    if (begin && end) {
      type = kFullType;
    } else if (begin) {
      type = kFirstType;
    } else if (end) {
      type = kLastType;
    } else {
      type = kMiddleType;
    }

    s = EmitPhysicalRecord(type, ptr, fragment_length);
    ptr += fragment_length;
    left -= fragment_length;
    begin = false;
  } while (s.ok() && left > 0);
  return s;
}
```

:::

定数は `db/log_format.h` で次のように決まっています。

<!-- source: db/log_format.h -->
```cpp:line-numbers=27
static const int kBlockSize = 32768;

// ヘッダはチェックサム（4 バイト）、長さ（2 バイト）、種類（1 バイト）。
static const int kHeaderSize = 4 + 2 + 1;
```

## 前提知識

- **`Status`**: LevelDB の「成功か、失敗ならその理由」を表す型です。`s.ok()` で成功かどうかを調べます。
- **`do { ... } while (条件);`**: 本体を先に 1 回実行してから条件を調べるループです。条件が最初から偽でも、1 回は実行されます。
- **`block_offset_`**: 今のブロックの中で、次に書く位置です。
- **`dest_->Append(...)`**: ファイルの末尾にデータを足します。`dest_` は書き込み先ファイルを表すオブジェクトへのポインタです。
- **`Slice("\x00\x00...", leftover)`**: 0 のバイトが並んだ文字列のうち、先頭の `leftover` バイトだけを指します。`\x00` は値が 0 の 1 バイトです。
- **`static_assert`**: コンパイル時の確認です。ここでは「0 の並びは 6 バイトで足りる」という前提を固定しています。

## 何をしているか

今のブロックの位置が 32760 で、70000 バイトのレコードを書くとします。

### 1. 残りがヘッダより小さければ次のブロックへ

```cpp:line-numbers=44
    const int leftover = kBlockSize - block_offset_;
    assert(leftover >= 0);
    if (leftover < kHeaderSize) {
      // 新しいブロックに切り替える
      if (leftover > 0) {
        // ブロックの残りを埋める（下のリテラルは kHeaderSize が 7 であることに依存）
        static_assert(kHeaderSize == 7, "");
        dest_->Append(Slice("\x00\x00\x00\x00\x00\x00", leftover));
      }
      block_offset_ = 0;
    }
```
残りは `32768 - 32760 = 8` バイトです。ヘッダ（7 バイト）は入るので、そのまま進みます。
もし残りが 1〜6 バイトなら、ヘッダすら入りません。その隙間を 0 で埋めて、次のブロックの先頭（`block_offset_ = 0`）から書きます。0 の文字列は最大 6 バイトあれば足りる、という前提を `static_assert(kHeaderSize == 7, "")` が守っています。

### 2. 今回書ける長さを決める

```cpp:line-numbers=59
    const size_t avail = kBlockSize - block_offset_ - kHeaderSize;
    const size_t fragment_length = (left < avail) ? left : avail;
```
使えるのは `8 - 7 = 1` バイトです。1 回目の断片は 1 バイトになります。

### 3. 種類を決める

```cpp:line-numbers=62
    RecordType type;
    const bool end = (left == fragment_length);
    if (begin && end) {
      type = kFullType;
    } else if (begin) {
      type = kFirstType;
    } else if (end) {
      type = kLastType;
    } else {
      type = kMiddleType;
    }
```
最初の断片で、まだ続きがあるので `kFirstType` です。
2 回目は新しいブロックで `32768 - 7 = 32761` バイト書けるので `kMiddleType`、3 回目に残りの 37238 バイトを書いて `kLastType` になります。1 回で書き切れるレコードは `kFullType` です。

### 4. 書いて進める

```cpp:line-numbers=74
    s = EmitPhysicalRecord(type, ptr, fragment_length);
    ptr += fragment_length;
    left -= fragment_length;
    begin = false;
  } while (s.ok() && left > 0);
```
断片を `EmitPhysicalRecord` で書き、ポインタと残りの長さを進めます。書き込みに失敗するか、全部書き終わったらループを抜けます。
長さ 0 のレコードでも、`do-while` なので 1 回は回り、長さ 0 の `kFullType` が 1 件書かれます（関数冒頭のコメントのとおりです）。

## ここがすごい

- **固定長ブロックで壊れても立ち直れる**: ログの一部が壊れても、32KB の境目は必ずわかります。読む側は壊れたブロックを飛ばし、次のブロックから読み直せます。可変長のレコードを単純に並べると、1 か所壊れただけで、それ以降の境目がわからなくなってしまいます。
- **断片の種類で組み立て直せる**: `First`、`Middle`、`Last` を見れば、読む側は断片をつなげて元のレコードに戻せます。途中の断片が壊れていれば、そのレコードだけを捨てられます。
- **ヘッダを分割しない**: 「ブロックの残りが 7 バイト未満なら必ず埋める」という不変条件（`Invariant` のコメント）を守ることで、ヘッダが 2 つのブロックにまたがることがありません。読む側の処理が単純になります。
- **空のレコードも正しく扱う**: `while` ではなく `do-while` を選ぶだけで、長さ 0 の特別扱いが要りません。

## まとめ

- ログを固定長ブロックに区切ると、壊れた箇所の後から読み直せる。
- ブロックに入りきらないデータは、種類付きの断片に分けると組み立て直せる。
- 「ヘッダは分割しない」のような不変条件を決め、隙間は埋めて守る。
- 「最低 1 回は実行したい」処理には `do-while` が合う。
