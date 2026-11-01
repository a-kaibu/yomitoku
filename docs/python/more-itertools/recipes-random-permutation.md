---
title: 要素から長さ r のランダムな順列を 1 つ取り出す
description: more_itertools.random_permutation は、列の要素から長さ r の順列を、ランダムに 1 つ返す。r を省略すると、全要素の並べ替えになる。内部では random.sample で、重複のない位置をランダムな順で選ぶ。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [608, 623]
function: random_permutation
difficulty: 2
format: 2
tags: [乱数, アルゴリズム]
---

## ひとことで

`random_permutation(iterable, r=None)` は、**要素の中から `r` 個を選んで並べた、ランダムな順列を 1 つ返す** 関数です。
`random_permutation(range(5))` は、`0` から `4` までを混ぜた並びを返します。毎回、違う並びになります。

## コード

::: code-group

```python:line-numbers=608 [日本語訳]
def random_permutation(iterable, r=None):
    """*iterable* の要素から、長さ *r* のランダムな順列を返す。

    *r* を省略するか ``None`` なら、既定値は
    *iterable* の長さになる。

        >>> random_permutation(range(5))  # doctest:+SKIP
        (3, 4, 0, 1, 2)

    これは、
    ``itertools.permutations(iterable, r)`` からランダムに 1 つ選ぶのと同じ。

    """
    pool = tuple(iterable)
    r = len(pool) if r is None else r
    return tuple(sample(pool, r))
```

```python:line-numbers=608 [原文]
def random_permutation(iterable, r=None):
    """Return a random *r* length permutation of the elements in *iterable*.

    If *r* is not specified or is ``None``, then *r* defaults to the length of
    *iterable*.

        >>> random_permutation(range(5))  # doctest:+SKIP
        (3, 4, 0, 1, 2)

    This is equivalent to taking a random selection from
    ``itertools.permutations(iterable, r)``.

    """
    pool = tuple(iterable)
    r = len(pool) if r is None else r
    return tuple(sample(pool, r))
```

:::

## 前提知識

- **順列（permutation）**: 要素の中から一部を選び、順番をつけて並べたものです。
- **`itertools.permutations`**: すべての順列を順に出す、標準ライブラリの関数です。
- **`random.sample`**: 列から、重複なしで指定した数の要素を、ランダムな順で選ぶ関数です。

## 何をしているか

### 1. 候補をタプルに固定する

```python:line-numbers=621
    pool = tuple(iterable)
```

`tuple(iterable)` で、要素を 1 回だけ読み、タプルに固定します。これで、選ぶ候補が決まります。

### 2. 長さを決める

```python:line-numbers=622
    r = len(pool) if r is None else r
```

`r` が省略されていれば、候補の数と同じにします。つまり、全部の要素を並べ替えることになります。

### 3. ランダムに選んで並べる

```python:line-numbers=623
    return tuple(sample(pool, r))
```

`sample(pool, r)` は、候補から重複なしで `r` 個を、ランダムな順で選びます。その結果をタプルにして返します。

## ここがすごい

### 全部のリストを作らない

すべての順列を作ると、要素が多いときに数が爆発します。この関数は、1 つだけをランダムに作るので、軽く動きます。

### 順列を一発で作れる

`sample` が、選ぶことと並べることを同時に行います。並べ替えを別に書かずに済みます。

### 候補の固定と、長さの省略

候補をタプルにしてから数えるので、長さを正しく決められます。`r` を省略すると、全要素の並べ替えになる、という分かりやすい既定値になっています。

## まとめ

- 候補をタプルにしてから、`sample` でランダムな順列を 1 つ作れる。
- 全部の順列を作らないので、要素が多くても使える。
- `r` を省略すると、全要素の並べ替えになる。
