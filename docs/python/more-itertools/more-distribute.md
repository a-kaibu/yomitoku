---
title: 1 本の列を、順番に配りながら n 本のイテレータに分ける
description: more_itertools.distribute は、1 つのイテラブルの要素を、n 個の小さいイテレータに交互に振り分ける。itertools.tee で元の列を複製し、islice で n 個おきに取り出している。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [1865, 1899]
function: distribute
difficulty: 2
format: 2
tags: [イテレータ, アルゴリズム, 遅延評価]
---

## ひとことで

`distribute(n, iterable)` は、**1 つの列の要素を、`n` 本の列に順番に配る** 関数です。
`distribute(2, [1, 2, 3, 4, 5, 6])` は、`[1, 3, 5]` と `[2, 4, 6]` の 2 本を返します。

## コード

::: code-group

```python:line-numbers=1865 [日本語訳]
def distribute(n, iterable):
    """*iterable* の要素を、*n* 個の小さいイテラブルに振り分ける。

        >>> group_1, group_2 = distribute(2, [1, 2, 3, 4, 5, 6])
        >>> list(group_1)
        [1, 3, 5]
        >>> list(group_2)
        [2, 4, 6]

    If the length of *iterable* is not evenly divisible by *n*, then the
    length of the returned iterables will not be identical:

        >>> children = distribute(3, [1, 2, 3, 4, 5, 6, 7])
        >>> [list(c) for c in children]
        [[1, 4, 7], [2, 5], [3, 6]]

    If the length of *iterable* is smaller than *n*, then the last returned
    iterables will be empty:

        >>> children = distribute(5, [1, 2, 3])
        >>> [list(c) for c in children]
        [[1], [2], [3], [], []]

    This function uses :func:`itertools.tee` and may require significant
    storage.

    If you need the order items in the smaller iterables to match the
    original iterable, see :func:`divide`.

    """
    if n < 1:
        raise ValueError('n must be at least 1')

    children = tee(iterable, n)
    return [islice(it, index, None, n) for index, it in enumerate(children)]
```

```python:line-numbers=1865 [原文]
def distribute(n, iterable):
    """Distribute the items from *iterable* among *n* smaller iterables.

        >>> group_1, group_2 = distribute(2, [1, 2, 3, 4, 5, 6])
        >>> list(group_1)
        [1, 3, 5]
        >>> list(group_2)
        [2, 4, 6]

    If the length of *iterable* is not evenly divisible by *n*, then the
    length of the returned iterables will not be identical:

        >>> children = distribute(3, [1, 2, 3, 4, 5, 6, 7])
        >>> [list(c) for c in children]
        [[1, 4, 7], [2, 5], [3, 6]]

    If the length of *iterable* is smaller than *n*, then the last returned
    iterables will be empty:

        >>> children = distribute(5, [1, 2, 3])
        >>> [list(c) for c in children]
        [[1], [2], [3], [], []]

    This function uses :func:`itertools.tee` and may require significant
    storage.

    If you need the order items in the smaller iterables to match the
    original iterable, see :func:`divide`.

    """
    if n < 1:
        raise ValueError('n must be at least 1')

    children = tee(iterable, n)
    return [islice(it, index, None, n) for index, it in enumerate(children)]
```

:::

`tee` は、1 つのイテレータを複数の独立したイテレータに複製する、`itertools` の関数です。`islice` は、先頭から数えて一部を取り出す関数です。

## 前提知識

- **イテレータは 1 回しか読めない**: 読んだ要素は、同じイテレータからはもう出てきません。そのため、複数の列に配るには、複製が必要です。
- **`tee(it, n)`**: `it` を `n` 個の独立したイテレータに複製します。どれか 1 つを先に読むと、他のものは読んだ分を内部に溜めます。
- **`islice(it, start, None, step)`**: `start` 番目から、`step` 個おきに取り出すイテレータです。
- **`enumerate`**: 要素と番号の組を作ります。ここでは、どの列か（番号）を取るために使います。

## 何をしているか

### 1. 0 本以下なら、エラーにする

```python:line-numbers=1895
    if n < 1:
        raise ValueError('n must be at least 1')
```

配る先の列が 1 本もないと、配り方が決まらないので、`ValueError` にします。

### 2. 元の列を n 個に複製する

```python:line-numbers=1898
    children = tee(iterable, n)
```

`tee(iterable, n)` で、同じ内容を読める n 個のイテレータを作ります。

### 3. 番号ごとに、n 個おきに取り出す

```python:line-numbers=1899
    return [islice(it, index, None, n) for index, it in enumerate(children)]
```

番号 `index` の列は、`index` 番目の要素から始めて、`n` 個おきに取り出します。`distribute(2, [1, 2, 3, 4, 5, 6])` の先頭の列（`index = 0`）は、先頭の `1` から 2 個おきに、`1, 3, 5` を取ります。

## ここがすごい

### 全体を配り切るまで待たなくてよい

先頭から順に読んでいくので、最初の要素だけ欲しいときなどは、すぐに結果を使えます。全部をリストにしてから分ける必要はありません。

### `tee` でイテレータの制約を回避する

普通のイテレータは 1 回しか読めないので、複数の列に配るには工夫がいります。`tee` が複製を作り、それぞれの列が同じ内容を独立に読めるようにしています。

### 列の長さが違っても構わない

要素数が `n` で割り切れないと、後ろの列が短くなります。docstring の例のように、空の列も出てきます。ずれを許すことで、単純な仕組みのまま動きます。

### 注意: メモリを使うことがある

`tee` は、ある列が先に進んで、他の列がまだ読んでいない分を内部に溜めます。読む速さがそろっていないと、溜めるメモリが増える点に注意が必要です。

## まとめ

- 1 つの列を n 本に分けるには、`tee` で複製して、`islice` で n 個おきに読むと簡単。
- 複製は、読む速さの差の分だけ、メモリを使う。
- 列の長さが違うのは、この方式では自然な結果になる。
