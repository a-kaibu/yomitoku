---
title: 「ポインタへのポインタ」で検索・挿入・削除を 1 つにまとめる
description: LevelDB の LRU キャッシュが使う自前ハッシュ表の検索関数。見つけた要素ではなく「それを指しているスロットの住所」を返すことで、挿入と削除を場合分けなしで書けるようにしている。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/cache.cc
lines: [112, 121]
function: HandleTable::FindPointer
difficulty: 2
format: 2
tags: [データ構造, ハッシュ, イディオム]
---

## ひとことで

`HandleTable` は、LevelDB のキャッシュが使う自作のハッシュ表（キーから値をすばやく探す表）です。同じバケツ（区画）に入った要素は、連結リストでつながっています。
`FindPointer` はその検索関数ですが、返すのは要素そのものではなく **「その要素を指しているポインタ」の住所** です。これのおかげで、検索・挿入・削除がどれも数行で書けます。

## コード

::: code-group

```cpp:line-numbers=112 [日本語訳]
  // key/hash に一致するキャッシュエントリを指しているスロットへの
  // ポインタを返す。そのようなエントリがなければ、対応する連結リストの
  // 末尾のスロットへのポインタを返す。
  LRUHandle** FindPointer(const Slice& key, uint32_t hash) {
    LRUHandle** ptr = &list_[hash & (length_ - 1)];
    while (*ptr != nullptr && ((*ptr)->hash != hash || key != (*ptr)->key())) {
      ptr = &(*ptr)->next_hash;
    }
    return ptr;
  }
```

```cpp:line-numbers=112 [原文]
  // Return a pointer to slot that points to a cache entry that
  // matches key/hash.  If there is no such cache entry, return a
  // pointer to the trailing slot in the corresponding linked list.
  LRUHandle** FindPointer(const Slice& key, uint32_t hash) {
    LRUHandle** ptr = &list_[hash & (length_ - 1)];
    while (*ptr != nullptr && ((*ptr)->hash != hash || key != (*ptr)->key())) {
      ptr = &(*ptr)->next_hash;
    }
    return ptr;
  }
```

:::

この関数を使う側（同じクラスの `Lookup`・`Insert`・`Remove`）は次のようにとても短くなります。

```cpp:line-numbers=75
  LRUHandle* Lookup(const Slice& key, uint32_t hash) {
    return *FindPointer(key, hash);
  }

  LRUHandle* Insert(LRUHandle* h) {
    LRUHandle** ptr = FindPointer(h->key(), h->hash);
    LRUHandle* old = *ptr;
    h->next_hash = (old == nullptr ? nullptr : old->next_hash);
    *ptr = h;
```

```cpp:line-numbers=95
  LRUHandle* Remove(const Slice& key, uint32_t hash) {
    LRUHandle** ptr = FindPointer(key, hash);
    LRUHandle* result = *ptr;
    if (result != nullptr) {
      *ptr = result->next_hash;
      --elems_;
    }
    return result;
  }
```

## 前提知識

- **`LRUHandle*`**: キャッシュの 1 エントリ（`LRUHandle` 構造体）を指すポインタです。`next_hash` メンバーで、同じバケツの次のエントリにつながります。
- **`LRUHandle**`**: 「`LRUHandle*` が入っている場所」を指すポインタ、つまりポインタへのポインタです。これを使うと、その場所に入っているポインタ自体を書き換えられます。
- **`&list_[i]`**: 配列 `list_` の i 番目の要素の住所です。`list_` はバケツの先頭ポインタが並んだ配列です。
- **`(*ptr)->hash`**: `*ptr` で中のポインタを取り出し、`->` でそのエントリのメンバーを読みます。
- **`&(*ptr)->next_hash`**: 今のエントリの `next_hash` メンバーの住所です。次の「スロット」に進む操作です。
- **`hash & (length_ - 1)`**: 表の長さ `length_` は 2 のべき乗なので、これは `hash % length_` と同じです。

## 何をしているか

表の長さが 4、バケツ 1 に A → B とつながっていて、キー B を探すとします。

### 1. バケツを選ぶ

```cpp:line-numbers=116
    LRUHandle** ptr = &list_[hash & (length_ - 1)];
```
`hash & 3` が 1 なら、`ptr` は `list_[1]`（バケツ 1 の先頭ポインタが入った場所）を指します。

### 2. リストを辿る

```cpp:line-numbers=117
    while (*ptr != nullptr && ((*ptr)->hash != hash || key != (*ptr)->key())) {
      ptr = &(*ptr)->next_hash;
    }
```
`*ptr` は A です。A のハッシュかキーが違うので、`ptr = &A->next_hash` に進みます。今度は `*ptr` が B で、ハッシュもキーも一致するので止まります。
ハッシュ値を先に比べているのは、ハッシュが違えばキーの比較（バイト列の比較）を省けるからです。

### 3. スロットを返す

```cpp:line-numbers=120
    return ptr;
```
返すのは「A の `next_hash` の住所」です。見つからなかったときは、リストの最後の `nullptr` が入ったスロットの住所を返します。

### 使う側の動き

```cpp:line-numbers=96
    LRUHandle** ptr = FindPointer(key, hash);
    LRUHandle* result = *ptr;
    if (result != nullptr) {
      *ptr = result->next_hash;
```

- **検索**: `*ptr` を読むだけ。見つからなければ `nullptr` です。
- **削除**: `*ptr = result->next_hash` で、A の `next_hash` を B の次に付け替えます。B がリストの先頭でも途中でも、同じ 1 行で済みます。
- **挿入**: 同じキーがあればそのスロットを新しいエントリに差し替え、なければリストの末尾につなぎます。

## ここがすごい

- **先頭の特別扱いが消える**: 連結リストからの削除を素直に書くと、「先頭なら `list_[i]` を書き換え、途中なら前の要素の `next` を書き換える」と場合分けが必要です。「書き換えるべき場所の住所」を返せば、先頭も途中も同じ扱いになります。
- **1 回の探索で済む**: 挿入では「同じキーを探す」と「置く場所を決める」が 1 回の `FindPointer` で終わります。
- **自前のハッシュ表**: クラスの前のコメントには、移植のための細工が減り、試した環境では組み込みのハッシュ表より速かった（g++ 4.4.3 との比較で readrandom が約 5% 速い）と書かれています。

## まとめ

- 要素ではなく「要素を指すポインタの住所」を返すと、連結リストの挿入・削除が場合分けなしで書ける。
- 安い比較（ハッシュ値）を先に、高い比較（キー）を後にすると、無駄な比較が減る。
- 表の長さを 2 のべき乗にすれば、余りの計算をビット AND で済ませられる。
