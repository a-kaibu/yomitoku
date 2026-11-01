---
title: 各入力の中で、ほかの入力に含まれない要素だけを残す
description: more_itertools.unique_to_each は、複数の入力それぞれについて、ほかのどの入力にも現れない要素だけを返す。各入力に何回出てきたかではなく、何個の入力に出てきたかを数えて判定する。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [1006, 1036]
function: unique_to_each
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 探索]
---

## ひとことで

`unique_to_each(*iterables)` は、**それぞれの入力について、ほかの入力のどれにもない要素だけを残す** 関数です。
`unique_to_each({'A', 'B'}, {'B', 'C'}, {'B', 'D'})` は `[['A'], ['C'], ['D']]` を返します。`B` はすべての入力にあるので、どこからも除かれます。

## コード

::: code-group

```python:line-numbers=1006 [日本語訳]
def unique_to_each(*iterables):
    """入力の各イテラブルから、ほかの入力のどれにも含まれない要素を返す。
    other input iterables.

    For example, suppose you have a set of packages, each with a set of
    dependencies::

        {'pkg_1': {'A', 'B'}, 'pkg_2': {'B', 'C'}, 'pkg_3': {'B', 'D'}}

    If you remove one package, which dependencies can also be removed?

    If ``pkg_1`` is removed, then ``A`` is no longer necessary - it is not
    associated with ``pkg_2`` or ``pkg_3``. Similarly, ``C`` is only needed for
    ``pkg_2``, and ``D`` is only needed for ``pkg_3``::

        >>> unique_to_each({'A', 'B'}, {'B', 'C'}, {'B', 'D'})
        [['A'], ['C'], ['D']]

    If there are duplicates in one input iterable that aren't in the others
    they will be duplicated in the output. Input order is preserved::

        >>> unique_to_each("mississippi", "missouri")
        [['p', 'p'], ['o', 'u', 'r']]

    It is assumed that the elements of each iterable are hashable.

    """
    pool = [list(it) for it in iterables]
    counts = Counter(chain.from_iterable(map(set, pool)))
    uniques = {element for element in counts if counts[element] == 1}
    return [list(filter(uniques.__contains__, it)) for it in pool]
```

```python:line-numbers=1006 [原文]
def unique_to_each(*iterables):
    """Return the elements from each of the input iterables that aren't in the
    other input iterables.

    For example, suppose you have a set of packages, each with a set of
    dependencies::

        {'pkg_1': {'A', 'B'}, 'pkg_2': {'B', 'C'}, 'pkg_3': {'B', 'D'}}

    If you remove one package, which dependencies can also be removed?

    If ``pkg_1`` is removed, then ``A`` is no longer necessary - it is not
    associated with ``pkg_2`` or ``pkg_3``. Similarly, ``C`` is only needed for
    ``pkg_2``, and ``D`` is only needed for ``pkg_3``::

        >>> unique_to_each({'A', 'B'}, {'B', 'C'}, {'B', 'D'})
        [['A'], ['C'], ['D']]

    If there are duplicates in one input iterable that aren't in the others
    they will be duplicated in the output. Input order is preserved::

        >>> unique_to_each("mississippi", "missouri")
        [['p', 'p'], ['o', 'u', 'r']]

    It is assumed that the elements of each iterable are hashable.

    """
    pool = [list(it) for it in iterables]
    counts = Counter(chain.from_iterable(map(set, pool)))
    uniques = {element for element in counts if counts[element] == 1}
    return [list(filter(uniques.__contains__, it)) for it in pool]
```

:::

`Counter` は、値ごとの出現回数を数える辞書型です。`chain.from_iterable` は、リストの中のイテラブルを 1 本につなげる関数です。

## 前提知識

- **集合（set）**: 同じ値を 2 つ持たない入れ物です。`{'A', 'B'}` のように書きます。
- **共通の要素**: 2 つの入力に両方含まれる値のことです。
- **`map(set, pool)`**: 各入力を集合に変えます。集合にすると、同じ入力の中の重複は 1 回として数えられます。
- **`uniques.__contains__`**: 集合に含まれるかを調べる関数です。`filter` に渡すと、含まれるものだけを残せます。

## 何をしているか

### 1. 各入力をリストにしておく

```python:line-numbers=1033
    pool = [list(it) for it in iterables]
```

入力は後で 2 回読むので、先にリストにしておきます。

### 2. 「いくつの入力に現れるか」を数える

```python:line-numbers=1034
    counts = Counter(chain.from_iterable(map(set, pool)))
```

各入力を集合にしてから 1 本につなぎ、値ごとに数えます。同じ入力の中で何回出ても、数えるのは 1 回だけです。

### 3. ちょうど 1 つの入力にだけ現れる値を集める

```python:line-numbers=1035
    uniques = {element for element in counts if counts[element] == 1}
```

数えが 1 の値は、1 つの入力にしか現れていません。その値の集合を `uniques` とします。

### 4. 各入力から、その集合の値だけを残す

```python:line-numbers=1036
    return [list(filter(uniques.__contains__, it)) for it in pool]
```

各入力を `filter` で、`uniques` に含まれる要素だけに絞ります。元の並びは保たれ、同じ入力の中の重複もそのまま残ります。

## ここがすごい

### 「何回」ではなく「いくつの入力に」を数える

普通に数えると、同じ入力の中で 2 回出た値は、その入力だけに現れたのに数が 2 になってしまいます。各入力を集合にしてから数えると、判定は「ほかの入力にあるか」だけに絞られます。

### 重複は、その入力の中では残る

docstring の例 `unique_to_each("mississippi", "missouri")` では、`p` は `mississippi` の中で 2 回現れ、ほかの入力にはないので、`['p', 'p']` になります。他と比べた結果だけが決まり、中の重複は消えません。

### 依存関係の整理に使える

docstring にあるように、パッケージと依存先の関係を調べると、どのパッケージを消したときに、どの依存が不要になるかが分かります。集合を並べて比べるだけで、答えが出ます。

## まとめ

- ほかの入力と比べて、独自の要素を探すには、「いくつの入力に現れるか」を数える。
- 入力ごとに集合にしてから数えると、同じ入力の中の重複が判定に影響しない。
- 残すときは元の並びを保つと、結果が分かりやすい。
