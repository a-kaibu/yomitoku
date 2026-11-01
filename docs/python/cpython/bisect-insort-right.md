---
title: ソート済みのリストに、位置を探して 1 件挿入する
description: bisect.insort_right は、ソート済みリストの正しい位置を二分探索で見つけ、そこに要素を挿入する。同じ値があれば、その右側に入れるので安定した並びになる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/bisect.py
lines: [4, 18]
function: insort_right
difficulty: 1
format: 2
tags: [ソート, 探索, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`insort_right(a, x)` は、**ソート済みのリスト `a` を崩さずに、`x` を正しい位置へ挿入する** 関数です。
`a = [1, 3, 5]` に `insort_right(a, 4)` を実行すると、`a` は `[1, 3, 4, 5]` になります。
リスト全体を並べ直さず、挿入する場所だけを探すので、大きなリストでも速く動きます。

## コード

::: code-group

```python:line-numbers=4 [日本語訳]
def insort_right(a, x, lo=0, hi=None, *, key=None):
    """リスト a に要素 x を挿入し、a がソート済みなら整列を保つ。

    x がすでに a にあれば、一番右の x の右側に挿入する。

    省略可能な lo（既定値 0）と hi（既定値 len(a)）で、探す範囲を決める。
    探す対象は a の部分（スライス）。

    並び順を変えるために、独自の key 関数を渡せる。
    """
    if key is None:
        lo = bisect_right(a, x, lo, hi)
    else:
        lo = bisect_right(a, key(x), lo, hi, key=key)
    a.insert(lo, x)
```

```python:line-numbers=4 [原文]
def insort_right(a, x, lo=0, hi=None, *, key=None):
    """Insert item x in list a, and keep it sorted assuming a is sorted.

    If x is already in a, insert it to the right of the rightmost x.

    Optional args lo (default 0) and hi (default len(a)) bound the
    slice of a to be searched.

    A custom key function can be supplied to customize the sort order.
    """
    if key is None:
        lo = bisect_right(a, x, lo, hi)
    else:
        lo = bisect_right(a, key(x), lo, hi, key=key)
    a.insert(lo, x)
```

:::

`bisect_right` は、同じファイルにある「挿入位置を探す関数」です。

## 前提知識

- **ソート済みのリスト**: 小さい値から順に並んでいるリストです。この関数は、リストが並んでいることを前提にしています。
- **二分探索**: 真ん中の値と比べて、探す範囲を半分ずつ狭めていく探索です。`bisect_right` はこの方法で位置を探します。
- **`list.insert(i, x)`**: 位置 `i` に `x` を入れます。後ろの要素は 1 つずつずれます。
- **`key` 関数**: 比べる前に値を変換する関数です。`key=str.lower` なら、大文字小文字を無視して比べられます。

## 何をしているか

### 1. 比べる値を決める

```python:line-numbers=14
    if key is None:
        lo = bisect_right(a, x, lo, hi)
    else:
        lo = bisect_right(a, key(x), lo, hi, key=key)
```

`key` がなければ、`x` をそのまま使います。`key` があれば、`key(x)` の値で位置を探します。`lo` と `hi` は、探す範囲を指定する引数です。

### 2. 挿入する位置を探す

`bisect_right` が、`x` を入れるべき位置を返します。同じ値がすでにあれば、その **右側** の位置です。

### 3. 挿入する

```python:line-numbers=18
    a.insert(lo, x)
```

見つけた位置に `x` を入れます。これで `a` はまだソート済みのままです。

## ここがすごい

### 並べ直さずに、位置だけを探す

リストに入れてから `sort()` すると、毎回全体を並べ直すことになります。二分探索なら、比較は `log n` 回で済み、挿入そのものだけが後ろの要素を動かす作業になります。

### 同じ値は右側に入る

同じ値があるとき右側に入れるので、先に入ったものが前に残ります。順番を保ちたい場面で役立ちます。

### `key` で比べ方を選べる

`key` を渡すと、比べる値を変換できます。たとえば、辞書のリストを特定のキーの値で並べたまま、新しい辞書を入れられます。

## まとめ

- ソート済みリストへの挿入は、位置を二分探索で探すと速い。
- 同じ値のとき右側に入れると、先に入ったものが前に残る。
- `key` を使うと、比べ方を変えても同じ仕組みで挿入できる。
