---
title: 逆順にできないイテラブルも、一度リストに溜めて逆順にする
description: more_itertools.always_reversible は、reversed が使えないジェネレータなどでも、後ろから順に出せるようにする。対応していればそのまま reversed を返し、そうでなければ一度リストに溜めてから逆順にする。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [2843, 2858]
function: always_reversible
difficulty: 2
format: 2
tags: [イテレータ, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`always_reversible(iterable)` は、**どんなイテラブルでも後ろから順に出せるようにする** 関数です。
`always_reversible(x for x in range(3))` は、`2, 1, 0` の順に出します。組み込みの `reversed` は、ジェネレータに使うとエラーになります。

## コード

::: code-group

```python:line-numbers=2843 [日本語訳]
def always_reversible(iterable):
    """:func:`reversed` を拡張し、すべてのイテラブルに使えるようにしたもの。
    just those which implement the ``Reversible`` or ``Sequence`` protocols.

        >>> print(*always_reversible(x for x in range(3)))
        2 1 0

    If the iterable is already reversible, this function returns the
    result of :func:`reversed()`. If the iterable is not reversible,
    this function will cache the remaining items in the iterable and
    yield them in reverse order, which may require significant storage.
    """
    try:
        return reversed(iterable)
    except TypeError:
        return reversed(list(iterable))
```

```python:line-numbers=2843 [原文]
def always_reversible(iterable):
    """An extension of :func:`reversed` that supports all iterables, not
    just those which implement the ``Reversible`` or ``Sequence`` protocols.

        >>> print(*always_reversible(x for x in range(3)))
        2 1 0

    If the iterable is already reversible, this function returns the
    result of :func:`reversed()`. If the iterable is not reversible,
    this function will cache the remaining items in the iterable and
    yield them in reverse order, which may require significant storage.
    """
    try:
        return reversed(iterable)
    except TypeError:
        return reversed(list(iterable))
```

:::

## 前提知識

- **`reversed(x)`**: 後ろから順に要素を返すイテレータを作る組み込み関数です。`x` が `__reversed__` を持つか、`__len__` と `__getitem__` を持つ必要があります。
- **ジェネレータ**: 値を 1 つずつ作る関数です。後ろから読むことができません。先頭から順にしか作れないからです。
- **`TypeError`**: 型が合わないときに出る例外です。`reversed` がジェネレータに使われると、この例外が出ます。
- **`list(iterable)`**: 全部の要素を取り出して、リストに入れます。

## 何をしているか

### 1. 逆順にできるなら、そのまま使う

```python:line-numbers=2855
    try:
        return reversed(iterable)
```

組み込みの `reversed` が使えれば、それをそのまま返します。リストや範囲は、ここで終わります。

### 2. 逆順にできないなら、溜めてから逆にする

```python:line-numbers=2857
    except TypeError:
        return reversed(list(iterable))
```

`TypeError` が出たら、要素を全部 `list` に入れてから `reversed` をかけます。ジェネレータの要素はすべてリストに残るので、後ろから読めるようになります。

## ここがすごい

### 試してみて、だめなら別の方法

「逆順にできるか」を前もって調べる代わりに、`reversed` を実際に試して、失敗したら別の方法に切り替えています。型を調べるより、動くかどうかで判断する書き方です。

### 溜めるコストを明示する

docstring にあるとおり、この方法は残りの要素をすべてメモリに溜めます。大きなジェネレータに使うと、メモリを多く使います。便利さと引き換えに、その代償を関数の説明に書いています。

### 組み込みの動きをそのまま活かす

逆順にできるものは、本物の `reversed` の結果をそのまま返します。特別な型を作らないので、既存の使い方と混ざっても困りません。

## まとめ

- 逆順にできない入力は、一度リストに溜めると後ろから読める。
- 型を調べるより、実際に試して失敗したら別の方法に切り替えるほうが柔軟。
- 便利な方法は、溜めるメモリの代償を説明に書いておく。
