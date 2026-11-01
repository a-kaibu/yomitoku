---
title: "安定であることを選んだ、どんな型でも並べられる挿入ソート"
description: "任意の型の配列を比較関数で並べる汎用ソート。同じ値の順序を保つ「安定ソート」が必要なため、あえてクイックソートではなく挿入ソートで実装している。"
language: c
project: nginx
repo: https://github.com/nginx/nginx
license: BSD-2-Clause
copyright: "Copyright (C) Igor Sysoev; Copyright (C) Nginx, Inc."
commit: "67290bfea61c81347464539f5e6d0a7cebec1fc8"
file: src/core/ngx_string.c
lines: [2076, 2106]
function: "ngx_sort"
difficulty: 2
format: 2
tags: [ソート, アルゴリズム, メモリ管理, ジェネリクス]
---

## ひとことで

`ngx_sort` は、配列を並べ替える汎用の関数です。要素の型を知らなくても、**要素の大きさ `size` と比較関数 `cmp`** を受け取ることで、どんな配列でも並べられます。
コメントにあるとおり、**安定ソート（同じ値の要素の前後関係が変わらない並べ替え）が必要** なので、挿入ソートで実装されています。nginx では、同じポートで待ち受けるアドレスの並べ替えなどに使われています。

## コード

::: code-group

```c:line-numbers=2076 [日本語訳]
/* 安定ソートが必要なので、ngx_sort() は挿入ソートで実装している */

void
ngx_sort(void *base, size_t n, size_t size,
    ngx_int_t (*cmp)(const void *, const void *))
{
    u_char  *p1, *p2, *p;

    p = ngx_alloc(size, ngx_cycle->log);
    if (p == NULL) {
        return;
    }

    for (p1 = (u_char *) base + size;
         p1 < (u_char *) base + n * size;
         p1 += size)
    {
        ngx_memcpy(p, p1, size);

        for (p2 = p1;
             p2 > (u_char *) base && cmp(p2 - size, p) > 0;
             p2 -= size)
        {
            ngx_memcpy(p2, p2 - size, size);
        }

        ngx_memcpy(p2, p, size);
    }

    ngx_free(p);
}
```

```c:line-numbers=2076 [原文]
/* ngx_sort() is implemented as insertion sort because we need stable sort */

void
ngx_sort(void *base, size_t n, size_t size,
    ngx_int_t (*cmp)(const void *, const void *))
{
    u_char  *p1, *p2, *p;

    p = ngx_alloc(size, ngx_cycle->log);
    if (p == NULL) {
        return;
    }

    for (p1 = (u_char *) base + size;
         p1 < (u_char *) base + n * size;
         p1 += size)
    {
        ngx_memcpy(p, p1, size);

        for (p2 = p1;
             p2 > (u_char *) base && cmp(p2 - size, p) > 0;
             p2 -= size)
        {
            ngx_memcpy(p2, p2 - size, size);
        }

        ngx_memcpy(p2, p, size);
    }

    ngx_free(p);
}
```

:::

## 前提知識

- **`void *`**: 「型の決まっていないポインタ」です。どんな型のデータの場所でも入れられますが、そのままでは中身を読めず、ポインタの足し算もできません。そこで `(u_char *) base` と 1 バイト単位のポインタに変えてから計算しています。
- **関数ポインタ**: `ngx_int_t (*cmp)(const void *, const void *)` は「2 つのポインタを受け取って整数を返す関数」を指すポインタです。`cmp(a, b)` と書けば、渡された関数を呼べます。並べ替えの順番は、この関数が返す値（正なら `a` が後ろ）で決まります。
- **`size` 単位のポインタ移動**: 要素 1 個は `size` バイトなので、`p1 += size` で次の要素へ、`p2 - size` で前の要素へ移動します。
- **`ngx_memcpy`**: 標準の `memcpy` で、メモリを `size` バイトコピーします。
- **`ngx_alloc` / `ngx_free`**: nginx のメモリ確保と解放です（中身は `malloc` と `free`）。
- **挿入ソート**: 左から順に、1 つずつ取り出した要素を「すでに並んだ左側」の正しい位置に差し込んでいく並べ替えです。
- **安定ソート**: 比較で「等しい」とされた要素どうしの、元の並び順を保つソートです。

## 何をしているか

### 1. 要素 1 個ぶんの一時置き場を作る

```c:line-numbers=2084
    p = ngx_alloc(size, ngx_cycle->log);
    if (p == NULL) {
        return;
    }
```

並べ替え中に 1 つの要素を避難させておく場所 `p` を確保します。確保できなければ何もせずに戻ります。

### 2. 2 番目の要素から順に差し込む

```c:line-numbers=2089
    for (p1 = (u_char *) base + size;
         p1 < (u_char *) base + n * size;
         p1 += size)
    {
        ngx_memcpy(p, p1, size);

        for (p2 = p1;
             p2 > (u_char *) base && cmp(p2 - size, p) > 0;
             p2 -= size)
        {
            ngx_memcpy(p2, p2 - size, size);
        }

        ngx_memcpy(p2, p, size);
    }
```

`p1` は「今から差し込む要素」です。2 番目（`base + size`）から最後まで進みます。

- `ngx_memcpy(p, p1, size);`: `p1` の要素を一時置き場 `p` に避難させます。
- 内側の `for (p2 = p1; ...)`: `p2` を左へ動かしながら、左どなりの要素が `p` より **大きい**（`cmp > 0`）あいだ、その要素を 1 つ右へずらします。
- `ngx_memcpy(p2, p, size);`: ずらし終えて空いた位置 `p2` に、避難させておいた要素を書き戻します。

`[3, 1, 2]` で追うと、

- `1` を取り出す → `3` を右へずらす → 先頭に `1` → `[1, 3, 2]`
- `2` を取り出す → `3` を右へずらす → `1` は大きくないので止まる → `[1, 2, 3]`

### 3. 一時置き場を返す

```c:line-numbers=2105
    ngx_free(p);
```

## ここがすごい

- **安定性を `> 0` で守っている**: `p2 > (u_char *) base && cmp(p2 - size, p) > 0;` の条件は `cmp(...) > 0`（左が **大きい** ときだけずらす）で、`>= 0` ではありません。左の要素と等しければそこで止まるので、等しい要素は追い越されず、元の順番が保たれます。ここを `>=` にすると、同じ並べ替えでも安定ではなくなります。
- **なぜクイックソートではないのか**: 標準の `qsort` は速いですが、安定であることが保証されていません。nginx では、設定ファイルに書かれた順番に意味がある場面があります。「同じ扱いのものは、書いた順に並んでいてほしい」という要求があるとき、安定ソートが必要になります。並べる要素はそれほど多くない設定データなので、挿入ソートの「要素数の 2 乗に比例する」遅さは問題になりません。
- **型を知らない汎用性**: 要素の大きさと比較関数だけで動くので、構造体の配列でも整数の配列でも同じ関数で並べられます。C で「ジェネリクス（型を問わないコード）」を実現する、`qsort` と同じ方法です。
- **ずらしてから 1 回で書き戻す**: 隣どうしを入れ替える（swap）方式だと、1 回の移動で 3 回コピーが必要です。この実装は、取り出した要素を一時置き場に置き、他の要素を 1 回ずつずらして、最後に 1 回だけ書き戻すので、コピーの回数が少なくて済みます。

## まとめ

- `void *` と要素の大きさ、比較関数の 3 つがあれば、C でも型を問わない処理が書ける。
- ソートを選ぶときは速さだけでなく「安定かどうか」も条件になる。
- 挿入ソートは「`>` か `>=` か」で安定性が決まる。
- 要素を一時置き場に避難させてからずらすと、入れ替えよりコピーが少ない。
