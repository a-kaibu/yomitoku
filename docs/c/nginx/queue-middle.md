---
title: "1 歩と 2 歩で進む「ウサギとカメ」で連結リストの真ん中を探す"
description: "双方向の環状リストの真ん中の要素を、長さを数えずに 1 回の走査で見つける関数。1 つずつ進むポインタと 2 つずつ進むポインタを同時に動かし、速いほうが端に着いたときの遅いほうを答えにする。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_queue.c
lines: [16, 49]
function: "ngx_queue_middle"
difficulty: 1
format: 2
tags: [データ構造, アルゴリズム, イディオム]
---

## ひとことで

`ngx_queue_middle` は、nginx のキュー（双方向の連結リスト）の **真ん中の要素** を返す関数です。コメントのとおり、要素数が奇数なら真ん中、偶数なら後半の先頭を返します。`[1, 2, 3, 4, 5]` なら `3`、`[1, 2, 3, 4]` なら `3` です。
要素数を数えずに、**1 歩ずつ進むポインタと 2 歩ずつ進むポインタ** を同時に動かすことで、1 回たどるだけで真ん中が分かります。マージソート（`ngx_queue_sort`）でリストを半分に分けるのに使われます。

## コード

::: code-group

```c:line-numbers=16 [日本語訳]
/*
 * キューの要素数が奇数なら真ん中の要素を、
 * そうでなければ後半の最初の要素を見つける
 */

ngx_queue_t *
ngx_queue_middle(ngx_queue_t *queue)
{
    ngx_queue_t  *middle, *next;

    middle = ngx_queue_head(queue);

    if (middle == ngx_queue_last(queue)) {
        return middle;
    }

    next = ngx_queue_head(queue);

    for ( ;; ) {
        middle = ngx_queue_next(middle);

        next = ngx_queue_next(next);

        if (next == ngx_queue_last(queue)) {
            return middle;
        }

        next = ngx_queue_next(next);

        if (next == ngx_queue_last(queue)) {
            return middle;
        }
    }
}
```

```c:line-numbers=16 [原文]
/*
 * find the middle queue element if the queue has odd number of elements
 * or the first element of the queue's second part otherwise
 */

ngx_queue_t *
ngx_queue_middle(ngx_queue_t *queue)
{
    ngx_queue_t  *middle, *next;

    middle = ngx_queue_head(queue);

    if (middle == ngx_queue_last(queue)) {
        return middle;
    }

    next = ngx_queue_head(queue);

    for ( ;; ) {
        middle = ngx_queue_next(middle);

        next = ngx_queue_next(next);

        if (next == ngx_queue_last(queue)) {
            return middle;
        }

        next = ngx_queue_next(next);

        if (next == ngx_queue_last(queue)) {
            return middle;
        }
    }
}
```

:::

## 前提知識

- **連結リスト**: 要素がメモリ上でばらばらに置かれ、各要素が「次の要素の場所」を持つことで並びを作るデータ構造です。配列と違い、`i` 番目にすぐ飛ぶことはできず、先頭から順にたどる必要があります。
- **nginx のキュー `ngx_queue_t`**: `prev`（前）と `next`（次）の 2 つのポインタだけを持つ構造体です。先頭の前に「見出し」役の要素（番兵）があり、最後の要素の次は見出しに戻る **環状** になっています。
- **マクロ**: `ngx_queue_head(h)` は `h->next`（最初の要素）、`ngx_queue_last(h)` は `h->prev`（最後の要素）、`ngx_queue_next(q)` は `q->next` に置き換わる短い定義です。
- **ポインタの比較 `==`**: 2 つのポインタが同じ要素を指しているかを調べます。
- **`for ( ;; )`**: 条件なしの無限ループです。中の `return` で抜けます。

## 何をしているか

### 1. 要素が 1 つなら、それが真ん中

```c:line-numbers=26
    middle = ngx_queue_head(queue);

    if (middle == ngx_queue_last(queue)) {
        return middle;
    }
```

最初の要素が最後の要素でもあれば、要素は 1 つです。そのまま返します。

### 2. 2 つのポインタを走らせる

```c:line-numbers=32
    next = ngx_queue_head(queue);

    for ( ;; ) {
        middle = ngx_queue_next(middle);

        next = ngx_queue_next(next);

        if (next == ngx_queue_last(queue)) {
            return middle;
        }

        next = ngx_queue_next(next);

        if (next == ngx_queue_last(queue)) {
            return middle;
        }
    }
```

`middle` と `next` の両方を最初の要素に置き、ループ 1 周で `middle` は 1 歩、`next` は 2 歩進みます。`next` は 1 歩ごとに「最後の要素に着いたか」を調べ（2 か所の `if (next == ngx_queue_last(queue))`）、着いたらその時点の `middle` を返します。

`[1, 2, 3, 4, 5]` で追います。

- 1 周目: `middle = 2`、`next` は 2 → 3。
- 2 周目: `middle = 3`、`next` は 4 → 5。5 は最後なので `3` を返す。

`[1, 2, 3, 4]` なら、

- 1 周目: `middle = 2`、`next` は 2 → 3。
- 2 周目: `middle = 3`、`next` は 4。4 は最後なので `3` を返す（後半 `[3, 4]` の先頭）。

## ここがすごい

- **長さを数えずに 1 回で済む**: 素直に書くと「まず全体を数えて長さ `n` を知り、次に `n / 2` 歩進む」となり、リストを 1.5 回たどります。速いポインタと遅いポインタを同時に動かせば、速いほうが端に着いたとき、遅いほうはちょうど半分の位置にいます。「ウサギとカメ」とも呼ばれる、連結リストの定番の技です（リストの環の検出にも同じ考え方が使われます）。
- **1 歩ごとに端を確かめる**: 2 歩をまとめて進めると、要素数が偶数のときに端を飛び越えて見出しに入ってしまいます。この関数は 1 歩進むたびに `ngx_queue_last` と比べるので、偶数でも奇数でも正しく止まります。
- **端の判定に見出しを使わない**: 「最後の要素か」を `ngx_queue_last(queue)` と比べて判定しているので、見出しの要素（データを持たない番兵）を `middle` として返してしまうことがありません。
- **分割に都合のよい答え**: 偶数のとき「後半の先頭」を返すので、マージソートではこの要素から後ろを切り離すだけで、前半と後半がほぼ同じ長さに分かれます。

## まとめ

- 連結リストの真ん中は、1 歩と 2 歩で進む 2 つのポインタで、1 回の走査で見つけられる。
- 2 歩進むときは 1 歩ごとに端を確かめると、要素数の偶奇どちらでも安全。
- 何を返すか（奇数なら真ん中、偶数なら後半の先頭）を、使う側（分割）に合わせて決めておく。
