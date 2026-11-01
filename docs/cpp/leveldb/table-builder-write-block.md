---
title: 12.5% 以上縮まないなら圧縮をやめるブロック書き込み
description: LevelDB の SSTable にデータブロックを書く関数。Snappy や Zstd で圧縮を試し、元の 8 分の 7 より小さくならなければ圧縮しない形で保存して、読み出し時の展開コストを省く。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: table/table_builder.cc
lines: [141, 190]
function: TableBuilder::WriteBlock
difficulty: 2
format: 2
tags: [ファイル, 最適化, 設計パターン]
---

## ひとことで

`TableBuilder::WriteBlock` は、LevelDB のデータファイル（SSTable）に、組み立て終わったブロック（キーと値を詰めた 4KB ほどの塊）を書き出す関数です。
設定に従って圧縮を試しますが、**圧縮しても 12.5% 以上小さくならなければ、圧縮しないまま保存** します。ブロックには「どう保存したか」の種類が記録されるので、読む側は迷いません。

## コード

::: code-group

```cpp:line-numbers=141 [日本語訳]
void TableBuilder::WriteBlock(BlockBuilder* block, BlockHandle* handle) {
  // ファイルはブロックの並びで、各ブロックは次の形:
  //    block_data: uint8[n]（ブロックの中身）
  //    type: uint8（圧縮の種類）
  //    crc: uint32（検査値）
  assert(ok());
  Rep* r = rep_;
  Slice raw = block->Finish();

  Slice block_contents;
  CompressionType type = r->options.compression;
  // TODO(リリース後): ほかの圧縮方式にも対応する。zlib とか？
  switch (type) {
    case kNoCompression:
      block_contents = raw;
      break;

    case kSnappyCompression: {
      std::string* compressed = &r->compressed_output;
      if (port::Snappy_Compress(raw.data(), raw.size(), compressed) &&
          compressed->size() < raw.size() - (raw.size() / 8u)) {
        block_contents = *compressed;
      } else {
        // Snappy が使えないか、12.5% 未満しか縮まなかったので、
        // 圧縮しない形で保存する
        block_contents = raw;
        type = kNoCompression;
      }
      break;
    }

    case kZstdCompression: {
      std::string* compressed = &r->compressed_output;
      if (port::Zstd_Compress(r->options.zstd_compression_level, raw.data(),
                              raw.size(), compressed) &&
          compressed->size() < raw.size() - (raw.size() / 8u)) {
        block_contents = *compressed;
      } else {
        // Zstd が使えないか、12.5% 未満しか縮まなかったので、
        // 圧縮しない形で保存する
        block_contents = raw;
        type = kNoCompression;
      }
      break;
    }
  }
  WriteRawBlock(block_contents, type, handle);
  r->compressed_output.clear();
  block->Reset();
}
```

```cpp:line-numbers=141 [原文]
void TableBuilder::WriteBlock(BlockBuilder* block, BlockHandle* handle) {
  // File format contains a sequence of blocks where each block has:
  //    block_data: uint8[n]
  //    type: uint8
  //    crc: uint32
  assert(ok());
  Rep* r = rep_;
  Slice raw = block->Finish();

  Slice block_contents;
  CompressionType type = r->options.compression;
  // TODO(postrelease): Support more compression options: zlib?
  switch (type) {
    case kNoCompression:
      block_contents = raw;
      break;

    case kSnappyCompression: {
      std::string* compressed = &r->compressed_output;
      if (port::Snappy_Compress(raw.data(), raw.size(), compressed) &&
          compressed->size() < raw.size() - (raw.size() / 8u)) {
        block_contents = *compressed;
      } else {
        // Snappy not supported, or compressed less than 12.5%, so just
        // store uncompressed form
        block_contents = raw;
        type = kNoCompression;
      }
      break;
    }

    case kZstdCompression: {
      std::string* compressed = &r->compressed_output;
      if (port::Zstd_Compress(r->options.zstd_compression_level, raw.data(),
                              raw.size(), compressed) &&
          compressed->size() < raw.size() - (raw.size() / 8u)) {
        block_contents = *compressed;
      } else {
        // Zstd not supported, or compressed less than 12.5%, so just
        // store uncompressed form
        block_contents = raw;
        type = kNoCompression;
      }
      break;
    }
  }
  WriteRawBlock(block_contents, type, handle);
  r->compressed_output.clear();
  block->Reset();
}
```

:::

## 前提知識

- **`BlockBuilder* block`, `BlockHandle* handle`**: ブロックを組み立てる係と、書き込んだ位置・大きさを受け取る入れ物へのポインタです。`handle` は出力引数で、後で索引に書かれます。
- **`Rep* r = rep_;`**: `Rep` はクラスの内部状態をまとめた構造体です。ヘッダに内部の詳細を出さないための「pimpl」という設計パターンです。
- **`Slice`**: 「バイト列の先頭と長さ」の組です。`block_contents = raw;` はデータのコピーではなく、指し先を変えるだけです。
- **`switch` と `case X: { ... }`**: `case` の中で変数を宣言するときは、`{}` で範囲を区切る必要があります。
- **`raw.size() / 8u`**: `8u` は符号なしの 8 です。符号なし同士で計算させ、型の混在による警告を避けています。
- **`port::Snappy_Compress`**: 移植層の関数で、Snappy（高速な圧縮ライブラリ）で圧縮します。ライブラリなしでビルドされた環境では `false` を返します。

## 何をしているか

### 1. ブロックを仕上げる

```cpp:line-numbers=146
  assert(ok());
  Rep* r = rep_;
  Slice raw = block->Finish();
```
`block->Finish()` で、ブロックの末尾にリスタート地点の一覧を付けて完成させ、中身を `raw` として受け取ります。

### 2. 圧縮を試す

```cpp:line-numbers=150
  Slice block_contents;
  CompressionType type = r->options.compression;
  // TODO(リリース後): ほかの圧縮方式にも対応する。zlib とか？
  switch (type) {
    case kNoCompression:
      block_contents = raw;
      break;

    case kSnappyCompression: {
      std::string* compressed = &r->compressed_output;
      if (port::Snappy_Compress(raw.data(), raw.size(), compressed) &&
          compressed->size() < raw.size() - (raw.size() / 8u)) {
        block_contents = *compressed;
      } else {
        // Snappy が使えないか、12.5% 未満しか縮まなかったので、
        // 圧縮しない形で保存する
        block_contents = raw;
        type = kNoCompression;
      }
      break;
    }
```
圧縮しない設定なら、そのまま `raw` を使います。
Snappy の設定なら、圧縮して `compressed_output` に入れます。採用する条件は、圧縮後の大きさが `raw.size() - raw.size() / 8` 未満であることです。4000 バイトのブロックなら、`4000 - 500 = 3500` バイト未満に縮んだときだけ圧縮版を使います。
3600 バイトにしかならなければ、圧縮をあきらめて `raw` を使い、`type` を `kNoCompression` に書き換えます。Snappy が使えない環境でも同じです。

### 3. Zstd も同じ規則

```cpp:line-numbers=172
    case kZstdCompression: {
      std::string* compressed = &r->compressed_output;
      if (port::Zstd_Compress(r->options.zstd_compression_level, raw.data(),
                              raw.size(), compressed) &&
          compressed->size() < raw.size() - (raw.size() / 8u)) {
        block_contents = *compressed;
      } else {
        // Zstd が使えないか、12.5% 未満しか縮まなかったので、
        // 圧縮しない形で保存する
        block_contents = raw;
        type = kNoCompression;
      }
      break;
    }
```
Zstd（圧縮率の高い圧縮ライブラリ）の場合も、圧縮レベルを渡す以外は同じ判断をします。

### 4. 書き出して後片付け

```cpp:line-numbers=187
  WriteRawBlock(block_contents, type, handle);
  r->compressed_output.clear();
  block->Reset();
```
`WriteRawBlock` が、中身・種類（1 バイト）・CRC（4 バイト）をファイルに書き、位置と大きさを `handle` に入れます。
最後に、使い回している圧縮用のバッファを空にし、ブロックの組み立て係を初期状態に戻します。

## ここがすごい

- **割に合わない圧縮はしない**: 圧縮したブロックは、読むたびに展開が必要です。少ししか縮まないなら、展開の CPU コストのほうが高くつきます。「8 分の 1 以上縮むこと」という基準を設けて、得になるときだけ圧縮します。すでに圧縮された画像などのデータが値に入っていても、無駄な展開を避けられます。
- **種類をブロックごとに記録**: 判断した結果の `type` をブロックの後ろに書くので、同じファイルの中で圧縮・非圧縮が混ざっても問題ありません。読む側はブロックごとに種類を見て処理します。
- **ライブラリがなくても動く**: 圧縮ライブラリなしでビルドされた環境では、圧縮関数が `false` を返し、自動的に非圧縮になります。設定とビルド環境が食い違っても、ファイルが壊れることはありません。
- **バッファの使い回し**: 圧縮結果の入れ物 `compressed_output` は `Rep` の中に 1 つだけあり、毎回 `clear()` して使い回します。ブロックごとにメモリを確保し直さずに済みます。

## まとめ

- 圧縮は「どれだけ縮んだか」を見て、割に合うときだけ採用する。
- 判断の結果をデータ自体に書いておけば、読む側は設定に頼らず正しく読める。
- 任意の機能（圧縮ライブラリ）が使えないときは、自然に安全な方式へ落ちるようにする。
- 繰り返し使うバッファは、確保し直さずに使い回す。
