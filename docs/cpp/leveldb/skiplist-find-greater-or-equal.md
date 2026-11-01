---
title: 上の段から降りながら探し、挿入位置もついでに記録する
description: LevelDB のスキップリストで、指定したキー以上の最初のノードを探す関数。各段で最後に止まった位置を prev に残すことで、挿入処理の下準備も同時に済ませる。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: db/skiplist.h
lines: [258, 279]
function: SkipList::FindGreaterOrEqual
difficulty: 2
format: 2
tags: [データ構造, 探索, アルゴリズム]
---

## ひとことで

`FindGreaterOrEqual` は、スキップリスト（連結リストを何段にも重ねたデータ構造）の中で、**指定したキー以上の最初のノード** を探す関数です。
検索は、いちばん上のまばらな段から始めて、行き過ぎそうになったら 1 段下りる、をくり返します。さらに、引数 `prev` を渡すと、各段で「どこで下りたか」を記録します。これが挿入のときにそのまま使えます。

## コード

::: code-group

```cpp:line-numbers=258 [日本語訳]
template <typename Key, class Comparator>
typename SkipList<Key, Comparator>::Node*
SkipList<Key, Comparator>::FindGreaterOrEqual(const Key& key,
                                              Node** prev) const {
  Node* x = head_;
  int level = GetMaxHeight() - 1;
  while (true) {
    Node* next = x->Next(level);
    if (KeyIsAfterNode(key, next)) {
      // この段のリストで探し続ける
      x = next;
    } else {
      if (prev != nullptr) prev[level] = x;
      if (level == 0) {
        return next;
      } else {
        // 次の段のリストに移る
        level--;
      }
    }
  }
}
```

```cpp:line-numbers=258 [原文]
template <typename Key, class Comparator>
typename SkipList<Key, Comparator>::Node*
SkipList<Key, Comparator>::FindGreaterOrEqual(const Key& key,
                                              Node** prev) const {
  Node* x = head_;
  int level = GetMaxHeight() - 1;
  while (true) {
    Node* next = x->Next(level);
    if (KeyIsAfterNode(key, next)) {
      // Keep searching in this list
      x = next;
    } else {
      if (prev != nullptr) prev[level] = x;
      if (level == 0) {
        return next;
      } else {
        // Switch to next list
        level--;
      }
    }
  }
}
```

:::

## 前提知識

- **`typename SkipList<Key, Comparator>::Node*`**: 戻り値の型です。「`SkipList` の中で定義された `Node` 型へのポインタ」です。テンプレートの中の型名なので `typename` が必要です。
- **`Node** prev`**: 「ノードへのポインタ」の配列を受け取るためのポインタです。呼び出し側が用意した配列 `prev[0]`、`prev[1]`… に結果を書き込みます。不要なら `nullptr`（どこも指さないポインタ）を渡します。
- **`const`（関数の後ろ）**: このメソッドがリストの中身を変更しないことを表します。
- **`x->Next(level)`**: `->` はポインタが指すオブジェクトのメンバーを呼ぶ書き方です。ノード `x` の `level` 段目の次のノードを返します。
- **`KeyIsAfterNode(key, n)`**: 「ノード `n` のキーが `key` より小さいか」を返します。`n` が `nullptr`（リストの終端）なら「無限大」とみなして `false` を返します。

```cpp:line-numbers=252
template <typename Key, class Comparator>
bool SkipList<Key, Comparator>::KeyIsAfterNode(const Key& key, Node* n) const {
  // null の n は無限大とみなす
  return (n != nullptr) && (compare_(n->key, key) < 0);
}
```


## 何をしているか

キー 3, 7, 12, 20 が入っていて、段が次のようになっているとします。`H` は先頭（`head_`）です。

```
段2: H ---------> 12 ---------> nil
段1: H ---> 7 --> 12 --> 20 --> nil
段0: H -> 3 -> 7 -> 12 -> 20 -> nil
```

`key = 15` を探します。

### 1. いちばん上の段から開始

```cpp:line-numbers=262
  Node* x = head_;
  int level = GetMaxHeight() - 1;
```
`x` は先頭、`level` は 2 です。`GetMaxHeight()` は今のリストの高さです。

### 2. 進めるだけ横に進む

```cpp:line-numbers=265
    Node* next = x->Next(level);
    if (KeyIsAfterNode(key, next)) {
      // この段のリストで探し続ける
      x = next;
```
段 2 で次は 12。12 < 15 なので `x = 12` に進みます。次は nil で、これは「無限大」なので進めません。

### 3. 下りる前に記録

```cpp:line-numbers=269
    } else {
      if (prev != nullptr) prev[level] = x;
      if (level == 0) {
        return next;
      } else {
        // 次の段のリストに移る
        level--;
      }
```
進めなくなったら `prev[2] = 12` と記録し、段 1 に下ります。
段 1 で 12 の次は 20。20 は 15 以上なので進めず、`prev[1] = 12`。段 0 でも 12 の次は 20 なので、`prev[0] = 12` です。

### 4. 最下段で答えを返す

```cpp:line-numbers=271
      if (level == 0) {
        return next;
```
段 0 で止まったときの `next`、つまり 20 が「15 以上の最初のノード」です。これを返します。
`prev` には `[12, 12, 12]` が入りました。15 を挿入するなら、各段で 12 の後ろにつなげばよい、ということです。

## ここがすごい

- **検索と挿入準備を兼ねる**: `Insert` はこの関数で `prev` を受け取り、すぐにリンクをつなぎ替えます。挿入位置を探すために別の検索を書く必要がありません。`prev` が不要な検索（`Seek` など）では `nullptr` を渡すだけです。
- **終端を「無限大」とみなす**: `KeyIsAfterNode` が `nullptr` を常に「後ろ」と判定するので、ループの中で終端の特別扱いが要りません。分岐が 1 種類にまとまり、コードが短くなっています。
- **ロックなしの読み出しと両立**: `x->Next(level)` は acquire 付きの読み出しです。挿入中の他スレッドがいても、見えたノードは完全に初期化済みです。高さ `GetMaxHeight()` が古い値でも、正しく動くように設計されています。
- **再帰を使わない**: 上から下へ 1 本道で進むだけなので、`while (true)` の単純なループで書けています。

## まとめ

- スキップリストの検索は「横に進めるだけ進み、無理なら 1 段下りる」のくり返し。
- 各段で下りた位置を記録すれば、そのまま挿入位置になる。
- 終端を「無限大」とみなすと、境界の場合分けが消える。
- オプションの出力引数を `nullptr` で省略できるようにすると、1 つの関数を複数の用途に使える。
