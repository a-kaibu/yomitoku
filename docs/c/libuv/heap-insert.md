---
title: "要素数の 2 進数が、木のどこに挿すかの道順になる"
description: "ポインタでつないだ二分ヒープに新しいノードを追加する関数。要素数を 2 進数で読むだけで、根から挿入位置までの左右の道順を求める。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: ISC
copyright: "Copyright (c) 2013, Ben Noordhuis <info@bnoordhuis.nl>"
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/heap-inl.h
lines: [106, 148]
function: "heap_insert"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, ビット演算]
---

## ひとことで

`heap_insert` は、libuv のタイマー管理に使われる二分ヒープ（親が子より小さい完全二分木）に、新しいノードを 1 つ追加する関数です。
配列で作るヒープなら「末尾に置く」だけで済みますが、これはポインタでつながった木です。
そこで **「新しい要素数を 2 進数で書くと、根から挿入位置までの左右の道順になる」** という性質を使って、末尾の位置を一発で求めています。

## コード

::: code-group

```c:line-numbers=106 [日本語訳]
HEAP_EXPORT(void heap_insert(struct heap* heap,
                             struct heap_node* newnode,
                             heap_compare_fn less_than)) {
  struct heap_node** parent;
  struct heap_node** child;
  unsigned int path;
  unsigned int n;
  unsigned int k;

  newnode->left = NULL;
  newnode->right = NULL;
  newnode->parent = NULL;

  /* 根から挿入位置までの道順を計算する。これは最小ヒープなので、
   * 常に最下段の、いちばん左の空き位置に挿入する。
   */
  path = 0;
  for (k = 0, n = 1 + heap->nelts; n >= 2; k += 1, n /= 2)
    path = (path << 1) | (n & 1);

  /* 前の手順で計算した道順に従ってヒープをたどる。 */
  parent = child = &heap->min;
  while (k > 0) {
    parent = child;
    if (path & 1)
      child = &(*child)->right;
    else
      child = &(*child)->left;
    path >>= 1;
    k -= 1;
  }

  /* 新しいノードを挿入する。 */
  newnode->parent = *parent;
  *child = newnode;
  heap->nelts += 1;

  /* 木を上へたどり、各ノードでヒープ条件が成り立っているかを確かめる。
   * 最小ヒープなので、親 < 子 が成り立たなければならない。
   */
  while (newnode->parent != NULL && less_than(newnode, newnode->parent))
    heap_node_swap(heap, newnode->parent, newnode);
}
```

```c:line-numbers=106 [原文]
HEAP_EXPORT(void heap_insert(struct heap* heap,
                             struct heap_node* newnode,
                             heap_compare_fn less_than)) {
  struct heap_node** parent;
  struct heap_node** child;
  unsigned int path;
  unsigned int n;
  unsigned int k;

  newnode->left = NULL;
  newnode->right = NULL;
  newnode->parent = NULL;

  /* Calculate the path from the root to the insertion point.  This is a min
   * heap so we always insert at the left-most free node of the bottom row.
   */
  path = 0;
  for (k = 0, n = 1 + heap->nelts; n >= 2; k += 1, n /= 2)
    path = (path << 1) | (n & 1);

  /* Now traverse the heap using the path we calculated in the previous step. */
  parent = child = &heap->min;
  while (k > 0) {
    parent = child;
    if (path & 1)
      child = &(*child)->right;
    else
      child = &(*child)->left;
    path >>= 1;
    k -= 1;
  }

  /* Insert the new node. */
  newnode->parent = *parent;
  *child = newnode;
  heap->nelts += 1;

  /* Walk up the tree and check at each node if the heap property holds.
   * It's a min heap so parent < child must be true.
   */
  while (newnode->parent != NULL && less_than(newnode, newnode->parent))
    heap_node_swap(heap, newnode->parent, newnode);
}
```

:::

## 前提知識

- **二分ヒープ**: 各ノードが最大 2 つの子を持つ木で、「親は子より小さい」という約束（ヒープ条件）を守ります。根がいちばん小さい値になるので、最小値をすぐ取り出せます。
- **完全二分木**: 上の段から順に、各段を左から詰めて埋めた木です。ノードが `n` 個なら形は 1 通りに決まります。
- **ポインタのポインタ（`struct heap_node**`）**: 「ポインタが入っている場所」を指すポインタです。`*child = newnode` と書くと、その場所（たとえば親の `left` 欄）に新しいノードを書き込めます。
- **`&`**: 変数やメンバのアドレスを取ります。`&heap->min` は「`heap->min` という欄の場所」です。
- **ビット演算**: `<<` は左シフト（2 倍）、`>>` は右シフト（2 で割る）、`|` はビットの OR、`n & 1` は `n` の最下位ビット（奇数なら 1）です。
- **関数ポインタ `heap_compare_fn`**: 比較の仕方を引数で受け取ります。`less_than(a, b)` は「a が b より小さければ 0 以外」を返します。

## 何をしているか

### 1. 道順を計算する

```c:line-numbers=122
  path = 0;
  for (k = 0, n = 1 + heap->nelts; n >= 2; k += 1, n /= 2)
    path = (path << 1) | (n & 1);
```

ノードに 1 から番号を振ると、根が 1、その左右が 2・3、さらにその下が 4〜7…となります。番号 `n` の左の子は `2n`、右の子は `2n+1` です。
つまり **番号を 2 進数で書くと、先頭の 1 を除いた各ビットが「0 なら左、1 なら右」の道順** になっています。

新しいノードの番号は `1 + heap->nelts` です。このループは、その番号の下位ビットから順に取り出して `path` に積み、ビットの並びを逆順にします。`k` は道のりの段数です。

たとえば既存のノードが 5 個なら、新しい番号は 6 = 2 進数 `110` です。ループは `n=6`（ビット 0）、`n=3`（ビット 1）と回って `n=1` で止まり、`path = 0b01`、`k = 2` になります。
`path` は逆順に積まれたので、下位ビットから読むと「右（1）→ 左（0）」。根 → 3 番 → 6 番、という道順です。

### 2. 道順どおりに降りる

```c:line-numbers=127
  parent = child = &heap->min;
  while (k > 0) {
    parent = child;
    if (path & 1)
      child = &(*child)->right;
    else
      child = &(*child)->left;
    path >>= 1;
    k -= 1;
  }
```

`parent` と `child` は「ポインタの入っている欄」を指します。最初は両方とも `&heap->min`（根の欄）です。
`path & 1` が 1 なら右の欄へ、0 なら左の欄へ進み、`path >>= 1` で次のビットへ移ります。`k` 段降りると、`child` は「新しいノードを入れるべき空の欄」を、`parent` はその 1 つ上の欄を指しています。

### 3. 差し込む

```c:line-numbers=139
  newnode->parent = *parent;
  *child = newnode;
  heap->nelts += 1;
```

`newnode->parent = *parent` で親を設定し、`*child = newnode` で親の `left` か `right` の欄に書き込みます。ヒープが空なら `child` は `&heap->min` のままなので、そのまま根になります。

### 4. 上に浮かせる

```c:line-numbers=146
  while (newnode->parent != NULL && less_than(newnode, newnode->parent))
    heap_node_swap(heap, newnode->parent, newnode);
```

新しいノードが親より小さいあいだ、`heap_node_swap` で親と入れ替えて上へ移動します。ヒープ条件が回復したら止まります。これは「シフトアップ」と呼ばれる標準的な手順です。

## ここがすごい

- **探索なしで末尾の位置がわかる**: ポインタの木で「最後の段の、左から次の空き」を探そうとすると、幅優先探索などが必要になりそうです。番号の 2 進表現を使えば、`O(log n)` 回のシフトだけで道順が決まります。
- **ポインタのポインタで分岐を消す**: `child` が「欄」を指すおかげで、根に入れる場合も、誰かの左や右に入れる場合も、`*child = newnode` の 1 行で済みます。「空のヒープなら特別扱い」という `if` が要りません。
- **メモリ確保ゼロ**: ノードはタイマー構造体に埋め込まれているので、挿入で `malloc` は一度も呼ばれません。タイマーの登録が失敗しない設計につながっています。

## まとめ

- 完全二分木に 1 から番号を振ると、番号の 2 進表現が根からの道順になる。
- ビットを逆順に積んでから下位ビットで読むと、上から順に左右を選べる。
- 「ポインタのポインタ」を使うと、根への挿入と子への挿入を同じコードで扱える。
- 挿入後は親と比べて入れ替えながら上へ移動し、ヒープ条件を保つ。
