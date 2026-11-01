---
title: 変換した結果が None のものを捨てて、残りを出す
description: more_itertools.filter_map は、各要素に関数を当て、結果が None でないものだけを出す。map と filter を 1 回の処理にまとめたもので、変換と絞り込みを同時に書ける。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [5158, 5169]
function: filter_map
difficulty: 1
format: 2
tags: [イテレータ, 関数型, イディオム]
---

## ひとことで

`filter_map(func, iterable)` は、**各要素を変換しながら、変換できなかったもの（結果が `None` のもの）を捨てる** 関数です。
`filter_map(lambda s: int(s) if s.isnumeric() else None, ['1', 'a', '2'])` は、`1` と `2` を出します。

## コード

::: code-group

```python:line-numbers=5158 [日本語訳]
def filter_map(func, iterable):
    """*iterable* のすべての要素に *func* を当て、結果が ``None`` でないものだけを出す。
    are not ``None``.

    >>> elems = ['1', 'a', '2', 'b', '3']
    >>> list(filter_map(lambda s: int(s) if s.isnumeric() else None, elems))
    [1, 2, 3]
    """
    for x in iterable:
        y = func(x)
        if y is not None:
            yield y
```

```python:line-numbers=5158 [原文]
def filter_map(func, iterable):
    """Apply *func* to every element of *iterable*, yielding only those which
    are not ``None``.

    >>> elems = ['1', 'a', '2', 'b', '3']
    >>> list(filter_map(lambda s: int(s) if s.isnumeric() else None, elems))
    [1, 2, 3]
    """
    for x in iterable:
        y = func(x)
        if y is not None:
            yield y
```

:::

## 前提知識

- **`map(f, xs)`**: 各要素に `f` を当てた結果を並べます。すべての要素が結果になります。
- **`filter(pred, xs)`**: 条件に合う要素だけを残します。変換はしません。
- **`None`**: 「値がない」ことを表す特別な値です。ここでは「捨てる」の合図として使われています。
- **`isnumeric()`**: 文字列が数字だけでできているかを調べるメソッドです。

## 何をしているか

### 1. 要素に関数を当てる

```python:line-numbers=5166
    for x in iterable:
        y = func(x)
```

各要素 `x` に `func` を当てて、結果を `y` とします。

### 2. `None` でなければ出す

```python:line-numbers=5168
        if y is not None:
            yield y
```

結果が `None` でなければ、`y` を出します。`None` の場合は、何も出さずに次の要素へ進みます。

## ここがすごい

### 変換と絞り込みを 1 回の処理で

`map` で変換して、`filter` で捨てると、2 回の処理になります。この関数は、変換の結果そのものを判定に使うので、1 回のループで済みます。

### `None` を捨ての合図にする

関数の中で「変換できなければ `None` を返す」と書くだけで、捨てる処理を呼ぶ側が書かずに済みます。例外を使わずに、失敗を表せます。

### 注意: `None` は必ず捨てられる

`None` が本当の値として必要な場合は、この関数は使えません。捨てる値が何かを、最初に決めておく必要があります。

## まとめ

- 変換と絞り込みは、結果が `None` かどうかで 1 回のループにまとめられる。
- 「失敗は `None`」と決めると、例外を使わない書き方ができる。
- `None` が正しい値であるデータには使わない。
