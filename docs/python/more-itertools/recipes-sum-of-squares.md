---
title: 同じ列を 2 本に分けて、各要素の 2 乗の和を求める
description: more_itertools.sum_of_squares は、列の各要素を 2 乗して足した値を返す。tee で元の列を 2 本に分け、内積の関数 _sumprod に同じ値の列どうしを渡すことで、1 回の走査で求める。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [1129, 1137]
function: sum_of_squares
difficulty: 2
format: 2
tags: [数値計算, イテレータ, アルゴリズム]
---

## ひとことで

`sum_of_squares(iterable)` は、**列の各要素を 2 乗して、その合計を返す** 関数です。
`sum_of_squares([10, 20, 30])` は `1400` を返します。`10² + 20² + 30²` の計算です。

## コード

::: code-group

```python:line-numbers=1129 [日本語訳]
def sum_of_squares(iterable):
    """入力された値の 2 乗の和を返す。

    >>> sum_of_squares([10, 20, 30])
    1400

    int、float、complex、Decimal、Fraction のすべての数の型に対応している。
    """
    return _sumprod(*tee(iterable))
```

```python:line-numbers=1129 [原文]
def sum_of_squares(iterable):
    """Return the sum of the squares of the input values.

    >>> sum_of_squares([10, 20, 30])
    1400

    Supports all numeric types: int, float, complex, Decimal, Fraction.
    """
    return _sumprod(*tee(iterable))
```

:::

## 前提知識

- **2 乗の和**: 各要素を自分と掛けて、それらを足した値です。
- **内積**: 2 つの列の対応する要素を掛けて、その和を取る計算です。`x` と `x` の内積は、2 乗の和になります。
- **`tee`**: 1 つのイテレータを、同じ値を読める 2 つのイテレータに分ける関数です。
- **`_sumprod`**: 内積を求める内部の関数です。2 つの列を受け取ります。

## 何をしているか

### 1. 元の列を 2 本に分ける

```python:line-numbers=1137
    return _sumprod(*tee(iterable))
```

`tee(iterable)` は、同じ値を読める 2 本のイテレータを作ります。`*` で、この 2 本を `_sumprod` の 2 つの引数として渡します。

## ここがすごい

### 2 乗を、内積として書く

「各要素を 2 乗して足す」は、「自分と自分の内積」と同じです。2 つの引数に同じ列を渡すだけで、2 乗の和が得られます。

### 1 回の走査で済む

`tee` で 2 本に分けるので、元の列は一度だけ読まれ、その値が両方の引数に流れます。列を 2 回作らずに済みます。

### 数の型をそのまま使える

`_sumprod` は、`int`、`float`、`complex`、`Decimal`、`Fraction` に対応しています。型ごとに分けた処理を書く必要はありません。

## まとめ

- 2 乗の和は、同じ列どうしの内積として書ける。
- `tee` で列を 2 本に分けると、1 回の読み取りで両方に値を渡せる。
- 内部の関数に任せると、数の型の違いを気にせず使える。
