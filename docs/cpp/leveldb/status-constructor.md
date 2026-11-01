---
title: 成功なら nullptr、失敗なら 1 本の配列に長さ・種類・文を詰める
description: LevelDB のエラーを表す Status クラスのコンストラクタ。成功時はポインタ 1 個ぶんの大きさで済ませ、失敗時だけ「長さ 4 バイト + コード 1 バイト + メッセージ」を 1 回の確保で作る。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/status.cc
lines: [13, 36]
function: Status::Status / Status::CopyState
difficulty: 2
format: 2
tags: [エラー処理, メモリ管理, API設計]
---

## ひとことで

`Status` は、LevelDB の関数が「成功したか、失敗したならなぜか」を返すためのクラスです。
このクラスの中身は **ポインタ 1 個（`state_`）だけ** です。成功なら `nullptr`、失敗なら「メッセージの長さ・エラーの種類・メッセージ」を 1 本につなげた配列を指します。ここでは、その配列を作るコンストラクタと、コピーする `CopyState` を読みます。

## コード

```cpp:line-numbers=13
const char* Status::CopyState(const char* state) {
  uint32_t size;
  std::memcpy(&size, state, sizeof(size));
  char* result = new char[size + 5];
  std::memcpy(result, state, size + 5);
  return result;
}

Status::Status(Code code, const Slice& msg, const Slice& msg2) {
  assert(code != kOk);
  const uint32_t len1 = static_cast<uint32_t>(msg.size());
  const uint32_t len2 = static_cast<uint32_t>(msg2.size());
  const uint32_t size = len1 + (len2 ? (2 + len2) : 0);
  char* result = new char[size + 5];
  std::memcpy(result, &size, sizeof(size));
  result[4] = static_cast<char>(code);
  std::memcpy(result + 5, msg.data(), len1);
  if (len2) {
    result[5 + len1] = ':';
    result[6 + len1] = ' ';
    std::memcpy(result + 7 + len1, msg2.data(), len2);
  }
  state_ = result;
}
```

配列の形は `include/leveldb/status.h` のメンバー宣言に書かれています。

<!-- source: include/leveldb/status.h -->
```cpp:line-numbers=95
  // 成功の status は state_ が null。そうでなければ state_ は new[] で確保した
  // 次の形の配列:
  //    state_[0..3] == メッセージの長さ
  //    state_[4]    == コード
  //    state_[5..]  == メッセージ
  const char* state_;
```

## 前提知識

- **コンストラクタ**: オブジェクトを作るときに呼ばれる特別な関数です。`Status::Status(...)` は `Status` クラスのコンストラクタです。
- **`const Slice&`**: `Slice` は「バイト列の先頭と長さ」の組です。`const&` はコピーせず、読み取り専用で受け取る指定です。
- **`new char[n]`**: n バイトの配列をヒープ（実行中に確保するメモリ領域）に作ります。`Status` のデストラクタが `delete[]` で解放します。
- **`std::memcpy(dst, src, n)`**: n バイトをそのままコピーします。ここでは 4 バイトの整数を配列に書き込むのにも使っています。
- **`len2 ? (2 + len2) : 0`**: 条件演算子です。`len2` が 0 でなければ `2 + len2`、0 なら 0 になります。
- **`assert`**: デバッグ時の確認です。このコンストラクタは失敗専用なので、成功（`kOk`）で呼ばれたら止めます。

## 何をしているか

`Status::NotFound("key1", "file.ldb")` のように、2 つのメッセージで作る場合を追います。

### 1. 長さを計算する

```cpp:line-numbers=23
  const uint32_t len1 = static_cast<uint32_t>(msg.size());
  const uint32_t len2 = static_cast<uint32_t>(msg2.size());
  const uint32_t size = len1 + (len2 ? (2 + len2) : 0);
```
`len1 = 4`（"key1"）、`len2 = 8`（"file.ldb"）です。2 つ目があるときは間に `": "` の 2 文字をはさむので、`size = 4 + 2 + 8 = 14` です。

### 2. 配列を 1 回で確保する

```cpp:line-numbers=26
  char* result = new char[size + 5];
```
先頭 5 バイト（長さ 4 + コード 1）を足して、19 バイトを確保します。

### 3. 順に詰める

```cpp:line-numbers=27
  std::memcpy(result, &size, sizeof(size));
  result[4] = static_cast<char>(code);
  std::memcpy(result + 5, msg.data(), len1);
  if (len2) {
    result[5 + len1] = ':';
    result[6 + len1] = ' ';
    std::memcpy(result + 7 + len1, msg2.data(), len2);
  }
```
- 0〜3 バイト目: 長さ 14 を `memcpy` で書く。
- 4 バイト目: エラーの種類（`kNotFound` なら 1）を書く。
- 5 バイト目から: `"key1"`、続けて `": "`、`"file.ldb"`。

メッセージ部分は `"key1: file.ldb"` になります。`ToString()` はこれに `"NotFound: "` を付けて表示します。

### 4. コピーするとき

```cpp:line-numbers=13
const char* Status::CopyState(const char* state) {
  uint32_t size;
  std::memcpy(&size, state, sizeof(size));
  char* result = new char[size + 5];
  std::memcpy(result, state, size + 5);
  return result;
}
```
`CopyState` は、先頭 4 バイトから長さを読み、`size + 5` バイトをまるごと複製します。配列の中に長さが入っているので、どこまでコピーすればよいかが配列だけでわかります。

## ここがすごい

- **成功は軽い**: ほとんどの呼び出しは成功します。成功時の `Status` は `nullptr` を持つだけで、メモリの確保も解放も起きません。`ok()` の判定もポインタが `nullptr` かを見るだけです。
- **失敗時も確保は 1 回**: エラーコードと `std::string` を別々に持つと、文字列の分だけ確保が増え、オブジェクトも大きくなります。ここでは長さ・コード・本文を 1 本の配列にまとめ、確保を 1 回にしています。
- **自分の大きさを知っている配列**: 長さを先頭に持つので、`CopyState` は他の情報なしに複製できます。C の文字列のように終端の `'\0'` を探す必要もありません。
- **関数の戻り値に向く**: `Status` はポインタ 1 個ぶんの大きさなので、値として返してもコストが小さく、ムーブ（中身の付け替え）なら確保も起きません。

## まとめ

- よくある場合（成功）を `nullptr` で表せば、その場合のコストをゼロにできる。
- 関連するデータは 1 本の配列にまとめると、確保が 1 回で済む。
- 可変長のデータの先頭に長さを書いておけば、コピーや表示が自己完結する。
- エラーを値として返す設計では、成功時の軽さが特に重要になる。
