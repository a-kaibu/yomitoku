---
title: "イベントループが何ミリ秒眠ってよいかを決める"
description: "次のタイマーの期限までの残り時間を返す関数。タイマーがなければ -1（ずっと待つ）、期限切れなら 0、大きすぎれば int の最大値に丸める。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: MIT
copyright: "Copyright Joyent, Inc. and other Node contributors. All rights reserved."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/timer.c
lines: [143, 161]
function: "uv__next_timeout"
difficulty: 1
format: 2
tags: [非同期, システムコール, 防御的プログラミング]
---

## ひとことで

`uv__next_timeout` は、イベントループが「次にタイマーを処理するまで、どれだけ眠ってよいか」をミリ秒で返す関数です。
この値は、OS の「何かが起きるまで待つ」システムコール（Linux の `epoll_wait` など）に、待ち時間の上限として渡されます。
返す値の意味が 3 通り（ずっと待つ・待たない・何ミリ秒待つ）あり、それを 1 つの `int` で表しているのが特徴です。

## コード

::: code-group

```c:line-numbers=143 [日本語訳]
int uv__next_timeout(const uv_loop_t* loop) {
  const struct heap_node* heap_node;
  const uv_timer_t* handle;
  uint64_t diff;

  heap_node = heap_min(timer_heap(loop));
  if (heap_node == NULL)
    return -1; /* 無期限に待つ */

  handle = container_of(heap_node, uv_timer_t, node.heap);
  if (handle->timeout <= loop->time)
    return 0;

  diff = handle->timeout - loop->time;
  if (diff > INT_MAX)
    diff = INT_MAX;

  return (int) diff;
}
```

```c:line-numbers=143 [原文]
int uv__next_timeout(const uv_loop_t* loop) {
  const struct heap_node* heap_node;
  const uv_timer_t* handle;
  uint64_t diff;

  heap_node = heap_min(timer_heap(loop));
  if (heap_node == NULL)
    return -1; /* block indefinitely */

  handle = container_of(heap_node, uv_timer_t, node.heap);
  if (handle->timeout <= loop->time)
    return 0;

  diff = handle->timeout - loop->time;
  if (diff > INT_MAX)
    diff = INT_MAX;

  return (int) diff;
}
```

:::

## 前提知識

- **イベントループ**: 「ファイルやネットワークに何か起きるのを待つ → 起きたら処理する」を繰り返す仕組みです。待っている間はスリープして CPU を使いません。ただし、タイマーの期限が来たら起きる必要があるので、待ち時間の上限が必要です。
- **ヒープと `heap_min`**: タイマーは期限の早い順に取り出せるヒープに入っています。`heap_min` は最も期限の早いノードを返し、空なら `NULL` を返します。
- **`container_of`**: 構造体に埋め込まれたメンバのアドレスから、構造体全体のアドレスを求めるマクロです。ヒープのノードから `uv_timer_t` に戻るのに使います。
- **`INT_MAX`**: `int` 型で表せる最大値です。`int` が 32 ビットなら約 21 億で、ミリ秒ならおよそ 24.8 日です。
- **型変換 `(int) diff`**: 64 ビットの `diff` を `int` にします。`int` に収まらない値を変換すると正しい値になりません。

## 何をしているか

### 1. タイマーがない場合

```c:line-numbers=148
  heap_node = heap_min(timer_heap(loop));
  if (heap_node == NULL)
    return -1; /* block indefinitely */
```

ヒープが空なら `-1` を返します。`epoll_wait` や `poll` は、待ち時間に `-1` を渡されると「何か起きるまで無期限に待つ」という意味になります。コメントの "block indefinitely" はそのことです。

### 2. すでに期限を過ぎている場合

```c:line-numbers=152
  handle = container_of(heap_node, uv_timer_t, node.heap);
  if (handle->timeout <= loop->time)
    return 0;
```

いちばん早いタイマーの期限が現在時刻以下なら、もう実行すべき時刻なので `0`（待たずにすぐ戻る）を返します。

### 3. 残り時間を計算して丸める

```c:line-numbers=156
  diff = handle->timeout - loop->time;
  if (diff > INT_MAX)
    diff = INT_MAX;

  return (int) diff;
```

期限 − 現在時刻 が残り時間です。それが `INT_MAX` を超えるなら `INT_MAX` にしてから `int` で返します。

### 例で追う

- タイマーなし → `-1`
- 現在 5000、最短の期限 4990 → すでに過ぎているので `0`
- 現在 5000、最短の期限 5250 → `250`
- 現在 5000、最短の期限が 60 日後 → `INT_MAX`（約 24.8 日）。その時間が経って起きたら、もう一度計算し直して残りを待ちます

## ここがすごい

- **3 つの意味を 1 つの値に**: 「無期限」「待たない」「n ミリ秒」を `-1`・`0`・正の数で表すのは、OS の待機システムコールの決まりに合わせたものです。計算結果をそのまま渡せるので、呼び出し側で変換する必要がありません。
- **引き算の前に大小を比べる**: 期限と現在時刻は符号なしの `uint64_t` です。期限を過ぎているのに先に `timeout - time` を計算すると、負にならず巨大な正の数に巻き戻ってしまいます。`handle->timeout <= loop->time` を先に比べて 0 を返しているので、その後の引き算は必ず正しい残り時間になります。
- **丸めても正しく動く**: 待ち時間を `INT_MAX` に丸めると、本当の期限より早く起きることになります。しかし早く起きる分には問題ありません。タイマーはまだ期限前なので実行されず、次の周回でこの関数がまた残り時間を計算するだけです。「遅れる」ことだけは絶対に起こさない、という安全側への丸め方です。

## まとめ

- イベントループの待ち時間は「次のタイマーの期限まで」で決まる。
- `-1` は無期限、`0` は待たない、正の数はミリ秒という、OS の決まりに合わせて返す。
- 符号なし整数の引き算は、先に大小を比べてから行う。
- 型に収まらない値は、安全側（早めに起きる側）に丸める。
