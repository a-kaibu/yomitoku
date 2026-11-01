---
title: キーを構造体の末尾に詰め込み、溢れたら古い順に捨てるキャッシュ挿入
description: LevelDB の LRU キャッシュにエントリを入れる関数。キーを 1 回の malloc で構造体の後ろに置き、容量を超えたら誰も使っていない最古のエントリから追い出す。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/cache.cc
lines: [268, 305]
function: LRUCache::Insert
difficulty: 2
format: 2
tags: [キャッシュ, メモリ管理, 並行処理]
---

## ひとことで

`LRUCache::Insert` は、LevelDB の LRU キャッシュ（いちばん長く使われていないものから捨てるキャッシュ）に、キーと値を登録する関数です。
エントリはキーの長さに合わせて **1 回の `malloc` で確保** し、キーを構造体の末尾に直接置きます。登録後に容量を超えていれば、誰も使っていない古いエントリから順に追い出します。

## コード

::: code-group

```cpp:line-numbers=268 [日本語訳]
Cache::Handle* LRUCache::Insert(const Slice& key, uint32_t hash, void* value,
                                size_t charge,
                                void (*deleter)(const Slice& key,
                                                void* value)) {
  MutexLock l(&mutex_);

  LRUHandle* e =
      reinterpret_cast<LRUHandle*>(malloc(sizeof(LRUHandle) - 1 + key.size()));
  e->value = value;
  e->deleter = deleter;
  e->charge = charge;
  e->key_length = key.size();
  e->hash = hash;
  e->in_cache = false;
  e->refs = 1;  // 返すハンドルの分。
  std::memcpy(e->key_data, key.data(), key.size());

  if (capacity_ > 0) {
    e->refs++;  // キャッシュ自身の参照の分。
    e->in_cache = true;
    LRU_Append(&in_use_, e);
    usage_ += charge;
    FinishErase(table_.Insert(e));
  } else {  // キャッシュしない（capacity_==0 は対応済みで、キャッシュ無効になる）
    // next は assert の中の key() で読まれるので、初期化が必要
    e->next = nullptr;
  }
  while (usage_ > capacity_ && lru_.next != &lru_) {
    LRUHandle* old = lru_.next;
    assert(old->refs == 1);
    bool erased = FinishErase(table_.Remove(old->key(), old->hash));
    if (!erased) {  // NDEBUG でコンパイルしたときの未使用変数（の警告）を避けるため
      assert(erased);
    }
  }

  return reinterpret_cast<Cache::Handle*>(e);
}
```

```cpp:line-numbers=268 [原文]
Cache::Handle* LRUCache::Insert(const Slice& key, uint32_t hash, void* value,
                                size_t charge,
                                void (*deleter)(const Slice& key,
                                                void* value)) {
  MutexLock l(&mutex_);

  LRUHandle* e =
      reinterpret_cast<LRUHandle*>(malloc(sizeof(LRUHandle) - 1 + key.size()));
  e->value = value;
  e->deleter = deleter;
  e->charge = charge;
  e->key_length = key.size();
  e->hash = hash;
  e->in_cache = false;
  e->refs = 1;  // for the returned handle.
  std::memcpy(e->key_data, key.data(), key.size());

  if (capacity_ > 0) {
    e->refs++;  // for the cache's reference.
    e->in_cache = true;
    LRU_Append(&in_use_, e);
    usage_ += charge;
    FinishErase(table_.Insert(e));
  } else {  // don't cache. (capacity_==0 is supported and turns off caching.)
    // next is read by key() in an assert, so it must be initialized
    e->next = nullptr;
  }
  while (usage_ > capacity_ && lru_.next != &lru_) {
    LRUHandle* old = lru_.next;
    assert(old->refs == 1);
    bool erased = FinishErase(table_.Remove(old->key(), old->hash));
    if (!erased) {  // to avoid unused variable when compiled NDEBUG
      assert(erased);
    }
  }

  return reinterpret_cast<Cache::Handle*>(e);
}
```

:::

エントリの構造体は、最後のメンバーが長さ 1 の配列です。

```cpp:line-numbers=43
struct LRUHandle {
  void* value;
  void (*deleter)(const Slice&, void* value);
  LRUHandle* next_hash;
  LRUHandle* next;
  LRUHandle* prev;
  size_t charge;  // TODO(最適化): uint32_t だけにする？
  size_t key_length;
  bool in_cache;     // エントリがキャッシュに入っているか。
  uint32_t refs;     // 参照数。キャッシュ自身の参照があればそれも含む。
  uint32_t hash;     // key() のハッシュ。シャードの振り分けと比較を速くするのに使う
  char key_data[1];  // キーの先頭
```

## 前提知識

- **`MutexLock l(&mutex_);`**: ミューテックス（同時に 1 スレッドしか入れないようにする鍵）をかける変数です。この変数が関数の終わりで消えるときに、自動で鍵が外れます。こうした「変数の寿命で後始末をする」書き方を RAII と呼びます。
- **`void (*deleter)(const Slice& key, void* value)`**: 関数ポインタの引数です。「キーと値を受け取って何も返さない関数」の住所を受け取ります。値を捨てるときに呼ばれます。
- **`void* value`**: 型を決めないポインタです。キャッシュはどんな値でも預かれます。
- **`malloc(n)` と `reinterpret_cast`**: `malloc` は n バイトの生のメモリを確保します。それを `LRUHandle*` として読み替えて使います。
- **`std::memcpy(dst, src, n)`**: n バイトをそのままコピーします。
- **`charge`**: そのエントリが「容量をどれだけ使うか」の値です。バイト数でも件数でも、利用者が決められます。

## 何をしているか

### 1. エントリを確保する

```cpp:line-numbers=274
  LRUHandle* e =
      reinterpret_cast<LRUHandle*>(malloc(sizeof(LRUHandle) - 1 + key.size()));
  e->value = value;
  e->deleter = deleter;
  e->charge = charge;
  e->key_length = key.size();
  e->hash = hash;
  e->in_cache = false;
  e->refs = 1;  // 返すハンドルの分。
  std::memcpy(e->key_data, key.data(), key.size());
```
`sizeof(LRUHandle) - 1 + key.size()` バイトを確保します。`key_data[1]` の 1 バイトを差し引き、キーの長さを足した大きさです。キー `"abc"` なら、構造体の末尾の `key_data` から 3 バイトにキーが入ります。
参照数 `refs` は 1 にします。これは呼び出し元に返すハンドルの分です。

### 2. キャッシュに登録する

```cpp:line-numbers=285
  if (capacity_ > 0) {
    e->refs++;  // キャッシュ自身の参照の分。
    e->in_cache = true;
    LRU_Append(&in_use_, e);
    usage_ += charge;
    FinishErase(table_.Insert(e));
```
容量が 0 より大きければ、キャッシュ自身の参照として `refs` を 2 にし、`in_use_`（使用中のリスト）に入れます。使用量 `usage_` に `charge` を足します。
`table_.Insert(e)` は、同じキーの古いエントリがあればそれを返します。`FinishErase` が、その古いエントリをキャッシュから外します。

### 3. 容量 0 ならキャッシュしない

```cpp:line-numbers=291
  } else {  // キャッシュしない（capacity_==0 は対応済みで、キャッシュ無効になる）
    // next は assert の中の key() で読まれるので、初期化が必要
    e->next = nullptr;
  }
```
容量 0 は「キャッシュ無効」の意味です。エントリは呼び出し元だけが持ち、`Release` で解放されます。

### 4. 溢れたら古い順に捨てる

```cpp:line-numbers=295
  while (usage_ > capacity_ && lru_.next != &lru_) {
    LRUHandle* old = lru_.next;
    assert(old->refs == 1);
    bool erased = FinishErase(table_.Remove(old->key(), old->hash));
    if (!erased) {  // NDEBUG でコンパイルしたときの未使用変数（の警告）を避けるため
      assert(erased);
    }
  }
```
`usage_ > capacity_` の間、`lru_.next`（誰も使っていないエントリの中で最も古いもの）をハッシュ表から外し、`FinishErase` で解放の手続きをします。
たとえば容量 100 で使用量 90 のところに `charge = 20` を入れると 110 になります。最も古い未使用エントリ（`charge = 15` とします）を捨てると 95 になり、ループを抜けます。
`lru_` が空になったら、使用量が容量を超えていても止まります。使用中のものは捨てられないからです。

### 5. ハンドルを返す

```cpp:line-numbers=304
  return reinterpret_cast<Cache::Handle*>(e);
```
内部の `LRUHandle*` を、利用者向けの型 `Cache::Handle*` に読み替えて返します。

## ここがすごい

- **確保は 1 回だけ**: キーを `std::string` で持つと、構造体とキーで 2 回の確保が必要になります。末尾に可変長の領域を置けば 1 回で済み、構造体とキーがメモリ上で隣り合うので、キャッシュ（CPU のキャッシュ）にも乗りやすくなります。
- **一時的な超過を許す**: 使用中のエントリしか残っていなければ、容量を超えたままにします。ハンドルを持っている利用者がいる以上、無理に消すと危険だからです。安全を優先した割り切りです。
- **`assert` 用の小技**: `if (!erased) { assert(erased); }` という一見むだな書き方は、リリースビルドで `assert` が消えたときに「変数 `erased` が使われていない」という警告が出ないようにする工夫です。コメントにその理由が書かれています。
- **中身を知らない設計**: 値は `void*`、大きさは `charge`、後始末は `deleter` で受け取ります。キャッシュは値の型を知らずに済み、ブロックのキャッシュにもテーブルのキャッシュにも使い回せます。

## まとめ

- 可変長のデータは構造体の末尾に置くと、確保が 1 回で済む。
- 鍵の解放は RAII に任せると、途中で `return` しても外し忘れがない。
- 使用中のものは捨てない、という安全側の規則を優先し、容量の一時的な超過は許す。
- 値の型・大きさ・後始末を外から受け取れば、汎用のキャッシュが作れる。
