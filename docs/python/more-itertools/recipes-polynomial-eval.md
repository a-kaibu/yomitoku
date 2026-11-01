---
title: 多項式の値を、べき乗の列と内積で一度に計算する
description: more_itertools.polynomial_eval は、係数の列（高い次数から並ぶ）と x から多項式の値を求める。x のべき乗を map と pow で作り、係数との内積を sumprod で足し合わせる。Horner 法より数値の誤差が出にくいとされる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [1106, 1126]
function: polynomial_eval
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, 可読性]
---

## ひとことで

`polynomial_eval(coefficients, x)` は、**係数の列で表された多項式に、`x` を代入した値** を返す関数です。
`polynomial_eval([1, -4, -17, 60], 2.5)` は `8.125` を返します。これは `x^3 - 4x^2 - 17x + 60` に `2.5` を代入した値です。

## コード

::: code-group

```python:line-numbers=1106 [日本語訳]
def polynomial_eval(coefficients, x):
    """多項式を、ある値で評価する。

    Horner 法より、数値の安定性がよい計算をする。

    ``x^3 - 4 * x^2 - 17 * x + 60`` を ``x = 2.5`` で評価する:

    >>> coefficients = [1, -4, -17, 60]
    >>> x = 2.5
    >>> polynomial_eval(coefficients, x)
    8.125

    多項式の係数は、次数の高い順に並べて指定することに注意。

    int、float、complex、Decimal、Fraction のすべての数の型に対応している。
    """
    n = len(coefficients)
    if n == 0:
        return type(x)(0)
    powers = map(pow, repeat(x), reversed(range(n)))
    return _sumprod(coefficients, powers)
```

```python:line-numbers=1106 [原文]
def polynomial_eval(coefficients, x):
    """Evaluate a polynomial at a specific value.

    Computes with better numeric stability than Horner's method.

    Evaluate ``x^3 - 4 * x^2 - 17 * x + 60`` at ``x = 2.5``:

    >>> coefficients = [1, -4, -17, 60]
    >>> x = 2.5
    >>> polynomial_eval(coefficients, x)
    8.125

    Note that polynomial coefficients are specified in descending power order.

    Supports all numeric types: int, float, complex, Decimal, Fraction.
    """
    n = len(coefficients)
    if n == 0:
        return type(x)(0)
    powers = map(pow, repeat(x), reversed(range(n)))
    return _sumprod(coefficients, powers)
```

:::

## 前提知識

- **多項式**: `x` の累乗に係数をかけて足し合わせた式です。`x^3 - 4x^2` などがあたります。
- **係数と次数**: 係数は各項にかける数です。次数は `x` の最も高い累乗です。
- **べき乗**: `x` を何回掛けるかを表す計算です。`pow(x, k)` は `x` の `k` 乗を返します。
- **内積**: 2 つの列の対応する要素を掛けて、その和を取る計算です。

## 何をしているか

### 1. 空の係数を特別扱いする

```python:line-numbers=1122
    n = len(coefficients)
    if n == 0:
        return type(x)(0)
```

係数が 1 つもなければ、多項式は常に 0 です。`type(x)(0)` で、`x` と同じ型の 0 を返します。こうすると、`int` でも `Fraction` でも、型に合った 0 が返ります。

### 2. x のべき乗の列を作る

```python:line-numbers=1125
    powers = map(pow, repeat(x), reversed(range(n)))
```

`reversed(range(n))` で、次数の高い順に `n - 1` から `0` までの数を並べます。`map(pow, repeat(x), ...)` は、`x` の各べき乗を順に作ります。

### 3. 係数と内積を取って足し合わせる

```python:line-numbers=1126
    return _sumprod(coefficients, powers)
```

係数の列とべき乗の列の対応する値を掛けて、その和を取ります。この計算を `_sumprod` が担当します。

## ここがすごい

### 数の型をそのまま使える

`pow` や `sumprod` は、`int`、`float`、`complex`、`Decimal`、`Fraction` で動きます。多項式の計算のためだけに、数の型を変換する必要はありません。

### 数値の誤差が出にくい

コメントにあるように、Horner 法より数値の誤差が出にくくなっています。たくさんの項を足すときに、途中の値が大きくなりすぎるのを抑える、という考えです。

### 係数の並べ方を決めておく

係数は、次数の高い順に並べます。`[1, -4, -17, 60]` は `x^3` の係数が先頭です。順番を決めておくと、`reversed(range(n))` と対応させやすくなります。

## まとめ

- 係数とべき乗の列を作り、内積で足し合わせると、多項式の値が得られる。
- 型を変えずに、どんな数の型でも同じ式で計算できる。
- 係数の並べ方を決めておくと、べき乗との対応が分かりやすい。
