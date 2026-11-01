---
title: 全部並べ替えず、大きい値を 1 つ押し出しながら小さい n 個を残す
description: heapq.nsmallest は、データの中から小さいほうから n 個を取り出す。n 個だけを覚えた最大ヒープを使い、それより小さい値が来たら一番大きい値と入れ替える。全体を並べ替えるより速い。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/heapq.py
lines: [477, 535]
function: nsmallest
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, ソート, 最適化]
---

## ひとことで

`nsmallest(n, iterable)` は、**データの中から小さいほうから n 個** を取り出す関数です。
`nsmallest(2, [5, 1, 4, 2])` は `[1, 2]` を返します。全部を並べ替えてから先頭を取るより、速く答えを出せます。

## コード

::: code-group

```python:line-numbers=477 [日本語訳]
def nsmallest(n, iterable, key=None):
    """データの中から、小さいほうから n 個の要素を見つける。

    Equivalent to:  sorted(iterable, key=key)[:n]
    """

    # n == 1 の近道は min() を使うこと
    if n == 1:
        it = iter(iterable)
        sentinel = object()
        result = min(it, default=sentinel, key=key)
        return [] if result is sentinel else [result]

    # n が要素数以上なら、sorted() を使うほうが速い
    try:
        size = len(iterable)
    except (TypeError, AttributeError):
        pass
    else:
        if n >= size:
            return sorted(iterable, key=key)

    # key がないときは、より単純な飾り付けを使う
    if key is None:
        it = iter(iterable)
        # range(n) を先に書き、zip() が余分な要素を消費しないようにする
        # （zip() はイテレータから n 個だけを取る）
        result = [(elem, i) for i, elem in zip(range(n), it)]
        if not result:
            return result
        heapify_max(result)
        top = result[0][0]
        order = n
        _heapreplace = heapreplace_max
        for elem in it:
            if elem < top:
                _heapreplace(result, (elem, order))
                top = result[0][0]
                order += 1
        result.sort()
        return [elem for (elem, order) in result]

    # 一般的な場合。最も遅い方法
    it = iter(iterable)
    result = [(key(elem), i, elem) for i, elem in zip(range(n), it)]
    if not result:
        return result
    heapify_max(result)
    top = result[0][0]
    order = n
    _heapreplace = heapreplace_max
    for elem in it:
        k = key(elem)
        if k < top:
            _heapreplace(result, (k, order, elem))
            top = result[0][0]
            order += 1
    result.sort()
    return [elem for (k, order, elem) in result]
```

```python:line-numbers=477 [原文]
def nsmallest(n, iterable, key=None):
    """Find the n smallest elements in a dataset.

    Equivalent to:  sorted(iterable, key=key)[:n]
    """

    # Short-cut for n==1 is to use min()
    if n == 1:
        it = iter(iterable)
        sentinel = object()
        result = min(it, default=sentinel, key=key)
        return [] if result is sentinel else [result]

    # When n>=size, it's faster to use sorted()
    try:
        size = len(iterable)
    except (TypeError, AttributeError):
        pass
    else:
        if n >= size:
            return sorted(iterable, key=key)

    # When key is none, use simpler decoration
    if key is None:
        it = iter(iterable)
        # put the range(n) first so that zip() doesn't
        # consume one too many elements from the iterator
        result = [(elem, i) for i, elem in zip(range(n), it)]
        if not result:
            return result
        heapify_max(result)
        top = result[0][0]
        order = n
        _heapreplace = heapreplace_max
        for elem in it:
            if elem < top:
                _heapreplace(result, (elem, order))
                top = result[0][0]
                order += 1
        result.sort()
        return [elem for (elem, order) in result]

    # General case, slowest method
    it = iter(iterable)
    result = [(key(elem), i, elem) for i, elem in zip(range(n), it)]
    if not result:
        return result
    heapify_max(result)
    top = result[0][0]
    order = n
    _heapreplace = heapreplace_max
    for elem in it:
        k = key(elem)
        if k < top:
            _heapreplace(result, (k, order, elem))
            top = result[0][0]
            order += 1
    result.sort()
    return [elem for (k, order, elem) in result]
```

:::

`heapify_max`、`heapreplace_max` は、最大ヒープ（先頭が一番大きい値になる配列）を作ったり更新したりする関数です。

## 前提知識

- **最大ヒープ**: 先頭に一番大きい値が来る配列です。`nsmallest` では、今残している n 個の中で一番大きいものを、すぐ取り出せるようにするために使います。
- **`heapreplace_max`**: 先頭の一番大きい値を、新しい値で置き換えます。その後、ヒープの性質を直します。
- **`sorted(x)[:n]`**: 並べてから先頭を取る方法です。docstring では、これと同じ結果だと書かれています。
- **`min(it, default=...)`**: 一番小さい値を返します。空のときは `default` を返します。

## 何をしているか

### 1. n が 1 のときは `min` を使う

```python:line-numbers=484
    if n == 1:
        it = iter(iterable)
        sentinel = object()
        result = min(it, default=sentinel, key=key)
        return [] if result is sentinel else [result]
```

1 個だけ欲しいなら、`min` で十分です。空のときに備えて、番兵（`sentinel`）を既定値にしています。

### 2. n が要素数以上なら、並べる

```python:line-numbers=490
    # n が要素数以上なら、sorted() を使うほうが速い
    try:
        size = len(iterable)
    except (TypeError, AttributeError):
        pass
    else:
        if n >= size:
            return sorted(iterable, key=key)
```

要素数より多く欲しいなら、全部を並べるのが一番簡単です。`len` が使えるときだけ、この判定をします。

### 3. 最初の n 個を最大ヒープに入れる

```python:line-numbers=499
    # key がないときは、より単純な飾り付けを使う
    if key is None:
        it = iter(iterable)
        # range(n) を先に書き、zip() が余分な要素を消費しないようにする
        # （zip() はイテレータから n 個だけを取る）
        result = [(elem, i) for i, elem in zip(range(n), it)]
        if not result:
            return result
        heapify_max(result)
        top = result[0][0]
        order = n
        _heapreplace = heapreplace_max
```

`(要素, 番号)` の組を、最初の n 個から作ります。`heapify_max` で、一番大きいものが先頭に来るようにします。`top` が、今残している中で一番大きい値です。

### 4. 残りの要素と比べて、入れ替える

```python:line-numbers=511
        for elem in it:
            if elem < top:
                _heapreplace(result, (elem, order))
                top = result[0][0]
                order += 1
```

新しい要素が `top` より小さければ、先頭の一番大きい値を、その新しい要素と入れ替えます。大きいものが押し出されて、小さい値だけが残ります。

### 5. 残った n 個を並べて返す

```python:line-numbers=516
        result.sort()
        return [elem for (elem, order) in result]
```

最後に、残った n 個を並べ直して、要素だけを返します。

## ここがすごい

### 全体を並べなくてよい

要素が 100 万個あって、小さい 10 個だけ欲しいとき、全体を並べると大量の比較が必要です。この方法では、n 個分のヒープを維持するだけで、大きい値を押し出し続けます。

### 番号で同点を区別する

組に番号 `order` を入れているので、値が同じ要素どうしでも、番号で順番が決まります。そのため、要素そのものを比べる必要がなくなり、結果の並びも安定します。

### 場合を分けて速くする

`n == 1` のときは `min`、要素数より多いときは `sorted`、`key` がないときは単純な形、と場合を分けています。それぞれの場合で、一番速い方法を選んでいます。

## まとめ

- 小さい n 個だけなら、n 個を覚える最大ヒープで十分。
- 大きい値を押し出す形にすると、全体を並べ替える必要がなくなる。
- 場合ごとに速い方法を選ぶと、同じ関数でも速さを保てる。
