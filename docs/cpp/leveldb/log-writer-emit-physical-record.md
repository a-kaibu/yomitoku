---
title: 種類 1 バイトの CRC を前もって計算し、ヘッダ込みの検査を安く済ませる
description: LevelDB の書き込みログに 1 つの断片を書く関数。7 バイトのヘッダを組み立て、レコード種類とデータの両方を覆う CRC を、種類ごとに事前計算した値の続きとして求める。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: db/log_writer.cc
lines: [82, 108]
function: log::Writer::EmitPhysicalRecord
difficulty: 2
format: 2
tags: [ファイル, 入出力, 最適化]
---

## ひとことで

`EmitPhysicalRecord` は、LevelDB の書き込みログ（クラッシュからの復元に使うファイル）に、1 つの断片を「ヘッダ + データ」の形で書き込む関数です。
ヘッダは 7 バイトで、CRC（壊れていないか確かめる検査値）4 バイト、長さ 2 バイト、種類 1 バイトからなります。CRC は **種類とデータの両方** を対象に計算しますが、種類の分はあらかじめ計算しておいた値を使います。

## コード

::: code-group

```cpp:line-numbers=82 [日本語訳]
Status Writer::EmitPhysicalRecord(RecordType t, const char* ptr,
                                  size_t length) {
  assert(length <= 0xffff);  // 2 バイトに収まらなければならない
  assert(block_offset_ + kHeaderSize + length <= kBlockSize);

  // ヘッダを組み立てる
  char buf[kHeaderSize];
  buf[4] = static_cast<char>(length & 0xff);
  buf[5] = static_cast<char>(length >> 8);
  buf[6] = static_cast<char>(t);

  // レコードの種類とデータの crc を計算する。
  uint32_t crc = crc32c::Extend(type_crc_[t], ptr, length);
  crc = crc32c::Mask(crc);  // 保存用に変形する
  EncodeFixed32(buf, crc);

  // ヘッダとデータを書く
  Status s = dest_->Append(Slice(buf, kHeaderSize));
  if (s.ok()) {
    s = dest_->Append(Slice(ptr, length));
    if (s.ok()) {
      s = dest_->Flush();
    }
  }
  block_offset_ += kHeaderSize + length;
  return s;
}
```

```cpp:line-numbers=82 [原文]
Status Writer::EmitPhysicalRecord(RecordType t, const char* ptr,
                                  size_t length) {
  assert(length <= 0xffff);  // Must fit in two bytes
  assert(block_offset_ + kHeaderSize + length <= kBlockSize);

  // Format the header
  char buf[kHeaderSize];
  buf[4] = static_cast<char>(length & 0xff);
  buf[5] = static_cast<char>(length >> 8);
  buf[6] = static_cast<char>(t);

  // Compute the crc of the record type and the payload.
  uint32_t crc = crc32c::Extend(type_crc_[t], ptr, length);
  crc = crc32c::Mask(crc);  // Adjust for storage
  EncodeFixed32(buf, crc);

  // Write the header and the payload
  Status s = dest_->Append(Slice(buf, kHeaderSize));
  if (s.ok()) {
    s = dest_->Append(Slice(ptr, length));
    if (s.ok()) {
      s = dest_->Flush();
    }
  }
  block_offset_ += kHeaderSize + length;
  return s;
}
```

:::

種類ごとの CRC は、ライターを作るときに計算されます。

```cpp:line-numbers=16
static void InitTypeCrc(uint32_t* type_crc) {
  for (int i = 0; i <= kMaxRecordType; i++) {
    char t = static_cast<char>(i);
    type_crc[i] = crc32c::Value(&t, 1);
  }
}
```

## 前提知識

- **`RecordType t`**: 断片の種類（`kFullType = 1`、`kFirstType = 2`、`kMiddleType = 3`、`kLastType = 4`）を表す列挙型（`enum`）です。
- **`char buf[kHeaderSize];`**: 7 バイトの配列を関数の中（スタック）に用意しています。
- **`length & 0xff` / `length >> 8`**: 長さの下位 8 ビットと、その上の 8 ビットです。2 バイトに分けて書きます。
- **`crc32c::Extend(crc, p, n)`**: すでに計算済みの CRC に、続きのデータ `p` の n バイトを足し込んだ CRC を返します。CRC は先頭から順に計算するので、途中から続けられます。
- **`crc32c::Mask`**: CRC をそのまま保存せず、回転と加算で変形する関数です。
- **`EncodeFixed32(buf, crc)`**: 32 ビットの値をリトルエンディアン（下位バイトが先）で 4 バイトに書きます。

## 何をしているか

種類 `kFullType`、長さ 300 バイトのデータを書くとします。

### 1. 前提の確認

```cpp:line-numbers=84
  assert(length <= 0xffff);  // 2 バイトに収まらなければならない
  assert(block_offset_ + kHeaderSize + length <= kBlockSize);
```
長さは 2 バイトで表せる 65535 以下であること、ブロック（32KB）からはみ出さないことを確かめます。

### 2. 長さと種類を書く

```cpp:line-numbers=88
  char buf[kHeaderSize];
  buf[4] = static_cast<char>(length & 0xff);
  buf[5] = static_cast<char>(length >> 8);
  buf[6] = static_cast<char>(t);
```
300 は `0x012C` なので、`buf[4] = 0x2C`、`buf[5] = 0x01`、`buf[6] = 1` です。0〜3 バイト目は後で CRC が入ります。

### 3. CRC を計算する

```cpp:line-numbers=93
  // レコードの種類とデータの crc を計算する。
  uint32_t crc = crc32c::Extend(type_crc_[t], ptr, length);
  crc = crc32c::Mask(crc);  // 保存用に変形する
  EncodeFixed32(buf, crc);
```
`type_crc_[1]` は「種類の 1 バイト（`0x01`）だけの CRC」で、作成時に計算済みです。これにデータ 300 バイトを `Extend` で足し込めば、「種類 1 バイト + データ」全体の CRC になります。
これをマスクして、ヘッダの先頭 4 バイトに書きます。

### 4. 書き込んで位置を進める

```cpp:line-numbers=98
  // ヘッダとデータを書く
  Status s = dest_->Append(Slice(buf, kHeaderSize));
  if (s.ok()) {
    s = dest_->Append(Slice(ptr, length));
    if (s.ok()) {
      s = dest_->Flush();
    }
  }
  block_offset_ += kHeaderSize + length;
  return s;
```
ヘッダ、データの順に追記し、成功したらフラッシュ（書き込みをバッファからファイルへ送り出す処理）します。最後に、ブロック内の位置を `7 + 300` だけ進めます。

## ここがすごい

- **種類も守る**: CRC がデータだけを対象にしていると、種類の 1 バイトが壊れても気づけません。種類を含めて計算すれば、`First` が `Last` に化けたような壊れ方も検出できます。
- **それでいて安い**: 「種類 + データ」をつなげたバッファを作ると、コピーが必要です。CRC は続きから計算できる性質があるので、種類の分を最初に計算しておき、データだけを足し込めば済みます。種類は 5 種類しかないので、表は 5 個の数で足ります。
- **固定長ヘッダ**: ヘッダは常に 7 バイトです。長さを varint（可変長の整数）にすることもできますが、固定長だと「ヘッダを分割しない」という規則で簡単に扱えます。断片はブロック（32KB）を超えないので、2 バイトの長さで足ります。
- **マスクして保存**: CRC をそのまま書かず `Mask` を通すので、CRC を含むデータにさらに CRC をかけるような場面でも問題が起きません。

## まとめ

- 検査値は、データだけでなく、その解釈に使う情報（種類など）も対象にする。
- CRC は途中から計算を続けられるので、固定の前置き部分は事前に計算しておける。
- 値の種類が少なければ、小さな表に結果を前もって入れておくとよい。
- ヘッダを固定長にすると、書き込みと読み出しの規則が単純になる。
