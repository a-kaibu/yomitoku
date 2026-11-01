---
title: 2 つの列の全組み合わせに関数を当て、表（行列）の形で返す
description: more_itertools.outer_product は、2 つの列のすべての組に 2 項の関数を当て、len(xs) 行 len(ys) 列の表として返す。掛け算の表や、クロス集計の表を作るのに使う。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [5101, 5132]
function: outer_product
difficulty: 2
format: 2
tags: [イテレータ, 数値計算, 関数型]
---

## ひとことで

`outer_product(func, xs, ys)` は、**2 つの列のすべての組み合わせに関数を当てて、表の形で返す** 関数です。
`outer_product(mul, range(1, 4), range(1, 6))` は、掛け算の表になります。1 行目は `1, 2, 3, 4, 5` です。

## コード

::: code-group

```python:line-numbers=5101 [日本語訳]
def outer_product(func, xs, ys, *args, **kwargs):
    """2 項の関数を、すべての組の要素に当てる、一般化された外積。
    pairs of items. Returns a 2D matrix with ``len(xs)`` rows and ``len(ys)``
    columns.
    Also accepts ``*args`` and ``**kwargs`` that are passed to ``func``.

    Multiplication table:

    >>> from operator import mul
    >>> list(outer_product(mul, range(1, 4), range(1, 6)))
    [(1, 2, 3, 4, 5), (2, 4, 6, 8, 10), (3, 6, 9, 12, 15)]

    Cross tabulation:

    >>> xs = ['A', 'B', 'A', 'A', 'B', 'B', 'A', 'A', 'B', 'B']
    >>> ys = ['X', 'X', 'X', 'Y', 'Z', 'Z', 'Y', 'Y', 'Z', 'Z']
    >>> pair_counts = Counter(zip(xs, ys))
    >>> count_rows = lambda x, y: pair_counts[x, y]
    >>> list(outer_product(count_rows, sorted(set(xs)), sorted(set(ys))))
    [(2, 3, 0), (1, 0, 4)]

    Usage with ``*args`` and ``**kwargs``:

    >>> animals = ['cat', 'wolf', 'mouse']
    >>> list(outer_product(min, animals, animals, key=len))
    [('cat', 'cat', 'cat'), ('cat', 'wolf', 'wolf'), ('cat', 'wolf', 'mouse')]
    """
    ys = tuple(ys)
    return batched(
        starmap(lambda x, y: func(x, y, *args, **kwargs), product(xs, ys)),
        n=len(ys),
    )
```

```python:line-numbers=5101 [原文]
def outer_product(func, xs, ys, *args, **kwargs):
    """A generalized outer product that applies a binary function to all
    pairs of items. Returns a 2D matrix with ``len(xs)`` rows and ``len(ys)``
    columns.
    Also accepts ``*args`` and ``**kwargs`` that are passed to ``func``.

    Multiplication table:

    >>> from operator import mul
    >>> list(outer_product(mul, range(1, 4), range(1, 6)))
    [(1, 2, 3, 4, 5), (2, 4, 6, 8, 10), (3, 6, 9, 12, 15)]

    Cross tabulation:

    >>> xs = ['A', 'B', 'A', 'A', 'B', 'B', 'A', 'A', 'B', 'B']
    >>> ys = ['X', 'X', 'X', 'Y', 'Z', 'Z', 'Y', 'Y', 'Z', 'Z']
    >>> pair_counts = Counter(zip(xs, ys))
    >>> count_rows = lambda x, y: pair_counts[x, y]
    >>> list(outer_product(count_rows, sorted(set(xs)), sorted(set(ys))))
    [(2, 3, 0), (1, 0, 4)]

    Usage with ``*args`` and ``**kwargs``:

    >>> animals = ['cat', 'wolf', 'mouse']
    >>> list(outer_product(min, animals, animals, key=len))
    [('cat', 'cat', 'cat'), ('cat', 'wolf', 'wolf'), ('cat', 'wolf', 'mouse')]
    """
    ys = tuple(ys)
    return batched(
        starmap(lambda x, y: func(x, y, *args, **kwargs), product(xs, ys)),
        n=len(ys),
    )
```

:::

`product` は、2 つの列のすべての組み合わせを順に出す関数です。`starmap` は、組を関数の引数に展開して適用する関数です。`batched` は、列を一定の個数ごとの塊に分ける関数です。

## 前提知識

- **外積（outer product）**: 2 つの列のすべての組に、何かの演算をかけて表を作る考え方です。掛け算の表が代表例です。
- **2 項の関数**: 引数を 2 つ取る関数です。`mul(x, y)` は `x * y` を返します。
- **`product(xs, ys)`**: `xs` と `ys` のすべての組を、`xs` を外側にして順に作ります。
- **`starmap(f, pairs)`**: 組の要素を `f` の引数として渡します。

## 何をしているか

### 1. `ys` を 1 度だけ作る

```python:line-numbers=5128
    ys = tuple(ys)
```

`ys` は、後で何度も使われるので、先にタプルにして一度読めるようにします。

### 2. すべての組に関数を当てる

```python:line-numbers=5129
    return batched(
        starmap(lambda x, y: func(x, y, *args, **kwargs), product(xs, ys)),
        n=len(ys),
```

`product(xs, ys)` ですべての組を作り、`starmap` で `func(x, y, *args, **kwargs)` を当てます。結果は 1 つの長い列になります。

### 3. `len(ys)` ごとに区切る

```python:line-numbers=5129
    return batched(
        starmap(lambda x, y: func(x, y, *args, **kwargs), product(xs, ys)),
        n=len(ys),
```

`batched` で、`len(ys)` 個ずつに区切ります。1 区切りが 1 行になるので、`len(xs)` 行 `len(ys)` 列の表になります。

## ここがすごい

### 表を作る処理を、部品の組み合わせにする

すべての組を作る、関数を当てる、行に区切るという 3 つの処理を、`product`、`starmap`、`batched` に分けています。それぞれは短く、組み合わせで表全体が作れます。

### 関数を差し替えるだけで、いろいろな表になる

掛け算の表、件数を数えるクロス集計、最小値の表など、関数を変えるだけで目的の表になります。docstring の例では、`Counter` と組み合わせて集計表を作っています。

### 追加の引数も渡せる

`*args` と `**kwargs` を `func` にそのまま渡せます。docstring の `key=len` のように、比べ方を追加で指定できます。

## まとめ

- すべての組に関数を当てて表にするには、`product` で組を作り、行に区切る。
- 関数を変えるだけで、掛け算表や集計表など、別の表が作れる。
- 追加の引数は、`*args` と `**kwargs` で渡せる。
