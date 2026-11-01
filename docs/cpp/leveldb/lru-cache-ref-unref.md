---
title: 参照カウントで「使用中」と「捨ててよい」の 2 本のリストを行き来する
description: LevelDB の LRU キャッシュで、エントリの参照数を増減する関数。参照数が 1 か 2 以上かで所属リストを移し替え、使用中のエントリが追い出されないようにしている。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/cache.cc
lines: [219, 252]
function: LRUCache::Ref / LRUCache::Unref
difficulty: 2
format: 2
tags: [キャッシュ, メモリ管理, データ構造]
---

## ひとことで

LRU キャッシュは、容量がいっぱいになったら **いちばん長く使われていないもの** から捨てるキャッシュです。LevelDB の `LRUCache` は、エントリを 2 本の環状リストに分けて管理します。

- `in_use_`: 利用者がまだ使っているエントリ。捨ててはいけない。
- `lru_`: キャッシュだけが持っているエントリ。古い順に捨ててよい。

`Ref` と `Unref` は、エントリの参照カウント（何か所から使われているかの数）を増減し、必要に応じてリストを移し替えます。

## コード

::: code-group

```cpp:line-numbers=219 [日本語訳]
void LRUCache::Ref(LRUHandle* e) {
  if (e->refs == 1 && e->in_cache) {  // lru_ リストにいるなら、in_use_ リストに移す。
    LRU_Remove(e);
    LRU_Append(&in_use_, e);
  }
  e->refs++;
}

void LRUCache::Unref(LRUHandle* e) {
  assert(e->refs > 0);
  e->refs--;
  if (e->refs == 0) {  // 解放する。
    assert(!e->in_cache);
    (*e->deleter)(e->key(), e->value);
    free(e);
  } else if (e->in_cache && e->refs == 1) {
    // もう使われていないので lru_ リストに移す。
    LRU_Remove(e);
    LRU_Append(&lru_, e);
  }
}

void LRUCache::LRU_Remove(LRUHandle* e) {
  e->next->prev = e->prev;
  e->prev->next = e->next;
}

void LRUCache::LRU_Append(LRUHandle* list, LRUHandle* e) {
  // *list の直前に入れて、"e" を最も新しいエントリにする
  e->next = list;
  e->prev = list->prev;
  e->prev->next = e;
  e->next->prev = e;
}
```

```cpp:line-numbers=219 [原文]
void LRUCache::Ref(LRUHandle* e) {
  if (e->refs == 1 && e->in_cache) {  // If on lru_ list, move to in_use_ list.
    LRU_Remove(e);
    LRU_Append(&in_use_, e);
  }
  e->refs++;
}

void LRUCache::Unref(LRUHandle* e) {
  assert(e->refs > 0);
  e->refs--;
  if (e->refs == 0) {  // Deallocate.
    assert(!e->in_cache);
    (*e->deleter)(e->key(), e->value);
    free(e);
  } else if (e->in_cache && e->refs == 1) {
    // No longer in use; move to lru_ list.
    LRU_Remove(e);
    LRU_Append(&lru_, e);
  }
}

void LRUCache::LRU_Remove(LRUHandle* e) {
  e->next->prev = e->prev;
  e->prev->next = e->next;
}

void LRUCache::LRU_Append(LRUHandle* list, LRUHandle* e) {
  // Make "e" newest entry by inserting just before *list
  e->next = list;
  e->prev = list->prev;
  e->prev->next = e;
  e->next->prev = e;
}
```

:::

## 前提知識

- **参照カウント**: オブジェクトを使っている人数を数え、0 になったら解放する方法です。ここではキャッシュ自身も 1 人として数えます。
- **環状の双方向リスト**: 各要素が `next`（次）と `prev`（前）を持ち、最後の次が先頭に戻る輪になったリストです。`lru_` や `in_use_` は「ダミーの先頭」で、データを持たず、空のときは自分自身を指します。
- **`e->refs`, `e->in_cache`**: エントリの参照数と、キャッシュに登録中かどうかのフラグです。
- **`(*e->deleter)(e->key(), e->value)`**: `deleter` は関数ポインタ（関数の住所を入れた変数）です。`(*関数ポインタ)(引数)` で、その関数を呼びます。値の後始末を利用者が決められます。
- **`free(e)`**: `malloc` で確保したメモリを解放します。エントリはキーの長さに合わせて `malloc` で確保されています。

## 何をしているか

### Ref

```cpp:line-numbers=219
void LRUCache::Ref(LRUHandle* e) {
  if (e->refs == 1 && e->in_cache) {  // lru_ リストにいるなら、in_use_ リストに移す。
    LRU_Remove(e);
    LRU_Append(&in_use_, e);
  }
  e->refs++;
}
```
キャッシュに登録済みで誰も使っていないエントリは `refs == 1`（キャッシュの分だけ）で `lru_` にいます。
これを利用者が `Lookup` で取り出すと `Ref` が呼ばれます。`refs == 1 && in_cache` なので、`lru_` から外して `in_use_` に移し、`refs` を 2 にします。
すでに誰かが使っている（`refs >= 2`）なら、リストは移さず数を増やすだけです。

### Unref

```cpp:line-numbers=227
void LRUCache::Unref(LRUHandle* e) {
  assert(e->refs > 0);
  e->refs--;
  if (e->refs == 0) {  // 解放する。
    assert(!e->in_cache);
    (*e->deleter)(e->key(), e->value);
    free(e);
  } else if (e->in_cache && e->refs == 1) {
    // もう使われていないので lru_ リストに移す。
    LRU_Remove(e);
    LRU_Append(&lru_, e);
  }
}
```
利用者が使い終わって `Release` すると `Unref` が呼ばれ、`refs` が 1 減ります。

- **0 になったとき**: キャッシュからもすでに外されています（`assert(!e->in_cache)`）。`deleter` で値を片付け、エントリを解放します。
- **1 になり、まだキャッシュにいるとき**: 使っている人がいなくなったので、`in_use_` から `lru_` の「いちばん新しい位置」に移します。

```cpp:line-numbers=230
  if (e->refs == 0) {  // 解放する。
    assert(!e->in_cache);
    (*e->deleter)(e->key(), e->value);
    free(e);
  } else if (e->in_cache && e->refs == 1) {
    // もう使われていないので lru_ リストに移す。
    LRU_Remove(e);
    LRU_Append(&lru_, e);
  }
```

### LRU_Remove と LRU_Append

```cpp:line-numbers=241
void LRUCache::LRU_Remove(LRUHandle* e) {
  e->next->prev = e->prev;
  e->prev->next = e->next;
}

void LRUCache::LRU_Append(LRUHandle* list, LRUHandle* e) {
  // *list の直前に入れて、"e" を最も新しいエントリにする
  e->next = list;
  e->prev = list->prev;
  e->prev->next = e;
  e->next->prev = e;
}
```
`LRU_Remove` は前後の要素を直接つなぎ、自分を輪から外します。
`LRU_Append` は、ダミーの先頭 `list` の **直前** に入れます。輪なので、先頭の直前は「最後」、つまりいちばん新しい位置です。逆に `lru_.next` がいちばん古いエントリになり、容量オーバーのときはそこから捨てます。

## ここがすごい

- **使用中のものを追い出さない**: リストが 1 本だと、捨てる候補を探すたびに「これは使用中か」を確かめて飛ばす必要があります。2 本に分けておけば、`lru_` の先頭を捨てるだけで済み、使用中のエントリが消える心配もありません。
- **状態とリストが一対一**: クラス定義のメンバーに付いたコメントのとおり、`lru_` にいるのは `refs == 1`、`in_use_` にいるのは `refs >= 2` です。「数が 1 と 2 の境目を越えたら移す」という単純な規則で、この不変条件（いつも成り立つ約束）が保たれます。
- **ダミーの先頭で場合分けを消す**: 環状リストにダミーの先頭を置くと、空のリストや先頭・末尾の要素でも `next` と `prev` が必ず存在します。`LRU_Remove` や `LRU_Append` に `if` が 1 つもないのはそのためです。
- **後始末は利用者に任せる**: 値の種類を知らないキャッシュの代わりに、`deleter` で解放方法を外から渡します。

## まとめ

- LRU キャッシュでは、「使用中」と「捨ててよい」を別のリストに分けると追い出しが単純になる。
- 参照カウントの境目でリストを移せば、状態とリストの対応を常に保てる。
- 環状リストにダミーの先頭を置くと、挿入・削除から場合分けが消える。
- 解放方法を関数ポインタで受け取れば、どんな値でもキャッシュに入れられる。
