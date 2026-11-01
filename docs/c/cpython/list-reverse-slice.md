---
title: "両端から歩み寄るだけでリストを逆順にする"
description: "リストの一部をその場で逆順に並べ替える CPython の関数。2 本のポインタを両端から近づけながら要素を交換する、シンプルで無駄のない書き方。"
language: c
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: "Copyright (c) 2001 Python Software Foundation; All Rights Reserved"
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Objects/listobject.c
lines: [1673, 1687]
function: "reverse_slice"
difficulty: 1
format: 2
tags: [アルゴリズム, データ構造, イディオム]
---

## ひとことで

`reverse_slice` は、配列の `lo` から `hi` の手前までを **その場で（新しい配列を作らずに）逆順** にする関数です。Python の `list.reverse()` や、ソートの途中で「下り坂の並び」を上り坂に直すときに使われます。
たとえば `[1, 2, 3, 4, 5]` 全体に使うと `[5, 4, 3, 2, 1]` になります。

## コード

::: code-group

```c:line-numbers=1673 [日本語訳]
/* リストのスライスを lo から hi の手前（hi は含まない）までその場で逆順にする。 */
static void
reverse_slice(PyObject **lo, PyObject **hi)
{
    assert(lo && hi);

    --hi;
    while (lo < hi) {
        PyObject *t = *lo;
        FT_ATOMIC_STORE_PTR_RELEASE(*lo, *hi);
        FT_ATOMIC_STORE_PTR_RELEASE(*hi, t);
        ++lo;
        --hi;
    }
}
```

```c:line-numbers=1673 [原文]
/* Reverse a slice of a list in place, from lo up to (exclusive) hi. */
static void
reverse_slice(PyObject **lo, PyObject **hi)
{
    assert(lo && hi);

    --hi;
    while (lo < hi) {
        PyObject *t = *lo;
        FT_ATOMIC_STORE_PTR_RELEASE(*lo, *hi);
        FT_ATOMIC_STORE_PTR_RELEASE(*hi, t);
        ++lo;
        --hi;
    }
}
```

:::

## 前提知識

- **ポインタ**: メモリ上の場所（アドレス）を指す値です。`PyObject **lo` は「`PyObject *`（Python オブジェクトへのポインタ）が並んだ配列の中の、ある位置を指すポインタ」です。
- **`*lo`**: ポインタが指す場所の中身を読み書きする書き方です。ここでは配列の 1 要素（オブジェクトへのポインタ）を取り出します。
- **`++lo` と `--hi`**: ポインタを 1 要素ぶん後ろ・前へ動かします。配列の添字を 1 増やす・減らすのと同じ意味です。
- **ポインタどうしの比較 `lo < hi`**: 同じ配列の中を指すポインタは、どちらが前にあるかを比べられます。
- **半開区間**: 「`lo` から `hi` の手前まで」という範囲の取り方です。`hi` 自身は含みません。Python のスライス `a[lo:hi]` と同じ考え方です。
- **`assert`**: 条件が成り立たなければプログラムを止める、開発用のチェックです。
- **`FT_ATOMIC_STORE_PTR_RELEASE`**: CPython のマクロです。GIL（グローバルインタプリタロック）を無効にしたビルドでは、ほかのスレッドから読まれても壊れた値が見えないように書き込みます。通常のビルドではふつうの代入 `*lo = *hi` と同じです。

## 何をしているか

### 1. 範囲の右端を「最後の要素」に合わせる

```c:line-numbers=1679
    --hi;
```
`hi` は範囲の **1 つ外** を指しています。そのままでは最後の要素ではないので、`--hi` で 1 つ前に戻し、最後の要素を指すようにします。

### 2. 両端を交換しながら近づく

```c:line-numbers=1680
    while (lo < hi) {
        PyObject *t = *lo;
        FT_ATOMIC_STORE_PTR_RELEASE(*lo, *hi);
        FT_ATOMIC_STORE_PTR_RELEASE(*hi, t);
        ++lo;
        --hi;
    }
```
`while (lo < hi)` の間、次のことを繰り返します。

1. 左端の値を一時変数 `t` に退避する。
2. 左端に右端の値を書く。
3. 右端に退避しておいた値を書く。
4. 左は右へ、右は左へ 1 つ進む。

`[1, 2, 3, 4, 5]` で追ってみます。最初は `lo` が `1`、`hi` が `5` を指します。

- 1 回目: `1` と `5` を交換 → `[5, 2, 3, 4, 1]`
- 2 回目: `2` と `4` を交換 → `[5, 4, 3, 2, 1]`
- 3 回目の前: `lo` と `hi` がどちらも `3` を指すので `lo < hi` が偽になり、終了。

真ん中の `3` は動かす必要がないので、要素数 5 なら交換は 2 回だけです。要素数が偶数の `[1, 2, 3, 4]` なら、2 回交換したあと `lo` が `hi` を追い越して終わります。

## ここがすごい

- **追加メモリがいらない**: 新しいリストを作って逆から詰め直す方法だと、要素数ぶんのメモリが余分に必要です。この関数は一時変数 1 個だけで済みます。
- **ループ回数は半分**: 交換 1 回で 2 要素が正しい位置に入るので、n 要素に対して交換は n/2 回です。
- **参照カウントに触れない**: CPython のオブジェクトは「何か所から参照されているか」を数えています（参照カウント）。この関数は配列の中でポインタを入れ替えるだけで、参照の数は変わりません。そのため `Py_INCREF` や `Py_DECREF` を呼ぶ必要がなく、とても軽い処理になっています。
- **添字ではなくポインタで書く**: `a[i]` と `a[n-1-i]` を使う書き方もできますが、ポインタを直接動かすと添字の計算が要らず、ループ条件も `lo < hi` と直感的です。
- **再利用しやすい形**: 引数が「始まりと終わりのポインタ」だけなので、リスト全体の反転にも、ソート中の部分的な反転（`sortslice_reverse`）にも、そのまま使い回されています。

## まとめ

- 配列の逆順は、両端から交換しながら中央へ近づけば、その場で実現できる。
- 半開区間の右端は、`--hi` で 1 つ戻してから使う。
- 交換回数は要素数の半分で、追加メモリは一時変数 1 個だけ。
- ポインタの入れ替えだけなら参照カウントの調整も要らない。
