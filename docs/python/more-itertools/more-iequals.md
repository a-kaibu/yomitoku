---
title: 型が違っても、順番どおりに同じ要素なら等しいとみなす
description: more_itertools.iequals は、リストや文字列、タプル、イテレータなど、型が違うイテラブルを要素の並びで比べる。長さが違えば、zip の strict 指定で早く False を返す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [3747, 3767]
function: iequals
difficulty: 2
format: 2
tags: [イテレータ, 防御的プログラミング, 関数型]
---

## ひとことで

`iequals(*iterables)` は、**複数のイテラブルが、同じ要素を同じ順番で持っているか** を調べる関数です。
`iequals("abc", ['a', 'b', 'c'], ('a', 'b', 'c'))` は `True` を返します。型が違っても、中身の並びが同じなら等しいとみなします。

## コード

::: code-group

```python:line-numbers=3747 [日本語訳]
def iequals(*iterables):
    """与えられた *iterables* がすべて互いに等しければ ``True`` を返す。
    which means that they contain the same elements in the same order.

    The function is useful for comparing iterables of different data types
    or iterables that do not support equality checks.

    >>> iequals("abc", ['a', 'b', 'c'], ('a', 'b', 'c'), iter("abc"))
    True

    >>> iequals("abc", "acb")
    False

    Not to be confused with :func:`all_equal`, which checks whether all
    elements of iterable are equal to each other.

    """
    try:
        return all(map(all_equal, zip(*iterables, strict=True)))
    except ValueError:
        return False
```

```python:line-numbers=3747 [原文]
def iequals(*iterables):
    """Return ``True`` if all given *iterables* are equal to each other,
    which means that they contain the same elements in the same order.

    The function is useful for comparing iterables of different data types
    or iterables that do not support equality checks.

    >>> iequals("abc", ['a', 'b', 'c'], ('a', 'b', 'c'), iter("abc"))
    True

    >>> iequals("abc", "acb")
    False

    Not to be confused with :func:`all_equal`, which checks whether all
    elements of iterable are equal to each other.

    """
    try:
        return all(map(all_equal, zip(*iterables, strict=True)))
    except ValueError:
        return False
```

:::

`all_equal` は、同じ仕組みで「すべての要素が等しいか」を調べる関数です。

## 前提知識

- **イテラブル**: `for` で 1 つずつ取り出せるものです。文字列、リスト、タプル、イテレータなどが含まれます。
- **`zip(*iterables, strict=True)`**: 各イテラブルから 1 つずつ取り出して組にします。長さが違うと、`strict=True` のとき `ValueError` になります。
- **`map(all_equal, ...)`**: 組ごとに `all_equal` を適用します。
- **`all(...)`**: すべてが真なら `True` を返します。途中で偽が出ると、そこで止まります。

## 何をしているか

### 1. 同じ位置の要素を組にする

```python:line-numbers=765
    """Yield successive distinct permutations of the elements in *iterable*.
```

`zip` が、各イテラブルの同じ位置の要素をまとめて組にします。`"abc"` と `"acb"` なら、`('a', 'a')`、`('b', 'c')`、`('c', 'b')` の組になります。

### 2. 組ごとに全部同じかを調べる

```python:line-numbers=765
    """Yield successive distinct permutations of the elements in *iterable*.
```

各組が全部同じ値なら、その位置は一致しています。`all` は、すべての組が一致しているときだけ `True` を返します。

### 3. 長さが違うときは False

```python:line-numbers=766

        >>> sorted(distinct_permutations([1, 0, 1]))
```

長さが違うと `zip(strict=True)` が `ValueError` を出すので、`False` を返します。

## ここがすごい

### 型より中身を比べる

`==` は、リストとタプルを別物として扱います。`iequals` は、要素の並びだけを見るので、型の違いに邪魔されません。docstring にあるとおり、等しさを比べられないイテレータ同士の比較にも使えます。

### 例外で長さの違いを知らせる

長さを先に数えると、イテレータを使い切ってしまいます。`zip(strict=True)` は、読みながら長さの違いを検出して `ValueError` を出すので、イテレータを 1 回だけ読めばよくなります。

### `all_equal` の組み合わせ

「同じ位置の要素がそろっているか」を、既に用意されている `all_equal` に任せています。部品を組み合わせて、新しい関数を短く書いています。

## まとめ

- 型が違っても、要素の並びだけを比べたいときは `zip` と `all` を組み合わせる。
- `zip(strict=True)` を使うと、長さの違いを例外で検出できる。
- 既存の部品（`all_equal`）を使うと、比較の仕組みを再実装しなくて済む。
