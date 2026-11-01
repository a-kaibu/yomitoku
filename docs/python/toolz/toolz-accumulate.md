---
title: 途中の結果を 1 つずつ出しながら、2 項の関数で積み上げる
description: toolz.accumulate は、2 つの値を受け取る関数を列に繰り返し当て、途中の結果を順に出す。累積和や累積積を作る。初期値を渡すと、最初の結果として使われ、空の列でも初期値 1 つだけを出す。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [30, 68]
function: accumulate
difficulty: 2
format: 2
tags: [イテレータ, 関数型, 遅延評価]
---

## ひとことで

`accumulate(binop, seq)` は、**2 つの値を受け取る関数を列に次々に当てて、途中の結果を 1 つずつ出す** 関数です。
`accumulate(add, [1, 2, 3, 4, 5])` は `1`、`3`、`6`、`10`、`15` を返します。途中の合計が、そのまま見えます。

## コード

::: code-group

```python:line-numbers=30 [日本語訳]
def accumulate(binop, seq, initial=no_default):
    """ 2 項の関数を列に繰り返し当て、途中の結果を積み上げる

    >>> from operator import add, mul
    >>> list(accumulate(add, [1, 2, 3, 4, 5]))
    [1, 3, 6, 10, 15]
    >>> list(accumulate(mul, [1, 2, 3, 4, 5]))
    [1, 2, 6, 24, 120]

    ``reduce`` に似ていて、累積和のような関数を作るのに向いている。
    例えば累積和:

    >>> from functools import partial, reduce
    >>> sum    = partial(reduce, add)
    >>> cumsum = partial(accumulate, add)

    accumulate は、省略できる初期値も受け取る。それが
    最初の値になる。初期値の使い方は ``reduce`` と同じである。

    >>> list(accumulate(add, [1, 2, 3], -1))
    [-1, 0, 2, 5]
    >>> list(accumulate(add, [], 1))
    [1]

    See Also:
        itertools.accumulate :  In standard itertools for Python 3.2+
    """
    seq = iter(seq)
    if initial == no_default:
        try:
            result = next(seq)
        except StopIteration:
            return
    else:
        result = initial
    yield result
    for elem in seq:
        result = binop(result, elem)
        yield result
```

```python:line-numbers=30 [原文]
def accumulate(binop, seq, initial=no_default):
    """ Repeatedly apply binary function to a sequence, accumulating results

    >>> from operator import add, mul
    >>> list(accumulate(add, [1, 2, 3, 4, 5]))
    [1, 3, 6, 10, 15]
    >>> list(accumulate(mul, [1, 2, 3, 4, 5]))
    [1, 2, 6, 24, 120]

    Accumulate is similar to ``reduce`` and is good for making functions like
    cumulative sum:

    >>> from functools import partial, reduce
    >>> sum    = partial(reduce, add)
    >>> cumsum = partial(accumulate, add)

    Accumulate also takes an optional argument that will be used as the first
    value. This is similar to reduce.

    >>> list(accumulate(add, [1, 2, 3], -1))
    [-1, 0, 2, 5]
    >>> list(accumulate(add, [], 1))
    [1]

    See Also:
        itertools.accumulate :  In standard itertools for Python 3.2+
    """
    seq = iter(seq)
    if initial == no_default:
        try:
            result = next(seq)
        except StopIteration:
            return
    else:
        result = initial
    yield result
    for elem in seq:
        result = binop(result, elem)
        yield result
```

:::

## 前提知識

- **2 項の関数**: 2 つの値を受け取り、1 つの値を返す関数です。`operator.add` や `operator.mul` などがあたります。
- **`reduce`**: 列を 1 つの値にまとめる関数です。`accumulate` は、途中の結果をすべて出します。
- **初期値**: 最初の結果として使う値です。省略すると、列の最初の要素が使われます。
- **`StopIteration`**: イテレータが尽きたときに出る例外です。

## 何をしているか

### 1. 列を読むイテレータを作り、初期値を決める

```python:line-numbers=57
    seq = iter(seq)
    if initial == no_default:
        try:
            result = next(seq)
        except StopIteration:
            return
    else:
        result = initial
```

`iter(seq)` で、列を 1 つずつ読むイテレータを作ります。初期値がなければ、最初の要素を結果にします。その要素がなければ、空の列として何も出さずに終わります。初期値があれば、それを結果にします。

### 2. 最初の結果を出す

```python:line-numbers=65
    yield result
```

まず、初期値（または最初の要素）を出します。これが、累積の最初の値です。

### 3. 次々に積み上げて出す

```python:line-numbers=66
    for elem in seq:
        result = binop(result, elem)
        yield result
```

残りの要素を 1 つずつ読み、今の結果と組み合わせて新しい結果を作ります。それを出してから、次の要素に進みます。

## ここがすごい

### 途中の経過が見える

`reduce` は最後の 1 つだけを返しますが、この関数は途中の値を全部出します。累積和の推移を、そのまま使えます。

### 遅延評価で、必要なところまで

結果は 1 つずつ出るので、大きな列でも、必要な途中の値だけを読めます。全部の結果を先に作る必要はありません。

### 空の列の扱いを、初期値で決める

空の列でも、初期値があれば、その値だけを 1 つ出します。初期値がなければ、何も出さずに終わります。空の場合の答えを、呼び出し側が決められます。

## まとめ

- 2 項の関数を積み上げて出すと、累積和や累積積の推移が見える。
- 途中の値を 1 つずつ出すので、大きな列でも必要な分だけ読める。
- 初期値を渡すと、空の列の答えも決められる。
