---
title: 0xff でない最初のバイトを 1 増やして、より大きい短いキーを作る
description: LevelDB のバイト比較器で、あるキー以上のなるべく短い文字列を作る関数。テーブル最後のブロックの索引キーを短くするのに使われる。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/comparator.cc
lines: [54, 66]
function: BytewiseComparatorImpl::FindShortSuccessor
difficulty: 1
format: 2
tags: [文字列処理, 最適化, アルゴリズム]
---

## ひとことで

`FindShortSuccessor` は、文字列 `key` を、**`key` 以上でなるべく短い文字列** に書き換える関数です。
LevelDB はテーブルファイルの索引に、ブロックごとの区切りキーを書きます。最後のブロックには「次のブロック」がないので、上限なしで短くできます。そのときに使うのがこの関数です。

## コード

::: code-group

```cpp:line-numbers=54 [日本語訳]
  void FindShortSuccessor(std::string* key) const override {
    // 1 増やせる最初の文字を探す
    size_t n = key->size();
    for (size_t i = 0; i < n; i++) {
      const uint8_t byte = (*key)[i];
      if (byte != static_cast<uint8_t>(0xff)) {
        (*key)[i] = byte + 1;
        key->resize(i + 1);
        return;
      }
    }
    // *key は 0xff の連続。そのままにしておく。
  }
```

```cpp:line-numbers=54 [原文]
  void FindShortSuccessor(std::string* key) const override {
    // Find first character that can be incremented
    size_t n = key->size();
    for (size_t i = 0; i < n; i++) {
      const uint8_t byte = (*key)[i];
      if (byte != static_cast<uint8_t>(0xff)) {
        (*key)[i] = byte + 1;
        key->resize(i + 1);
        return;
      }
    }
    // *key is a run of 0xffs.  Leave it alone.
  }
```

:::

## 前提知識

- **`std::string* key`**: 書き換え可能な文字列へのポインタです。この関数は `key` をその場で書き換えます。戻り値はありません（`void`）。
- **`(*key)[i]`**: ポインタ `key` の指す文字列の i 番目の文字です。
- **`const uint8_t byte = (*key)[i];`**: 文字を 0〜255 の符号なしの数として取り出します。`char` は符号付きのことがあるので、`0xff` との比較を確実にするためです。
- **`static_cast<uint8_t>(0xff)`**: 255 を `uint8_t` 型として書いています。比較する両辺の型をそろえる意図です。
- **`resize(n)`**: 文字列の長さを n にします。短くすると後ろが切り捨てられます。
- **バイト順の比較**: LevelDB の既定の比較器は、文字列を先頭から 1 バイトずつ符号なしの数として比べます。最初に違ったバイトの大小で決まり、辞書の並びと同じです。

## 何をしているか

### 1. 先頭から増やせるバイトを探す

```cpp:line-numbers=56
    size_t n = key->size();
    for (size_t i = 0; i < n; i++) {
      const uint8_t byte = (*key)[i];
```
`key = "hello"` なら、最初のバイトは `'h'`（0x68）です。0xff ではないので、ここで決まります。

### 2. 1 増やして切る

```cpp:line-numbers=59
      if (byte != static_cast<uint8_t>(0xff)) {
        (*key)[i] = byte + 1;
        key->resize(i + 1);
        return;
      }
```
`'h'` を `'i'` に変え、長さを 1 に切ります。`key` は `"i"` になりました。
`"hello" < "i"` なので、元のキー以上という条件を満たします。5 文字が 1 文字になりました。

先頭が 0xff の場合は、次のバイトに進みます。たとえば `"\xff\xff\x10abc"` なら、3 バイト目の 0x10 を 0x11 にして、`"\xff\xff\x11"` になります。

### 3. 全部 0xff なら何もしない

```cpp:line-numbers=65
    // *key は 0xff の連続。そのままにしておく。
```
すべてのバイトが 0xff なら、それより大きい短い文字列は作れません。コメントのとおり、そのままにします。

## ここがすごい

- **最短の答えをすぐ出す**: 最初に増やせるバイトを 1 つ増やして切れば、元より大きく、かつその位置より後ろの文字がすべて不要になります。ほとんどのキーは先頭バイトが 0xff ではないので、結果はたった 1 バイトです。
- **索引の最後の区切りを小さくする**: テーブルを作り終えるとき、最後のブロックの区切りには「最後のキー以上」なら何でも使えます。長いキーの代わりに 1 バイトで済めば、索引が小さくなります。
- **安全な失敗**: 増やせるバイトがないときは何もしない、という逃げ道があるので、どんな入力でも正しさを壊しません。
- **0xff の扱い**: 0xff に 1 を足すと 0x00 に戻ってしまい、かえって小さくなります。その場合を飛ばすことで、あふれのバグを防いでいます。

## まとめ

- 「ある文字列以上の最短文字列」は、最初の増やせるバイトを 1 増やして切れば得られる。
- 1 を足すとあふれる値（0xff）は特別に扱う。
- できないときは何もしない、という逃げ道を用意しておくと、どんな入力でも安全。
