---
title: "余分な配列なしで連結リストを並べる、10 行の安定マージソート"
description: "nginx の双方向リストを並べ替える関数。真ん中で 2 つに切り、それぞれを再帰的に並べてから合わせるマージソートを、ポインタの付け替えだけで行う。追加のメモリは要らない。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_queue.c
lines: [52, 74]
function: "ngx_queue_sort"
difficulty: 2
format: 2
tags: [ソート, 再帰, データ構造, アルゴリズム]
---

## ひとことで

`ngx_queue_sort` は、nginx のキュー（双方向の連結リスト）を、比較関数 `cmp` の順に並べ替える関数です。コメントのとおり、**安定なマージソート**（同じ値どうしの順番を保つ並べ替え）です。
リストを真ん中で 2 つに分け、それぞれを自分自身で並べ替え（再帰）、最後に 2 つの並んだリストを 1 つに合わせます。nginx では、たとえば `location` の設定をまとめるときに使われています。

## コード

::: code-group

```c:line-numbers=52 [日本語訳]
/* 安定なマージソート */

void
ngx_queue_sort(ngx_queue_t *queue,
    ngx_int_t (*cmp)(const ngx_queue_t *, const ngx_queue_t *))
{
    ngx_queue_t  *q, tail;

    q = ngx_queue_head(queue);

    if (q == ngx_queue_last(queue)) {
        return;
    }

    q = ngx_queue_middle(queue);

    ngx_queue_split(queue, q, &tail);

    ngx_queue_sort(queue, cmp);
    ngx_queue_sort(&tail, cmp);

    ngx_queue_merge(queue, &tail, cmp);
}
```

```c:line-numbers=52 [原文]
/* the stable merge sort */

void
ngx_queue_sort(ngx_queue_t *queue,
    ngx_int_t (*cmp)(const ngx_queue_t *, const ngx_queue_t *))
{
    ngx_queue_t  *q, tail;

    q = ngx_queue_head(queue);

    if (q == ngx_queue_last(queue)) {
        return;
    }

    q = ngx_queue_middle(queue);

    ngx_queue_split(queue, q, &tail);

    ngx_queue_sort(queue, cmp);
    ngx_queue_sort(&tail, cmp);

    ngx_queue_merge(queue, &tail, cmp);
}
```

:::

## 前提知識

- **連結リストとキュー**: `ngx_queue_t` は `prev` と `next` だけを持つ構造体で、見出しの要素（番兵）を含む環状の双方向リストを作ります。データは、この構造体を自分の構造体に埋め込んで持たせます。
- **マクロ**: `ngx_queue_head(h)` は最初の要素、`ngx_queue_last(h)` は最後の要素です。`ngx_queue_split(h, q, n)` は、リスト `h` を要素 `q` の手前で切り、`q` から後ろを新しい見出し `n` のリストに移します。
- **関数ポインタ**: `ngx_int_t (*cmp)(const ngx_queue_t *, const ngx_queue_t *)` は「2 つの要素を比べて、負・0・正を返す関数」を受け取る引数です。
- **再帰**: 関数が自分自身を呼ぶことです。問題を小さく分けて同じ方法で解くときに使います。
- **ローカル変数 `tail`**: `ngx_queue_t tail;` はポインタではなく、構造体そのものを関数の中に置いています。これが後半のリストの見出しになります。
- **マージソート**: 半分に分けて、それぞれを並べ、並んだもの同士を先頭から比べながら合わせる並べ替えです。

## 何をしているか

### 1. 0 個か 1 個なら何もしない

```c:line-numbers=60
    q = ngx_queue_head(queue);

    if (q == ngx_queue_last(queue)) {
        return;
    }
```

最初の要素が最後の要素でもあれば、要素は 1 つで、もう並んでいます。空のリストでは、最初も最後も見出し自身になるので、同じ条件で抜けます。

### 2. 真ん中で 2 つに切る

```c:line-numbers=66
    q = ngx_queue_middle(queue);

    ngx_queue_split(queue, q, &tail);
```

`ngx_queue_middle` で後半の先頭 `q` を見つけ、`ngx_queue_split` で `q` から後ろを `tail` に移します。`[5, 2, 4, 1]` なら、`queue` は `[5, 2]`、`tail` は `[4, 1]` になります。

### 3. それぞれを並べる

```c:line-numbers=70
    ngx_queue_sort(queue, cmp);
    ngx_queue_sort(&tail, cmp);
```

自分自身を呼び、前半と後半を並べます。`[2, 5]` と `[1, 4]` になります。

### 4. 合わせる

```c:line-numbers=73
    ngx_queue_merge(queue, &tail, cmp);
```

`ngx_queue_merge` で、並んだ 2 つのリストを 1 つにまとめます。`[1, 2, 4, 5]` になり、`tail` は空になります。

## ここがすごい

- **追加の配列がいらない**: 配列のマージソートでは、合わせるときに作業用の配列が必要です。連結リストなら、要素を動かすのではなく **ポインタを付け替えるだけ** で並べ替えられるので、作業用のメモリがいりません。後半の見出し `tail` も、関数の中に置いた変数 1 つです。
- **リストに向いたアルゴリズムを選んでいる**: クイックソートやヒープソートは、`i` 番目の要素にすぐ飛べる配列で力を発揮します。連結リストでは順にたどるしかないので、先頭から順に比べていくだけのマージソートが最適です。時間は要素数を `n` として `n log n` に比例します。
- **安定であること**: 同じ順位の要素の並びが元のまま保たれます（合わせるときに、等しければ前半を先にするため）。設定ファイルに書かれた順番に意味がある場面で大切な性質です。
- **データを知らない汎用性**: キューの要素は `prev` と `next` しか持たず、データは比較関数だけが知っています。どんな構造体を並べるのにも、この関数 1 つで足ります。
- **短さ**: 分割は `ngx_queue_middle` と `ngx_queue_split`、合流は `ngx_queue_merge` に任せ、この関数自体は「止める・分ける・並べる・合わせる」の 4 行の骨組みだけになっています。マージソートの定義そのままの形です。

## まとめ

- 連結リストの並べ替えにはマージソートが向いている。ポインタの付け替えだけで、追加の配列なしに並べられる。
- 「分ける」「合わせる」を別の関数にすると、再帰の本体はアルゴリズムの定義どおりの短い形になる。
- 見出し（番兵）を持つリストなら、空と 1 要素を同じ条件で判定できる。
