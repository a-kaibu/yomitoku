---
title: 辞書の値だけに関数を当てて、新しい辞書を作る
description: toolz.valmap は、辞書のキーはそのままに、各値へ関数を当てた新しい辞書を返す。元の辞書は変えず、zip で keys と map の結果を組み直して作る。factory を渡すと、返す辞書の型も選べる。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/dicttoolz.py
lines: [73, 86]
function: valmap
difficulty: 1
format: 2
tags: [関数型, 可読性]
---

## ひとことで

`valmap(func, d)` は、**辞書のキーはそのままに、値へ関数を当てた新しい辞書** を返す関数です。
`valmap(sum, {'Alice': [20, 15, 30], 'Bob': [10, 35]})` は、`{'Alice': 65, 'Bob': 45}` を返します。

## コード

::: code-group

```python:line-numbers=73 [日本語訳]
def valmap(func, d, factory=dict):
    """ 辞書の値に関数を適用する

    >>> bills = {"Alice": [20, 15, 30], "Bob": [10, 35]}
    >>> valmap(sum, bills)  # doctest: +SKIP
    {'Alice': 65, 'Bob': 45}

    See Also:
        keymap
        itemmap
    """
    rv = factory()
    rv.update(zip(d.keys(), map(func, d.values())))
    return rv
```

```python:line-numbers=73 [原文]
def valmap(func, d, factory=dict):
    """ Apply function to values of dictionary

    >>> bills = {"Alice": [20, 15, 30], "Bob": [10, 35]}
    >>> valmap(sum, bills)  # doctest: +SKIP
    {'Alice': 65, 'Bob': 45}

    See Also:
        keymap
        itemmap
    """
    rv = factory()
    rv.update(zip(d.keys(), map(func, d.values())))
    return rv
```

:::

## 前提知識

- **辞書（dict）**: キーと値の組を持つ、Python の基本的なデータ構造です。
- **関数を当てる**: 関数に値を渡して、その結果を受け取ることです。`sum` はリストの合計を返します。
- **`zip` と `map`**: 2 つの列を組にする関数と、列の各要素に関数を当てる関数です。
- **`factory`**: 結果の辞書を作る関数です。既定値は `dict` で、`OrderedDict` などに置き換えられます。

## 何をしているか

### 1. 新しい辞書を作る

```python:line-numbers=84
    rv = factory()
```

`factory()` で、結果を入れる空の辞書を作ります。既定では普通の `dict` です。

### 2. キーと、変換した値を組にする

```python:line-numbers=85
    rv.update(zip(d.keys(), map(func, d.values())))
```

`d.keys()` はそのままのキーの列です。`map(func, d.values())` は、各値に `func` を当てた列です。`zip` で 2 つを組にし、新しい辞書に入れます。

### 3. 結果を返す

```python:line-numbers=86
    return rv
```

元の辞書 `d` には何もしていないので、変換後の辞書だけが返ります。

## ここがすごい

### 元の辞書を変えない

値を書き換えるのではなく、新しい辞書を作ります。同じ辞書を別の場所でも使い続けられるので、副作用の心配が要りません。

### キーはそのままで値だけ変える

キーの並びや名前を変えずに、値だけを変換します。集計結果を、人ごとの表に直すような場面で使えます。

### 返す型を選べる

`factory` を渡すと、結果の辞書の型を変えられます。並びを保ちたいときは `OrderedDict` を渡す、といった使い方ができます。

## まとめ

- 値だけに関数を当てるなら、キーと変換した値を `zip` で組み直すと書ける。
- 元の辞書を変えないので、安全に使い回せる。
- `factory` で返す型を選べるので、用途に合わせられる。
