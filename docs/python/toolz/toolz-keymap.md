---
title: 辞書のキーだけに関数を当てて、新しい辞書を作る
description: toolz.keymap は、辞書の値はそのままに、各キーへ関数を当てた新しい辞書を返す。元の辞書は変えず、map で変換したキーと値を zip で組み直す。factory を渡すと、返す辞書の型も選べる。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/dicttoolz.py
lines: [89, 102]
function: keymap
difficulty: 1
format: 2
tags: [関数型, 可読性]
---

## ひとことで

`keymap(func, d)` は、**値はそのままに、キーへ関数を当てた新しい辞書** を返す関数です。
`keymap(str.lower, {'Alice': [20, 15, 30]})` は `{'alice': [20, 15, 30]}` を返します。キーの表記を統一したいときに使えます。

## コード

::: code-group

```python:line-numbers=89 [日本語訳]
def keymap(func, d, factory=dict):
    """ 辞書のキーに関数を適用する

    >>> bills = {"Alice": [20, 15, 30], "Bob": [10, 35]}
    >>> keymap(str.lower, bills)  # doctest: +SKIP
    {'alice': [20, 15, 30], 'bob': [10, 35]}

    See Also:
        valmap
        itemmap
    """
    rv = factory()
    rv.update(zip(map(func, d.keys()), d.values()))
    return rv
```

```python:line-numbers=89 [原文]
def keymap(func, d, factory=dict):
    """ Apply function to keys of dictionary

    >>> bills = {"Alice": [20, 15, 30], "Bob": [10, 35]}
    >>> keymap(str.lower, bills)  # doctest: +SKIP
    {'alice': [20, 15, 30], 'bob': [10, 35]}

    See Also:
        valmap
        itemmap
    """
    rv = factory()
    rv.update(zip(map(func, d.keys()), d.values()))
    return rv
```

:::

## 前提知識

- **キー**: 辞書で値を探すための名前です。
- **`str.lower`**: 文字列の大文字を小文字にする関数です。関数を値として渡せます。
- **`factory`**: 結果の辞書を作る関数です。既定値は `dict` です。

## 何をしているか

### 1. 結果の辞書を作る

```python:line-numbers=100
    rv = factory()
```

`factory()` で、結果を入れる空の辞書を用意します。

### 2. 変換したキーと、元の値を組にする

```python:line-numbers=101
    rv.update(zip(map(func, d.keys()), d.values()))
```

`map(func, d.keys())` で、各キーに関数を当てた列を作ります。`d.values()` は、元の値の列のままです。`zip` で組にして、新しい辞書に入れます。

### 3. 結果を返す

```python:line-numbers=102
    return rv
```

元の辞書 `d` は変えずに、変換後の辞書を返します。

## ここがすごい

### キーの衝突に注意する

変換後のキーが同じになると、後から入った値が前の値を上書きします。`str.lower` で `'Alice'` と `'alice'` が同じになるような場合は、片方の値が消えます。

### `valmap` と対になる

`valmap` は値に関数を当て、`keymap` はキーに関数を当てます。どちらも、元の辞書を変えず、同じ書き方で使えます。

### 関数を値として渡す

`str.lower` のような既存の関数を、そのまま引数に渡せます。変換の内容を、名前付きの関数で読み取れる形になります。

## まとめ

- キーだけを変えたい辞書は、変換したキーと元の値を `zip` で組み直すと作れる。
- 変換後のキーが重なると、値が上書きされるので注意する。
- `valmap` と対になるので、用途に応じて選べる。
