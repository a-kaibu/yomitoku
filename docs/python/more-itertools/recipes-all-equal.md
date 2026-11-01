---
title: すべての要素が同じかを、2 つ目の値を探して判定する
description: more_itertools.all_equal は、列の要素がすべて同じかを True か False で返す。itertools.groupby で同じ値のまとまりを作り、まとまりが 2 つ以上あるかを確かめる。key を渡すと、比べる前に値を変換できる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [216, 239]
function: all_equal
difficulty: 2
format: 2
tags: [アルゴリズム, イテレータ, 探索]
---

## ひとことで

`all_equal(iterable, key=None)` は、**列の要素がすべて同じ値かどうか** を返す関数です。
`all_equal('aaaa')` は `True`、`all_equal('aaab')` は `False` を返します。

## コード

::: code-group

```python:line-numbers=216 [日本語訳]
def all_equal(iterable, key=None):
    """
    全部の要素が互いに等しければ ``True`` を返す。

        >>> all_equal('aaaa')
        True
        >>> all_equal('aaab')
        False

    1 つの引数を受け取り、変換した値を返す関数を
    *key* として指定できる。各要素は、その関数で変換してから比べる:

        >>> all_equal('AaaA', key=str.casefold)
        True
        >>> all_equal([1, 2, 3], key=lambda x: x < 10)
        True

    """
    iterator = groupby(iterable, key)
    for first in iterator:
        for second in iterator:
            return False
        return True
    return True
```

```python:line-numbers=216 [原文]
def all_equal(iterable, key=None):
    """
    Returns ``True`` if all the elements are equal to each other.

        >>> all_equal('aaaa')
        True
        >>> all_equal('aaab')
        False

    A function that accepts a single argument and returns a transformed version
    of each input item can be specified with *key*:

        >>> all_equal('AaaA', key=str.casefold)
        True
        >>> all_equal([1, 2, 3], key=lambda x: x < 10)
        True

    """
    iterator = groupby(iterable, key)
    for first in iterator:
        for second in iterator:
            return False
        return True
    return True
```

:::

## 前提知識

- **`groupby`**: 隣り合う同じ値を、1 つのまとまりにまとめる `itertools` の関数です。
- **まとまり（group）**: 同じ値が続く部分です。`'aaab'` は `aaa` と `b` の 2 つのまとまりになります。
- **`key` 関数**: 比べる前に、各要素を変換するために使う関数です。`str.casefold` のような関数を渡せます。
- **空の列**: 要素が 1 つもない列です。この関数では `True` を返します。

## 何をしているか

### 1. 同じ値のまとまりを作る

```python:line-numbers=234
    iterator = groupby(iterable, key)
```

`groupby` は、隣り合う同じ値（`key` で変換した後の値）を、まとまりとして取り出します。ここでは、まとまりの列を `iterator` に入れます。

### 2. まとまりが 2 つ以上あるかを確かめる

```python:line-numbers=235
    for first in iterator:
        for second in iterator:
            return False
        return True
    return True
```

最初のまとまりを取ったあと、2 つ目を取ろうとします。2 つ目があれば、値が途中で変わったので `False` を返します。2 つ目がなければ、すべて同じ値なので `True` です。空の列は、どちらの繰り返しにも入らず、最後の `True` で返ります。

## ここがすごい

### 全部を比べずに済む

2 つ目のまとまりが見つかった時点で、答えが決まります。すべての要素を比べる前に、結果を返せることがあります。

### 数えずに判定する

要素の数を数えたり、リストにしたりしていません。`groupby` の結果を、1 回の繰り返しで見ているだけです。大きな列でも、余計なメモリを使いません。

### 比べ方を変えられる

`key=str.casefold` を渡すと、`'AaaA'` は大文字小文字を区別せずに同じと判定されます。値をどう比べるかを、引数で自由に決められます。

## まとめ

- 同じ値のまとまりが 2 つ以上あるかで、すべて同じかを判定できる。
- 答えが決まった時点で返すので、全部を読まずに済むことがある。
- `key` で比べる値を変換すると、大文字小文字などを無視して比べられる。
