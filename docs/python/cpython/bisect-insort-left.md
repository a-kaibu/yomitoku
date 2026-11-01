---
title: 並べ替え済みの列に、同じ値の左側を選んで要素を入れる
description: bisect.insort_left は、並べ替え済みの列に要素 x を入れ、列の並びを保つ。挿入位置を bisect_left で求め、そこに insert する。同じ値が既にあれば、その一番左の前に入る。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/bisect.py
lines: [57, 72]
function: insort_left
difficulty: 2
format: 2
tags: [探索, データ構造, アルゴリズム]
---

## ひとことで

`insort_left(a, x)` は、**並べ替え済みの列 `a` に `x` を入れて、並びを保つ** 関数です。
`a = [1, 2, 3]` に `insort_left(a, 2)` を実行すると、`a` は `[1, 2, 2, 3]` になります。

## コード

::: code-group

```python:line-numbers=57 [日本語訳]
def insort_left(a, x, lo=0, hi=None, *, key=None):
    """並べ替え済みの列 a を保ったまま、要素 x を入れる。

    x が既に a にあれば、一番左の x の左側に入れる。

    省略できる引数 lo（既定値は 0）と hi（既定値は len(a)）は、探す範囲を決める。
    探す範囲は a の部分列になる。

    並べ替えの順序を変えるために、key 関数を渡せる。
    """

    if key is None:
        lo = bisect_left(a, x, lo, hi)
    else:
        lo = bisect_left(a, key(x), lo, hi, key=key)
    a.insert(lo, x)
```

```python:line-numbers=57 [原文]
def insort_left(a, x, lo=0, hi=None, *, key=None):
    """Insert item x in list a, and keep it sorted assuming a is sorted.

    If x is already in a, insert it to the left of the leftmost x.

    Optional args lo (default 0) and hi (default len(a)) bound the
    slice of a to be searched.

    A custom key function can be supplied to customize the sort order.
    """

    if key is None:
        lo = bisect_left(a, x, lo, hi)
    else:
        lo = bisect_left(a, key(x), lo, hi, key=key)
    a.insert(lo, x)
```

:::

## 前提知識

- **並べ替え済みの列**: 小さい順に並んでいる列です。
- **`bisect_left`**: 挿入すべき位置を、二分探索で求める関数です。同じ値の左端を返します。
- **`list.insert`**: 指定した位置に要素を入れるメソッドです。後ろの要素が 1 つずつずれます。

## 何をしているか

### 1. 挿入位置を求める

```python:line-numbers=68
    if key is None:
        lo = bisect_left(a, x, lo, hi)
```

`key` がなければ、`bisect_left` で `x` を入れる位置を求めます。`lo` と `hi` は、探す範囲を狭めるために渡されます。

```python:line-numbers=70
    else:
        lo = bisect_left(a, key(x), lo, hi, key=key)
```

`key` があれば、`key(x)` の値で比べる位置を求めます。並べ替えの規則と、同じ規則で探すための分岐です。

### 2. その位置に入れる

```python:line-numbers=72
    a.insert(lo, x)
```

求めた位置 `lo` に `insert` します。並びは崩れず、同じ値が並ぶときは、一番左の前に入ります。

## ここがすごい

### 探す部分と入れる部分を分けている

位置を求める処理を `bisect_left` に任せ、この関数は `insert` だけを行います。部品の役割がはっきり分かれています。

### 同じ値は左側に入る

`bisect_left` を使うので、同じ値があれば、その一番左の前に入ります。並びの安定性を、どう保つかが決まっています。

### 挿入は後ろの要素をずらす

`insert` は、後ろの要素を 1 つずつ動かします。探す回数は少なくても、大きな列への挿入は、後ろの要素の数に比例した時間がかかります。

## まとめ

- 並べ替え済みの列への挿入は、二分探索で位置を求めてから `insert` すると簡単にできる。
- 同じ値の左側に入るので、`insort_right` とは結果が違う。
- 大きな列では、後ろの要素を動かす時間が効いてくる。
