---
title: 列の後ろに、None を無限に付け足す
description: more_itertools.pad_none は、列の要素を出したあと、None を無限に出し続けるイテレータを返す。標準の chain と repeat を組み合わせ、組み込みの map の挙動を真似るために使える。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [254, 265]
function: pad_none
difficulty: 1
format: 2
tags: [イテレータ, 可読性, 遅延評価]
---

## ひとことで

`pad_none(iterable)` は、**列の要素を出し終えたあと、`None` を無限に出し続けるイテレータ** を返す関数です。
`pad_none(range(3))` は `0`、`1`、`2`、`None`、`None` と続きます。短い列を、長さがそろっていないまま扱いたいときに使えます。

## コード

::: code-group

```python:line-numbers=254 [日本語訳]
def pad_none(iterable):
    """列の要素を出したあと、``None`` を無限に返す。

        >>> take(5, pad_none(range(3)))
        [0, 1, 2, None, None]

    組み込みの :func:`map` の動きを真似るときに便利。

    関連: :func:`padded`。

    """
    return chain(iterable, repeat(None))
```

```python:line-numbers=254 [原文]
def pad_none(iterable):
    """Returns the sequence of elements and then returns ``None`` indefinitely.

        >>> take(5, pad_none(range(3)))
        [0, 1, 2, None, None]

    Useful for emulating the behavior of the built-in :func:`map` function.

    See also :func:`padded`.

    """
    return chain(iterable, repeat(None))
```

:::

## 前提知識

- **`None`**: 「値がない」ことを表す、Python の特別な値です。
- **`repeat(None)`**: `None` を終わりなく出すイテレータです。
- **`chain`**: 複数の列を順につなぐ `itertools` の関数です。
- **`map` の動き**: 複数の列を一緒に読むとき、短い列が終わると、結果の長さは短い方に合わせられます。この関数は、その短さを `None` で埋めて、反対の振る舞いを作ります。

## 何をしているか

### 1. 元の列の後ろに、`None` を無限につなぐ

```python:line-numbers=265
    return chain(iterable, repeat(None))
```

`chain(iterable, repeat(None))` は、元の列を全部出したあと、`None` を続けて出します。どちらのイテレータも、読まれるまでは値を作りません。

## ここがすごい

### 1 行で、終わりのない列ができる

`repeat(None)` を後ろにつなぐだけで、長さが無限の列ができます。ループや条件分岐は要りません。

### 遅延評価で、無限でも安全

`None` を無限に作っても、読まれた分しか作られません。`take(5, pad_none(...))` のように、個数を決めて読めば、止まります。

### 短い列を埋めるときの道具になる

複数の列を並べて読むとき、短い列を `None` で埋めると、長さをそろえられます。`zip` では短い方で止まるので、埋める方が必要になります。

## まとめ

- `chain` と `repeat(None)` を組み合わせると、列の後ろを `None` で無限に埋められる。
- 遅延評価なので、読んだ分だけしか計算されない。
- 長さの違う列を並べるときの、埋める道具として使える。
