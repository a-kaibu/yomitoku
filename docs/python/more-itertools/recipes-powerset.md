---
title: 集合のすべての部分集合を、順に作る
description: more_itertools.powerset は、与えられた列のすべての部分集合を、要素数の少ないものから順に返す。要素数 r ごとの組み合わせを作り、chain でつなぐ。重複がある入力では、重複した部分集合も出る。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [451, 469]
function: powerset
difficulty: 2
format: 2
tags: [アルゴリズム, イテレータ, 数値計算]
---

## ひとことで

`powerset(iterable)` は、**列から取り出せるすべての組み合わせ（部分集合）** を順に返す関数です。
`powerset([1, 2, 3])` は、空の組、`(1,)`、`(2,)`、`(3,)`、`(1, 2)` と続き、最後に `(1, 2, 3)` を返します。3 個の要素からは、8 通りの部分集合ができます。

## コード

::: code-group

```python:line-numbers=451 [日本語訳]
def powerset(iterable):
    """列の全部の部分集合を、順に返す。

        >>> list(powerset([1, 2, 3]))
        [(), (1,), (2,), (3,), (1, 2), (1, 3), (2, 3), (1, 2, 3)]

    :func:`powerset` は、:class:`set` ではない列にも使え、
    入力に同じ要素があれば、出力にも同じ部分集合が重なって出る。
    in the output.

        >>> seq = [1, 1, 0]
        >>> list(powerset(seq))
        [(), (1,), (1,), (0,), (1, 1), (1, 0), (1, 0), (1, 1, 0)]

    本当に :class:`set` を返す版については、
    :func:`powerset_of_sets` を参照。
    """
    s = list(iterable)
    return chain.from_iterable(combinations(s, r) for r in range(len(s) + 1))
```

```python:line-numbers=451 [原文]
def powerset(iterable):
    """Yields all possible subsets of the iterable.

        >>> list(powerset([1, 2, 3]))
        [(), (1,), (2,), (3,), (1, 2), (1, 3), (2, 3), (1, 2, 3)]

    :func:`powerset` will operate on iterables that aren't :class:`set`
    instances, so repeated elements in the input will produce repeated elements
    in the output.

        >>> seq = [1, 1, 0]
        >>> list(powerset(seq))
        [(), (1,), (1,), (0,), (1, 1), (1, 0), (1, 0), (1, 1, 0)]

    For a variant that efficiently yields actual :class:`set` instances, see
    :func:`powerset_of_sets`.
    """
    s = list(iterable)
    return chain.from_iterable(combinations(s, r) for r in range(len(s) + 1))
```

:::

## 前提知識

- **部分集合**: 元の集合から一部の要素を選んで作る集合です。空の集合も、元の集合そのものも含みます。
- **組み合わせ（combinations）**: 順番を気にせず、`r` 個の要素を選ぶ方法です。
- **`chain.from_iterable`**: 列の列を 1 本につなぐ関数です。
- **2 のべき乗**: 要素が `n` 個なら、部分集合は `2 ** n` 通りになります。

## 何をしているか

### 1. 入力を一度リストにする

```python:line-numbers=468
    s = list(iterable)
```

入力は、何度も読む必要があるので、先にリストに入れます。こうしておくと、要素数を数えたり、組み合わせを作ったりできます。

### 2. 要素数ごとの組み合わせをつなぐ

```python:line-numbers=469
    return chain.from_iterable(combinations(s, r) for r in range(len(s) + 1))
```

`r` を 0 から要素数まで変えて、それぞれの組み合わせを作ります。`chain.from_iterable` でつなげると、要素数の少ない順に、すべての部分集合が並びます。

## ここがすごい

### 数を変えるだけで全部を作る

「0 個選ぶ、1 個選ぶ、……全部選ぶ」という考え方を、`range` で表しています。ループを 1 段書くだけで、すべての部分集合が出てきます。

### 重複を区別しない

入力が `[1, 1, 0]` のように重複していると、部分集合にも同じ組が重なって出ます。`set` の性質を使わず、ただ組み合わせを並べているので、この挙動になります。`set` として扱いたいときは、別の関数を使います。

### 数が増えると急に大きくなる

要素が 1 つ増えるたびに、部分集合の数は 2 倍になります。20 個の要素では、100 万通り以上になるので、全部を使うときは注意が必要です。

## まとめ

- 要素数ごとの組み合わせを作って、つなげると全部の部分集合が得られる。
- 重複のある入力では、同じ部分集合も重なって出る。
- 部分集合の数は要素数に対して急増するので、大きな入力では注意する。
