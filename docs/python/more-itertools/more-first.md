---
title: for の中で最初に return して、先頭だけ取り出す
description: more_itertools.first は、イテラブルの先頭の要素を返す。空なら既定値を返し、既定値もなければ ValueError を出す。ジェネレータを 1 つ読むだけで済むので、遅い取得処理を避けられる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [253, 277]
function: first
difficulty: 1
format: 2
tags: [イテレータ, エラー処理, 遅延評価]
---

## ひとことで

`first(iterable, default)` は、**イテラブルの先頭の要素を 1 つだけ** 返す関数です。
`first([0, 1, 2, 3])` は `0` を返します。空のときは `default` を返し、`default` も指定されていなければ `ValueError` を出します。

## コード

::: code-group

```python:line-numbers=253 [日本語訳]
def first(iterable, default=_marker):
    """*iterable* の先頭の要素を返す。空なら *default* を返す。
    empty.

        >>> first([0, 1, 2, 3])
        0
        >>> first([], 'some default')
        'some default'

    If *default* is not provided and there are no items in the iterable,
    raise ``ValueError``.

    :func:`first` is useful when you have a generator of expensive-to-retrieve
    values and want any arbitrary one. It is marginally shorter than
    ``next(iter(iterable), default)``.

    """
    for item in iterable:
        return item
    if default is _marker:
        raise ValueError(
            'first() was called on an empty iterable, '
            'and no default value was provided.'
        )
    return default
```

```python:line-numbers=253 [原文]
def first(iterable, default=_marker):
    """Return the first item of *iterable*, or *default* if *iterable* is
    empty.

        >>> first([0, 1, 2, 3])
        0
        >>> first([], 'some default')
        'some default'

    If *default* is not provided and there are no items in the iterable,
    raise ``ValueError``.

    :func:`first` is useful when you have a generator of expensive-to-retrieve
    values and want any arbitrary one. It is marginally shorter than
    ``next(iter(iterable), default)``.

    """
    for item in iterable:
        return item
    if default is _marker:
        raise ValueError(
            'first() was called on an empty iterable, '
            'and no default value was provided.'
        )
    return default
```

:::

`ValueError` は、値の種類は正しいが、中身が不正なときに投げられる例外です。

## 前提知識

- **`for` の中の `return`**: ループの途中で `return` すると、関数はそこで終わります。1 回目の要素だけを使うときの定番の書き方です。
- **空のイテラブル**: 要素が 1 つもないものです。`for` の中身は 1 回も実行されません。
- **`_marker`**: 「引数が省略されたこと」を表すための、内部の目印です。`None` と違い、利用者が渡すことはありません。
- **`next(iter(x), default)`**: 同じことを 1 行で書く方法です。docstring にも、この関数の方が少し短い、と書かれています。

## 何をしているか

### 1. 先頭の要素を返す

```python:line-numbers=270
    for item in iterable:
        return item
```

ループの 1 回目で `return item` が実行されます。ジェネレータなら、先頭の 1 件だけを作って止まります。残りの要素は作られません。

### 2. 要素がなかった場合、既定値があるか確かめる

```python:line-numbers=272
    if default is _marker:
```

ループが 1 回も回らなかったときは、ここに来ます。`default` が `_marker`、つまり省略されたままなら、エラーにする必要があります。

### 3. エラーにするか、既定値を返す

```python:line-numbers=273
        raise ValueError(
            'first() was called on an empty iterable, '
            'and no default value was provided.'
        )
    return default
```

省略されていたら `ValueError` を出します。省略されていなければ、`default` を返します。

## ここがすごい

### 1 件だけ読む

値を作るのが重い（ネットワークから取る、大きなファイルを読むなど）ジェネレータでも、先頭の 1 件だけを読んで止まります。docstring にあるとおり、「任意の 1 つが欲しい」ときに向いています。

### `None` を既定値にできる

`default=None` を普通の既定値にすると、「`None` を渡したのか、何も渡さなかったのか」が区別できません。`_marker` という専用の目印を使うことで、`None` も立派な既定値として扱えます。

### エラーの文章に理由を書く

`first() was called on an empty iterable` と、どの関数で何が起きたかをメッセージに書いています。呼び出し側がすぐに原因を理解できます。

## まとめ

- 先頭の 1 つだけ欲しいときは、`for` の中で `return` すると、残りを読まずに済む。
- 「省略された」を表す専用の目印を使うと、`None` を既定値にできる。
- 空のときの扱いは、既定値とエラーの 2 通りを用意すると使いやすい。
