---
title: "中身ごと入れ替えてからポインタを直す、親子ノードの交換"
description: "libuv のタイマー用ヒープで、親と子のノードを入れ替える関数。構造体をまるごとコピーで交換し、そのあと壊れた親子リンクを丁寧に張り直す。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: ISC
copyright: "Copyright (c) 2013, Ben Noordhuis <info@bnoordhuis.nl>"
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/heap-inl.h
lines: [71, 104]
function: "heap_node_swap"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, イディオム]
---

## ひとことで

libuv はタイマーを「いちばん早く期限が来るもの」から取り出すために、二分ヒープ（親が必ず子より小さい木）を使っています。
`heap_node_swap` は、そのヒープの中で **親ノードと子ノードの位置を入れ替える** 関数です。
配列ではなくポインタでつながった木なので、入れ替えには「左右の子」「親」の 3 本のリンクをすべて正しく直す必要があります。

## コード

::: code-group

```c:line-numbers=71 [日本語訳]
/* 親と子を入れ替える。子は根に近づき、親は根から遠ざかる。 */
static void heap_node_swap(struct heap* heap,
                           struct heap_node* parent,
                           struct heap_node* child) {
  struct heap_node* sibling;
  struct heap_node t;

  t = *parent;
  *parent = *child;
  *child = t;

  parent->parent = child;
  if (child->left == child) {
    child->left = parent;
    sibling = child->right;
  } else {
    child->right = parent;
    sibling = child->left;
  }
  if (sibling != NULL)
    sibling->parent = child;

  if (parent->left != NULL)
    parent->left->parent = parent;
  if (parent->right != NULL)
    parent->right->parent = parent;

  if (child->parent == NULL)
    heap->min = child;
  else if (child->parent->left == parent)
    child->parent->left = child;
  else
    child->parent->right = child;
}
```

```c:line-numbers=71 [原文]
/* Swap parent with child. Child moves closer to the root, parent moves away. */
static void heap_node_swap(struct heap* heap,
                           struct heap_node* parent,
                           struct heap_node* child) {
  struct heap_node* sibling;
  struct heap_node t;

  t = *parent;
  *parent = *child;
  *child = t;

  parent->parent = child;
  if (child->left == child) {
    child->left = parent;
    sibling = child->right;
  } else {
    child->right = parent;
    sibling = child->left;
  }
  if (sibling != NULL)
    sibling->parent = child;

  if (parent->left != NULL)
    parent->left->parent = parent;
  if (parent->right != NULL)
    parent->right->parent = parent;

  if (child->parent == NULL)
    heap->min = child;
  else if (child->parent->left == parent)
    child->parent->left = child;
  else
    child->parent->right = child;
}
```

:::

## 前提知識

- **`struct`（構造体）**: 複数の値をひとまとめにした型です。ここでは `struct heap_node` が `left`（左の子）・`right`（右の子）・`parent`（親）の 3 つのポインタを持ちます。
- **ポインタ**: メモリ上の場所を指す値です。`struct heap_node* p` は「ノードがある場所」を表します。`NULL` は「どこも指していない」という特別な値です。
- **`*` と `->`**: `*parent` はポインタの指す先の構造体そのもの、`parent->left` は「`parent` が指す構造体の `left` メンバ」です（`(*parent).left` の略記）。
- **構造体の代入**: C では `t = *parent;` のように構造体をまるごと代入でき、全メンバがコピーされます。
- **`static`**: 関数に付けると「このファイルの中だけで使う関数」という意味になります。
- **侵入型（intrusive）データ構造**: libuv では、タイマーの構造体の中に `heap_node` を埋め込みます。ヒープはノードだけを扱い、ノードのアドレスから元のタイマーを逆算します。だからノードを「別のメモリに移す」ことはできず、**ノードそのもののリンクを書き換える** しかありません。

## 何をしているか

### 1. 3 本のポインタをまるごと交換する

```c:line-numbers=78
  t = *parent;
  *parent = *child;
  *child = t;
```

`t = *parent; *parent = *child; *child = t;` で、2 つのノードの中身（`left`・`right`・`parent`）を丸ごと交換します。
ただし、これだけでは木は壊れています。たとえば元が「P の左の子が C」だった場合、交換後の C は P の古いリンクを受け取るので、`C->left` は **C 自身** を指してしまいます（P の左の子は C だったから）。

### 2. 自分を指してしまったリンクを直す

```c:line-numbers=82
  parent->parent = child;
  if (child->left == child) {
    child->left = parent;
    sibling = child->right;
  } else {
    child->right = parent;
    sibling = child->left;
  }
  if (sibling != NULL)
    sibling->parent = child;
```

まず、もと親だった `parent` の親を `child` にします（`parent` は一段下がったので）。
次の `if (child->left == child)` が、まさに「自分を指してしまった」ほうを見つける判定です。左の子だったなら `child->left = parent` に直し、反対側（右）の子を `sibling`（兄弟）として覚えます。
最後の `if (sibling != NULL)` で、その兄弟の親も新しい親である `child` に付け替えます。

### 3. 下に降りた parent の子たちを直す

```c:line-numbers=93
  if (parent->left != NULL)
    parent->left->parent = parent;
  if (parent->right != NULL)
    parent->right->parent = parent;
```

`parent` は child がもともと持っていた子を受け継ぎました。その子たちの `parent` ポインタはまだ古い child を指しているので、`parent` に付け替えます。

### 4. 祖父母からのリンクを直す

```c:line-numbers=98
  if (child->parent == NULL)
    heap->min = child;
  else if (child->parent->left == parent)
    child->parent->left = child;
  else
    child->parent->right = child;
```

最後に、交換後の `child` の親（もとの祖父母）から見たリンクを直します。親がいなければ child が新しい根なので、`heap->min` を更新します。そうでなければ、祖父母の左右どちらが `parent` を指していたかを調べ、`child` に書き換えます。

### 例で追う

根 A の左の子が B、B の左右に D・E がいる木で、`heap_node_swap(heap, A, B)` を呼ぶとします。
構造体の交換のあと、B は A の古いリンク（左 = B、右 = C、親 = なし）を持ち、A は B の古いリンク（左 = D、右 = E、親 = A）を持ちます。
`A->parent = B` とし、`B->left == B` が真なので `B->left = A`、兄弟 C の親を B にします。続いて D・E の親を A に付け替え、B には親がないので `heap->min = B` となり、B が根になります。

## ここがすごい

- **「全部コピーしてから例外を直す」発想**: 6 本前後のポインタを 1 本ずつ慎重に付け替えるコードは、順番を間違えるとすぐ壊れます。この関数は、まず構造体代入で大部分を正しい位置に運び、ずれてしまう少数のリンクだけを後から直します。直すべき箇所がはっきりするので、読みやすくバグも入りにくい書き方です。
- **自己参照を判定に使う**: 交換直後に `child->left == child` になるという「壊れ方」そのものを、子が左だったか右だったかの判定に利用しています。追加のフラグ変数がいりません。
- **配列ヒープとの違い**: 教科書のヒープは配列で作り、要素の値を入れ替えるだけで済みます。しかし libuv のタイマーはユーザーが確保した構造体の中にノードが埋め込まれているので、値を動かせません。メモリ確保をせずに何個でもタイマーを登録できる代わりに、リンクの付け替えという手間を引き受けているのです。

## まとめ

- ポインタでつないだ二分ヒープでは、ノード交換で「親・左・右」すべてのリンクを直す必要がある。
- 構造体をまるごと交換してから、ずれたリンクだけを修正すると間違えにくい。
- 交換後に生じる自己参照を、左右の判定に再利用できる。
- 侵入型データ構造は、メモリ確保が不要な代わりにノード自体を書き換える処理が必要になる。
