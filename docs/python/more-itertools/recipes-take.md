---
title: 先頭から n 個を取り出して、リストにして返す
description: more_itertools.take は、イテラブルの先頭から最大 n 個の要素を取り出し、リストにして返す。islice で数を制限するので、要素が n 個より少なければ、ある分だけを返す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [113, 126]
function: take
difficulty: 1
format: 2
tags: [イテレータ, 防御的プログラミング, 可読性]
---

## ひとことで

`take(n, iterable)` は、**列の先頭から最大 `n` 個の要素を、リストにして返す** 関数です。
`take(3, range(10))` は `[0, 1, 2]` を返します。列が短くても、エラーにならず、あるだけを返します。

## コード

::: code-group

```python:line-numbers=113 [日本語訳]
def take(n, iterable):
    """イテラブルの先頭から *n* 個の要素を、リストにして返す。

        >>> take(3, range(10))
        [0, 1, 2]

    イテラブルの要素が *n* 個より少なければ、全部を
    返す。

        >>> take(10, range(3))
        [0, 1, 2]

    """
    return list(islice(iterable, n))
```

```python:line-numbers=113 [原文]
def take(n, iterable):
    """Return first *n* items of the *iterable* as a list.

        >>> take(3, range(10))
        [0, 1, 2]

    If there are fewer than *n* items in the iterable, all of them are
    returned.

        >>> take(10, range(3))
        [0, 1, 2]

    """
    return list(islice(iterable, n))
```

:::

## 前提知識

- **イテラブル（iterable）**: `for` 文で順に値を取り出せるものです。
- **`islice`**: 列の先頭から、指定した数だけ値を切り出すイテレータです。
- **リスト化**: 値を順に取り出して、1 つのリストに集めることです。

## 何をしているか

### 1. 先頭から `n` 個だけを切り出す

```python:line-numbers=126
    return list(islice(iterable, n))
```

`islice(iterable, n)` は、先頭から `n` 個だけを読むイテレータを作ります。`n` より後ろの値は読まれません。`list` がそれを 1 つのリストに集めます。

## ここがすごい

### 読みすぎない

`list(iterable)` と書くと全部を読んでしまいますが、`take` は `n` 個だけを読みます。無限に続く列でも、先頭だけを安全に取れます。

### 短い列でもエラーにならない

`take(10, range(3))` のように、列が `n` 個より短くても、あるだけを返します。インデックスの範囲を気にせずに使えます。

### `toolz.take` と似ている

同じ名前の関数は、`toolz` にもあります。ただし `toolz` はイテレータを返し、こちらはリストを返します。結果をすぐに使いたいときは、この関数が便利です。

## まとめ

- 先頭から `n` 個だけを読むと、無限の列でも安全に扱える。
- 列が短くても、あるだけを返すので、範囲を気にせずに使える。
- すぐに値を使うならリスト、後で使うならイテレータ、と返り値の形で使い分けられる。
