---
title: acquire と release でロックなしの読み出しを支えるリンク
description: LevelDB のスキップリストのノード。次のノードへのリンクを atomic にし、読み書きで acquire/release を使い分けることで、ロックなしで安全に読めるようにしている。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: db/skiplist.h
lines: [143, 177]
function: SkipList::Node
difficulty: 3
format: 2
tags: [並行処理, ロック不要, データ構造]
---

## ひとことで

`SkipList::Node` は、LevelDB のメモリ上の表（MemTable）を作るスキップリストの「1 つの要素」です。キーと、次のノードを指すリンクを何段か持ちます。
このノードの工夫は、リンクの読み書きに **メモリ順序（memory order）** を指定していることです。これで、書き込み中のスレッドがいても、読むスレッドはロックなしで安全に辿れます。

## コード

::: code-group

```cpp:line-numbers=143 [日本語訳]
template <typename Key, class Comparator>
struct SkipList<Key, Comparator>::Node {
  explicit Node(const Key& k) : key(k) {}

  Key const key;

  // リンクの読み出し・書き換え。必要に応じて適切なバリアを入れられるよう
  // メソッドで包んでいる。
  Node* Next(int n) {
    assert(n >= 0);
    // 「acquire 読み出し」を使い、返したノードが完全に
    // 初期化された状態で見えるようにする。
    return next_[n].load(std::memory_order_acquire);
  }
  void SetNext(int n, Node* x) {
    assert(n >= 0);
    // 「release 書き込み」を使い、このポインタ経由で読む誰もが
    // 挿入されたノードを完全に初期化された状態で見られるようにする。
    next_[n].store(x, std::memory_order_release);
  }

  // いくつかの場所で安全に使える、バリアなしの版。
  Node* NoBarrier_Next(int n) {
    assert(n >= 0);
    return next_[n].load(std::memory_order_relaxed);
  }
  void NoBarrier_SetNext(int n, Node* x) {
    assert(n >= 0);
    next_[n].store(x, std::memory_order_relaxed);
  }

 private:
  // 長さはノードの高さに等しい配列。next_[0] がいちばん下の段のリンク。
  std::atomic<Node*> next_[1];
};
```

```cpp:line-numbers=143 [原文]
template <typename Key, class Comparator>
struct SkipList<Key, Comparator>::Node {
  explicit Node(const Key& k) : key(k) {}

  Key const key;

  // Accessors/mutators for links.  Wrapped in methods so we can
  // add the appropriate barriers as necessary.
  Node* Next(int n) {
    assert(n >= 0);
    // Use an 'acquire load' so that we observe a fully initialized
    // version of the returned Node.
    return next_[n].load(std::memory_order_acquire);
  }
  void SetNext(int n, Node* x) {
    assert(n >= 0);
    // Use a 'release store' so that anybody who reads through this
    // pointer observes a fully initialized version of the inserted node.
    next_[n].store(x, std::memory_order_release);
  }

  // No-barrier variants that can be safely used in a few locations.
  Node* NoBarrier_Next(int n) {
    assert(n >= 0);
    return next_[n].load(std::memory_order_relaxed);
  }
  void NoBarrier_SetNext(int n, Node* x) {
    assert(n >= 0);
    next_[n].store(x, std::memory_order_relaxed);
  }

 private:
  // Array of length equal to the node height.  next_[0] is lowest level link.
  std::atomic<Node*> next_[1];
};
```

:::

## 前提知識

- **`template <typename Key, class Comparator>`**: テンプレートです。`Key` や `Comparator` に好きな型を入れて使える「型の穴あき」設計図です。
- **`struct SkipList<...>::Node`**: `SkipList` クラスの中で宣言された `Node` 型の中身を、外側で定義しています。
- **`explicit`**: コンストラクタに付けると、`Key` から `Node` への暗黙の型変換を禁止します。
- **`std::atomic<Node*>`**: 複数のスレッドから同時に読み書きしても壊れない変数です。中身はノードへのポインタです。
- **`load` / `store`**: atomic 変数の読み出しと書き込みです。引数でメモリ順序を指定します。
- **メモリ順序**: CPU やコンパイラは、速くするために読み書きの順番を入れ替えることがあります。`memory_order_release` で書くと「それより前の書き込みは、この書き込みより先に見える」ことが保証されます。`memory_order_acquire` で読むと「release で書かれた値を読んだら、その前の書き込みもすべて見える」ことが保証されます。`memory_order_relaxed` は順序を何も保証しない、いちばん軽い指定です。
- **`next_[1]`**: 長さ 1 の配列として宣言していますが、実際にはノードの高さぶんのメモリを確保して、それ以上の添字も使います（後述）。

## 何をしているか

### 1. キーは変えられない

```cpp:line-numbers=145
  explicit Node(const Key& k) : key(k) {}

  Key const key;
```
`Key const key;` なので、ノードを作ったあとキーは変更できません。読むスレッドから見て、キーが途中で変わる心配がありません。

### 2. 普通のリンク操作

```cpp:line-numbers=151
  Node* Next(int n) {
    assert(n >= 0);
    // 「acquire 読み出し」を使い、返したノードが完全に
    // 初期化された状態で見えるようにする。
    return next_[n].load(std::memory_order_acquire);
  }
  void SetNext(int n, Node* x) {
    assert(n >= 0);
    // 「release 書き込み」を使い、このポインタ経由で読む誰もが
    // 挿入されたノードを完全に初期化された状態で見られるようにする。
    next_[n].store(x, std::memory_order_release);
  }
```
`Next(n)` は n 段目のリンクを **acquire** で読みます。`SetNext(n, x)` は **release** で書きます。
新しいノード `x` を挿入するとします。書く側はまず `x` のキーや `x` のリンクを用意し、最後に前のノードのリンクを `x` に向けます（release）。読む側がこのリンクを acquire で読んで `x` を受け取れば、`x` の中身はすでに完全に見えている、と保証されます。
つまり「作りかけのノードが見える」ことがありません。

### 3. 順序保証なしの版

```cpp:line-numbers=164
  // いくつかの場所で安全に使える、バリアなしの版。
  Node* NoBarrier_Next(int n) {
    assert(n >= 0);
    return next_[n].load(std::memory_order_relaxed);
  }
  void NoBarrier_SetNext(int n, Node* x) {
    assert(n >= 0);
    next_[n].store(x, std::memory_order_relaxed);
  }
```
`NoBarrier_Next` / `NoBarrier_SetNext` は relaxed で読み書きします。
挿入処理では、新しいノード自身のリンクを設定するときにこちらを使います。そのノードはまだ誰からも見えないので、順序を保証する必要がないからです。

### 4. 可変長のリンク配列

```cpp:line-numbers=174
 private:
  // 長さはノードの高さに等しい配列。next_[0] がいちばん下の段のリンク。
  std::atomic<Node*> next_[1];
```
`next_[1]` の後ろに、高さ分のリンクが続くようにメモリを取ります。高さ 3 のノードなら、`next_[0]`、`next_[1]`、`next_[2]` が使えます。

## ここがすごい

- **書くスレッドは 1 つ、読むスレッドはたくさん、を前提にした設計**: LevelDB では挿入は外側のロックで 1 つずつ行われます。読み出しはロックなしです。この前提なら、release/acquire の組み合わせだけで十分に安全になります。読むたびにロックを取るより、ずっと軽く済みます。
- **必要なところだけ重い操作を使う**: 全部を acquire/release にするのではなく、「まだ公開していないノード」には relaxed を使います。コメントにもあるように、どこが安全かを考えて使い分けています。
- **バリアをメソッドに閉じ込める**: コメントに「Wrapped in methods so we can add the appropriate barriers」とあります。生の `next_` を触らせず、意図が名前に出るメソッドを通させることで、使う側が順序指定を間違えにくくなります。
- **ノードのサイズが高さに比例する**: 固定で 12 段ぶん持たせると、ほとんどのノード（高さ 1）でメモリを大きく無駄にします。必要な段数だけ確保する作りです。

## まとめ

- 「作ってから公開する」パターンでは、公開の書き込みを release、受け取りを acquire にすれば、中身が完全に見えることが保証される。
- まだ他のスレッドから見えないデータには、軽い relaxed で十分。
- 危ない操作はメソッドに包み、名前で意図を示すと間違いにくい。
- 書き手が 1 人なら、ロックなしの読み出しはかなり単純に実現できる。
