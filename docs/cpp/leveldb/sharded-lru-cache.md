---
title: ハッシュの上位 4 ビットで 16 個に分けてロックの奪い合いを減らす
description: LevelDB のキャッシュ本体。LRU キャッシュを 16 個の独立した「シャード」に分け、キーのハッシュの上位ビットで振り分けることで、スレッド同士のロック競合を減らしている。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/cache.cc
lines: [350, 389]
function: ShardedLRUCache
difficulty: 2
format: 2
tags: [並行処理, キャッシュ, ハッシュ]
---

## ひとことで

`ShardedLRUCache` は、LevelDB が実際に使うキャッシュです。中身は 16 個の `LRUCache`（それぞれが独立した LRU キャッシュ）の配列です。
キーのハッシュ値の **上位 4 ビット** でどのキャッシュ（シャード）を使うか決めます。各シャードが自分のロックを持つので、別々のシャードに触るスレッド同士は待たされません。

## コード

```cpp:line-numbers=350
static const int kNumShardBits = 4;
static const int kNumShards = 1 << kNumShardBits;

class ShardedLRUCache : public Cache {
 private:
  LRUCache shard_[kNumShards];
  port::Mutex id_mutex_;
  uint64_t last_id_;

  static inline uint32_t HashSlice(const Slice& s) {
    return Hash(s.data(), s.size(), 0);
  }

  static uint32_t Shard(uint32_t hash) { return hash >> (32 - kNumShardBits); }

 public:
  explicit ShardedLRUCache(size_t capacity) : last_id_(0) {
    const size_t per_shard = (capacity + (kNumShards - 1)) / kNumShards;
    for (int s = 0; s < kNumShards; s++) {
      shard_[s].SetInitialCapacity(per_shard);
    }
  }
  ~ShardedLRUCache() override {}
  Handle* Insert(const Slice& key, void* value, size_t charge,
                 void (*deleter)(const Slice& key, void* value)) override {
    const uint32_t hash = HashSlice(key);
    return shard_[Shard(hash)].Insert(key, hash, value, charge, deleter);
  }
  Handle* Lookup(const Slice& key) override {
    const uint32_t hash = HashSlice(key);
    return shard_[Shard(hash)].Lookup(key, hash);
  }
  void Release(Handle* handle) override {
    LRUHandle* h = reinterpret_cast<LRUHandle*>(handle);
    shard_[Shard(h->hash)].Release(handle);
  }
  void Erase(const Slice& key) override {
    const uint32_t hash = HashSlice(key);
    shard_[Shard(hash)].Erase(key, hash);
  }
```

## 前提知識

- **`class ShardedLRUCache : public Cache`**: `Cache` という抽象クラス（インターフェース）を継承しています。利用者は `Cache` として扱い、中身が分割されていることを知りません。
- **`static const int`**: クラスの外に置かれた、このファイル専用の定数です。
- **`LRUCache shard_[kNumShards];`**: `LRUCache` を 16 個並べた配列を、メンバーとして直接持っています。
- **`static inline` メンバー関数**: `static` はオブジェクトがなくても呼べる関数、`inline` は呼び出し元に展開してよいという指定です。
- **`override`**: 親クラスの仮想関数を上書きしていることを示します。綴りを間違えるとコンパイルエラーになるので安全です。
- **`explicit`**: コンストラクタで、`size_t` からの暗黙の変換を禁止します。
- **`reinterpret_cast<LRUHandle*>(handle)`**: 利用者に見せている `Handle*` を、内部の型に読み替えます。

## 何をしているか

### 1. 16 個のシャード

```cpp:line-numbers=350
static const int kNumShardBits = 4;
static const int kNumShards = 1 << kNumShardBits;

class ShardedLRUCache : public Cache {
 private:
  LRUCache shard_[kNumShards];
  port::Mutex id_mutex_;
  uint64_t last_id_;
```
`kNumShardBits = 4` なので、シャードの数は `1 << 4 = 16` です。

### 2. シャードの選び方

```cpp:line-numbers=359
  static inline uint32_t HashSlice(const Slice& s) {
    return Hash(s.data(), s.size(), 0);
  }

  static uint32_t Shard(uint32_t hash) { return hash >> (32 - kNumShardBits); }
```
キーをハッシュし、`hash >> (32 - 4)`、つまり **上位 4 ビット** を取り出します。0〜15 の値になります。
たとえばハッシュが `0xA1B2C3D4` なら、`>> 28` で `0xA`、つまりシャード 10 です。

### 3. 容量を分ける

```cpp:line-numbers=366
  explicit ShardedLRUCache(size_t capacity) : last_id_(0) {
    const size_t per_shard = (capacity + (kNumShards - 1)) / kNumShards;
    for (int s = 0; s < kNumShards; s++) {
      shard_[s].SetInitialCapacity(per_shard);
    }
  }
```
全体の容量を 16 で割って各シャードに配ります。`(capacity + 15) / 16` は切り上げの割り算です。容量 1000 なら各シャード 63 で、合計 1008 と少しだけ多めになります。

### 4. 操作をシャードに転送する

```cpp:line-numbers=373
  Handle* Insert(const Slice& key, void* value, size_t charge,
                 void (*deleter)(const Slice& key, void* value)) override {
    const uint32_t hash = HashSlice(key);
    return shard_[Shard(hash)].Insert(key, hash, value, charge, deleter);
  }
  Handle* Lookup(const Slice& key) override {
    const uint32_t hash = HashSlice(key);
    return shard_[Shard(hash)].Lookup(key, hash);
  }
  void Release(Handle* handle) override {
    LRUHandle* h = reinterpret_cast<LRUHandle*>(handle);
    shard_[Shard(h->hash)].Release(handle);
  }
  void Erase(const Slice& key) override {
    const uint32_t hash = HashSlice(key);
    shard_[Shard(hash)].Erase(key, hash);
  }
```
`Insert`、`Lookup`、`Erase` は、キーをハッシュしてシャードを選び、そのシャードにハッシュ値ごと渡します。
`Release` は、キーの代わりにハンドルの中に保存したハッシュ値 `h->hash` からシャードを選びます。

## ここがすごい

- **ロックの分割**: キャッシュ全体に 1 つのロックだと、たくさんのスレッドが読み込みのたびに同じ鍵を取り合います。16 個に分ければ、キーがばらけている限り、同時に同じ鍵を取り合う確率が下がります。
- **上位ビットと下位ビットの使い分け**: 各シャードの中のハッシュ表は `hash & (length - 1)`、つまり **下位ビット** でバケツを選びます。シャード選びに上位ビットを使うので、2 つの選択が互いに偏りを生みません。もし下位 4 ビットでシャードを選ぶと、同じシャードに入るキーは下位 4 ビットがすべて同じになり、ハッシュ表のバケツが偏ってしまいます。
- **ハッシュは 1 回だけ**: シャード選びに使ったハッシュ値を、そのままシャードに渡します。シャード内でもう一度計算しません。
- **利用者からは 1 つのキャッシュに見える**: `Cache` インターフェースの裏に分割を隠しています。分け方を変えても、利用者のコードは変わりません。
- **トレードオフ**: LRU の順序はシャードごとなので、全体で厳密に「いちばん古いもの」を捨てるわけではありません。容量もシャードごとに独立しています。性能のために、厳密さを少し手放しています。

## まとめ

- 共有データをいくつかに分割し、それぞれに鍵を持たせると、ロックの奪い合いが減る。
- 1 つのハッシュ値を 2 段階で使うときは、上位ビットと下位ビットのように別の部分を使う。
- 分割は抽象インターフェースの裏に隠すと、使う側に影響しない。
- 分割すると全体での厳密な順序は失われる。それを許容できるかがポイント。
