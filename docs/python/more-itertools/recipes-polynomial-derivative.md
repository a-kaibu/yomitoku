---
title: 係数の並びから、多項式の導関数の係数を作る
description: more_itertools.polynomial_derivative は、多項式の係数の列から、導関数の係数の列を作る。各係数に、その項の次数を掛け、次数を 1 つ下げる。定数項は消えるので、係数の数が 1 つ減る。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [1140, 1156]
function: polynomial_derivative
difficulty: 2
format: 2
tags: [数値計算, アルゴリズム]
---

## ひとことで

`polynomial_derivative(coefficients)` は、**多項式の係数の列から、導関数の係数の列を作る** 関数です。
`polynomial_derivative([1, -4, -17, 60])` は `[3, -8, -17]` を返します。これは `x³ - 4x² - 17x + 60` を微分した `3x² - 8x - 17` の係数です。

## コード

::: code-group

```python:line-numbers=1140 [日本語訳]
def polynomial_derivative(coefficients):
    """多項式の 1 階の導関数を求める。

    ``x³ - 4 x² - 17 x + 60`` の導関数を求める:

    >>> coefficients = [1, -4, -17, 60]
    >>> derivative_coefficients = polynomial_derivative(coefficients)
    >>> derivative_coefficients
    [3, -8, -17]

    多項式の係数は、次数の高い順に並べて指定することに注意。

    int、float、complex、Decimal、Fraction のすべての数の型に対応している。
    """
    n = len(coefficients)
    powers = reversed(range(1, n))
    return list(map(mul, coefficients, powers))
```

```python:line-numbers=1140 [原文]
def polynomial_derivative(coefficients):
    """Compute the first derivative of a polynomial.

    Evaluate the derivative of ``x³ - 4 x² - 17 x + 60``:

    >>> coefficients = [1, -4, -17, 60]
    >>> derivative_coefficients = polynomial_derivative(coefficients)
    >>> derivative_coefficients
    [3, -8, -17]

    Note that polynomial coefficients are specified in descending power order.

    Supports all numeric types: int, float, complex, Decimal, Fraction.
    """
    n = len(coefficients)
    powers = reversed(range(1, n))
    return list(map(mul, coefficients, powers))
```

:::

## 前提知識

- **導関数**: 関数の変化の割合を表す式です。多項式では、項ごとに「次数を掛けて、次数を 1 下げる」だけで求まります。
- **係数と次数**: `3x²` の係数は `3`、次数は `2` です。
- **定数項**: `x` を含まない項です。微分すると、0 になって消えます。
- **`mul`**: 2 つの数を掛ける `operator` の関数です。

## 何をしているか

### 1. 係数の数と、次数の列を作る

```python:line-numbers=1154
    n = len(coefficients)
    powers = reversed(range(1, n))
```

係数の数 `n` から、次数の列を作ります。`range(1, n)` は `1` から `n - 1` までです。`reversed` で、高い次数から順に並べ直します。

### 2. 係数と次数を掛けて並べる

```python:line-numbers=1156
    return list(map(mul, coefficients, powers))
```

`map(mul, coefficients, powers)` で、対応する係数と次数を掛けます。定数項は次数の列に含まれないので、`map` が止まる時点で、自然に消えます。

## ここがすごい

### 定数項が消える仕組み

`powers` は `n - 1` 個しかありません。`map` は短い方の列で止まるので、一番後ろの定数項は、掛け算の対象になりません。消えるための特別な処理を書いていません。

### 次数の列を逆順で作る

係数は次数の高い順に並んでいます。`reversed(range(1, n))` で、その順番に合わせた次数の列を作るので、対応する位置どうしを掛けられます。

### 数の型に依存しない

掛け算だけを使うので、`int`、`float`、`Decimal`、`Fraction` などの型でも同じ式で動きます。

## まとめ

- 導関数の係数は、各係数に次数を掛けたものになる。
- `map` は短い列で止まるので、定数項が自然に消える。
- 係数の並び順と次数の列を揃えると、対応する位置を掛けられる。
