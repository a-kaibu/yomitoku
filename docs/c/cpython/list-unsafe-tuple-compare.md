---
title: "タプルのソートで「最初の要素」だけを特別扱いする比較関数"
description: "Python のソートでタプルのリストを並べるときの専用比較関数。等しくない最初の位置を探し、その位置が先頭なら先頭要素用の高速比較を使う。"
language: c
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: "Copyright (c) 2001 Python Software Foundation; All Rights Reserved"
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Objects/listobject.c
lines: [2957, 2991]
function: "unsafe_tuple_compare"
difficulty: 2
format: 2
tags: [ソート, 最適化, 標準ライブラリ]
---

## ひとことで

`unsafe_tuple_compare` は、`[(3, "c"), (1, "a"), (2, "b")]` のような **タプルのリスト** を `list.sort()` で並べるときに使われる比較関数です。`v < w` なら 1、そうでなければ 0、エラーなら -1 を返します。
タプルの比較は「先頭から順に比べ、最初に違った要素で決める」というルールです。多くの場合は先頭要素だけで決まるので、**先頭要素の比較には、事前に選んでおいた高速な比較関数** を使います。

## コード

::: code-group

```c:line-numbers=2957 [日本語訳]
static int
unsafe_tuple_compare(PyObject *v, PyObject *w, MergeState *ms)
{
    PyTupleObject *vt, *wt;
    Py_ssize_t i, vlen, wlen;
    int k;

    /* Objects/tupleobject.c の tuplerichcompare を、次の前提で改変したもの: */
    assert(Py_IS_TYPE(v, &PyTuple_Type));
    assert(Py_IS_TYPE(w, &PyTuple_Type));
    assert(Py_SIZE(v) > 0);
    assert(Py_SIZE(w) > 0);

    vt = (PyTupleObject *)v;
    wt = (PyTupleObject *)w;

    vlen = Py_SIZE(vt);
    wlen = Py_SIZE(wt);

    for (i = 0; i < vlen && i < wlen; i++) {
        k = PyObject_RichCompareBool(vt->ob_item[i], wt->ob_item[i], Py_EQ);
        if (k < 0)
            return -1;
        if (!k)
            break;
    }

    if (i >= vlen || i >= wlen)
        return vlen < wlen;

    if (i == 0)
        return ms->tuple_elem_compare(vt->ob_item[i], wt->ob_item[i], ms);
    else
        return PyObject_RichCompareBool(vt->ob_item[i], wt->ob_item[i], Py_LT);
}
```

```c:line-numbers=2957 [原文]
static int
unsafe_tuple_compare(PyObject *v, PyObject *w, MergeState *ms)
{
    PyTupleObject *vt, *wt;
    Py_ssize_t i, vlen, wlen;
    int k;

    /* Modified from Objects/tupleobject.c:tuplerichcompare, assuming: */
    assert(Py_IS_TYPE(v, &PyTuple_Type));
    assert(Py_IS_TYPE(w, &PyTuple_Type));
    assert(Py_SIZE(v) > 0);
    assert(Py_SIZE(w) > 0);

    vt = (PyTupleObject *)v;
    wt = (PyTupleObject *)w;

    vlen = Py_SIZE(vt);
    wlen = Py_SIZE(wt);

    for (i = 0; i < vlen && i < wlen; i++) {
        k = PyObject_RichCompareBool(vt->ob_item[i], wt->ob_item[i], Py_EQ);
        if (k < 0)
            return -1;
        if (!k)
            break;
    }

    if (i >= vlen || i >= wlen)
        return vlen < wlen;

    if (i == 0)
        return ms->tuple_elem_compare(vt->ob_item[i], wt->ob_item[i], ms);
    else
        return PyObject_RichCompareBool(vt->ob_item[i], wt->ob_item[i], Py_LT);
}
```

:::

## 前提知識

- **タプルの大小比較**: Python では `(1, 9) < (2, 0)` は真です。先頭の `1` と `2` で決まり、2 番目は見ません。先頭が同じなら 2 番目、さらに同じなら 3 番目…と比べます。全部同じなら、短いほうが小さくなります（`(1, 2) < (1, 2, 3)`）。
- **`PyObject_RichCompareBool(a, b, op)`**: CPython の汎用比較関数です。`op` に `Py_EQ`（等しい）や `Py_LT`（小なり）を指定し、真なら 1、偽なら 0、例外なら -1 を返します。
- **`Py_SIZE`**: タプルの要素数を返すマクロです。
- **`vt->ob_item[i]`**: タプル構造体の中にある要素の配列から、`i` 番目を取り出します。`->` はポインタが指す構造体のメンバを読む演算子です。
- **キャスト `(PyTupleObject *)v`**: 汎用のオブジェクトへのポインタを、タプル専用の構造体へのポインタとして扱い直します。
- **関数ポインタ**: 関数のアドレスを変数に入れて、あとから呼び出す仕組みです。`ms->tuple_elem_compare(...)` は、ソート開始時に選ばれた比較関数を呼び出しています。

## 何をしているか

### 1. 前提とキャスト

```c:line-numbers=2966
    assert(Py_IS_TYPE(w, &PyTuple_Type));
    assert(Py_SIZE(v) > 0);
    assert(Py_SIZE(w) > 0);

    vt = (PyTupleObject *)v;
    wt = (PyTupleObject *)w;

    vlen = Py_SIZE(vt);
    wlen = Py_SIZE(wt);
```
`assert` で、両方がタプルで、要素が 1 個以上あることを確かめます。そのうえでタプルとして扱い、要素数 `vlen`、`wlen` を取り出します。

### 2. 等しくない最初の位置を探す

```c:line-numbers=2976
    for (i = 0; i < vlen && i < wlen; i++) {
        k = PyObject_RichCompareBool(vt->ob_item[i], wt->ob_item[i], Py_EQ);
        if (k < 0)
            return -1;
        if (!k)
            break;
    }
```
先頭から順に `Py_EQ` で「等しいか」を調べます。等しくない位置が見つかればそこで `break` します。比較で例外が起きれば `-1` を返します。

### 3. どちらかが尽きた場合

```c:line-numbers=2984
    if (i >= vlen || i >= wlen)
        return vlen < wlen;
```
ループが最後まで回り、一方（または両方）の要素がなくなったら、共通部分はすべて等しかったということです。このときは短いほうが小さいので、`vlen < wlen` を返します。

### 4. 違った位置で大小を決める

```c:line-numbers=2987
    if (i == 0)
        return ms->tuple_elem_compare(vt->ob_item[i], wt->ob_item[i], ms);
    else
        return PyObject_RichCompareBool(vt->ob_item[i], wt->ob_item[i], Py_LT);
```
- 違った位置が先頭（`i == 0`）なら、`ms->tuple_elem_compare` を使います。ソート開始時に、全タプルの先頭要素の型を調べて選んだ比較関数です。たとえば先頭要素がすべて小さな整数なら、整数専用の高速な比較になります。
- 2 番目以降なら、汎用の `PyObject_RichCompareBool(..., Py_LT)` で比べます。

### 具体例

`v = (2, "b")`、`w = (2, "z")` の場合、位置 0 の `2 == 2` は等しいので続行し、位置 1 で `"b"` と `"z"` が違うので止まります。`i == 1` なので汎用比較で `"b" < "z"` を調べ、1 を返します。
`v = (1, "a")`、`w = (3, "c")` なら、位置 0 ですぐ違いがわかり、先頭用の高速比較で `1 < 3` を調べます。

## ここがすごい

- **2 段階の最適化**: `list.sort` は「全要素がタプルか」を調べたうえで、さらに「全タプルの先頭要素が同じ型か」も調べます。これで、タプルの比較そのものと、先頭要素どうしの比較の両方が高速化されます（ソースのコメントでは「2 段階で比較を最適化する」と説明されています）。
- **よくある場合に合わせる**: タプルの比較はほとんどが先頭要素だけで決まる、という経験則に基づいています。2 番目以降まで進むのは先頭が等しいときだけなので、そこは汎用比較に任せても全体への影響は小さいのです。
- **等しさの判定は汎用のまま**: 等しさを調べる `Py_EQ` の比較は高速版になっていません。高速版の比較関数は「小なり」専用だからです。役割を割り切ることで、コードが単純に保たれています。
- **元の比較と同じ意味**: コメントにある通り、この関数は `tuplerichcompare`（タプルの通常の比較）を、前提を仮定して短くしたものです。結果は通常の比較と一致します。

## まとめ

- タプルの大小は「最初に違う要素」で決まり、共通部分が同じなら短いほうが小さい。
- ソート前に先頭要素の型をそろって調べておけば、先頭の比較を専用関数に任せられる。
- よく通る道（先頭で決まる場合）だけを速くし、まれな道は汎用処理に任せる。
- 関数ポインタを使うと、実行時に最適な比較方法を選んで差し替えられる。
