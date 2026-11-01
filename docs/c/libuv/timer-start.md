---
title: "足し算のあふれを検出して「ずっと先」に丸めるタイマー開始"
description: "libuv のタイマーを開始する関数。現在時刻に待ち時間を足した値があふれたら最大値に丸め、通し番号を振ってヒープに入れる。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: MIT
copyright: "Copyright Joyent, Inc. and other Node contributors. All rights reserved."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/timer.c
lines: [67, 94]
function: "uv_timer_start"
difficulty: 2
format: 2
tags: [防御的プログラミング, 非同期, データ構造]
---

## ひとことで

`uv_timer_start` は、「`timeout` ミリ秒後に `cb` を呼び、その後は `repeat` ミリ秒ごとに繰り返す」というタイマーを開始する、libuv の公開 API です。
期限を「今の時刻 + 待ち時間」で計算するときに **足し算があふれる** 場合を検出し、「いつまでも来ない時刻」に丸めているのがポイントです。
そのうえで、同じ期限のタイマーの順番を決める通し番号を振り、ヒープに挿入します。

## コード

::: code-group

```c:line-numbers=67 [日本語訳]
int uv_timer_start(uv_timer_t* handle,
                   uv_timer_cb cb,
                   uint64_t timeout,
                   uint64_t repeat) {
  uint64_t clamped_timeout;

  if (uv__is_closing(handle) || cb == NULL)
    return UV_EINVAL;

  uv_timer_stop(handle);

  clamped_timeout = handle->loop->time + timeout;
  if (clamped_timeout < timeout)
    clamped_timeout = (uint64_t) -1;

  handle->timer_cb = cb;
  handle->timeout = clamped_timeout;
  handle->repeat = repeat;
  /* start_id は timer_less_than() で 2 番目に比べられる鍵 */
  handle->start_id = handle->loop->timer_counter++;

  heap_insert(timer_heap(handle->loop),
              (struct heap_node*) &handle->node.heap,
              timer_less_than);
  uv__handle_start(handle);

  return 0;
}
```

```c:line-numbers=67 [原文]
int uv_timer_start(uv_timer_t* handle,
                   uv_timer_cb cb,
                   uint64_t timeout,
                   uint64_t repeat) {
  uint64_t clamped_timeout;

  if (uv__is_closing(handle) || cb == NULL)
    return UV_EINVAL;

  uv_timer_stop(handle);

  clamped_timeout = handle->loop->time + timeout;
  if (clamped_timeout < timeout)
    clamped_timeout = (uint64_t) -1;

  handle->timer_cb = cb;
  handle->timeout = clamped_timeout;
  handle->repeat = repeat;
  /* start_id is the second index to be compared in timer_less_than() */
  handle->start_id = handle->loop->timer_counter++;

  heap_insert(timer_heap(handle->loop),
              (struct heap_node*) &handle->node.heap,
              timer_less_than);
  uv__handle_start(handle);

  return 0;
}
```

:::

## 前提知識

- **イベントループ**: libuv の中心にある「待つ → 起きたことの処理を呼ぶ」を繰り返す仕組みです。`loop->time` は、そのループが覚えている現在時刻（ミリ秒）です。
- **`uint64_t` とあふれ（オーバーフロー）**: 64 ビットの符号なし整数は 0〜約 1.8×10¹⁹ を表せます。最大値を超える足し算をすると、0 の側に巻き戻ります（たとえば最大値 + 1 は 0）。符号なし整数ではこれが C の規格で決まった動作です。
- **`(uint64_t) -1`**: -1 を符号なし 64 ビットに変換すると、すべてのビットが 1 の最大値になります。
- **関数ポインタ `uv_timer_cb cb`**: 「あとで呼ぶ関数」を値として受け取ります。`NULL` なら呼ぶ関数がないという意味です。
- **`->`**: ポインタの指す構造体のメンバにアクセスします。`handle->loop->time` は「ハンドルが属するループの時刻」です。
- **後置 `++`**: `x++` は「今の値を使ってから 1 増やす」です。`handle->loop->timer_counter++` は、今のカウンタの値を `start_id` に入れ、カウンタを進めます。

## 何をしているか

### 1. 引数の確認

```c:line-numbers=73
  if (uv__is_closing(handle) || cb == NULL)
    return UV_EINVAL;
```

閉じかけているハンドルや、コールバックが `NULL` のときは `UV_EINVAL`（不正な引数）を返します。

### 2. いったん止める

```c:line-numbers=76
  uv_timer_stop(handle);
```

すでに動いているタイマーを再び開始する場合に備えて、まず `uv_timer_stop` でヒープから外します。止まっているタイマーに対して呼んでも問題ありません。これで「開始」は常に「やり直し」として扱えます。

### 3. 期限を計算し、あふれたら丸める

```c:line-numbers=78
  clamped_timeout = handle->loop->time + timeout;
  if (clamped_timeout < timeout)
    clamped_timeout = (uint64_t) -1;
```

`clamped_timeout = loop->time + timeout` で期限を計算します。符号なしの足し算があふれると、結果は足した値より **小さく** なります。`clamped_timeout < timeout` はちょうどその判定です。あふれていたら、最大値に置き換えます。

`loop->time = 1000` で `timeout = UINT64_MAX - 10` を渡した場合、足し算の結果は 989 に巻き戻ります。そのままだと「すでに過ぎた時刻」になり、タイマーがすぐに発火してしまいます。丸めておけば、実質的に永遠に発火しません。

### 4. 情報を保存してヒープへ

```c:line-numbers=82
  handle->timer_cb = cb;
  handle->timeout = clamped_timeout;
  handle->repeat = repeat;
  /* start_id is the second index to be compared in timer_less_than() */
  handle->start_id = handle->loop->timer_counter++;

  heap_insert(timer_heap(handle->loop),
              (struct heap_node*) &handle->node.heap,
              timer_less_than);
  uv__handle_start(handle);
```

コールバック・期限・繰り返し間隔を保存し、`start_id` に通し番号を振ります。比較関数 `timer_less_than` は、期限が同じならこの番号で順番を決めます。
`heap_insert` でタイマー用のヒープに入れ、`uv__handle_start` でハンドルを「動作中」にします。動作中のハンドルがあるあいだ、イベントループは終了しません。

## ここがすごい

- **あふれの検出が 1 回の比較で済む**: 符号なし整数の足し算 `a + b` があふれたかどうかは、`(a + b) < b`（または `< a`）で判定できます。事前に `a > MAX - b` を調べる方法もありますが、ここでは計算してから結果を見るだけで済ませています。符号付き整数ではあふれが未定義動作になるのでこの方法は使えず、`uint64_t` だからこそ成り立つ技です。
- **「巨大な待ち時間」を「待たない」に化けさせない**: あふれをそのままにすると、極端に大きな値を渡したタイマーが即座に発火する、という正反対の結果になります。最大値に丸めることで、利用者の意図（とても長く待つ）に近い動作を保っています。
- **開始の前に必ず停止**: 冒頭の `uv_timer_stop(handle)` のおかげで、動いているタイマーを `uv_timer_start` し直すだけで期限を更新できます。ヒープに同じノードが二重に入る事故も起きません。
- **順番の決定を開始時に済ませる**: 通し番号を振るのはこの関数だけなので、「同じ期限なら先に開始したものが先」という規則が、ここ 1 か所で保証されます。

## まとめ

- 符号なし整数の足し算のあふれは、「結果が足した値より小さいか」で検出できる。
- あふれた期限は最大値に丸めると、「すぐ発火」という誤動作を防げる。
- 「開始」の前に「停止」を呼ぶと、再開始と二重登録の問題をまとめて解決できる。
- 同じ期限のタイマーには通し番号を振って順番を決める。
