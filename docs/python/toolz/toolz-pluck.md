---
title: 各要素の決まった場所の値を、まとめて取り出す
description: toolz.pluck は、列の各要素（辞書やリストなど）から、指定したキーや添字の値を取り出す。1 つを指定すると値を、リストで指定すると値のタプルを返す。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [772, 801]
function: pluck
difficulty: 1
format: 2
tags: [イテレータ, データ構造, 関数型]
---

## ひとことで

`pluck(ind, seqs)` は、**列の各要素から、決まったキーや添字の値だけを取り出す** 関数です。
`list(pluck('name', [{'id': 1, 'name': 'Cheese'}, {'id': 2, 'name': 'Pies'}]))` は `['Cheese', 'Pies']` になります。辞書の `name` だけが並びます。

## コード

::: code-group

```python:line-numbers=772 [日本語訳]
def pluck(ind, seqs, default=no_default):
    """ 列の各要素から、1 つまたは複数の要素を取り出す。

    ``pluck`` maps ``itertoolz.get`` over a sequence and returns one or more
    elements of each item in the sequence.

    This is equivalent to running `map(curried.get(ind), seqs)`

    ``ind`` can be either a single string/index or a list of strings/indices.
    ``seqs`` should be sequence containing sequences or dicts.

    e.g.

    >>> data = [{'id': 1, 'name': 'Cheese'}, {'id': 2, 'name': 'Pies'}]
    >>> list(pluck('name', data))
    ['Cheese', 'Pies']
    >>> list(pluck([0, 1], [[1, 2, 3], [4, 5, 7]]))
    [(1, 2), (4, 5)]

    See Also:
        get
        map
    """
    if default == no_default:
        get = getter(ind)
        return map(get, seqs)
    elif isinstance(ind, list):
        return (tuple(_get(item, seq, default) for item in ind)
                for seq in seqs)
    return (_get(ind, seq, default) for seq in seqs)
```

```python:line-numbers=772 [原文]
def pluck(ind, seqs, default=no_default):
    """ plucks an element or several elements from each item in a sequence.

    ``pluck`` maps ``itertoolz.get`` over a sequence and returns one or more
    elements of each item in the sequence.

    This is equivalent to running `map(curried.get(ind), seqs)`

    ``ind`` can be either a single string/index or a list of strings/indices.
    ``seqs`` should be sequence containing sequences or dicts.

    e.g.

    >>> data = [{'id': 1, 'name': 'Cheese'}, {'id': 2, 'name': 'Pies'}]
    >>> list(pluck('name', data))
    ['Cheese', 'Pies']
    >>> list(pluck([0, 1], [[1, 2, 3], [4, 5, 7]]))
    [(1, 2), (4, 5)]

    See Also:
        get
        map
    """
    if default == no_default:
        get = getter(ind)
        return map(get, seqs)
    elif isinstance(ind, list):
        return (tuple(_get(item, seq, default) for item in ind)
                for seq in seqs)
    return (_get(ind, seq, default) for seq in seqs)
```

:::

`getter` は、キーや添字を指定すると、その位置の値を取り出す関数を作ります。`_get` は、取り出しに失敗したときに既定値を返すための内部関数です。

## 前提知識

- **キー**: 辞書で値を取り出すための名前です。`{'name': 'Cheese'}` の `'name'` がキーです。
- **添字（インデックス）**: リストの何番目かを表す数です。`[1, 2, 3]` の `1` は、添字 0 の値です。
- **`map(f, xs)`**: 各要素に `f` を当てた結果を並べるイテレータです。
- **`default`**: キーや添字がないときに、代わりに返す値です。

## 何をしているか

### 1. 既定値がない場合

```python:line-numbers=795
    if default == no_default:
        get = getter(ind)
        return map(get, seqs)
```

`getter(ind)` で、キーや添字の値を取り出す関数を作ります。それを `map` で全要素に当てます。

### 2. 指定が複数（リスト）のとき

```python:line-numbers=798
    elif isinstance(ind, list):
        return (tuple(_get(item, seq, default) for item in ind)
                for seq in seqs)
```

`ind` がリストなら、各要素から複数の値を取り出し、タプルにします。docstring の `pluck([0, 1], [[1, 2, 3], [4, 5, 7]])` は、`(1, 2)` と `(4, 5)` になります。

### 3. 既定値を指定した場合

```python:line-numbers=801
    return (_get(ind, seq, default) for seq in seqs)
```

既定値があるときは、キーがなくても例外にせず、既定値を返します。

## ここがすごい

### 関数を書かずに、値を取り出せる

`lambda x: x['name']` と書く代わりに、キーの名前だけを渡します。よくある取り出しを、短く表せます。

### 1 つでも複数でも同じ関数で

キーが 1 つなら値そのもの、リストなら値のタプルと、指定の形で結果の形が決まります。呼ぶ側の書き方を変えずに、必要な形を選べます。

### 既定値で壊れない

キーがない要素が混ざっていても、既定値を指定すれば例外で止まりません。データのばらつきに強い書き方です。

## まとめ

- 各要素から決まった値を取り出すなら、キーや添字を渡す `pluck` が短く書ける。
- 複数を指定すると、タプルでまとめて取り出せる。
- 既定値を指定すると、データのばらつきを許せる。
