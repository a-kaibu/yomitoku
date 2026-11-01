---
title: "親をたどって「次に大きいノード」を見つける、スタック不要の木の巡回"
description: "赤黒木で、あるノードの次に大きいキーを持つノードを返す関数。右の部分木があればその最小、なければ「左の子として登った最初の親」を探すことで、再帰もスタックも使わずに木を順に巡れる。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_rbtree.c
lines: [378, 404]
function: "ngx_rbtree_next"
difficulty: 2
format: 2
tags: [データ構造, イテレータ, アルゴリズム]
---

## ひとことで

`ngx_rbtree_next` は、赤黒木の中で、`node` の **次に大きい** キーを持つノード（後続ノード）を返す関数です。いちばん大きいノードなら `NULL` を返します。
最小のノードから始めてこの関数を繰り返し呼べば、木の全ノードを小さい順に巡れます。各ノードが **親へのポインタ** を持っているので、再帰も、たどった道を覚えておくスタックもいりません。

## コード

```c:line-numbers=378
ngx_rbtree_node_t *
ngx_rbtree_next(ngx_rbtree_t *tree, ngx_rbtree_node_t *node)
{
    ngx_rbtree_node_t  *root, *sentinel, *parent;

    sentinel = tree->sentinel;

    if (node->right != sentinel) {
        return ngx_rbtree_min(node->right, sentinel);
    }

    root = tree->root;

    for ( ;; ) {
        parent = node->parent;

        if (node == root) {
            return NULL;
        }

        if (node == parent->left) {
            return parent;
        }

        node = parent;
    }
}
```

## 前提知識

- **二分探索木**: 左の子孫は小さく、右の子孫は大きい木です。小さい順に並べると「左の部分木 → 自分 → 右の部分木」の順になります（中間順）。
- **構造体とポインタ**: 各ノードは `left`、`right`、`parent` を持ちます。`node->right` は右の子です。
- **番兵（sentinel）**: 「子がいない」を表す特別なノードです。`node->right != sentinel` は「右の子がいる」という意味です。
- **`ngx_rbtree_min(n, sentinel)`**: ヘッダにある小さな関数で、`n` から左の子をたどれるところまでたどり、その部分木の最小ノードを返します。
- **`for ( ;; )`**: 条件なしの無限ループです。`return` で抜けます。
- **`NULL`**: どこも指していないポインタで、ここでは「次はない」を表します。

## 何をしているか

### 1. 右の部分木があれば、その最小が次

```c:line-numbers=385
    if (node->right != sentinel) {
        return ngx_rbtree_min(node->right, sentinel);
    }
```

`node` より大きく、しかもいちばん近いのは、右の部分木の中の最小値です。右の子から左へたどれるところまでたどれば見つかります。

### 2. なければ、親をたどって上がる

```c:line-numbers=389
    root = tree->root;

    for ( ;; ) {
        parent = node->parent;

        if (node == root) {
            return NULL;
        }

        if (node == parent->left) {
            return parent;
        }

        node = parent;
    }
```

右の部分木がないときは、`node` 自身がある部分木の最大です。そこで親へと上がっていきます。

- 自分が親の **左の子** なら、その親が次です（`if (node == parent->left)`）。親は左の部分木全体より大きいからです。
- 自分が親の **右の子** なら、親は自分より小さいので、さらに上へ進みます（`node = parent;`）。
- 根まで来てしまったら、`node` は木全体の最大なので `NULL` を返します（`if (node == root)`）。

### 具体例

```
        20
       /  \
     10    30
       \
        15
```

- `next(10)`: 右の子 15 がいて、その最小は 15。
- `next(15)`: 右の子なし。15 は 10 の右の子なので上へ。10 は 20 の左の子なので、答えは 20。
- `next(30)`: 右の子なし。30 は 20 の右の子なので上へ。20 は根なので `NULL`。

## ここがすごい

- **スタックがいらない**: 木を順に巡る方法としては再帰がよく知られていますが、再帰はたどった道をスタックに覚えておくので、深い木ではメモリを使い、途中で処理を中断・再開しにくくなります。親へのポインタがあれば、「今いるノード」1 つだけで次が分かります。呼び出し側は「現在位置」を持っておくだけでよく、イテレータ（反復子）として使いやすい設計です。
- **かかる時間はならすと一定**: 1 回の呼び出しでは木の高さぶん上り下りすることもありますが、木全体を巡ると、各辺を通るのは上りと下りの 2 回ずつなので、全体ではノード数に比例する時間で済みます。
- **根の判定を先にする**: `if (node == root)` で `node == root` を先に調べているのは、根の `parent` は `NULL` だからです。`NULL` の `left` を読もうとする事故を防いでいます。
- **キーの意味を知らない**: キーを一度も比べず、木の形だけで次を決めています。そのため、タイマー用の比較など、どんな比較で作られた木でも同じ関数で巡れます。

## まとめ

- 二分探索木の「次のノード」は、右の部分木の最小か、左の子として上がった最初の親。
- 親へのポインタがあると、再帰やスタックなしで木を順に巡れる。
- 根の親は `NULL` なので、親をたどるループでは根の判定を先に済ませる。
