---
title: 列の要素数を、長さを持つものは len で、そうでなければ数えて求める
description: toolz.count は、列の要素の個数を返す。len が使える列は、そのまま len を返し、使えないイテレータは要素を 1 つずつ読んで数える。組み込みの len と違い、遅延評価の列にも使える。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [757, 769]
function: count
difficulty: 1
format: 2
tags: [アルゴリズム, 可読性, イテレータ]
---

## ひとことで

`count(seq)` は、**列の中にある要素の個数** を返す関数です。
`count([10, 20, 30])` は `3` を返します。組み込みの `len` では数えられない、ジェネレータのような列にも使えます。

## コード

::: code-group

```python:line-numbers=757 [日本語訳]
def count(seq):
    """ seq の要素の個数を数える

    組み込みの ``len`` に似ているが、遅延評価の列にも使える。

    ``itertools.count`` とは別物なので注意。

    See also:
        len
    """
    if hasattr(seq, '__len__'):
        return len(seq)
    return sum(1 for i in seq)
```

```python:line-numbers=757 [原文]
def count(seq):
    """ Count the number of items in seq

    Like the builtin ``len`` but works on lazy sequences.

    Not to be confused with ``itertools.count``

    See also:
        len
    """
    if hasattr(seq, '__len__'):
        return len(seq)
    return sum(1 for i in seq)
```

:::

## 前提知識

- **`len`**: 長さを返す組み込み関数です。`__len__` を持つ列でだけ使えます。
- **ジェネレータ（遅延評価の列）**: 値を 1 つずつ作る列です。全体の長さは、読んでみないと分かりません。
- **`hasattr`**: オブジェクトが、特定の属性を持つかを確かめる組み込み関数です。

## 何をしているか

### 1. 長さを持つ列なら、`len` を使う

```python:line-numbers=767
    if hasattr(seq, '__len__'):
        return len(seq)
```

`hasattr(seq, '__len__')` で、長さを教えられる列かを確かめます。そうなら、`len` の値をそのまま返します。この場合は、要素を 1 つも読まずに答えが出ます。

### 2. 長さがない列は、数えながら読む

```python:line-numbers=769
    return sum(1 for i in seq)
```

長さがない列は、`for` で 1 つずつ読み、1 を足していきます。`sum(1 for i in seq)` は、読んだ要素の数を合計する書き方です。

## ここがすごい

### 読まずに答えられる場合を優先する

長さを持つ列では、中身を読まずに数が分かります。全部を読む処理は、必要なときだけ使われます。

### 組み込みの `len` の代わりになる

`len` は、ジェネレータに使うとエラーになります。この関数は、同じ呼び出しの形で、どんな列の個数も返せます。

### 数えるために、全部を読む

長さがない列では、個数を知るために、最後まで読みきる必要があります。無限の列では、この関数は終わりません。

## まとめ

- 長さを持つ列は `len` で即座に数え、持たない列は読みながら数える。
- 組み込みの `len` の代わりに、遅延評価の列にも同じ形で使える。
- 長さがない列は全部を読むので、無限の列には使えない。
