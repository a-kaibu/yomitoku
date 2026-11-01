---
title: "3 本のポインタを付け替えて木を傾ける「左回転」"
description: "赤黒木のバランスを直すための基本操作、左回転。親子関係を入れ替えても二分探索木の順序が崩れないよう、6 か所のポインタを決まった順番で付け替える。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_rbtree.c
lines: [318, 345]
function: "ngx_rbtree_left_rotate"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム]
---

## ひとことで

`ngx_rbtree_left_rotate` は、木の一部を **左に回転** させる関数です。ノード `node` とその右の子 `temp` の上下関係を入れ替え、`temp` を上に、`node` をその左の子にします。
回転しても「左は小さく、右は大きい」という二分探索木の順序は崩れません。それでいて木の形（左右の高さ）は変わるので、赤黒木のバランス調整に使われます。

## コード

```c:line-numbers=318
static ngx_inline void
ngx_rbtree_left_rotate(ngx_rbtree_node_t **root, ngx_rbtree_node_t *sentinel,
    ngx_rbtree_node_t *node)
{
    ngx_rbtree_node_t  *temp;

    temp = node->right;
    node->right = temp->left;

    if (temp->left != sentinel) {
        temp->left->parent = node;
    }

    temp->parent = node->parent;

    if (node == *root) {
        *root = temp;

    } else if (node == node->parent->left) {
        node->parent->left = temp;

    } else {
        node->parent->right = temp;
    }

    temp->left = node;
    node->parent = temp;
}
```

## 前提知識

- **二分探索木**: 各ノードの左の子孫はそのノードより小さく、右の子孫は大きい、という木です。
- **構造体とポインタ**: ノードは `left`（左の子）、`right`（右の子）、`parent`（親）の 3 つのポインタを持ちます。`node->right` は「`node` が指すノードの右の子」です。
- **ポインタのポインタ `**root`**: 木の根を指すポインタが入っている場所を指します。`*root = temp` で、根そのものを差し替えられます。
- **番兵（sentinel）**: 「子がいない」を表す特別なノードです。番兵の `parent` は書き換えないようにしています。
- **`static ngx_inline`**: このファイルの中だけで使う関数で、呼び出し元に展開（インライン化）してよいとコンパイラに伝えています。小さな関数の呼び出しのコストを省くためです。

## 何をしているか

次の形を考えます。`a`、`b`、`c` は部分木（その下にある木）です。

```
      node              temp
     /    \            /    \
    a     temp   →   node    c
         /    \     /    \
        b      c   a      b
```

順序は `a < node < b < temp < c` で、回転の前後で変わりません。動くのは `b` だけで、`temp` の左の子から `node` の右の子へ移ります。

### 1. temp の左の子 b を node の右へ移す

```c:line-numbers=324
    temp = node->right;
    node->right = temp->left;

    if (temp->left != sentinel) {
        temp->left->parent = node;
    }
```

`temp` に `node` の右の子を覚え、`node->right` を `b`（`temp->left`）にします。`b` が番兵でなければ、`b` の親も `node` に直します。

### 2. temp を node の元の位置につなぐ

```c:line-numbers=331
    temp->parent = node->parent;

    if (node == *root) {
        *root = temp;

    } else if (node == node->parent->left) {
        node->parent->left = temp;

    } else {
        node->parent->right = temp;
    }
```

`temp` の親を、`node` の元の親にします。そして、`node` が根だったなら根を `temp` に、親の左の子だったなら親の左を、右の子だったなら親の右を `temp` に付け替えます。

### 3. node を temp の左の子にする

```c:line-numbers=343
    temp->left = node;
    node->parent = temp;
```

最後に `temp->left = node`、`node->parent = temp` として完成です。

### 付け替えたポインタの数

`node->right`、`b->parent`、`temp->parent`、親（または根）から `temp` への 1 本、`temp->left`、`node->parent` の 6 か所です。親子のポインタは双方向なので、片方だけ直すと木が壊れます。

## ここがすごい

- **順番が大事**: `temp = node->right;` で先に `temp` を覚えておかないと、`node->right = temp->left;` で `node->right` を書き換えた時点で `temp` に手が届かなくなります。また `} else if (node == node->parent->left)` の `node->parent->left` の判定は、最後の 2 行で `node->parent` を書き換える **前** に行う必要があります。この関数は、情報が失われない順番でポインタを付け替えています。
- **番兵の親を書き換えない**: `if (temp->left != sentinel)` の `if` は、`b` が番兵のときに番兵の `parent` を書き換えないための確認です。番兵は木全体で 1 つを共有しているので、勝手に書き換えると別の場所の処理に影響しかねません。
- **根が変わる場合に対応**: 回転で根が入れ替わることがあるので、`root` をポインタのポインタで受け取り、`if (node == *root)` の中で根を差し替えています。親の左右のどちらかを書き換える処理と同じ形で扱えます。
- **一定時間で終わる**: 回転はノードの数に関係なく、決まった数のポインタ操作で終わります。赤黒木の挿入や削除が速いのは、バランスを直すのに必要な回転が少なく、その 1 回 1 回が軽いからです。
- **右回転は鏡写し**: すぐ下の `ngx_rbtree_right_rotate` は、この関数の `left` と `right` を入れ替えただけの形です。

## まとめ

- 回転は「親子の上下を入れ替える」操作で、二分探索木の順序を保ったまま形を変えられる。
- 双方向のポインタを付け替えるときは、情報を失わない順番で、両方向とも直す。
- 共有の番兵ノードは書き換えないように気をつける。
