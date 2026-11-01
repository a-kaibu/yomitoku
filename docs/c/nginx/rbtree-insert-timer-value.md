---
title: "49 日で一周する時刻でも正しく並べる、引き算ひとつの比較"
description: "タイマー用の赤黒木でノードの置き場所を探す関数。ミリ秒の時刻が 32 ビットであふれて 0 に戻っても大小を正しく判定するため、差を符号つき整数として見るだけの比較を使う。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_rbtree.c
lines: [121, 153]
function: "ngx_rbtree_insert_timer_value"
difficulty: 2
format: 2
tags: [データ構造, ビット演算, 日時, 防御的プログラミング]
---

## ひとことで

`ngx_rbtree_insert_timer_value` は、nginx の **タイマー**（「何ミリ秒後にこの処理をする」という予定）を赤黒木に入れるとき、新しいノードをどこにぶら下げるかを決める関数です。
ふつうの版（`ngx_rbtree_insert_value`）は `node->key < temp->key` で大小を比べますが、この版は **`(符号つき)(node->key - temp->key) < 0`** で比べます。コメントのとおり、ミリ秒の時刻を 32 ビットで持つと約 49 日で一周して 0 に戻ってしまうので、それでも正しく並べるための工夫です。

## コード

::: code-group

```c:line-numbers=121 [日本語訳]
void
ngx_rbtree_insert_timer_value(ngx_rbtree_node_t *temp, ngx_rbtree_node_t *node,
    ngx_rbtree_node_t *sentinel)
{
    ngx_rbtree_node_t  **p;

    for ( ;; ) {

        /*
         * タイマーの値は
         * 1) 狭い範囲（ふつうは数分）に散らばっていて、
         * 2) ミリ秒を 32 ビットで持つと 49 日ごとにあふれる。
         * この比較はそのあふれを考慮している。
         */

        /*  node->key < temp->key の意味 */

        p = ((ngx_rbtree_key_int_t) (node->key - temp->key) < 0)
            ? &temp->left : &temp->right;

        if (*p == sentinel) {
            break;
        }

        temp = *p;
    }

    *p = node;
    node->parent = temp;
    node->left = sentinel;
    node->right = sentinel;
    ngx_rbt_red(node);
}
```

```c:line-numbers=121 [原文]
void
ngx_rbtree_insert_timer_value(ngx_rbtree_node_t *temp, ngx_rbtree_node_t *node,
    ngx_rbtree_node_t *sentinel)
{
    ngx_rbtree_node_t  **p;

    for ( ;; ) {

        /*
         * Timer values
         * 1) are spread in small range, usually several minutes,
         * 2) and overflow each 49 days, if milliseconds are stored in 32 bits.
         * The comparison takes into account that overflow.
         */

        /*  node->key < temp->key */

        p = ((ngx_rbtree_key_int_t) (node->key - temp->key) < 0)
            ? &temp->left : &temp->right;

        if (*p == sentinel) {
            break;
        }

        temp = *p;
    }

    *p = node;
    node->parent = temp;
    node->left = sentinel;
    node->right = sentinel;
    ngx_rbt_red(node);
}
```

:::

## 前提知識

- **タイマーと赤黒木**: nginx は、期限の時刻をキーにしてタイマーを赤黒木に入れます。いちばん左（いちばん小さい）ノードが次に期限が来るタイマーです。
- **符号なし整数のあふれ**: `unsigned`（符号なし）の整数は、最大値を超えると 0 に戻ります（あふれ）。32 ビットなら最大値は約 42 億で、ミリ秒で数えると約 49.7 日です。C では、符号なし整数のあふれはこの「一周する」動きをすると決まっています。
- **型のキャスト `(ngx_rbtree_key_int_t)`**: 符号なしの値を、同じ幅の **符号つき** 整数として解釈し直します。最上位ビットが 1 なら負の数になります。
- **`ngx_rbtree_key_t`**: キーの型で、`ngx_uint_t`（符号なし）の別名です。`ngx_rbtree_key_int_t` は同じ幅の符号つき版です。
- **ポインタのポインタ `**p`**: `p` は「左の子へのポインタ」か「右の子へのポインタ」が入っている **場所** を指します。`*p = node` と書けば、その場所に新しいノードをつなげます。
- **番兵（sentinel）**: 「子がいない」を表す特別なノードです。

## 何をしているか

### 1. 左右どちらに進むか決める

```c:line-numbers=138
        p = ((ngx_rbtree_key_int_t) (node->key - temp->key) < 0)
            ? &temp->left : &temp->right;
```

`node->key - temp->key` を計算し、それを符号つきとして見て負なら左、そうでなければ右へ進みます。

### 2. 空き場所に着いたら止まる

```c:line-numbers=141
        if (*p == sentinel) {
            break;
        }

        temp = *p;
```

進む先が番兵なら、そこが空き場所です。そうでなければ、そのノードに移って比較を続けます。

### 3. ぶら下げる

```c:line-numbers=148
    *p = node;
    node->parent = temp;
    node->left = sentinel;
    node->right = sentinel;
    ngx_rbt_red(node);
```

`*p = node` で親の左か右に新しいノードをつなぎ、親・子のポインタを設定して、色を赤にします。この後の色の調整は `ngx_rbtree_insert` が行います。

### あふれをまたぐ例

分かりやすく 8 ビット（0〜255 で一周）で考えます。

- いまある期限 `temp->key = 250`
- 新しい期限は 10 ミリ秒後で、あふれて `node->key = 4`（260 − 256）

ふつうの比較 `4 < 250` では、新しいタイマーのほうが **先** に期限が来ると判断されてしまいます。

この関数の比較では、`4 - 250` は 8 ビットの符号なしで `10` になります（あふれて一周）。符号つきで見ても `10` で正なので「右（後）」と判断され、正しい順番になります。

逆に `node->key = 245` なら、`245 - 250` は符号なしで `251`、符号つきでは `-5` で負なので「左（先）」です。

## ここがすごい

- **差で比べると、一周しても大丈夫**: 2 つの時刻の **差** が型の範囲の半分（32 ビットなら約 24 日）より小さければ、引き算の結果を符号つきとして見るだけで正しい前後関係が分かります。コメントにある「タイマーの値は数分程度の狭い範囲に散らばる」という性質があるので、この条件はいつも満たされます。
- **比較のしかたを差し替えるだけで済む**: 赤黒木の挿入（バランス調整）は共通で、比較の 1 行だけをタイマー用にしています。nginx の赤黒木が「置き場所探し」を関数ポインタにしているおかげです。
- **ポインタのポインタで「つなぐ場所」を覚える**: `p` に `&temp->left` か `&temp->right` を入れておくと、ループを抜けたあと「左だったか右だったか」をもう一度調べずに `*p = node` で済みます。リスト操作などでもよく使われる C のイディオムです。
- **同じ考え方は広く使われている**: 一周するカウンタの前後を差の符号で判断する方法は、TCP のシーケンス番号の比較など、ネットワークや OS の世界で定番の技法です。

## まとめ

- 一周するカウンタ（時刻、通し番号）の大小は、`a < b` ではなく「`a - b` を符号つきで見て負か」で比べる。
- この方法は、比べる 2 つの値の差が範囲の半分より小さいときに正しい。
- `**p` に「次につなぐ場所」を持たせると、木やリストへの挿入が短く書ける。
