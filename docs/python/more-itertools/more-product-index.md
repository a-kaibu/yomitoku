---
title: 直積の中で、その組が何番目かを、全部作らずに計算する
description: more_itertools.product_index は、itertools.product の結果の中で、指定した組が最初に現れる番号を返す。各位置の要素を「桁」として、混合基数の数の計算で求める。全部の組を作らないので速い。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [4456, 4483]
function: product_index
difficulty: 3
format: 2
tags: [アルゴリズム, イテレータ, 探索]
---

## ひとことで

`product_index(element, *iterables)` は、直積（`product`）の中で **その組が何番目にあるか** を返す関数です。
`product_index([8, 2], range(10), range(5))` は `42` を返します。全部の組を作らずに、番号だけを計算しています。

## コード

::: code-group

```python:line-numbers=4456 [日本語訳]
def product_index(element, *iterables, repeat=1):
    """``list(product(*iterables, repeat=repeat)).index(tuple(element))`` と同じ結果を返す。

    The products of *iterables* can be ordered lexicographically.
    :func:`product_index` computes the first index of *element* without
    computing the previous products.

        >>> product_index([8, 2], range(10), range(5))
        42

    The *repeat* keyword argument specifies the number of repetitions
    of the iterables::

        >>> product_index([8, 0, 7], range(10), repeat=3)
        807

    ``ValueError`` will be raised if the given *element* isn't in the product
    of *args*.
    """
    elements = tuple(element)
    pools = tuple(map(tuple, iterables)) * repeat
    if len(elements) != len(pools):
        raise ValueError('element is not a product of args')

    index = 0
    for elem, pool in zip(elements, pools):
        index = index * len(pool) + pool.index(elem)
    return index
```

```python:line-numbers=4456 [原文]
def product_index(element, *iterables, repeat=1):
    """Equivalent to ``list(product(*iterables, repeat=repeat)).index(tuple(element))``

    The products of *iterables* can be ordered lexicographically.
    :func:`product_index` computes the first index of *element* without
    computing the previous products.

        >>> product_index([8, 2], range(10), range(5))
        42

    The *repeat* keyword argument specifies the number of repetitions
    of the iterables::

        >>> product_index([8, 0, 7], range(10), repeat=3)
        807

    ``ValueError`` will be raised if the given *element* isn't in the product
    of *args*.
    """
    elements = tuple(element)
    pools = tuple(map(tuple, iterables)) * repeat
    if len(elements) != len(pools):
        raise ValueError('element is not a product of args')

    index = 0
    for elem, pool in zip(elements, pools):
        index = index * len(pool) + pool.index(elem)
    return index
```

:::

## 前提知識

- **直積の並び**: `product` は、左の列を先に変えながら、辞書順（先頭から比べる順）に組を出します。
- **混合基数の数**: 桁ごとに基数（そこでの選択肢の数）が違う数です。時計の時・分のように、位ごとに上限が違います。
- **`pool.index(elem)`**: 列の中で `elem` が最初に現れる位置を返します。
- **`ValueError`**: 要素がその列の中になかったときに出る例外です。

## 何をしているか

### 1. 組と列を用意し、個数を確かめる

```python:line-numbers=4475
    elements = tuple(element)
    pools = tuple(map(tuple, iterables)) * repeat
    if len(elements) != len(pools):
        raise ValueError('element is not a product of args')
```

指定された組と、それぞれの列を用意します。組の長さが列の数と違えば、その組は直積の中にあり得ないので、`ValueError` にします。

### 2. 桁ごとに数を積み上げる

```python:line-numbers=4480
    index = 0
    for elem, pool in zip(elements, pools):
        index = index * len(pool) + pool.index(elem)
```

`index` を 0 から始め、各桁で「今までの数 × その桁の選択肢の数 + 今の要素の位置」を計算します。これは、10 進数で `数 × 10 + 桁` と組み立てるのと同じ考え方です。

### 3. 結果を返す

```python:line-numbers=4483
    return index
```

すべての桁を処理したら、積み上げた数が答えです。

## ここがすごい

### 全部の組を作らない

直積の組は、列の長さの積の数だけあります。全部を作ってから探すと、大量のメモリと時間がかかります。この方法は、各桁の位置だけを計算するので、組を 1 つも作りません。

### 位取りの計算として見る

10 進数の `807` は、`8 × 100 + 0 × 10 + 7` と、桁ごとの数を積み上げたものです。直積の番号も、各桁の位置を、その桁の選択肢の数で位取りして積み上げたものになります。

### `repeat` は列を並べるだけ

`repeat=3` のときは、同じ列が 3 つ並んだものとして扱います。`pools` を作るときに並べるだけなので、計算はそのままです。

## まとめ

- 直積の番号は、各桁の位置を混合基数の数として積み上げると、組を作らずに求まる。
- 全部の組を作る方法は、組の数が多いと現実的でない。
- 要素がない場合は、先に長さを確かめてエラーにする。
