---
title: "「どこに置くか」を外に出した、使い回せる赤黒木の挿入"
description: "nginx のタイマーやキャッシュを支える赤黒木への挿入。キーの比べ方は関数ポインタで差し替え、木のバランス調整だけを共通化している。番兵ノードで NULL チェックも減らす。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_rbtree.c
lines: [24, 93]
function: "ngx_rbtree_insert"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 設計パターン]
---

## ひとことで

`ngx_rbtree_insert` は、**赤黒木**（バランスを自動で保つ二分探索木）に新しいノードを入れる関数です。
nginx の赤黒木は、タイマー、共有メモリのキャッシュ、接続数制限など、いろいろな場所で使われます。この関数は「新しいノードを木のどこにぶら下げるか」を `tree->insert` という **差し替え可能な関数** に任せ、そのあとの **バランス調整（色の塗り替えと回転）** だけを共通処理として行います。

## コード

::: code-group

```c:line-numbers=24 [日本語訳]
void
ngx_rbtree_insert(ngx_rbtree_t *tree, ngx_rbtree_node_t *node)
{
    ngx_rbtree_node_t  **root, *temp, *sentinel;

    /* 二分木としての挿入 */

    root = &tree->root;
    sentinel = tree->sentinel;

    if (*root == sentinel) {
        node->parent = NULL;
        node->left = sentinel;
        node->right = sentinel;
        ngx_rbt_black(node);
        *root = node;

        return;
    }

    tree->insert(*root, node, sentinel);

    /* 木のバランスを取り直す */

    while (node != *root && ngx_rbt_is_red(node->parent)) {

        if (node->parent == node->parent->parent->left) {
            temp = node->parent->parent->right;

            if (ngx_rbt_is_red(temp)) {
                ngx_rbt_black(node->parent);
                ngx_rbt_black(temp);
                ngx_rbt_red(node->parent->parent);
                node = node->parent->parent;

            } else {
                if (node == node->parent->right) {
                    node = node->parent;
                    ngx_rbtree_left_rotate(root, sentinel, node);
                }

                ngx_rbt_black(node->parent);
                ngx_rbt_red(node->parent->parent);
                ngx_rbtree_right_rotate(root, sentinel, node->parent->parent);
            }

        } else {
            temp = node->parent->parent->left;

            if (ngx_rbt_is_red(temp)) {
                ngx_rbt_black(node->parent);
                ngx_rbt_black(temp);
                ngx_rbt_red(node->parent->parent);
                node = node->parent->parent;

            } else {
                if (node == node->parent->left) {
                    node = node->parent;
                    ngx_rbtree_right_rotate(root, sentinel, node);
                }

                ngx_rbt_black(node->parent);
                ngx_rbt_red(node->parent->parent);
                ngx_rbtree_left_rotate(root, sentinel, node->parent->parent);
            }
        }
    }

    ngx_rbt_black(*root);
}
```

```c:line-numbers=24 [原文]
void
ngx_rbtree_insert(ngx_rbtree_t *tree, ngx_rbtree_node_t *node)
{
    ngx_rbtree_node_t  **root, *temp, *sentinel;

    /* a binary tree insert */

    root = &tree->root;
    sentinel = tree->sentinel;

    if (*root == sentinel) {
        node->parent = NULL;
        node->left = sentinel;
        node->right = sentinel;
        ngx_rbt_black(node);
        *root = node;

        return;
    }

    tree->insert(*root, node, sentinel);

    /* re-balance tree */

    while (node != *root && ngx_rbt_is_red(node->parent)) {

        if (node->parent == node->parent->parent->left) {
            temp = node->parent->parent->right;

            if (ngx_rbt_is_red(temp)) {
                ngx_rbt_black(node->parent);
                ngx_rbt_black(temp);
                ngx_rbt_red(node->parent->parent);
                node = node->parent->parent;

            } else {
                if (node == node->parent->right) {
                    node = node->parent;
                    ngx_rbtree_left_rotate(root, sentinel, node);
                }

                ngx_rbt_black(node->parent);
                ngx_rbt_red(node->parent->parent);
                ngx_rbtree_right_rotate(root, sentinel, node->parent->parent);
            }

        } else {
            temp = node->parent->parent->left;

            if (ngx_rbt_is_red(temp)) {
                ngx_rbt_black(node->parent);
                ngx_rbt_black(temp);
                ngx_rbt_red(node->parent->parent);
                node = node->parent->parent;

            } else {
                if (node == node->parent->left) {
                    node = node->parent;
                    ngx_rbtree_right_rotate(root, sentinel, node);
                }

                ngx_rbt_black(node->parent);
                ngx_rbt_red(node->parent->parent);
                ngx_rbtree_left_rotate(root, sentinel, node->parent->parent);
            }
        }
    }

    ngx_rbt_black(*root);
}
```

:::

## 前提知識

- **二分探索木**: 各ノードについて「左の子孫はすべて小さく、右の子孫はすべて大きい」が成り立つ木です。探すときは根から大小を比べて左右に進むだけです。ただし、入れる順番が悪いと一直線に偏り、遅くなります。
- **赤黒木**: 各ノードを赤か黒に塗り、「赤の子は必ず黒」「根から葉までの黒の数はどの道でも同じ」といった規則を守ることで、木の高さを常に要素数の対数程度に抑える二分探索木です。教科書『Introduction to Algorithms』（コメントに書かれています）のアルゴリズムに基づいています。
- **構造体とポインタ**: `ngx_rbtree_node_t` はノードを表す構造体で、`key`、`left`、`right`、`parent`、`color` を持ちます。`node->parent` は「`node` が指すノードの親」です。
- **`ngx_rbtree_node_t **root`**: 「ノードへのポインタ」が入っている場所を指すポインタです。`*root = node` と書くと、木の根そのものを差し替えられます。
- **番兵（sentinel）**: 「子がいない」を `NULL` ではなく、特別な黒いノード 1 個で表す方法です。すべての葉はこの番兵を指します。
- **関数ポインタ**: `tree->insert(...)` は、構造体に入れておいた関数を呼び出しています。
- **マクロ**: `ngx_rbt_red(node)` は `node->color = 1`、`ngx_rbt_black(node)` は `color = 0`、`ngx_rbt_is_red(node)` は `color` を読むだけの置き換えです。

## 何をしているか

### 1. 空の木なら根にする

```c:line-numbers=31
    root = &tree->root;
    sentinel = tree->sentinel;

    if (*root == sentinel) {
        node->parent = NULL;
        node->left = sentinel;
        node->right = sentinel;
        ngx_rbt_black(node);
        *root = node;

        return;
    }
```

根が番兵なら木は空です。新しいノードを黒く塗って根にします（根は黒、という規則）。

### 2. 置く場所を探してぶら下げる

```c:line-numbers=44
    tree->insert(*root, node, sentinel);
```

`tree->insert` に任せます。ふつうのキーなら `ngx_rbtree_insert_value` が使われ、根から大小を比べて下り、空いている位置に **赤い** ノードとしてぶら下げます。

### 3. 赤が続いたら直す

```c:line-numbers=48
    while (node != *root && ngx_rbt_is_red(node->parent)) {

        if (node->parent == node->parent->parent->left) {
            temp = node->parent->parent->right;

            if (ngx_rbt_is_red(temp)) {
                ngx_rbt_black(node->parent);
                ngx_rbt_black(temp);
                ngx_rbt_red(node->parent->parent);
                node = node->parent->parent;

            } else {
                if (node == node->parent->right) {
                    node = node->parent;
                    ngx_rbtree_left_rotate(root, sentinel, node);
                }

                ngx_rbt_black(node->parent);
                ngx_rbt_red(node->parent->parent);
                ngx_rbtree_right_rotate(root, sentinel, node->parent->parent);
            }

        } else {
            temp = node->parent->parent->left;

            if (ngx_rbt_is_red(temp)) {
                ngx_rbt_black(node->parent);
                ngx_rbt_black(temp);
                ngx_rbt_red(node->parent->parent);
                node = node->parent->parent;

            } else {
                if (node == node->parent->left) {
                    node = node->parent;
                    ngx_rbtree_right_rotate(root, sentinel, node);
                }

                ngx_rbt_black(node->parent);
                ngx_rbt_red(node->parent->parent);
                ngx_rbtree_left_rotate(root, sentinel, node->parent->parent);
            }
        }
    }
```

赤いノードを足すと、親も赤だった場合に「赤の子は黒」の規則が破れます。親が赤のあいだ、次のどちらかで直します。親が祖父の左の子か右の子かで、左右を入れ替えた同じ処理が 2 つ並んでいます（`if (node->parent == node->parent->parent->left)` の側と、その `else` の側）。

- **おじ（親の兄弟）も赤のとき**（`if (ngx_rbt_is_red(temp))` の中）: 親とおじを黒に、祖父を赤に塗り替えます。黒の数は変わりません。ただし祖父が赤になったので、今度は祖父を `node` として、上で同じ問題が起きていないか調べ直します。
- **おじが黒のとき**（その `else` の中）: 回転で形を変えます。`node` が親の「内側」の子なら、まず親を中心に回して「外側」にそろえます（`if (node == node->parent->right)` の中）。そして親を黒、祖父を赤にして、祖父を中心に逆向きに回すと、規則が回復して終わります。

### 4. 根を黒にする

```c:line-numbers=92
    ngx_rbt_black(*root);
```

色の塗り替えが根まで上ってきたときのために、最後に根を黒にします。

## ここがすごい

- **「場所探し」と「バランス調整」の分離**: 赤黒木のバランス調整は、キーの意味とは無関係です。一方、キーの比べ方は用途で変わります。タイマーでは時刻があふれることを考えた比較（`ngx_rbtree_insert_timer_value`）、文字列キーではハッシュ値が同じときに文字列を比べる、といった具合です。nginx は比較と配置だけを `tree->insert` として差し替え可能にし、難しいバランス調整のコードは 1 つだけにしています。
- **番兵で NULL チェックを減らす**: 葉の位置に `NULL` ではなく黒い番兵を置くので、`ngx_rbt_is_red(temp)` のように、おじがいない場合でも色を読むことができます（番兵は常に黒）。「いないなら黒とみなす」という場合分けを書かずに済みます。
- **ノードをデータに埋め込む設計**: `ngx_rbtree_node_t` には値を入れる場所がほぼありません。使う側は、自分の構造体の中にこのノードを含めておきます。木のための追加のメモリ確保が不要で、共有メモリの中でもそのまま使えます。
- **`root` をポインタのポインタで持つ**: 回転で根が入れ替わることがあるので、`root` は `&tree->root` として持ち、回転の関数に渡しています。

## まとめ

- 赤黒木の挿入は「ふつうの二分探索木として入れる → 赤が続いたら塗り替えか回転で直す」の 2 段階。
- 用途で変わる部分（キーの比べ方）を関数ポインタで外に出すと、難しい共通部分を 1 つにできる。
- 番兵ノードを使うと、「子がいない」場合の特別扱いを減らせる。
