---
title: 検証関数が例外を出さないものだけ、通して流す
description: more_itertools.filter_except は、各要素を検証関数に渡し、指定した例外が出た要素を捨てる。例外の種類を選べるので、想定外のエラーは止めたまま残せる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [3810, 3831]
function: filter_except
difficulty: 2
format: 2
tags: [エラー処理, イテレータ, 防御的プログラミング]
---

## ひとことで

`filter_except(validator, iterable, *exceptions)` は、**検証関数が指定した例外を出さなかった要素だけを** 出す関数です。
`filter_except(int, ['1', '2', 'three', '4'], ValueError)` は `'1', '2', '4'` を出します。`int('three')` が `ValueError` を出したので、その要素は捨てられます。

## コード

::: code-group

```python:line-numbers=3810 [日本語訳]
def filter_except(validator, iterable, *exceptions):
    """*validator* 関数が指定の例外を出さない *iterable* の要素を出す。
    not raise one of the specified *exceptions*.

    *validator* is called for each item in *iterable*.
    It should be a function that accepts one argument and raises an exception
    if that item is not valid.

    >>> iterable = ['1', '2', 'three', '4', None]
    >>> list(filter_except(int, iterable, ValueError, TypeError))
    ['1', '2', '4']

    If an exception other than one given by *exceptions* is raised by
    *validator*, it is raised like normal.
    """
    for item in iterable:
        try:
            validator(item)
        except exceptions:
            pass
        else:
            yield item
```

```python:line-numbers=3810 [原文]
def filter_except(validator, iterable, *exceptions):
    """Yield the items from *iterable* for which the *validator* function does
    not raise one of the specified *exceptions*.

    *validator* is called for each item in *iterable*.
    It should be a function that accepts one argument and raises an exception
    if that item is not valid.

    >>> iterable = ['1', '2', 'three', '4', None]
    >>> list(filter_except(int, iterable, ValueError, TypeError))
    ['1', '2', '4']

    If an exception other than one given by *exceptions* is raised by
    *validator*, it is raised like normal.
    """
    for item in iterable:
        try:
            validator(item)
        except exceptions:
            pass
        else:
            yield item
```

:::

`except exceptions:` の `exceptions` は、例外の種類の並び（タプル）です。どれか 1 つに当たれば、その節が実行されます。

## 前提知識

- **検証関数（validator）**: 要素を 1 つ受け取り、不正なら例外を出す関数です。`int` も、文字列を数に直せなければ `ValueError` を出すので、検証関数として使えます。
- **`try` / `except` / `else`**: `try` の中で例外が起きたら `except` へ、起きなければ `else` へ進みます。
- **`*exceptions`**: 例外の種類を、いくつでも並べて渡せる引数です。
- **`pass`**: 何もしない文です。ここでは、捨てる要素を「何もせず飛ばす」ために使います。

## 何をしているか

### 1. 要素ごとに検証する

```python:line-numbers=825
            # Find the largest index j greater than j such that A[i] < A[j]
            for j in range(size - 1, i, -1):
                if A[i] < A[j]:
                    break

```

各要素を `validator` に渡します。指定された例外が出たら、`pass` で何もせず次の要素に進みます。

### 2. 例外が出なかった要素だけを出す

```python:line-numbers=830
            # Swap the value of A[i] with that of A[j], then reverse the
            # sequence from A[i + 1] to form the new permutation
```

`else` の節は、`try` の中で例外が出なかったときだけ実行されます。その場合だけ `yield` で要素を出します。

## ここがすごい

### 想定内の例外だけ捨てる

`except Exception` のように広くつかまえると、プログラムの間違い（例えば `TypeError` の本当の原因）まで隠してしまいます。この関数は、利用者が指定した例外だけを捨てます。docstring にあるとおり、それ以外は普通どおり投げられます。

### 「通すか捨てるか」を try の形で表す

`if` で条件を書く代わりに、「失敗したら捨てる、成功したら通す」を `try` と `else` で表しています。検証を失敗させることで判断する、という考え方をそのまま書いています。

### 例外の種類を呼ぶ側が決める

どの例外を無視するかは、`*exceptions` で呼ぶ側が決めます。文字列を数にする場合は `ValueError` だけ、型も含めるなら `TypeError` も、と細かく選べます。

## まとめ

- 検証で失敗したものだけを捨てるなら、`try` と `else` で書くと分かりやすい。
- 捨てる例外は、必要な種類だけを指定する。
- 想定外のエラーは隠さずに投げると、バグの見落としを防げる。
