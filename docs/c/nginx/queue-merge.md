---
title: "後ろのリストから 1 つずつ抜いて差し込む、その場でのマージ"
description: "並べ替え済みの 2 つの連結リストを 1 つにまとめる関数。前のリストを順に進みながら、後ろのリストの先頭が小さいときだけ抜いて差し込み、残りは最後にまとめてつなぐ。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_queue.c
lines: [77, 106]
function: "ngx_queue_merge"
difficulty: 2
format: 2
tags: [ソート, データ構造, アルゴリズム]
---

## ひとことで

`ngx_queue_merge` は、マージソート（`ngx_queue_sort`）の後半で使われる関数で、**並べ替え済みの 2 つのリスト** `queue` と `tail` を、1 つの並んだリスト `queue` にまとめます。`[2, 5]` と `[1, 4]` なら、`queue` は `[1, 2, 4, 5]` になり、`tail` は空になります。
新しいリストを作るのではなく、`tail` の要素を 1 つずつ抜き出して `queue` の正しい位置に **差し込む** ことで、その場でまとめます。

## コード

```c:line-numbers=77
static void
ngx_queue_merge(ngx_queue_t *queue, ngx_queue_t *tail,
    ngx_int_t (*cmp)(const ngx_queue_t *, const ngx_queue_t *))
{
    ngx_queue_t  *q1, *q2;

    q1 = ngx_queue_head(queue);
    q2 = ngx_queue_head(tail);

    for ( ;; ) {
        if (q1 == ngx_queue_sentinel(queue)) {
            ngx_queue_add(queue, tail);
            break;
        }

        if (q2 == ngx_queue_sentinel(tail)) {
            break;
        }

        if (cmp(q1, q2) <= 0) {
            q1 = ngx_queue_next(q1);
            continue;
        }

        ngx_queue_remove(q2);
        ngx_queue_insert_before(q1, q2);

        q2 = ngx_queue_head(tail);
    }
}
```

## 前提知識

- **nginx のキュー**: `ngx_queue_t` は `prev`（前）と `next`（次）のポインタを持つ構造体で、見出し（番兵）を含む環状の双方向リストを作ります。
- **マクロ**:
  - `ngx_queue_head(h)`: 最初の要素。
  - `ngx_queue_sentinel(h)`: 見出しそのもの。「最後まで進んで見出しに戻った」かどうかの判定に使います。
  - `ngx_queue_next(q)`: 次の要素。
  - `ngx_queue_remove(x)`: 要素 `x` をリストから外します（前後の要素を直接つなぎます）。
  - `ngx_queue_insert_before(q, x)`: 要素 `x` を `q` の直前に入れます。
  - `ngx_queue_add(h, n)`: リスト `n` の要素を全部、リスト `h` の末尾にまとめてつなぎます。
- **関数ポインタ `cmp`**: 2 つの要素を比べて、負・0・正を返す関数です。
- **`continue` と `break`**: ループの次の周へ進む / ループを抜ける、です。

## 何をしているか

`q1` は `queue` の中の「今見ている要素」、`q2` は `tail` の先頭です。

### 1. queue を最後まで見たら、残りの tail を全部つなぐ

```c:line-numbers=87
        if (q1 == ngx_queue_sentinel(queue)) {
            ngx_queue_add(queue, tail);
            break;
        }
```

`q1` が見出しに戻ったら、`queue` のどの要素よりも `tail` の残りが大きいということです。`ngx_queue_add` で残りをまとめて末尾につなぎ、終わります。

### 2. tail が空になったら終わり

```c:line-numbers=92
        if (q2 == ngx_queue_sentinel(tail)) {
            break;
        }
```

`tail` の要素を全部差し込み終えたら、`queue` の残りはすでに正しい順番なので、何もせずに終わります。

### 3. q1 のほうが小さいか等しければ、q1 を進める

```c:line-numbers=96
        if (cmp(q1, q2) <= 0) {
            q1 = ngx_queue_next(q1);
            continue;
        }
```

`q1` はこの位置のままでよいので、次の要素に進みます。

### 4. q2 のほうが小さければ、抜いて q1 の前に差し込む

```c:line-numbers=101
        ngx_queue_remove(q2);
        ngx_queue_insert_before(q1, q2);

        q2 = ngx_queue_head(tail);
```

`q2` を `tail` から外し、`q1` の直前に入れます。そして `tail` の新しい先頭を `q2` にします。`q1` は進めません。次の `tail` の要素も、まだ `q1` より小さいかもしれないからです。

### 具体例

`queue = [2, 5]`、`tail = [1, 4]` で追います。

- `q1 = 2`、`q2 = 1`: 2 > 1 なので、1 を 2 の前へ → `[1, 2, 5]`、`tail = [4]`
- `q1 = 2`、`q2 = 4`: 2 ≤ 4 なので `q1 = 5`
- `q1 = 5`、`q2 = 4`: 5 > 4 なので、4 を 5 の前へ → `[1, 2, 4, 5]`、`tail = []`
- `tail` が空なので終わり

## ここがすごい

- **`<= 0` で安定性を守る**: `if (cmp(q1, q2) <= 0)` は `cmp(q1, q2) <= 0` のとき `q1` を進めます。等しい場合は `queue`（前半）の要素が先に残り、`tail`（後半）の要素はその後ろに入ります。元の並びで前にあったものが前に来るので、マージソート全体が安定になります。`< 0` にすると、この性質が失われます。
- **残りをまとめてつなぐ**: どちらかのリストが尽きたら、もう一方の残りは比べる必要がありません。`queue` が尽きた場合は、`ngx_queue_add` のポインタ付け替え 4 回だけで `tail` の残り全部をつなげます。要素の数に関係なく一定の手間です。
- **要素を動かさない**: 移動するのはポインタだけで、データのコピーは一切ありません。大きな構造体を並べるときでも軽く済みます。
- **作業用のリストがいらない**: 「新しい空のリストを用意して、小さいほうから順に移す」という教科書どおりの書き方もできますが、この関数は `queue` を結果のリストとしてそのまま使い、`tail` の要素だけを差し込みます。前半がすでに正しい位置にあることを生かした書き方です。

## まとめ

- 並んだ 2 つのリストの合流は、「小さいほうを先に」を先頭から繰り返すだけ。等しいときに前のリストを優先すると安定になる。
- 片方が尽きたら、残りはまとめてつなげばよい。
- 連結リストでは、データを動かさずポインタの付け替えだけで並べ替えができる。
