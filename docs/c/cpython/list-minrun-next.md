---
title: "割り切れない長さを「誤差を持ち越して」均等に配る minrun"
description: "Python のソートで、最初に作る短いランの長さを決める関数。リスト長を 2 の累乗個にほぼ均等に分けるため、余りを次回に持ち越す固定小数点の計算をしている。"
language: c
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: "Copyright (c) 2001 Python Software Foundation; All Rights Reserved"
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Objects/listobject.c
lines: [2799, 2808]
function: "minrun_next"
difficulty: 3
format: 2
tags: [アルゴリズム, ソート, ビット演算, 数値計算]
---

## ひとことで

`minrun_next` は、Python の `list.sort()` が「最低でもこの長さのランを作る」という目安（minrun）を、次に使う分だけ返す関数です。
リストの長さ `n` を 2 の累乗個のかたまりに **できるだけ均等に** 分けるため、割り算の余りを捨てずに次回へ持ち越します。たとえば `n = 1000` なら、16 個のかたまりの長さは 62 と 63 が交互に並び、合計がぴったり 1000 になります。

## コード

::: code-group

```c:line-numbers=2799 [日本語訳]
/* 次に使う minrun の値を返す。listsort.txt を参照。 */
Py_LOCAL_INLINE(Py_ssize_t)
minrun_next(MergeState *ms)
{
    ms->mr_current += ms->listlen;
    assert(ms->mr_current >= 0); /* オーバーフローしていない */
    Py_ssize_t result = ms->mr_current >> ms->mr_e;
    ms->mr_current &= ms->mr_mask;
    return result;
}
```

```c:line-numbers=2799 [原文]
/* Return the next minrun value to use. See listsort.txt. */
Py_LOCAL_INLINE(Py_ssize_t)
minrun_next(MergeState *ms)
{
    ms->mr_current += ms->listlen;
    assert(ms->mr_current >= 0); /* no overflow */
    Py_ssize_t result = ms->mr_current >> ms->mr_e;
    ms->mr_current &= ms->mr_mask;
    return result;
}
```

:::

`ms->mr_e` などは、同じファイルの `merge_init` で次のように初期化されます。

```c:line-numbers=2315
    /* State for generating minrun values. See listsort.txt. */
    ms->mr_e = 0;
    while (list_size >> ms->mr_e >= MAX_MINRUN) {
        ++ms->mr_e;
    }
    ms->mr_mask = ((Py_ssize_t)1 << ms->mr_e) - 1;
    ms->mr_current = 0;
```

## 前提知識

- **ランと minrun**: Timsort は、もともと昇順に並んだ区間（ラン）を探して、それらをマージします。ランが短すぎるときは、挿入ソートで最低 minrun 個まで伸ばします。マージの効率がよいのは、ランの数が 2 の累乗に近く、長さがそろっているときです。
- **`>>`（右シフト）**: `x >> e` は `x` を `2^e` で割って切り捨てた値です。`1000 >> 4` は `62` です。
- **`&`（ビットごとの AND）とマスク**: `mask = 2^e - 1` とすると、`x & mask` は `x` を `2^e` で割った余りになります。`1000 & 15` は `8` です。
- **固定小数点**: 小数を整数で表す方法です。ここでは `mr_current` の下位 `e` ビットを「小数部分」として扱っています。
- **`Py_LOCAL_INLINE`**: CPython のマクロで、「このファイルだけで使うインライン関数」を宣言します。
- **`ms->`**: ポインタ `ms` が指す構造体（ソートの状態 `MergeState`）のメンバを読み書きします。

## 何をしているか

### 1. 準備（関数の外）

ソート開始時の `merge_init` で、`mr_e` を「`n >> mr_e` が 64（`MAX_MINRUN`）未満になる最小の数」に設定し、`mr_mask = 2^mr_e - 1`、`mr_current = 0` とします（下の補足）。`n = 1000` なら `1000 >> 4 = 62 < 64` なので `mr_e = 4`、`mr_mask = 15` です。

### 2. 長さを足してから割る

```c:line-numbers=2803
    ms->mr_current += ms->listlen;
    assert(ms->mr_current >= 0); /* no overflow */
    Py_ssize_t result = ms->mr_current >> ms->mr_e;
```
最初に `mr_current` に `n` を足します。次に `mr_current >> mr_e`、つまり `2^mr_e` で割った整数部分を今回の minrun にします。

### 3. 余りだけ残す

```c:line-numbers=2806
    ms->mr_current &= ms->mr_mask;
```
`mr_current &= mr_mask` で、割り切れなかった余りだけを残します。これが次回に持ち越す「端数」です。

### 4. 具体例（n = 1000）

- 1 回目: `0 + 1000 = 1000`。`1000 >> 4 = 62`。余り `1000 & 15 = 8`。
- 2 回目: `8 + 1000 = 1008`。`1008 >> 4 = 63`。余り `0`。
- 3 回目: `0 + 1000` で再び 62、余り 8。

62 と 63 が交互に出て、16 回分の合計は `8 × 62 + 8 × 63 = 1000` になります。`1000 / 16 = 62.5` という本当の値を、端数を持ち越すことで正確に再現しているのです。

## ここがすごい

- **端数を捨てない**: 毎回 `n / 16` を切り捨てて使うと、62 × 16 = 992 となり、最後に 8 要素の半端なランが残ります。長さがそろわないとマージの効率が落ちます。端数を持ち越すと、ランがすべて minrun ちょうどの長さで作られた場合でも、全部が 62 か 63 になり、ちょうど 16 個で終わります（自然なランが長ければ、そのぶん個数は減ります）。
- **割り算を使わない**: `2^e` で割る処理はシフトと AND だけで済みます。ソートのたびに何度も呼ばれる関数なので、軽いことが大切です。
- **画面に線を引く技と同じ発想**: 「誤差を累積して、整数部分があふれたら 1 増やす」という考え方は、ディスプレイに斜めの線を引くブレゼンハムのアルゴリズムと同じです。
- **オーバーフロー対策**: `assert(ms->mr_current >= 0)` は、足し算で値があふれていないことを確かめています。`mr_current` は常に `2^e` 未満に戻されるので、`n` を足しても安全です。

## まとめ

- minrun は、リスト長を 2 の累乗個にほぼ均等に分けた長さ。
- 割り算の余りを次回に持ち越せば、切り捨ての誤差がたまらず、合計がぴったり合う。
- 2 の累乗での割り算と余りは、シフト `>>` とマスク `&` で計算できる。
- 小さな関数でも、端数の扱い方ひとつでアルゴリズム全体の効率が変わる。
