---
title: 列のすべての連続した部分列を、短いものから順に取り出す
description: more_itertools.subslices は、列のすべての連続した空でない部分列を返す。開始と終了の位置の組み合わせを作り、slice で切り出すので、部分列の順番は開始位置の早い順になる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [829, 840]
function: subslices
difficulty: 2
format: 2
tags: [アルゴリズム, イテレータ, 探索]
---

## ひとことで

`subslices(iterable)` は、**列から連続した部分列を、すべて作って返す** 関数です。
`subslices('ABC')` は `['A']`、`['A', 'B']`、`['A', 'B', 'C']`、`['B']`、`['B', 'C']`、`['C']` の順に返します。

## コード

::: code-group

```python:line-numbers=829 [日本語訳]
def subslices(iterable):
    """*iterable* のすべての連続した、空でない部分列を返す。

        >>> list(subslices('ABC'))
        [['A'], ['A', 'B'], ['A', 'B', 'C'], ['B'], ['B', 'C'], ['C']]

    :func:`substrings` と似ているが、
    出す要素の順番が違う。
    """
    seq = list(iterable)
    slices = starmap(slice, combinations(range(len(seq) + 1), 2))
    return map(getitem, repeat(seq), slices)
```

```python:line-numbers=829 [原文]
def subslices(iterable):
    """Return all contiguous non-empty subslices of *iterable*.

        >>> list(subslices('ABC'))
        [['A'], ['A', 'B'], ['A', 'B', 'C'], ['B'], ['B', 'C'], ['C']]

    This is similar to :func:`substrings`, but emits items in a different
    order.
    """
    seq = list(iterable)
    slices = starmap(slice, combinations(range(len(seq) + 1), 2))
    return map(getitem, repeat(seq), slices)
```

:::

## 前提知識

- **部分列（subslice）**: 元の列から、連続した一部を切り出したものです。`'ABC'` の `'BC'` などがあたります。
- **組み合わせ（combinations）**: 順番を気にせず、指定した数の要素を選ぶ方法です。ここでは 2 つの位置を選びます。
- **`slice`**: 開始と終了の位置を表す、切り出しのための値です。
- **`getitem`**: `列[添字]` と同じ動きを、関数として呼べるようにしたものです。

## 何をしているか

### 1. 列を一度リストにする

```python:line-numbers=838
    seq = list(iterable)
```

部分列を何度も切り出すので、入力を先にリストに入れておきます。こうすると、位置で切り出せるようになります。

### 2. 開始と終了の組を作る

```python:line-numbers=839
    slices = starmap(slice, combinations(range(len(seq) + 1), 2))
```

`range(len(seq) + 1)` は、位置の境界の一覧です。その中から 2 つを選ぶ組み合わせは、開始位置と終了位置の組になります。`starmap(slice, ...)` で、それぞれを `slice` の値にします。

### 3. 位置で切り出す

```python:line-numbers=840
    return map(getitem, repeat(seq), slices)
```

`map(getitem, repeat(seq), slices)` で、同じリストに、すべての `slice` を当てて切り出します。

## ここがすごい

### 組み合わせで、全部を網羅する

開始と終了の 2 つの位置を、すべての組み合わせで選ぶので、部分列の漏れがありません。考え方を、そのまま `combinations` の呼び出しで表せます。

### 切り出しを関数で並べる

`slice` と `getitem` を `map` で組み合わせると、ループを書かずに、切り出し処理を並べられます。

### 部分列の数は多くなる

要素が `n` 個の列では、部分列は `n(n+1)/2` 個になります。長い列では、結果がとても多くなるので、全部を使うかどうかを考える必要があります。

## まとめ

- 開始と終了の位置を組み合わせると、すべての連続した部分列が得られる。
- 切り出しを `slice` と `getitem` で表すと、ループを書かずに済む。
- 部分列の数は要素数のおおよそ 2 乗に比例するので、大きな列では注意する。
