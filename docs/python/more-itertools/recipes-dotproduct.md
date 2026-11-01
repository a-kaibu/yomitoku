---
title: 2 つの列の内積を、対応する要素の積の和で求める
description: more_itertools.dotproduct は、2 つの列の内積を返す。map と operator.mul で対応する要素どうしを掛け、sum で足し合わせる。Python 3.12 以降では math.sumprod が同じ役割を担う。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [281, 291]
function: dotproduct
difficulty: 1
format: 2
tags: [数値計算, イテレータ, 可読性]
---

## ひとことで

`dotproduct(vec1, vec2)` は、**2 つの列の内積** を返す関数です。
`dotproduct([10, 15, 12], [0.65, 0.80, 1.25])` は `33.5` を返します。対応する位置の値を掛けて、その合計を求めます。

## コード

::: code-group

```python:line-numbers=281 [日本語訳]
def dotproduct(vec1, vec2):
    """2 つのイテラブルの内積を返す。

    >>> dotproduct([10, 15, 12], [0.65, 0.80, 1.25])
    33.5
    >>> 10 * 0.65 + 15 * 0.80 + 12 * 1.25
    33.5

    Python 3.12 以降では、代わりに ``math.sumprod()`` を使う。
    """
    return sum(map(mul, vec1, vec2))
```

```python:line-numbers=281 [原文]
def dotproduct(vec1, vec2):
    """Returns the dot product of the two iterables.

    >>> dotproduct([10, 15, 12], [0.65, 0.80, 1.25])
    33.5
    >>> 10 * 0.65 + 15 * 0.80 + 12 * 1.25
    33.5

    In Python 3.12 and later, use ``math.sumprod()`` instead.
    """
    return sum(map(mul, vec1, vec2))
```

:::

## 前提知識

- **内積**: 2 つの列の同じ位置の要素どうしを掛けて、その和を取る計算です。
- **ベクトル**: 数を一列に並べたものです。ここでは、列を 1 つのベクトルと考えます。
- **`operator.mul`**: 2 つの数を掛ける関数です。`*` と同じ働きを、関数として渡せます。
- **`sum`**: 列の要素を足し合わせる組み込み関数です。

## 何をしているか

### 1. 対応する要素どうしを掛ける

```python:line-numbers=291
    return sum(map(mul, vec1, vec2))
```

`map(mul, vec1, vec2)` は、2 つの列の同じ位置の値を、順に掛けていきます。`mul` は掛け算の関数で、`*` の演算子を関数として渡す役割です。その結果を `sum` が足し合わせます。

## ここがすごい

### 1 行で書ける

掛け算と足し算を、1 行にまとめています。ループの中で変数を更新する書き方より、何を計算しているかがすぐ分かります。

### 短い列で止まる

`map` は、2 つの列のうち短い方が終わると止まります。長さがずれていても、エラーにならずに、対応する部分だけを計算します。

### 新しい標準の関数に置き換わる

コメントにあるように、Python 3.12 以降では `math.sumprod()` が同じ計算を担当します。この関数は、古い Python でも使えるように残されています。

## まとめ

- 内積は、対応する要素の積の和として `map` と `sum` で書ける。
- `map` は短い列で止まるので、長さがずれても安全に計算できる。
- 新しい Python では標準の `math.sumprod` が使えるので、目的に合わせて選ぶ。
