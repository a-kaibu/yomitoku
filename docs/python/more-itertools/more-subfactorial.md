---
title: 漸化式 D(n) = n × D(n−1) + (−1)^n で完全順列の数を求める
description: more_itertools.subfactorial は、固定点のない並べ方の数（完全順列の数）を返す。階乗を計算せずに、符号を交互に反転させながら、1 つ前の値に掛けて足す漸化式で求める。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [5593, 5616]
function: subfactorial
difficulty: 2
format: 2
tags: [数値計算, アルゴリズム]
---

## ひとことで

`subfactorial(n)` は、**`n` 個の要素を並べたとき、どの要素も元の位置にならない並べ方の数** を返す関数です。
`subfactorial(7)` は `1854` を返します。階乗を直接計算せず、短い漸化式で求めます。

## コード

::: code-group

```python:line-numbers=5593 [日本語訳]
def subfactorial(n):
    """*n* 個の要素の並べ方のうち、どの要素も元の位置にないもの（固定点がないもの）の数。

    :func:`subfactorial` は、
    :func:`derangements` の要素数を計算する。例えば、
    単語 "epsilon" の文字を並べ替えて、どの文字も元の位置に残さない方法は
    1,854 通りある:

        >>> from more_itertools import derangements, ilen
        >>> ilen(derangements('epsilon'))
        1854
        >>> subfactorial(len('epsilon'))
        1854

    参考:  https://oeis.org/A000166

    """
    if n < 0:
        raise ValueError
    sf = adj = 1
    for i in range(n + 1):
        sf = sf * i + adj
        adj = -adj
    return sf
```

```python:line-numbers=5593 [原文]
def subfactorial(n):
    """Number of permutations of *n* elements with no fixed points.

    The :func:`subfactorial` function computes the length of
    :func:`derangements`.  For example, there are 1,854 ways to
    rearrange the letters in word "epsilon" without leaving any
    letter in its original position:

        >>> from more_itertools import derangements, ilen
        >>> ilen(derangements('epsilon'))
        1854
        >>> subfactorial(len('epsilon'))
        1854

    Reference:  https://oeis.org/A000166

    """
    if n < 0:
        raise ValueError
    sf = adj = 1
    for i in range(n + 1):
        sf = sf * i + adj
        adj = -adj
    return sf
```

:::

## 前提知識

- **固定点**: 並べ替えたあとも、元の位置にとどまっている要素です。
- **完全順列（derangement）**: 固定点が 1 つもない並べ替えです。
- **漸化式**: 前の値から次の値を決める式です。ここでは `D(n) = n × D(n−1) + (−1)^n` で、`D(0) = 1` から始めます。
- **`(−1)^n`**: `n` が偶数なら `1`、奇数なら `-1` になる符号です。

## 何をしているか

### 1. 負の数を拒否する

```python:line-numbers=5610
    if n < 0:
        raise ValueError
```

負の `n` は並べ方の数として意味がないので、`ValueError` で止めます。

### 2. 初期値を置く

```python:line-numbers=5612
    sf = adj = 1
```

`sf` は計算中の値で、最初は `D(0) = 1` です。`adj` は、符号を表す値で、最初は `1` です。

### 3. 漸化式で積み上げる

```python:line-numbers=5613
    for i in range(n + 1):
        sf = sf * i + adj
        adj = -adj
```

各段階で、今の値に `i` を掛けて符号を足します。符号は毎回反転するので、`(−1)^n` の交互の並びが作られます。

### 4. 結果を返す

```python:line-numbers=5616
    return sf
```

`n` 段目が終わった時点の `sf` が、完全順列の数です。

## ここがすごい

### 階乗を作らずに済む

完全順列の数を、階乗と交互の和で書く式もあります。この関数は、1 つ前の値だけを持つ漸化式で、同じ値を求めます。大きな数の階乗を作らずに済みます。

### 符号を 1 つの変数で交互にする

`adj = -adj` で符号を反転させるので、`(−1)^n` を別に計算する必要がありません。短い変数で、式の規則を表しています。

### 小さな値で確かめられる

`D(0) = 1`、`D(1) = 0`、`D(2) = 1`、`D(3) = 2` と続きます。少ない要素で手で数えて、結果を確かめられます。

## まとめ

- 完全順列の数は、`D(n) = n × D(n−1) + (−1)^n` という 1 つ前の値に頼る漸化式で求められる。
- 符号を 1 つの変数で反転させると、`(−1)^n` を別に書かずに済む。
- 小さな値から手で確かめると、式の規則が理解しやすい。
