---
title: 同じ値が並ぶとき、最も左の挿入位置を二分探索で求める
description: bisect.bisect_left は、並べ替え済みの列に要素を入れるとき、同じ値より前に入る位置を返す。範囲を半分ずつ狭める二分探索で、毎回の比較の回数を対数に抑える。bisect_right と対になる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/bisect.py
lines: [74, 107]
function: bisect_left
difficulty: 2
format: 2
tags: [探索, アルゴリズム]
---

## ひとことで

`bisect_left(a, x)` は、**並べ替え済みの列 `a` に `x` を入れるとき、同じ値の中で最も左に入る位置** を返す関数です。
`bisect_left([1, 2, 2, 3], 2)` は `1` を返します。2 が並ぶ前に入る位置です。

## コード

::: code-group

```python:line-numbers=74 [日本語訳]
def bisect_left(a, x, lo=0, hi=None, *, key=None):
    """並べ替え済みの列 a に、要素 x を入れる位置（インデックス）を返す。

    戻り値 i は、a[:i] のすべての e が x より小さく、
    a[i:] のすべての e が x 以上になる位置である。x が既にあれば、a.insert(i, x) は
    既にある一番左の x の直前に入る。

    省略できる引数 lo（既定値は 0）と hi（既定値は len(a)）は、探す範囲を決める。
    探す範囲は a の部分列になる。

    並べ替えの順序を変えるために、key 関数を渡せる。
    """

    if lo < 0:
        raise ValueError('lo must be non-negative')
    if hi is None:
        hi = len(a)
    # 比較には "<" を使う。list.sort() と heapq の
    # __lt__() の動きに合わせるためである。
    if key is None:
        while lo < hi:
            mid = (lo + hi) // 2
            if a[mid] < x:
                lo = mid + 1
            else:
                hi = mid
    else:
        while lo < hi:
            mid = (lo + hi) // 2
            if key(a[mid]) < x:
                lo = mid + 1
            else:
                hi = mid
    return lo
```

```python:line-numbers=74 [原文]
def bisect_left(a, x, lo=0, hi=None, *, key=None):
    """Return the index where to insert item x in list a, assuming a is sorted.

    The return value i is such that all e in a[:i] have e < x, and all e in
    a[i:] have e >= x.  So if x already appears in the list, a.insert(i, x) will
    insert just before the leftmost x already there.

    Optional args lo (default 0) and hi (default len(a)) bound the
    slice of a to be searched.

    A custom key function can be supplied to customize the sort order.
    """

    if lo < 0:
        raise ValueError('lo must be non-negative')
    if hi is None:
        hi = len(a)
    # Note, the comparison uses "<" to match the
    # __lt__() logic in list.sort() and in heapq.
    if key is None:
        while lo < hi:
            mid = (lo + hi) // 2
            if a[mid] < x:
                lo = mid + 1
            else:
                hi = mid
    else:
        while lo < hi:
            mid = (lo + hi) // 2
            if key(a[mid]) < x:
                lo = mid + 1
            else:
                hi = mid
    return lo
```

:::

## 前提知識

- **並べ替え済みの列**: 小さい順に並んでいる列です。二分探索は、この前提の上で動きます。
- **二分探索**: 範囲の真ん中を調べ、答えがどちら側にあるかで範囲を半分にする探し方です。
- **`bisect_right`**: 同じ値の後ろに入る位置を返す、対になる関数です。
- **`key` 関数**: 比べる前に、要素を変換する関数です。

## 何をしているか

### 1. 範囲の始まりと終わりを決める

```python:line-numbers=87
    if lo < 0:
        raise ValueError('lo must be non-negative')
    if hi is None:
        hi = len(a)
```

`lo` が負なら、例外で止めます。`hi` を省略されたら、列の長さにします。これで、探す範囲は `[lo, hi)` になります。

### 2. 真ん中を比べて、範囲を半分にする

```python:line-numbers=93
    if key is None:
        while lo < hi:
            mid = (lo + hi) // 2
            if a[mid] < x:
                lo = mid + 1
            else:
                hi = mid
```

範囲の真ん中 `mid` の値を、`x` と比べます。`a[mid] < x` なら、答えは `mid` より後ろにあるので `lo` を動かします。そうでなければ、`mid` を含めた前側に答えがあるので、`hi` を `mid` にします。

### 3. key がある場合も、同じ手順で探す

```python:line-numbers=100
    else:
        while lo < hi:
            mid = (lo + hi) // 2
            if key(a[mid]) < x:
                lo = mid + 1
            else:
                hi = mid
    return lo
```

`key` が指定されていれば、比べる前に `key(a[mid])` で変換します。最後に、範囲が空になった `lo` が答えです。

## ここがすごい

### 比べる回数が対数に抑えられる

範囲を半分ずつ狭めるので、100 万個の列でも、約 20 回の比較で答えが出ます。一つずつ調べるより、ずっと速く動きます。

### `<` だけで位置が決まる

答えは「`x` より小さい要素の数」として決まります。比べ方が `<` だけなので、並べ替えに使われる比べ方と合わせられます。

### 同じ値の左端を選ぶ

`bisect_right` が右端を返すのに対し、この関数は左端を返します。`insert` で同じ値の前に入れたいときや、同じ値の個数を数えるときに、この違いが役立ちます。

## まとめ

- 並べ替え済みの列では、二分探索で挿入位置を対数回の比較で求められる。
- `<` だけで比べるので、並べ替えの規則と合う。
- 同じ値の左端を返すので、`bisect_right` と使い分けられる。
