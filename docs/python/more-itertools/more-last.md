---
title: 末尾の要素を、全部読まずに取る方法を選ぶ
description: more_itertools.last は、イテラブルの最後の要素を返す。__reversed__ を持つものは後ろから、持たないものは長さ 1 の deque で末尾だけ残して取り出す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [280, 302]
function: last
difficulty: 2
format: 2
tags: [イテレータ, データ構造, 防御的プログラミング]
---

## ひとことで

`last(iterable, default)` は、**イテラブルの最後の要素** を返す関数です。
`last([0, 1, 2, 3])` は `3` を返します。空のときは `default` を返し、`default` も無ければ `ValueError` を出します。

## コード

::: code-group

```python:line-numbers=280 [日本語訳]
def last(iterable, default=_marker):
    """*iterable* の最後の要素を返す。空なら *default* を返す。
    empty.

        >>> last([0, 1, 2, 3])
        3
        >>> last([], 'some default')
        'some default'

    If *default* is not provided and there are no items in the iterable,
    raise ``ValueError``.
    """
    try:
        if getattr(iterable, '__reversed__', None):
            return next(reversed(iterable))
        return deque(iterable, maxlen=1)[-1]
    except (IndexError, StopIteration):
        if default is _marker:
            raise ValueError(
                'last() was called on an empty iterable, '
                'and no default value was provided.'
            )
        return default
```

```python:line-numbers=280 [原文]
def last(iterable, default=_marker):
    """Return the last item of *iterable*, or *default* if *iterable* is
    empty.

        >>> last([0, 1, 2, 3])
        3
        >>> last([], 'some default')
        'some default'

    If *default* is not provided and there are no items in the iterable,
    raise ``ValueError``.
    """
    try:
        if getattr(iterable, '__reversed__', None):
            return next(reversed(iterable))
        return deque(iterable, maxlen=1)[-1]
    except (IndexError, StopIteration):
        if default is _marker:
            raise ValueError(
                'last() was called on an empty iterable, '
                'and no default value was provided.'
            )
        return default
```

:::

`deque` は、両端から出し入れできる箱のような型で、`collections` モジュールにあります。

## 前提知識

- **`__reversed__`**: 後ろから順に取り出すための特別なメソッドです。リストや範囲（`range`）は持っています。
- **`reversed(x)`**: 後ろから順に要素を返すイテレータを作ります。
- **`deque(iterable, maxlen=1)`**: 最大 1 件しか入らない箱です。新しい要素が入ると、古い要素は自動で捨てられます。
- **`IndexError` と `StopIteration`**: 空の並びから取り出そうとしたときに出る例外です。

## 何をしているか

### 1. 後ろから取れる場合

```python:line-numbers=293
        if getattr(iterable, '__reversed__', None):
            return next(reversed(iterable))
```

`__reversed__` を持っていれば、`reversed` で後ろから 1 つ取るだけで済みます。`next` で最初に取れたものが、最後の要素です。

### 2. 後ろから取れない場合

```python:line-numbers=295
        return deque(iterable, maxlen=1)[-1]
```

ジェネレータなど、後ろから読めないものは、全部を読みながら `deque(maxlen=1)` に流し込みます。箱には最後の 1 件しか残らないので、`[-1]` で取り出せます。

### 3. 空だったときの処理

```python:line-numbers=296
    except (IndexError, StopIteration):
        if default is _marker:
            raise ValueError(
                'last() was called on an empty iterable, '
                'and no default value was provided.'
            )
        return default
```

空のときは `IndexError` か `StopIteration` が出ます。それを受け止めて、`default` を返すか、`ValueError` を出します。

## ここがすごい

### 方法を入力の性質で切り替える

後ろから読めるものは、全部を読まずに済みます。読めないものは仕方なく全部を読みますが、メモリは 1 件分しか使いません。入力の性質に合わせて、2 つの方法を選んでいます。

### `deque(maxlen=1)` で末尾だけ残す

全部をリストに保存する代わりに、箱の大きさを 1 にします。どれだけ長くても、覚えるのは最後の 1 件だけです。

### 例外をまとめて受け止める

`IndexError`（deque が空のとき）と `StopIteration`（`next` が空のとき）を、1 つの `except` でまとめて扱っています。空の場合の処理が、1 か所で済みます。

## まとめ

- 後ろから読める入力は、その方向から 1 件取るのが速い。
- 読めない入力は、長さ 1 の `deque` で末尾だけを残すとメモリを使わない。
- 空の場合は、既定値とエラーを同じ場所で分けて扱うと読みやすい。
