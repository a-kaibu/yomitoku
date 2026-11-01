---
title: 関数を繰り返し当てはめた値を、止まらずに出し続ける
description: more_itertools.iterate は、start, func(start), func(func(start)) ... の列を無限に出す。止める条件は、take や takewhile と組み合わせて外側で決める。StopIteration で終わる仕組みも持つ。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [558, 575]
function: iterate
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`iterate(func, start)` は、**`start` から始めて、`func` を繰り返し当てはめた値** を無限に出すイテレータです。
`take(5, iterate(lambda x: 2*x, 1))` は `[1, 2, 4, 8, 16]` になります。

## コード

::: code-group

```python:line-numbers=558 [日本語訳]
def iterate(func, start):
    """``start``、``func(start)``、``func(func(start))``、... を返す。

    無限のイテレータを作る。止める条件を付けるには、
    use :func:`take`, ``takewhile``, or :func:`takewhile_inclusive`:.

    >>> take(10, iterate(lambda x: 2*x, 1))
    [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]

    >>> collatz = lambda x: 3*x + 1 if x%2==1 else x // 2
    >>> list(takewhile_inclusive(lambda x: x!=1, iterate(collatz, 10)))
    [10, 5, 16, 8, 4, 2, 1]

    """
    with suppress(StopIteration):
        while True:
            yield start
            start = func(start)
```

```python:line-numbers=558 [原文]
def iterate(func, start):
    """Return ``start``, ``func(start)``, ``func(func(start))``, ...

    Produces an infinite iterator. To add a stopping condition,
    use :func:`take`, ``takewhile``, or :func:`takewhile_inclusive`:.

    >>> take(10, iterate(lambda x: 2*x, 1))
    [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]

    >>> collatz = lambda x: 3*x + 1 if x%2==1 else x // 2
    >>> list(takewhile_inclusive(lambda x: x!=1, iterate(collatz, 10)))
    [10, 5, 16, 8, 4, 2, 1]

    """
    with suppress(StopIteration):
        while True:
            yield start
            start = func(start)
```

:::

`take` は、イテレータから先頭の n 個をリストにして返す関数です。`suppress` は、指定した例外を握りつぶす `with` 文を作ります。

## 前提知識

- **無限のイテレータ**: 要素が終わらないイテレータです。そのまま `list` にすると止まらなくなるので、必ず途中で止める仕組みと組み合わせます。
- **ジェネレータの `yield`**: 値を 1 つ外へ渡し、次の値が求められるまで止まります。
- **`StopIteration`**: イテレータが終わったことを表す例外です。`func` がこれを出すと、ジェネレータも終わります。
- **`takewhile`**: 条件が真の間だけ要素を出し、最初に偽になったところで止まる関数です。

## 何をしているか

### 1. 最初の値を出す

```python:line-numbers=572
    with suppress(StopIteration):
        while True:
            yield start
```

`suppress(StopIteration)` で囲んだ `while True` の中で、まず `start` を `yield` します。`start` そのものが、列の最初の要素です。

### 2. 次の値を作る

```python:line-numbers=575
            start = func(start)
```

`start = func(start)` で、次の値を作ります。次のループで、それが `yield` されます。

### 3. 止め方は呼ぶ側が決める

`iterate` 自体は止まりません。`take(10, ...)` で個数を決めたり、`takewhile(lambda x: x != 1, ...)` で条件を決めたりします。docstring の例では、コラッツ数列を `1` で止めています。

## ここがすごい

### 状態を引数で渡す

「前の値から次を作る」という形なので、関数は前の値だけを受け取ります。ループの変数を外に持たず、列の作り方が 1 行の式に収まります。

### 止めるのは呼ぶ側

無限の列を作る関数が、止める条件まで決めると、使い道が限られます。`iterate` は列を作ることだけに集中し、止め方は `take` や `takewhile` に任せています。部品を組み合わせる設計です。

### `StopIteration` でも終わる

`func` の中で `StopIteration` が出ると、`suppress` によってジェネレータが終わります。途中で値がなくなる列も、同じ仕組みで表せます。

## まとめ

- 「前の値から次を作る」列は、関数を繰り返し当てはめると無限に作れる。
- 止める条件は、`take` や `takewhile` のような部品に任せると組み合わせやすい。
- 終わりを表す例外を `suppress` で受け止めると、途中で終わる列も書ける。
