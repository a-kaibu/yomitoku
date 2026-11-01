---
title: "先頭・末尾・途中を場合分けして双方向リストからノードを外す"
description: "curl の連結リストからノードを取り外し、載せていたデータを返す。外したノードは全ポインタを消し、デバッグ時は「削除済み」の印まで付ける。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/llist.c
lines: [129, 172]
function: "Curl_node_take_elem"
difficulty: 2
format: 2
tags: [データ構造, 防御的プログラミング, メモリ管理]
---

## ひとことで

`Curl_node_take_elem` は、双方向連結リストからノード `e` を取り外し、そのノードに載せていたデータへのポインタを返します。`A ⇄ B ⇄ C` から `B` を外すと `A ⇄ C` になり、`B` が持っていたデータが戻ってきます。データそのものは解放しません（ヘッダのコメントに「登録された `dtor` は呼ばない」とあります）。

## コード

::: code-group

```c:line-numbers=129 [日本語訳]
void *Curl_node_take_elem(struct Curl_llist_node *e)
{
  void *ptr;
  struct Curl_llist *list;
  if(!e)
    return NULL;

  list = e->_list;
  DEBUGASSERT(list);
  DEBUGASSERT(list->_init == LLISTINIT);
  DEBUGASSERT(list->_size);
  DEBUGASSERT(e->_init == NODEINIT);
  if(list) {
    if(e == list->_head) {
      list->_head = e->_next;

      if(!list->_head)
        list->_tail = NULL;
      else
        e->_next->_prev = NULL;
    }
    else {
      if(e->_prev)
        e->_prev->_next = e->_next;

      if(!e->_next)
        list->_tail = e->_prev;
      else
        e->_next->_prev = e->_prev;
    }
    --list->_size;
  }
  ptr = e->_ptr;

  e->_list = NULL;
  e->_ptr  = NULL;
  e->_prev = NULL;
  e->_next = NULL;
#ifdef DEBUGBUILD
  e->_init = NODEREM; /* 削除時は決まった値にする - 0 ではない */
#endif

  return ptr;
}
```

```c:line-numbers=129 [原文]
void *Curl_node_take_elem(struct Curl_llist_node *e)
{
  void *ptr;
  struct Curl_llist *list;
  if(!e)
    return NULL;

  list = e->_list;
  DEBUGASSERT(list);
  DEBUGASSERT(list->_init == LLISTINIT);
  DEBUGASSERT(list->_size);
  DEBUGASSERT(e->_init == NODEINIT);
  if(list) {
    if(e == list->_head) {
      list->_head = e->_next;

      if(!list->_head)
        list->_tail = NULL;
      else
        e->_next->_prev = NULL;
    }
    else {
      if(e->_prev)
        e->_prev->_next = e->_next;

      if(!e->_next)
        list->_tail = e->_prev;
      else
        e->_next->_prev = e->_prev;
    }
    --list->_size;
  }
  ptr = e->_ptr;

  e->_list = NULL;
  e->_ptr  = NULL;
  e->_prev = NULL;
  e->_next = NULL;
#ifdef DEBUGBUILD
  e->_init = NODEREM; /* specific pattern on remove - not zero */
#endif

  return ptr;
}
```

:::

ノードの構造体（`lib/llist.h`）と、デバッグ用の印（同じファイルの先頭）です。

<!-- source: lib/llist.h -->
```c:line-numbers=43
struct Curl_llist_node {
  struct Curl_llist *_list; /* the list where this belongs */
  void *_ptr;
  struct Curl_llist_node *_prev;
  struct Curl_llist_node *_next;
#ifdef DEBUGBUILD
  int _init;      /* detect API usage mistakes */
#endif
};
```

```c:line-numbers=28
#ifdef DEBUGBUILD
#define LLISTINIT 0x100cc001 /* random pattern */
#define NODEINIT  0x12344321 /* random pattern */
#define NODEREM   0x54321012 /* random pattern */
```

## 前提知識

- **双方向連結リスト**: 各ノードが前（`_prev`）と次（`_next`）のノードを指して並ぶ構造です。リスト本体は先頭 `_head` と末尾 `_tail` と要素数 `_size` を持ちます。
- **`->` の連続**: `e->_next->_prev` は「`e` の次のノードの `_prev`」です。
- **`void *`**: 型を決めない汎用ポインタです。どんなデータでも載せられます。
- **`NULL`**: どこも指していないポインタ。先頭の `_prev`、末尾の `_next` は `NULL` です。
- **`DEBUGASSERT`**: デバッグビルドでだけ条件を確かめて、偽なら止めるマクロです。
- **`#ifdef DEBUGBUILD`**: 開発用ビルドでだけ有効になるコードです。

## 何をしているか

### 1. 確認

```c:line-numbers=133
  if(!e)
    return NULL;

  list = e->_list;
  DEBUGASSERT(list);
  DEBUGASSERT(list->_init == LLISTINIT);
  DEBUGASSERT(list->_size);
  DEBUGASSERT(e->_init == NODEINIT);
```

`e` が `NULL` なら何もせず `NULL` を返します。デバッグビルドでは、所属リストがあるか、リストが初期化済みか、要素が 1 つ以上あるか、ノードが「使用中」の印を持っているかを確かめます。

### 2. 先頭を外す場合

```c:line-numbers=142
    if(e == list->_head) {
      list->_head = e->_next;

      if(!list->_head)
        list->_tail = NULL;
      else
        e->_next->_prev = NULL;
    }
```

先頭を次のノードに移します。次がなければ（1 個だけのリストなら）末尾も `NULL` にして空にします。次があれば、その `_prev` を `NULL` にして新しい先頭にします。

### 3. 先頭以外を外す場合

```c:line-numbers=150
    else {
      if(e->_prev)
        e->_prev->_next = e->_next;

      if(!e->_next)
        list->_tail = e->_prev;
      else
        e->_next->_prev = e->_prev;
    }
```

前のノードの `_next` を、`e` の次に付け替えます。`e` が末尾なら末尾を前のノードに移し、そうでなければ次のノードの `_prev` を `e` の前に付け替えます。

`A ⇄ B ⇄ C` から `B` を外すと、`A->_next = C`、`C->_prev = A` になります。

### 4. 要素数を減らし、ノードを空にする

```c:line-numbers=159
    --list->_size;
  }
  ptr = e->_ptr;

  e->_list = NULL;
  e->_ptr  = NULL;
  e->_prev = NULL;
  e->_next = NULL;
#ifdef DEBUGBUILD
  e->_init = NODEREM; /* specific pattern on remove - not zero */
#endif
```

要素数を 1 減らし、載せていたデータを `ptr` に控えてから、ノードの 4 つのポインタをすべて `NULL` にします。デバッグビルドでは `_init` を「削除済み」の印 `NODEREM` に書き換えます。

### 5. データを返す

```c:line-numbers=171
  return ptr;
```

## ここがすごい

- **場合分けが漏れなく並ぶ**: 双方向リストの削除で気をつけるのは「先頭か」「末尾か」「両方（1 個だけ）か」です。この関数は先頭かどうかで大きく分け、それぞれの中で次や前があるかを確かめているので、4 つの組み合わせすべてで先頭・末尾・矢印が正しく保たれます。
- **外したノードを「無害」にする**: 外したあとも `_prev` や `_next` が古い隣を指したままだと、うっかり使ったときにリストを壊します。全部 `NULL` にしておけば、誤用してもすぐに `NULL` 参照として表に出ます。
- **削除済みの印は 0 ではない**: 印を書き込む行のコメント「削除時は特定の値、0 ではない」が大事です。`NODEINIT` でも 0 でもない値にしておくと、「一度も使われていない」「使用中」「削除済み」の 3 つを区別できます。すでに外したノードをもう一度外そうとすると、最初の `DEBUGASSERT(e->_init == NODEINIT)` で止まります。
- **解放はしない**: データを返すだけで、`free` もデストラクタ（後始末用の関数）も呼びません。呼び出し側がデータの扱いを決められます。デストラクタを呼びたいときは、この関数を使う `node_uremove`（すぐ下にある関数）を通します。役割を分けたことで、同じ削除処理を 2 回書かずに済んでいます。

## まとめ

- 双方向リストの削除は「先頭か」「末尾か」で場合分けし、隣の矢印と先頭・末尾を付け替える。
- 外したノードのポインタは `NULL` にして、誤用をすぐ表に出す。
- デバッグ用の印に「使用中」と「削除済み」を別の値で持たせると、二重削除を検出できる。
- 「外す」と「後始末する」を別の関数に分けると、使う側が選べる。
