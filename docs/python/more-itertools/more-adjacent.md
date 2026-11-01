---
title: 条件に合う要素と、その隣の要素に印を付けて流す
description: more_itertools.adjacent は、各要素に「条件に合うか、または条件に合う要素の隣か」を示す真偽値を付けて返す。畳み込みのような窓を使い、距離を指定すると隣の範囲を広げられる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [2187, 2223]
function: adjacent
difficulty: 3
format: 2
tags: [イテレータ, アルゴリズム, 関数型]
---

## ひとことで

`adjacent(predicate, iterable, distance=1)` は、**各要素について「条件に合うか、条件に合う要素の近くにあるか」を `(bool, 要素)` の組で出す** 関数です。
`adjacent(lambda x: x == 3, range(6))` は、`(False, 0), (False, 1), (True, 2), (True, 3), (True, 4), (False, 5)` を出します。`3` と、その両隣が `True` になります。

## コード

::: code-group

```python:line-numbers=2187 [日本語訳]
def adjacent(predicate, iterable, distance=1):
    """`item` が *iterable* から取られる `(bool, item)` の組を返す。
    drawn from *iterable* and the `bool` indicates whether
    that item satisfies the *predicate* or is adjacent to an item that does.

    For example, to find whether items are adjacent to a ``3``::

        >>> list(adjacent(lambda x: x == 3, range(6)))
        [(False, 0), (False, 1), (True, 2), (True, 3), (True, 4), (False, 5)]

    Set *distance* to change what counts as adjacent. For example, to find
    whether items are two places away from a ``3``:

        >>> list(adjacent(lambda x: x == 3, range(6), distance=2))
        [(False, 0), (True, 1), (True, 2), (True, 3), (True, 4), (True, 5)]

    This is useful for contextualizing the results of a search function.
    For example, a code comparison tool might want to identify lines that
    have changed, but also surrounding lines to give the viewer of the diff
    context.

    The predicate function will only be called once for each item in the
    iterable.

    See also :func:`groupby_transform`, which can be used with this function
    to group ranges of items with the same `bool` value.

    """
    # distance=0 を許すのは、主に map() と同じ結果になるかをテストするため
    if distance < 0:
        raise ValueError('distance must be at least 0')

    i1, i2 = tee(iterable)
    padding = [False] * distance
    selected = chain(padding, map(predicate, i1), padding)
    adjacent_to_selected = map(any, windowed(selected, 2 * distance + 1))
    return zip(adjacent_to_selected, i2)
```

```python:line-numbers=2187 [原文]
def adjacent(predicate, iterable, distance=1):
    """Return an iterable over `(bool, item)` tuples where the `item` is
    drawn from *iterable* and the `bool` indicates whether
    that item satisfies the *predicate* or is adjacent to an item that does.

    For example, to find whether items are adjacent to a ``3``::

        >>> list(adjacent(lambda x: x == 3, range(6)))
        [(False, 0), (False, 1), (True, 2), (True, 3), (True, 4), (False, 5)]

    Set *distance* to change what counts as adjacent. For example, to find
    whether items are two places away from a ``3``:

        >>> list(adjacent(lambda x: x == 3, range(6), distance=2))
        [(False, 0), (True, 1), (True, 2), (True, 3), (True, 4), (True, 5)]

    This is useful for contextualizing the results of a search function.
    For example, a code comparison tool might want to identify lines that
    have changed, but also surrounding lines to give the viewer of the diff
    context.

    The predicate function will only be called once for each item in the
    iterable.

    See also :func:`groupby_transform`, which can be used with this function
    to group ranges of items with the same `bool` value.

    """
    # Allow distance=0 mainly for testing that it reproduces results with map()
    if distance < 0:
        raise ValueError('distance must be at least 0')

    i1, i2 = tee(iterable)
    padding = [False] * distance
    selected = chain(padding, map(predicate, i1), padding)
    adjacent_to_selected = map(any, windowed(selected, 2 * distance + 1))
    return zip(adjacent_to_selected, i2)
```

:::

`windowed` は、連続する要素を幅ごとに組にする関数です。`groupby_transform` のような後続の部品と組み合わせると、印の付いた範囲をまとめられます。

## 前提知識

- **述語（predicate）**: 要素を受け取って、真か偽を返す関数です。
- **窓（window）**: 一定の幅で、列の上をずらしていく範囲です。幅 `2 * distance + 1` の窓は、中央の要素の両側 `distance` 個を含みます。
- **`any`**: 窓の中に 1 つでも真があれば `True` を返します。
- **`tee(iterable)`**: 同じ列を 2 回読めるように複製します。ここでは、述語の結果と元の要素を、別々に使うために使います。

## 何をしているか

### 1. 距離が負なら、エラーにする

```python:line-numbers=2216
    if distance < 0:
        raise ValueError('distance must be at least 0')
```

距離は 0 以上でなければなりません。

### 2. 列を 2 つに複製する

```python:line-numbers=2219
    i1, i2 = tee(iterable)
```

`i1` は述語を当てるため、`i2` は最後に元の要素を出すために使います。同じ列を 2 つの役割で読めるように、`tee` で複製します。

### 3. 述語の結果に、両端の余白を足す

```python:line-numbers=2220
    padding = [False] * distance
    selected = chain(padding, map(predicate, i1), padding)
```

各要素に述語を当てた結果の列の前後に、`distance` 個の `False` を足します。こうすると、列の端の要素でも、窓の中央として扱えます。

### 4. 窓の中に真があるかを調べる

```python:line-numbers=2222
    adjacent_to_selected = map(any, windowed(selected, 2 * distance + 1))
    return zip(adjacent_to_selected, i2)
```

幅 `2 * distance + 1` の窓ごとに `any` を取ります。窓の中央が、条件に合う要素または、その近くにある要素なら、`True` になります。最後に、元の要素と組にして返します。

## ここがすごい

### 述語は 1 回だけ呼ばれる

docstring にあるとおり、述語は各要素に 1 回だけ当てられます。窓が重なっていても、判定の結果を使い回すので、同じ判定を何度も繰り返しません。

### 「近さ」を窓の幅で表す

隣接の範囲は、窓の幅を変えるだけで広げられます。`distance=2` にすると、両隣 2 つずつまで `True` になります。新しい仕組みを足さず、窓の大きさで表現しています。

### 検索結果の文脈を作る

docstring には、差分表示のツールで、変わった行の前後を見せたい例が挙げられています。条件に合うものだけでなく、その周辺も一緒に表示できます。

## まとめ

- 「条件に合うものの隣」は、判定の列に余白を足して、窓で `any` を取ると求められる。
- 範囲の広さは、窓の幅を変えるだけで調整できる。
- 同じ列を 2 つの役割で読むには、`tee` で複製する。
