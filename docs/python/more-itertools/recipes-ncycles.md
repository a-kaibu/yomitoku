---
title: 列の要素を、指定した回数だけ繰り返して並べる
description: more_itertools.ncycles は、列の要素の並びを n 回繰り返すイテレータを返す。最初に一度だけタプルに固定してから repeat で n 回並べ、chain.from_iterable でつなぐ。元の列が一度しか読まれない点が特徴である。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [271, 278]
function: ncycles
difficulty: 1
format: 2
tags: [イテレータ, イディオム, 遅延評価]
---

## ひとことで

`ncycles(iterable, n)` は、**列の要素の並びを `n` 回繰り返した列** を返す関数です。
`ncycles(['a', 'b'], 3)` は `a`、`b`、`a`、`b`、`a`、`b` の順に値を出します。

## コード

::: code-group

```python:line-numbers=271 [日本語訳]
def ncycles(iterable, n):
    """列の要素の並びを *n* 回返す

    >>> list(ncycles(["a", "b"], 3))
    ['a', 'b', 'a', 'b', 'a', 'b']

    """
    return chain.from_iterable(repeat(tuple(iterable), n))
```

```python:line-numbers=271 [原文]
def ncycles(iterable, n):
    """Returns the sequence elements *n* times

    >>> list(ncycles(["a", "b"], 3))
    ['a', 'b', 'a', 'b', 'a', 'b']

    """
    return chain.from_iterable(repeat(tuple(iterable), n))
```

:::

## 前提知識

- **繰り返し**: 同じ並びを、決まった回数だけ続けて出すことです。
- **タプル**: 変更できない値の並びです。`tuple(...)` で作れます。
- **`repeat`**: 同じ値を、指定した回数だけ出すイテレータです。
- **`chain.from_iterable`**: 列の列を 1 本につなぐ関数です。

## 何をしているか

### 1. 元の列を一度だけタプルに固定する

```python:line-numbers=278
    return chain.from_iterable(repeat(tuple(iterable), n))
```

`tuple(iterable)` で元の列を 1 回だけ読み、タプルに固定します。これを `repeat` で `n` 回並べ、`chain.from_iterable` で 1 本につなぎます。

## ここがすごい

### 元の列を何度も読まない

繰り返しのたびに元の列を読み直すと、一度しか読めないイテレータでは失敗します。先にタプルに固定しておくと、どの回数でも同じ値を使えます。

### 1 行で書ける

`repeat` と `chain` の組み合わせで、繰り返しのためのループを書かずに済みます。何をしているかが、式の形から読み取れます。

### 元の列の長さに注意

タプルに固定するので、元の列の全部が一度メモリに入ります。長い列を大量に繰り返すときは、メモリの使用量に注意が必要です。

## まとめ

- 列を先にタプルにしておくと、一度しか読めないイテレータでも繰り返せる。
- `repeat` と `chain` を組み合わせると、ループなしで繰り返しが書ける。
- 元の列は全部メモリに入るので、大きさに注意する。
