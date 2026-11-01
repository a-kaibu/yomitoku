---
title: 行列どうしの掛け算を、内積と転置の組み合わせで書く
description: more_itertools.matmul は、2 つの行列の積を求める。左の行と右の列の全組み合わせについて内積を取り、結果を列数ごとに区切る。転置と内積の関数を組み合わせて、ループを使わずに書いている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [1039, 1051]
function: matmul
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, イディオム]
---

## ひとことで

`matmul(m1, m2)` は、**2 つの行列の積** を求める関数です。
`matmul([(7, 5), (3, 5)], [(2, 5), (7, 9)])` は、`(49, 80)` と `(41, 60)` の 2 行を返します。左の行列の行と、右の行列の列の内積を、すべての組み合わせで求めます。

## コード

::: code-group

```python:line-numbers=1039 [日本語訳]
def matmul(m1, m2):
    """2 つの行列を掛け合わせる。

    >>> list(matmul([(7, 5), (3, 5)], [(2, 5), (7, 9)]))
    [(49, 80), (41, 60)]

    呼び出し側は、入力の行列の次元が互いに合うことを確かめるべきである。
    

    int、float、complex、Decimal、Fraction のすべての数の型に対応している。
    """
    n = len(m2[0])
    return batched(starmap(_sumprod, product(m1, transpose(m2))), n)
```

```python:line-numbers=1039 [原文]
def matmul(m1, m2):
    """Multiply two matrices.

    >>> list(matmul([(7, 5), (3, 5)], [(2, 5), (7, 9)]))
    [(49, 80), (41, 60)]

    The caller should ensure that the dimensions of the input matrices are
    compatible with each other.

    Supports all numeric types: int, float, complex, Decimal, Fraction.
    """
    n = len(m2[0])
    return batched(starmap(_sumprod, product(m1, transpose(m2))), n)
```

:::

## 前提知識

- **行列の積**: 左の行列の行と、右の行列の列の内積を、各位置に並べたものです。左の列数と右の行数が一致している必要があります。
- **内積**: 2 つの列の対応する要素を掛けて、その和を取る計算です。
- **転置**: 行と列を入れ替えることです。列の内積を、行どうしの内積として扱えるようになります。
- **`product`**: 2 つの列の、すべての組み合わせを作る `itertools` の関数です。

## 何をしているか

### 1. 結果の列数を数える

```python:line-numbers=1050
    n = len(m2[0])
```

`len(m2[0])` は、右の行列の列数です。結果の 1 行に入る要素の数になるので、後で区切る長さに使います。

### 2. 行と列の全組み合わせで内積を取る

```python:line-numbers=1051
    return batched(starmap(_sumprod, product(m1, transpose(m2))), n)
```

`transpose(m2)` で、右の行列の列を行として取り出します。`product` で、左の各行と右の各列の組を作り、`starmap(_sumprod, ...)` で、それぞれの内積を求めます。最後に、列数の個数ずつ区切って、行列の形に戻します。

## ここがすごい

### 部品を組み合わせて書く

転置、内積、組み合わせ、区切りという 4 つの部品を並べると、行列の積になります。二重のループを書かずに、同じ意味を表せます。

### 結果の形が自然に決まる

全組み合わせの内積は、左の行数 × 右の列数 の個数になります。それを右の列数ごとに区切れば、正しい行列の形になります。

### 数の型をそのまま使える

内積の部分に `_sumprod` を使うので、`int`、`float`、`complex`、`Decimal`、`Fraction` で同じ式が動きます。

## まとめ

- 行列の積は、左の行と右の列の内積を並べたものとして書ける。
- 転置で列を行にすると、内積の仕組みを行どうしの計算として使える。
- 結果を列数で区切ると、行列の形が自然に戻る。
