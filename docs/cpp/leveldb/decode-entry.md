---
title: 3 つの値を OR して 1 回の比較で「全部 1 バイトか」を判定する
description: LevelDB のブロックからエントリの見出しを読む関数。3 つの varint がすべて 1 バイトで済む場合を、OR をとって 128 未満かを見るだけで判定し、速い経路で処理する。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: table/block.cc
lines: [48, 75]
function: DecodeEntry
difficulty: 2
format: 2
tags: [ビット演算, パース, 防御的プログラミング]
---

## ひとことで

LevelDB のブロックに入ったエントリは、先頭に 3 つの数（共通部分の長さ・残りのキーの長さ・値の長さ）を varint（小さい数ほど短い可変長の整数）で持っています。
`DecodeEntry` はこの 3 つを読み出す関数です。**3 つとも 1 バイトで書かれていることがほとんど** なので、その場合をビット OR 1 回の判定で見つけて、まとめて処理します。

## コード

::: code-group

```cpp:line-numbers=48 [日本語訳]
// 補助関数: "p" から始まる次のブロックエントリを解読し、
// 共有するキーのバイト数・共有しないキーのバイト数・
// 値の長さを、それぞれ "*shared"・"*non_shared"・
// "*value_length" に入れる。"limit" より先は参照しない。
//
// エラーを見つけたら nullptr を返す。そうでなければ、
// キーの差分（3 つの値の直後）へのポインタを返す。
static inline const char* DecodeEntry(const char* p, const char* limit,
                                      uint32_t* shared, uint32_t* non_shared,
                                      uint32_t* value_length) {
  if (limit - p < 3) return nullptr;
  *shared = reinterpret_cast<const uint8_t*>(p)[0];
  *non_shared = reinterpret_cast<const uint8_t*>(p)[1];
  *value_length = reinterpret_cast<const uint8_t*>(p)[2];
  if ((*shared | *non_shared | *value_length) < 128) {
    // 速い経路: 3 つの値がすべて 1 バイトずつで書かれている
    p += 3;
  } else {
    if ((p = GetVarint32Ptr(p, limit, shared)) == nullptr) return nullptr;
    if ((p = GetVarint32Ptr(p, limit, non_shared)) == nullptr) return nullptr;
    if ((p = GetVarint32Ptr(p, limit, value_length)) == nullptr) return nullptr;
  }

  if (static_cast<uint32_t>(limit - p) < (*non_shared + *value_length)) {
    return nullptr;
  }
  return p;
}
```

```cpp:line-numbers=48 [原文]
// Helper routine: decode the next block entry starting at "p",
// storing the number of shared key bytes, non_shared key bytes,
// and the length of the value in "*shared", "*non_shared", and
// "*value_length", respectively.  Will not dereference past "limit".
//
// If any errors are detected, returns nullptr.  Otherwise, returns a
// pointer to the key delta (just past the three decoded values).
static inline const char* DecodeEntry(const char* p, const char* limit,
                                      uint32_t* shared, uint32_t* non_shared,
                                      uint32_t* value_length) {
  if (limit - p < 3) return nullptr;
  *shared = reinterpret_cast<const uint8_t*>(p)[0];
  *non_shared = reinterpret_cast<const uint8_t*>(p)[1];
  *value_length = reinterpret_cast<const uint8_t*>(p)[2];
  if ((*shared | *non_shared | *value_length) < 128) {
    // Fast path: all three values are encoded in one byte each
    p += 3;
  } else {
    if ((p = GetVarint32Ptr(p, limit, shared)) == nullptr) return nullptr;
    if ((p = GetVarint32Ptr(p, limit, non_shared)) == nullptr) return nullptr;
    if ((p = GetVarint32Ptr(p, limit, value_length)) == nullptr) return nullptr;
  }

  if (static_cast<uint32_t>(limit - p) < (*non_shared + *value_length)) {
    return nullptr;
  }
  return p;
}
```

:::

## 前提知識

- **`static inline`**: `static` はこのファイルだけで使う関数、`inline` は呼び出し元に展開してよいという指定です。
- **出力引数 `uint32_t* shared` など**: ポインタで受け取り、`*shared = ...` で呼び出し元の変数に結果を書き込みます。戻り値とは別に複数の結果を返すための書き方です。
- **`reinterpret_cast<const uint8_t*>(p)[0]`**: バイト列を符号なしの 1 バイトの数として読みます。`char` のままだと、128 以上が負の数になる環境があります。
- **varint の 1 バイト判定**: varint では最上位ビット（128 の位）が「続きがあるか」の印です。128 未満なら、その 1 バイトで値が完結しています。
- **`limit - p`**: ポインタ同士の引き算で、残りのバイト数です。
- **`GetVarint32Ptr`**: varint を 1 つ読み、次の位置を返す関数です。失敗すると `nullptr` を返します。

## 何をしているか

### 1. 最低 3 バイトあるか

```cpp:line-numbers=58
  if (limit - p < 3) return nullptr;
```
3 つの値はそれぞれ最低 1 バイトなので、3 バイト未満なら壊れています。

### 2. とりあえず 1 バイトずつ読む

```cpp:line-numbers=59
  *shared = reinterpret_cast<const uint8_t*>(p)[0];
  *non_shared = reinterpret_cast<const uint8_t*>(p)[1];
  *value_length = reinterpret_cast<const uint8_t*>(p)[2];
```
1 バイト目・2 バイト目・3 バイト目を、そのまま 3 つの値として読みます。

### 3. 全部 128 未満なら確定

```cpp:line-numbers=62
  if ((*shared | *non_shared | *value_length) < 128) {
    // 速い経路: 3 つの値がすべて 1 バイトずつで書かれている
    p += 3;
```
たとえば `0x04 0x04 0x01` なら、OR は `0x05` で 128 未満です。3 つとも 1 バイトの varint だったと確定し、`p` を 3 進めます。
どれか 1 つでも 128 以上なら、その値の最上位ビットが 1 なので、OR の結果も 128 以上になります。たとえば `0x00 0xAC 0x02 ...` なら、2 つ目が 0xAC なので OR は 128 以上です。

### 4. そうでなければ普通に読む

```cpp:line-numbers=65
  } else {
    if ((p = GetVarint32Ptr(p, limit, shared)) == nullptr) return nullptr;
    if ((p = GetVarint32Ptr(p, limit, non_shared)) == nullptr) return nullptr;
    if ((p = GetVarint32Ptr(p, limit, value_length)) == nullptr) return nullptr;
  }
```
`GetVarint32Ptr` で 1 つずつ正しく読み直します。上の例なら、2 つ目は `0xAC 0x02` で 300 になります。途中で失敗すれば `nullptr` を返します。

### 5. 本体が収まっているか

```cpp:line-numbers=71
  if (static_cast<uint32_t>(limit - p) < (*non_shared + *value_length)) {
    return nullptr;
  }
```
残りのバイト数が「キーの残り + 値」の長さに足りなければ、壊れたデータとして `nullptr` を返します。問題がなければ、キーの差分の先頭を返します。

## ここがすごい

- **3 つの判定を 1 回に**: 「1 つ目 < 128 かつ 2 つ目 < 128 かつ 3 つ目 < 128」は、3 回比較して分岐する必要があります。OR をとって 1 回比べれば、同じ意味の判定が分岐 1 つで済みます。ビットの「どれかに 1 があれば結果にも 1 が残る」という OR の性質を使った小技です。
- **よくある場合を速く**: キーの差分や値が 127 バイト以下なら、varint の解析を 3 回呼ばずに済みます。ブロック内の検索はこの関数を何度も呼ぶので、効果が積み重なります。
- **壊れたデータで範囲外を読まない**: 最初に 3 バイトあるか、最後に本体が収まっているかを確かめ、varint の解析にも `limit` を渡しています。ディスクのデータが壊れていても、メモリの範囲外を読みません。
- **誤りは `nullptr` 1 つで**: 呼び出し側は戻り値が `nullptr` かを見るだけで、すべての異常を検出できます。

## まとめ

- 「全部が条件を満たすか」をビットの OR でまとめて判定すると、分岐が減る。
- 可変長形式の読み出しは、よくある短い場合を特別に速くすると効果が大きい。
- 外から来たデータは、読み始める前と本体を使う前の両方で長さを確かめる。
