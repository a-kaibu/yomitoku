---
title: 条件に合う要素だけ変換し、残りは別の変換をかけて流す
description: more_itertools.map_if は、各要素に述語を当て、真なら func、偽なら func_else で変換してから順に出す。func_else を省くと、条件に合わない要素はそのまま流す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [3855, 3880]
function: map_if
difficulty: 1
format: 2
tags: [イテレータ, 関数型, 遅延評価]
---

## ひとことで

`map_if(iterable, pred, func, func_else=None)` は、**要素ごとに条件を調べて、変換の仕方を分けながら** 出す関数です。
`map_if([1, 5, 2], lambda x: x > 3, lambda x: 'big')` は `1, 'big', 2` を出します。条件に合う要素だけを変換する、という使い方ができます。

## コード

::: code-group

```python:line-numbers=3855 [日本語訳]
def map_if(iterable, pred, func, func_else=None):
    """各要素に *pred* を当てて評価する。結果が真と同等なら
    equivalent to ``True``, transform the item with *func* and yield it.
    Otherwise, transform the item with *func_else* and yield it.

    *pred*, *func*, and *func_else* should each be functions that accept
    one argument. By default, *func_else* is the identity function.

    >>> from math import sqrt
    >>> iterable = list(range(-5, 5))
    >>> iterable
    [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4]
    >>> list(map_if(iterable, lambda x: x > 3, lambda x: 'toobig'))
    [-5, -4, -3, -2, -1, 0, 1, 2, 3, 'toobig']
    >>> list(map_if(iterable, lambda x: x >= 0,
    ... lambda x: f'{sqrt(x):.2f}', lambda x: None))
    [None, None, None, None, None, '0.00', '1.00', '1.41', '1.73', '2.00']
    """

    if func_else is None:
        for item in iterable:
            yield func(item) if pred(item) else item

    else:
        for item in iterable:
            yield func(item) if pred(item) else func_else(item)
```

```python:line-numbers=3855 [原文]
def map_if(iterable, pred, func, func_else=None):
    """Evaluate each item from *iterable* using *pred*. If the result is
    equivalent to ``True``, transform the item with *func* and yield it.
    Otherwise, transform the item with *func_else* and yield it.

    *pred*, *func*, and *func_else* should each be functions that accept
    one argument. By default, *func_else* is the identity function.

    >>> from math import sqrt
    >>> iterable = list(range(-5, 5))
    >>> iterable
    [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4]
    >>> list(map_if(iterable, lambda x: x > 3, lambda x: 'toobig'))
    [-5, -4, -3, -2, -1, 0, 1, 2, 3, 'toobig']
    >>> list(map_if(iterable, lambda x: x >= 0,
    ... lambda x: f'{sqrt(x):.2f}', lambda x: None))
    [None, None, None, None, None, '0.00', '1.00', '1.41', '1.73', '2.00']
    """

    if func_else is None:
        for item in iterable:
            yield func(item) if pred(item) else item

    else:
        for item in iterable:
            yield func(item) if pred(item) else func_else(item)
```

:::

`yield` は、値を 1 つずつ外へ渡すキーワードです。この関数は、呼び出すたびに 1 件ずつ結果を作ります。

## 前提知識

- **述語（predicate）**: 要素を受け取り、真か偽を返す関数です。
- **`func_else`**: 述語が偽だったときに使う変換です。省略すると `None` になります。
- **`yield`**: 関数の中で値を外へ渡し、次の値が求められるまで止まる書き方です。ジェネレータを作ります。
- **条件式 `a if c else b`**: `c` が真なら `a`、偽なら `b` を値にする書き方です。

## 何をしているか

### 1. `func_else` が省略されている場合

```python:line-numbers=874

    items = list(iterable)

```

`func_else` が `None` なら、条件に合わない要素はそのまま出します。ループの中では、`func(item) if pred(item) else item` で 1 行に判定と変換をまとめています。

### 2. `func_else` が指定されている場合

```python:line-numbers=878
        items.sort()
        sortable = True
    except TypeError:
```

条件に合わない要素には、`func_else` の変換をかけてから出します。どちらの要素にも、必ず何かの変換がかかります。

## ここがすごい

### 条件分岐を 1 行に

`if` を書いて `yield` を 2 回書く代わりに、条件式で値を選びます。変換の仕方の違いだけが、目で見て分かる形になっています。

### 省略時は「そのまま」を既定にする

`func_else=None` と書いたときに、`None` という値をそのまま返すわけではありません。`func_else` がないことを確かめて、要素を変えずに出す分岐に入ります。

### ジェネレータなので、途中で止められる

`yield` で 1 件ずつ作るので、大きなデータでも必要な分だけ変換されます。

## まとめ

- 条件で変換を分けるなら、条件式で 1 行にまとめるとすっきりする。
- 省略可能な変換は、「ないときはそのまま」と分けて扱う。
- ジェネレータにすると、大きなデータも必要な分だけ処理できる。
