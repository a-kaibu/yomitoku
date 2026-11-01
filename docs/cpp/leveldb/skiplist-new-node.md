---
title: 配置 new で高さぶんだけのノードを作る
description: LevelDB のスキップリストでノードを作る関数。アリーナから必要なバイト数だけを確保し、配置 new でその場にオブジェクトを組み立てる。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: db/skiplist.h
lines: [179, 185]
function: SkipList::NewNode
difficulty: 2
format: 2
tags: [メモリ管理, イディオム, データ構造]
---

## ひとことで

`NewNode` は、スキップリストのノードを 1 つ作る関数です。わずか 2 文ですが、C++ らしい技が 2 つ入っています。
1 つは **ノードの高さに合わせて、必要な大きさだけメモリを取る** こと。もう 1 つは **配置 new** で、確保済みのメモリの上にオブジェクトを組み立てることです。

## コード

```cpp:line-numbers=179
template <typename Key, class Comparator>
typename SkipList<Key, Comparator>::Node* SkipList<Key, Comparator>::NewNode(
    const Key& key, int height) {
  char* const node_memory = arena_->AllocateAligned(
      sizeof(Node) + sizeof(std::atomic<Node*>) * (height - 1));
  return new (node_memory) Node(key);
}
```

参考までに、ノードの最後のメンバーは次のように宣言されています（同じファイルのノードの定義より）。

```cpp:line-numbers=175
  // 長さはノードの高さに等しい配列。next_[0] がいちばん下の段のリンク。
  std::atomic<Node*> next_[1];
```

## 前提知識

- **`typename SkipList<Key, Comparator>::Node*`**: 戻り値の型です。テンプレートの中で「`SkipList<...>` の中の `Node` という型」を指すとき、それが型であることをコンパイラに伝えるために `typename` を付けます。
- **`sizeof(T)`**: 型 `T` の大きさ（バイト数）です。
- **`std::atomic<Node*>`**: スレッド間で安全に読み書きできるポインタです。ここではノードのリンク 1 本分です。
- **配置 new（placement new）**: `new (住所) 型(引数)` と書くと、メモリを新しく確保せず、指定した住所の上でコンストラクタだけを実行します。メモリの確保と、オブジェクトの初期化を分けられます。
- **`arena_`**: ノード用のメモリを切り出すアリーナ（大きなメモリの塊から少しずつ渡す仕組み）です。

## 何をしているか

### 1. 必要なバイト数を計算する

```cpp:line-numbers=182
  char* const node_memory = arena_->AllocateAligned(
      sizeof(Node) + sizeof(std::atomic<Node*>) * (height - 1));
```
`sizeof(Node)` にはリンク 1 本分（`next_[1]`）が含まれています。高さ `height` のノードには `height` 本のリンクが必要なので、足りない `height - 1` 本分を足します。
64 ビット環境で `Key` がポインタ（8 バイト）なら、`sizeof(Node)` は 16 バイトです（キー 8 + リンク 8）。高さ 4 のノードなら `16 + 8 × 3 = 40` バイトを確保します。高さ 1 なら 16 バイトだけです。
確保には `AllocateAligned` を使います。中にポインタがあるので、住所を 8 の倍数にそろえる必要があるからです。

### 2. その場でノードを組み立てる

```cpp:line-numbers=184
  return new (node_memory) Node(key);
```
`new (node_memory) Node(key)` で、確保したメモリの先頭に `Node` を作ります。キーがコピーされます。
リンクの初期化はここではしません。呼び出し元（`Insert` やコンストラクタ）が `SetNext` で設定します。
こうしてできたノードでは、`next_[3]` のように宣言より大きな添字でも、確保したメモリの範囲内に収まります。

## ここがすごい

- **メモリの無駄がない**: スキップリストのノードは高さが確率的に決まり、4 分の 3 は高さ 1 です。最大の高さ 12 で固定の配列にすると、ほとんどのノードで 11 本分（88 バイト）が無駄になります。ここでは高さぶんだけしか取りません。
- **アリーナと組み合わせる**: 通常の `new Node` ではヒープから 1 つずつ確保されます。配置 new を使えば、メモリはアリーナから切り出し、初期化だけ C++ のコンストラクタに任せられます。MemTable は丸ごと捨てるので、ノードを 1 つずつ解放する必要もありません。
- **トレードオフ**: `next_[1]` より先にアクセスするのは、厳密な C++ の規則から見るとグレーな書き方です。C 言語で昔から使われる「構造体の最後に可変長の配列を置く」技法（フレキシブル配列メンバー）を C++ で使っている形です。ノードのデストラクタも呼ばれません。LevelDB はキーの型を単純なものに限ることで、この問題を避けています。

## まとめ

- 配置 new を使うと「メモリの確保」と「オブジェクトの初期化」を分けられる。
- 構造体の最後に配列を置き、後ろに余分に確保すると、可変長のオブジェクトが作れる。
- アリーナのような独自の確保手段と、C++ のコンストラクタを組み合わせられる。
- 便利な分、デストラクタが呼ばれないなどの制約を理解して使う必要がある。
