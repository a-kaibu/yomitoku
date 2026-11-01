---
title: 値を繰り返せるかを、iter を試して判定する
description: toolz.isiterable は、与えられた値が反復可能かを True か False で返す。iter を呼んで TypeError が出るかで判定するので、型の一覧を書かなくても、どんな値にも使える。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [270, 284]
function: isiterable
difficulty: 1
format: 2
tags: [防御的プログラミング, 可読性]
---

## ひとことで

`isiterable(x)` は、**値 `x` を `for` 文で繰り返せるかどうか** を返す関数です。
`isiterable([1, 2, 3])` は `True`、`isiterable(5)` は `False` を返します。文字列も、繰り返せるので `True` です。

## コード

::: code-group

```python:line-numbers=270 [日本語訳]
def isiterable(x):
    """ x は反復可能か？

    >>> isiterable([1, 2, 3])
    True
    >>> isiterable('abc')
    True
    >>> isiterable(5)
    False
    """
    try:
        iter(x)
        return True
    except TypeError:
        return False
```

```python:line-numbers=270 [原文]
def isiterable(x):
    """ Is x iterable?

    >>> isiterable([1, 2, 3])
    True
    >>> isiterable('abc')
    True
    >>> isiterable(5)
    False
    """
    try:
        iter(x)
        return True
    except TypeError:
        return False
```

:::

## 前提知識

- **反復可能（iterable）**: `for` 文で値を 1 つずつ取り出せるものです。リスト、文字列、辞書、ジェネレータなどがあたります。
- **`iter`**: 値から、順に読むイテレータを作る組み込み関数です。反復できない値には使えません。
- **`TypeError`**: 型が合わない操作をしたときに出るエラーです。

## 何をしているか

### 1. `iter` を試す

```python:line-numbers=280
    try:
        iter(x)
```

`iter(x)` が成功すれば、その値は反復可能です。成功したことを確かめるために、結果は使わずに捨てます。

### 2. 失敗したら `False` を返す

```python:line-numbers=282
        return True
    except TypeError:
        return False
```

反復できない値では `iter` が `TypeError` を出します。それを捕まえて、`False` を返します。

## ここがすごい

### 型の一覧を書かなくていい

「リストかタプルか、辞書か」と型を並べて調べると、新しい型に対応できません。`iter` を試す方法なら、どんな反復可能な型にも正しく働きます。

### 試してみるのが最も確実

型の情報だけで判断すると、ユーザーが作った型を見落とすことがあります。実際に `iter` を呼んでみるのが、一番確かな判定です。

### 文字列も反復可能

`isiterable('abc')` は `True` です。文字列を 1 文字ずつ繰り返せるので、列として扱われます。文字列を特別扱いするかどうかは、呼び出し側で決める必要があります。

## まとめ

- 反復可能かは、`iter` を試して `TypeError` が出るかで判定できる。
- 型の一覧を書かなくても、どんな値にも使える。
- 文字列も反復可能なので、用途によっては別に扱う。
