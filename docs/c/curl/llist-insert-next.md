---
title: "「e の次に入れる」1 つで先頭・途中・末尾をこなす双方向リストの挿入"
description: "curl の連結リストの挿入関数。e に NULL を渡すと先頭に入る、という約束で、追加の関数を何本も書かずに済ませている。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/llist.c
lines: [56, 109]
function: "llist_insert_next"
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, API設計]
---

## ひとことで

`llist_insert_next` は、双方向連結リスト（前と後ろの要素への矢印を持つ要素の列）で、要素 `e` の **次** に新しいノード `ne` をつなぎます。`e` が `NULL` なら先頭に入ります。末尾に追加する `Curl_llist_append` は、`e` に今の末尾を渡してこの関数を呼ぶだけです。

## コード

::: code-group

```c:line-numbers=56 [日本語訳]
/*
 * llist_insert_next()
 *
 * 与えられた要素 'e' の後ろに新しいリスト要素を挿入する。与えられた既存の
 * 要素が NULL で、リストにすでに要素がある場合、新しい要素は
 * リストの先頭に挿入される。
 *
 * 引数 'ne' は、格納するオブジェクトの中を指すポインタであること。
 *
 * @unittest 1300
 */
UNITTEST void llist_insert_next(struct Curl_llist *list,
                                struct Curl_llist_node *e, const void *p,
                                struct Curl_llist_node *ne);
UNITTEST void llist_insert_next(struct Curl_llist *list,
                                struct Curl_llist_node *e, /* NULL でもよい */
                                const void *p,
                                struct Curl_llist_node *ne)
{
  DEBUGASSERT(list);
  DEBUGASSERT(list->_init == LLISTINIT);
  DEBUGASSERT(ne);

#ifdef DEBUGBUILD
  ne->_init = NODEINIT;
#endif
  ne->_ptr = CURL_UNCONST(p);
  ne->_list = list;
  if(list->_size == 0) {
    list->_head = ne;
    list->_head->_prev = NULL;
    list->_head->_next = NULL;
    list->_tail = ne;
  }
  else {
    /* ここで 'e' が NULL なら、新しい要素をリストの先頭に入れる */
    ne->_next = e ? e->_next : list->_head;
    ne->_prev = e;
    if(!e) {
      list->_head->_prev = ne;
      list->_head = ne;
    }
    else if(e->_next) {
      e->_next->_prev = ne;
    }
    else {
      list->_tail = ne;
    }
    if(e)
      e->_next = ne;
  }

  ++list->_size;
}
```

```c:line-numbers=56 [原文]
/*
 * llist_insert_next()
 *
 * Inserts a new list element after the given one 'e'. If the given existing
 * entry is NULL and the list already has elements, the new one will be
 * inserted first in the list.
 *
 * The 'ne' argument should be a pointer into the object to store.
 *
 * @unittest 1300
 */
UNITTEST void llist_insert_next(struct Curl_llist *list,
                                struct Curl_llist_node *e, const void *p,
                                struct Curl_llist_node *ne);
UNITTEST void llist_insert_next(struct Curl_llist *list,
                                struct Curl_llist_node *e, /* may be NULL */
                                const void *p,
                                struct Curl_llist_node *ne)
{
  DEBUGASSERT(list);
  DEBUGASSERT(list->_init == LLISTINIT);
  DEBUGASSERT(ne);

#ifdef DEBUGBUILD
  ne->_init = NODEINIT;
#endif
  ne->_ptr = CURL_UNCONST(p);
  ne->_list = list;
  if(list->_size == 0) {
    list->_head = ne;
    list->_head->_prev = NULL;
    list->_head->_next = NULL;
    list->_tail = ne;
  }
  else {
    /* if 'e' is NULL here, we insert the new element first in the list */
    ne->_next = e ? e->_next : list->_head;
    ne->_prev = e;
    if(!e) {
      list->_head->_prev = ne;
      list->_head = ne;
    }
    else if(e->_next) {
      e->_next->_prev = ne;
    }
    else {
      list->_tail = ne;
    }
    if(e)
      e->_next = ne;
  }

  ++list->_size;
}
```

:::

構造体は `lib/llist.h` で定義されています。

<!-- source: lib/llist.h -->
```c:line-numbers=33
struct Curl_llist {
  struct Curl_llist_node *_head;
  struct Curl_llist_node *_tail;
  Curl_llist_dtor _dtor;
  size_t _size;
#ifdef DEBUGBUILD
  int _init;      /* detect API usage mistakes */
#endif
};

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

## 前提知識

- **連結リスト**: データを配列のように連続した場所に置かず、各要素（ノード）が「次の要素の場所」を持って数珠つなぎにした構造です。双方向なら「前の要素の場所」も持ちます。
- **`struct` と `->`**: `ne->_next` は「`ne` が指すノードの `_next` メンバー」です。`e->_next->_prev` は「`e` の次のノードの、前へのポインタ」です。
- **`void *`**: 型を決めない汎用のポインタです。リストにどんなデータでも載せられるよう、`_ptr` はこの型になっています。
- **`NULL`**: どこも指していないポインタです。先頭の `_prev` や末尾の `_next` は `NULL` です。
- **`UNITTEST`**: curl のマクロで、テスト用ビルドでは関数を外から呼べるようにし、ふだんは `static`（ファイル内だけ）にします。そのため定義の前に宣言だけを先に置いています。
- **`CURL_UNCONST(p)`**: `const`（書き換えない約束）付きのポインタから `const` を外すマクロです。
- **`#ifdef DEBUGBUILD`**: 開発用ビルドでだけ有効になるコードです。

## 何をしているか

### 1. ノードに情報を入れる

```c:line-numbers=79
#ifdef DEBUGBUILD
  ne->_init = NODEINIT;
#endif
  ne->_ptr = CURL_UNCONST(p);
  ne->_list = list;
```

デバッグ用の印、載せるデータ `p`、所属するリストを記録します。ノードのメモリ自体は呼び出し側が用意したもので、この関数は `malloc` しません。

### 2. 空のリストに入れる場合

```c:line-numbers=84
  if(list->_size == 0) {
    list->_head = ne;
    list->_head->_prev = NULL;
    list->_head->_next = NULL;
    list->_tail = ne;
  }
```

リストが空なら、`ne` が先頭でも末尾でもあり、前後はどちらも `NULL` です。

### 3. 空でない場合

```c:line-numbers=90
  else {
    /* if 'e' is NULL here, we insert the new element first in the list */
    ne->_next = e ? e->_next : list->_head;
    ne->_prev = e;
    if(!e) {
      list->_head->_prev = ne;
      list->_head = ne;
    }
    else if(e->_next) {
      e->_next->_prev = ne;
    }
    else {
      list->_tail = ne;
    }
    if(e)
      e->_next = ne;
  }
```

まず `ne->_next` を決めます。`e` があれば `e` の次、`e` が `NULL` なら今の先頭です。次に `ne->_prev = e` とします（`NULL` なら先頭になる印）。

そのあと、`ne` の周りの矢印を付け替えます。

- `e` が `NULL`（先頭に入れる）: 今の先頭の `_prev` を `ne` にし、先頭を `ne` にする
- `e` の次がある（途中に入れる）: 次のノードの `_prev` を `ne` にする
- `e` が末尾（末尾に入れる）: 末尾を `ne` にする

最後に、`e` があれば `e->_next = ne` とします。

`A ⇄ B` のリストで `e = A` とすると、`ne->_next = B`、`ne->_prev = A`、`B->_prev = ne`、`A->_next = ne` となって `A ⇄ ne ⇄ B` になります。

### 4. 要素数を増やす

```c:line-numbers=108
  ++list->_size;
```

`++list->_size;` で要素数を 1 増やします。数を持っておくので、要素数を知るために全体をたどる必要はありません。

## ここがすごい

- **1 つの関数で 3 つの場所に入れられる**: 「先頭に追加」「途中に挿入」「末尾に追加」を別々に書くと、矢印の付け替えを 3 回書くことになります。ここでは「`e` の次」という 1 つの考え方に、「`e` が `NULL` なら先頭の前」という約束を足して、全部をまかなっています。
- **ノードを埋め込む設計**: ノードは呼び出し側の構造体の中に置かれ、この関数はそれをつなぐだけです。要素を追加するたびに `malloc` しないので、追加は失敗しませんし、速く、解放の心配もありません（Linux カーネルの `list_head` などと同じ「侵入型リスト」の考え方です）。
- **先頭と末尾を両方持つ**: `_tail` があるので、末尾への追加は要素数に関係なく一定時間でできます。
- **ノードが自分の所属を覚える**: `_list` を記録しておくので、ノードだけを渡されても、どのリストから外せばよいかが分かります（`Curl_node_take_elem` がこれを使います）。
- **メンバー名の `_`**: ヘッダのコメントに「直接触らず関数を使え」とあり、メンバー名の先頭の `_` はその目印です。

## まとめ

- 「`e` の次に入れる、`e` が `NULL` なら先頭」と決めると、挿入関数は 1 つで済む。
- 双方向リストの挿入は、新しいノードの前後と、その両隣の矢印をそれぞれ付け替える。
- ノードを利用側の構造体に埋め込むと、追加のたびに `malloc` しなくてよい。
- 末尾ポインタを持てば、末尾への追加はいつでも一定時間。
