---
title: エントリを付け替えるだけでハッシュ表を倍に広げる
description: LevelDB のキャッシュ用ハッシュ表の拡張関数。要素数以上の 2 のべき乗に表を広げ、各エントリを新しいバケツの先頭につなぎ直す。メモリの確保や要素のコピーはしない。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/cache.cc
lines: [123, 147]
function: HandleTable::Resize
difficulty: 2
format: 2
tags: [データ構造, ハッシュ, メモリ管理]
---

## ひとことで

`Resize` は、LevelDB のキャッシュが使う自作ハッシュ表（キーから値を探す表）を大きくする関数です。要素数がバケツ（区画）の数を超えると呼ばれます。
新しいバケツの配列を作り、既存の要素を **つなぎ直すだけ** で移します。要素のコピーやハッシュの再計算はしません。

## コード

```cpp:line-numbers=123
  void Resize() {
    uint32_t new_length = 4;
    while (new_length < elems_) {
      new_length *= 2;
    }
    LRUHandle** new_list = new LRUHandle*[new_length];
    memset(new_list, 0, sizeof(new_list[0]) * new_length);
    uint32_t count = 0;
    for (uint32_t i = 0; i < length_; i++) {
      LRUHandle* h = list_[i];
      while (h != nullptr) {
        LRUHandle* next = h->next_hash;
        uint32_t hash = h->hash;
        LRUHandle** ptr = &new_list[hash & (new_length - 1)];
        h->next_hash = *ptr;
        *ptr = h;
        h = next;
        count++;
      }
    }
    assert(elems_ == count);
    delete[] list_;
    list_ = new_list;
    length_ = new_length;
  }
```

## 前提知識

- **`LRUHandle** list_`**: バケツの配列です。各要素は、そのバケツに入った連結リストの先頭を指すポインタです。
- **`new LRUHandle*[n]`**: ポインタ n 個の配列をヒープ（実行中に確保するメモリ領域）に作ります。`delete[]` で解放します。
- **`memset(p, 0, size)`**: `p` から `size` バイトを 0 で埋めます。ポインタの配列を `nullptr` で初期化するのに使っています（一般的な環境では `nullptr` のビットはすべて 0 です）。
- **`sizeof(new_list[0])`**: 配列の要素 1 個の大きさ、つまりポインタ 1 個のバイト数です。
- **`h->next_hash`**: 同じバケツの次の要素へのポインタです。
- **`hash & (new_length - 1)`**: `new_length` は 2 のべき乗なので、`hash % new_length` と同じです。

## 何をしているか

長さ 4 の表に 5 個目の要素が入り、`elems_ = 5` で呼ばれたとします。

### 1. 新しい長さを決める

```cpp:line-numbers=124
    uint32_t new_length = 4;
    while (new_length < elems_) {
      new_length *= 2;
    }
```
4 から始めて、要素数以上になるまで 2 倍にします。5 なら 8 になります。結果として「バケツ 1 つあたり平均 1 個以下」が保たれます。

### 2. 空の配列を作る

```cpp:line-numbers=128
    LRUHandle** new_list = new LRUHandle*[new_length];
    memset(new_list, 0, sizeof(new_list[0]) * new_length);
```
8 個のポインタの配列を作り、すべて `nullptr` にします。

### 3. 要素をつなぎ直す

```cpp:line-numbers=130
    uint32_t count = 0;
    for (uint32_t i = 0; i < length_; i++) {
      LRUHandle* h = list_[i];
      while (h != nullptr) {
        LRUHandle* next = h->next_hash;
        uint32_t hash = h->hash;
        LRUHandle** ptr = &new_list[hash & (new_length - 1)];
        h->next_hash = *ptr;
        *ptr = h;
        h = next;
        count++;
      }
    }
```
古いバケツを順に見て、リストの要素を 1 つずつ取り出します。

1. 次の要素を `next` に退避する。
2. 保存済みのハッシュ値 `h->hash` から新しいバケツを決める。たとえば `hash = 13`（2 進数 `1101`）なら、古い表では `13 & 3 = 1`、新しい表では `13 & 7 = 5` です。
3. その要素を、新しいバケツのリストの **先頭** に差し込む。
4. 退避しておいた次の要素に進む。

### 4. 入れ替える

```cpp:line-numbers=143
    assert(elems_ == count);
    delete[] list_;
    list_ = new_list;
    length_ = new_length;
```
数え上げた要素数が `elems_` と一致することを確かめ、古い配列を捨てて新しい配列に切り替えます。

## ここがすごい

- **要素を動かさない**: 移すのはポインタだけで、エントリ本体はメモリ上の同じ場所に残ります。キャッシュの利用者が持っているハンドル（エントリへのポインタ）は、拡張の後もそのまま使えます。
- **ハッシュを再計算しない**: 各エントリが自分のハッシュ値 `hash` を保存しているので、キーをもう一度ハッシュする必要がありません。
- **先頭に差し込む**: 末尾につなぐにはリストを最後まで辿る必要がありますが、先頭なら 2 回の代入で済みます。同じバケツの中の順番は変わりますが、ハッシュ表では順番に意味がないので問題ありません。
- **2 のべき乗の長さ**: 余りの計算がビット AND で済みます。長さが 2 倍になると、各要素の行き先は「元と同じ番号」か「元 + 古い長さ」のどちらかになる、という性質もあります（例: 1 は 1 か 5 へ）。

## まとめ

- ハッシュ表の拡張は、エントリを動かさずポインタだけ付け替えれば安く済む。
- ハッシュ値をエントリに保存しておくと、拡張時の再計算を省ける。
- 順番を気にしないリストへの追加は、先頭に差し込むのがいちばん速い。
- 要素数 ≦ バケツ数を保つと、検索で辿るリストが平均 1 個以下になる。
