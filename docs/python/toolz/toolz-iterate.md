---
title: 値に関数を繰り返し当てて、終わりのない列を作る
description: toolz.iterate は、初期値 x を出し、その後 func(x)、func(func(x)) と続く値を無限に出すイテレータを返す。while True の中で、値を出してから次の値を計算する形で、必要な分だけ読める。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [632, 659]
function: iterate
difficulty: 2
format: 2
tags: [イテレータ, 関数型, 遅延評価]
---

## ひとことで

`iterate(func, x)` は、**初めの値 `x` から始めて、関数を繰り返し当てた値を、順に無限に出す** 関数です。
`iterate(lambda x: x * 2, 1)` は `1`、`2`、`4`、`8` と続きます。2 のべき乗の列を、終わりを決めずに作れます。

## コード

::: code-group

```python:line-numbers=632 [日本語訳]
def iterate(func, x):
    """ 元の入力に、関数を繰り返し当てる

    x、func(x)、func(func(x)) の順に、値を出し続ける。

    >>> def inc(x):  return x + 1
    >>> counter = iterate(inc, 0)
    >>> next(counter)
    0
    >>> next(counter)
    1
    >>> next(counter)
    2

    >>> double = lambda x: x * 2
    >>> powers_of_two = iterate(double, 1)
    >>> next(powers_of_two)
    1
    >>> next(powers_of_two)
    2
    >>> next(powers_of_two)
    4
    >>> next(powers_of_two)
    8
    """
    while True:
        yield x
        x = func(x)
```

```python:line-numbers=632 [原文]
def iterate(func, x):
    """ Repeatedly apply a function func onto an original input

    Yields x, then func(x), then func(func(x)), then func(func(func(x))), etc..

    >>> def inc(x):  return x + 1
    >>> counter = iterate(inc, 0)
    >>> next(counter)
    0
    >>> next(counter)
    1
    >>> next(counter)
    2

    >>> double = lambda x: x * 2
    >>> powers_of_two = iterate(double, 1)
    >>> next(powers_of_two)
    1
    >>> next(powers_of_two)
    2
    >>> next(powers_of_two)
    4
    >>> next(powers_of_two)
    8
    """
    while True:
        yield x
        x = func(x)
```

:::

## 前提知識

- **関数を繰り返す**: 関数の結果を、次の入力として同じ関数に渡すことです。`f(f(x))` のように入れ子になります。
- **無限のイテレータ**: 値が終わらずに続くイテレータです。読む側が、途中で止める必要があります。
- **ジェネレータ**: `yield` で値を 1 つずつ出す関数です。
- **`next`**: イテレータから次の値を 1 つ取り出す組み込み関数です。

## 何をしているか

### 1. 無限に続くループを作る

```python:line-numbers=657
    while True:
```

`while True` で、終わりのないループを作ります。読まれるたびに、この中の処理が 1 回進みます。

### 2. 今の値を出す

```python:line-numbers=658
        yield x
```

`yield x` で、今の値を呼び出し側に渡します。呼び出し側が次を読むまで、この関数は止まって待ちます。

### 3. 関数で次の値を作る

```python:line-numbers=659
        x = func(x)
```

`x = func(x)` で、今の値に関数を当てて、次の値を作ります。次に読まれたとき、この新しい値が出ます。

## ここがすごい

### 次の値は、読まれるまで計算しない

`yield` の後に計算するので、値を読まれていないときは、関数は呼ばれていません。遅延評価の形で、必要な分だけ計算します。

### 状態を変数 1 つで持つ

「今の値」という状態だけを `x` で持ち、関数で次へ進めます。複雑な状態管理を書かずに、数列の仕組みを表せます。

### 止める役は読む側にある

無限に続くので、`next` を決まった回数だけ呼ぶか、`take` で切り出して使います。終わりを作らないことで、読む側が必要な長さを決める設計になっています。

## まとめ

- 関数を繰り返し当てると、無限の列が 1 つの変数で作れる。
- 値を出してから次を計算すると、必要な分だけ計算が進む。
- 読む側が止めるので、数列の長さを自由に決められる。
