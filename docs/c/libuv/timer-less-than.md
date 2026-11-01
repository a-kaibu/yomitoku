---
title: "同じ時刻なら先に登録したほうが先、タイマーの比べ方"
description: "libuv のタイマーをヒープに並べるための比較関数。期限が同じなら登録順の通し番号で比べ、ヒープという順番の保証がない構造で「登録順」を守る。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: MIT
copyright: "Copyright Joyent, Inc. and other Node contributors. All rights reserved."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/timer.c
lines: [37, 54]
function: "timer_less_than"
difficulty: 1
format: 2
tags: [データ構造, ソート, イディオム]
---

## ひとことで

`timer_less_than` は、2 つのタイマーのどちらを先に実行すべきかを決める比較関数です。
基本は期限（`timeout`）の早いほうが先ですが、**期限が同じなら、先に開始したほうが先** になるよう、通し番号 `start_id` で比べます。
たった十数行ですが、ヒープというデータ構造の弱点を補う、大事な役目を持っています。

## コード

::: code-group

```c:line-numbers=37 [日本語訳]
static int timer_less_than(const struct heap_node* ha,
                           const struct heap_node* hb) {
  const uv_timer_t* a;
  const uv_timer_t* b;

  a = container_of(ha, uv_timer_t, node.heap);
  b = container_of(hb, uv_timer_t, node.heap);

  if (a->timeout < b->timeout)
    return 1;
  if (b->timeout < a->timeout)
    return 0;

  /* 両方の timeout が同じなら start_id で比べる。start_id は
   * uv_timer_start() で loop->timer_counter から割り当てられる。
   */
  return a->start_id < b->start_id;
}
```

```c:line-numbers=37 [原文]
static int timer_less_than(const struct heap_node* ha,
                           const struct heap_node* hb) {
  const uv_timer_t* a;
  const uv_timer_t* b;

  a = container_of(ha, uv_timer_t, node.heap);
  b = container_of(hb, uv_timer_t, node.heap);

  if (a->timeout < b->timeout)
    return 1;
  if (b->timeout < a->timeout)
    return 0;

  /* Compare start_id when both have the same timeout. start_id is
   * allocated with loop->timer_counter in uv_timer_start().
   */
  return a->start_id < b->start_id;
}
```

:::

## 前提知識

- **ヒープ**: いちばん小さい要素をすぐ取り出せる木構造です。libuv はタイマーをヒープに入れ、いちばん期限の早いものを取り出します。ただし、**同じ大きさの要素の順番は保証されません**（安定ではない、と言います）。
- **`container_of(ptr, type, member)`**: 構造体のメンバのアドレスから、その構造体全体のアドレスを逆算する libuv のマクロです。ヒープのノード `heap_node` はタイマー構造体 `uv_timer_t` の中に埋め込まれているので、ノードから元のタイマーに戻るのに使います。
- **`const`**: 「この関数は指している中身を書き換えない」という約束です。
- **比較関数**: 並べ替えやヒープは、「a は b より前か」を答える関数を受け取って順番を決めます。この関数は「a が b より前なら 1、そうでなければ 0」を返します。
- **`uint64_t`**: 64 ビットの符号なし整数です。期限はミリ秒単位の時刻で表されます。

## 何をしているか

### 1. ノードからタイマーへ戻る

```c:line-numbers=42
  a = container_of(ha, uv_timer_t, node.heap);
  b = container_of(hb, uv_timer_t, node.heap);
```

ヒープは `heap_node` しか知らないので、`container_of` で `uv_timer_t` を取り出します。`node.heap` はタイマー構造体の中でノードが置かれているメンバの名前です。

### 2. 期限で比べる

```c:line-numbers=45
  if (a->timeout < b->timeout)
    return 1;
  if (b->timeout < a->timeout)
    return 0;
```

`a` の期限が早ければ 1、`b` の期限が早ければ 0 を返します。

### 3. 期限が同じなら通し番号で比べる

```c:line-numbers=50
  /* Compare start_id when both have the same timeout. start_id is
   * allocated with loop->timer_counter in uv_timer_start().
   */
  return a->start_id < b->start_id;
```

ここまで来たのは期限がまったく同じときです。`start_id` は `uv_timer_start` のたびにループの `timer_counter` から 1 ずつ増えながら振られる番号なので、小さいほど先に開始されたタイマーです。

### 例で追う

ループの時刻が 1000 のとき、次の順に 3 つのタイマーを開始したとします。

- A: 100 ミリ秒後（期限 1100、`start_id` 5）
- B: 100 ミリ秒後（期限 1100、`start_id` 6）
- C: 50 ミリ秒後（期限 1050、`start_id` 7）

比べると、C は期限が早いので最初です。A と B は期限が同じなので `start_id` で比べ、A が先になります。実行順は C → A → B で、「同じ時刻なら開始した順」が守られます。

## ここがすごい

- **安定でない構造に、安定な順番を与える**: ヒープは、入れた順番と取り出す順番が同じ大きさの要素どうしでは入れ替わりえます。もし期限だけで比べていたら、同じ時刻に設定した A と B のどちらが先に動くかは、ヒープの中の配置しだいになってしまいます。比較の鍵を「期限、次に通し番号」の 2 段にするだけで、順番が完全に決まります。
- **利用者の直感に合う**: 同じ待ち時間で 2 つのタイマーを続けて開始したら、先に開始したほうが先に呼ばれると期待するのが自然です。その期待を、比較関数 1 つで保証しています。
- **早期 return で読みやすく**: `a < b` なら 1、`b < a` なら 0、と先に決着をつけ、最後の行に「同じだった場合」だけを残しています。1 つの長い条件式にするより、「何で比べているか」の優先順位が一目でわかります。

## まとめ

- ヒープは同じ大きさの要素の順番を保証しない（安定ではない）。
- 比較の鍵に「通し番号」を加えると、同じ値どうしでも登録順が守られる。
- 埋め込まれたノードから元の構造体へは `container_of` で戻る。
- 複数の基準で比べるときは、優先度の高い順に早期 return すると読みやすい。
