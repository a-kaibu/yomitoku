---
title: 下の段から順につなぎ、読み手を止めずにノードを挿入する
description: LevelDB のスキップリストに新しいキーを入れる関数。新ノードのリンクを先に用意してから release 書き込みで公開し、ロックなしの読み手と安全に共存する。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: db/skiplist.h
lines: [334, 366]
function: SkipList::Insert
difficulty: 3
format: 2
tags: [並行処理, ロック不要, データ構造]
---

## ひとことで

`Insert` は、スキップリスト（連結リストを何段にも重ねたデータ構造）に新しいキーを 1 つ加える関数です。
LevelDB では、書き込みは 1 スレッドずつですが、読み出しはロックなしで同時に行われます。この関数は、**読んでいる最中のスレッドが壊れたリストを見ないよう**、つなぎ替えの順番を工夫しています。

## コード

::: code-group

```cpp:line-numbers=334 [日本語訳]
template <typename Key, class Comparator>
void SkipList<Key, Comparator>::Insert(const Key& key) {
  // TODO(最適化): Insert() は外部で同期されているので、ここでは
  // バリアなし版の FindGreaterOrEqual() を使える。
  Node* prev[kMaxHeight];
  Node* x = FindGreaterOrEqual(key, prev);

  // このデータ構造は重複した挿入を許さない
  assert(x == nullptr || !Equal(key, x->key));

  int height = RandomHeight();
  if (height > GetMaxHeight()) {
    for (int i = GetMaxHeight(); i < height; i++) {
      prev[i] = head_;
    }
    // 並行して読むスレッドと同期せずに max_height_ を変えてよい。
    // max_height_ の新しい値を見た読み手は、head_ からの新しい段の
    // ポインタについて、古い値（nullptr）か、下のループで設定された
    // 新しい値のどちらかを見る。
    // 前者の場合、nullptr はすべてのキーより後ろとみなされるので、
    // 読み手はすぐ次の段に下りる。
    // 後者の場合、読み手は新しいノードを使う。
    max_height_.store(height, std::memory_order_relaxed);
  }

  x = NewNode(key, height);
  for (int i = 0; i < height; i++) {
    // prev[i] に "x" へのポインタを公開するときにバリアを入れるので、
    // ここでは NoBarrier_SetNext() で十分。
    x->NoBarrier_SetNext(i, prev[i]->NoBarrier_Next(i));
    prev[i]->SetNext(i, x);
  }
}
```

```cpp:line-numbers=334 [原文]
template <typename Key, class Comparator>
void SkipList<Key, Comparator>::Insert(const Key& key) {
  // TODO(opt): We can use a barrier-free variant of FindGreaterOrEqual()
  // here since Insert() is externally synchronized.
  Node* prev[kMaxHeight];
  Node* x = FindGreaterOrEqual(key, prev);

  // Our data structure does not allow duplicate insertion
  assert(x == nullptr || !Equal(key, x->key));

  int height = RandomHeight();
  if (height > GetMaxHeight()) {
    for (int i = GetMaxHeight(); i < height; i++) {
      prev[i] = head_;
    }
    // It is ok to mutate max_height_ without any synchronization
    // with concurrent readers.  A concurrent reader that observes
    // the new value of max_height_ will see either the old value of
    // new level pointers from head_ (nullptr), or a new value set in
    // the loop below.  In the former case the reader will
    // immediately drop to the next level since nullptr sorts after all
    // keys.  In the latter case the reader will use the new node.
    max_height_.store(height, std::memory_order_relaxed);
  }

  x = NewNode(key, height);
  for (int i = 0; i < height; i++) {
    // NoBarrier_SetNext() suffices since we will add a barrier when
    // we publish a pointer to "x" in prev[i].
    x->NoBarrier_SetNext(i, prev[i]->NoBarrier_Next(i));
    prev[i]->SetNext(i, x);
  }
}
```

:::

## 前提知識

- **`Node* prev[kMaxHeight];`**: ノードへのポインタを 12 個（`kMaxHeight`）入れる配列を、関数の中（スタック）に用意しています。
- **`FindGreaterOrEqual(key, prev)`**: 指定キー以上の最初のノードを探し、各段で「その手前のノード」を `prev` に入れて返す関数です。
- **`std::atomic` の `store` / `memory_order_relaxed`**: `max_height_` は複数スレッドから読まれる atomic 変数です。`relaxed` は順序の保証をしない、いちばん軽い書き込みです。
- **`SetNext` / `NoBarrier_SetNext`**: ノードのリンクを書き換えるメソッドです。`SetNext` は release 付き（それより前の書き込みが、読む側から先に見えることを保証）、`NoBarrier_` は保証なしの軽い版です。
- **`assert`**: デバッグ時の確認です。ここでは同じキーの二重登録がないことを確かめています。

## 何をしているか

キー 3, 7, 12, 20 が入ったリスト（高さ 2）に 15 を入れる場合を追います。

### 1. 挿入位置を探す

```cpp:line-numbers=338
  Node* prev[kMaxHeight];
  Node* x = FindGreaterOrEqual(key, prev);

  // このデータ構造は重複した挿入を許さない
  assert(x == nullptr || !Equal(key, x->key));
```
`FindGreaterOrEqual(15, prev)` は 20 を返し、`prev` には各段で 15 の手前のノード（たとえば `[12, 12]`）が入ります。20 は 15 と等しくないので、`assert` も通ります。

### 2. 高さを決める

```cpp:line-numbers=344
  int height = RandomHeight();
```
`RandomHeight()` で新しいノードの高さを決めます。ここでは 3 になったとします。

### 3. リストより高ければ先頭を手前にする

```cpp:line-numbers=345
  if (height > GetMaxHeight()) {
    for (int i = GetMaxHeight(); i < height; i++) {
      prev[i] = head_;
    }
    // 並行して読むスレッドと同期せずに max_height_ を変えてよい。
    // max_height_ の新しい値を見た読み手は、head_ からの新しい段の
    // ポインタについて、古い値（nullptr）か、下のループで設定された
    // 新しい値のどちらかを見る。
    // 前者の場合、nullptr はすべてのキーより後ろとみなされるので、
    // 読み手はすぐ次の段に下りる。
    // 後者の場合、読み手は新しいノードを使う。
    max_height_.store(height, std::memory_order_relaxed);
  }
```
今のリストの高さは 2 なので、段 2 の手前は先頭 `head_` です。`prev[2] = head_` とし、`max_height_` を 3 にします。
長いコメントは「この書き込みに同期はいらない」理由の説明です。読み手が新しい高さ 3 を見たとき、段 2 の先頭のリンクはまだ `nullptr` かもしれません。`nullptr` は「すべてのキーより後ろ」扱いなので、読み手はすぐ段 1 に下りるだけで、検索は正しく続きます。

### 4. 下の段から順につなぐ

```cpp:line-numbers=359
  x = NewNode(key, height);
  for (int i = 0; i < height; i++) {
    // prev[i] に "x" へのポインタを公開するときにバリアを入れるので、
    // ここでは NoBarrier_SetNext() で十分。
    x->NoBarrier_SetNext(i, prev[i]->NoBarrier_Next(i));
    prev[i]->SetNext(i, x);
  }
```
新ノード `x` を作り、段 0 から順に 2 つの操作をします。

1. `x` の次を、`prev[i]` の今の次（たとえば 20）にする（`NoBarrier_SetNext`）。
2. `prev[i]` の次を `x` にする（`SetNext`）。

1 は、まだ誰からも見えない `x` を書くだけなので軽い書き込みで十分です。2 は `x` を公開する瞬間なので release で書きます。読み手がこのリンクから `x` を見つけたとき、1 で設定した `x` の次のリンクも必ず見えます。

## ここがすごい

- **公開は最後の 1 手だけ**: 「新ノードを完全に作る → 前のノードから指す」という順番を守ると、読み手には「挿入前」か「挿入後」のどちらかしか見えません。作りかけの状態は見えません。
- **下の段からつなぐ理由**: 段 0 はすべてのノードを含む「正しい列」です。ここを先につなげば、上の段がまだつながっていなくても、読み手は段 0 を辿れば必ず `x` に行き着きます。上の段は「近道」にすぎないので、遅れてつながっても問題ありません。
- **同期を最小限に**: 書き込み同士は外側のロックで直列化されているので、関数の中ではロックを取りません。atomic の中でも、必要な場所だけ release にして、他は relaxed で済ませています。どこまで省けるかをコメントで論証しているのも参考になります。
- **TODO も正直**: 関数冒頭の TODO コメントには「挿入は外部で同期されるので、検索もバリアなし版にできる」と、まだ残っている最適化の余地が書かれています。

## まとめ

- ロックなしの読み手がいるデータ構造では、新しい要素を「完全に作ってから公開する」。
- 公開の書き込みだけを release にすれば、軽い書き込みと安全性を両立できる。
- 正しさを担う下の段から先に更新し、近道の段は後から足す。
- 同期を省くときは、なぜ安全かをコメントで説明しておく。
