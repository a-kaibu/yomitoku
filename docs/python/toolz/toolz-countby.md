---
title: 要素をキーで分類して、それぞれの個数を数える
description: toolz.countby は、列の各要素をキー関数で分類し、キーごとの個数を辞書にして返す。キーが関数でなければ添字として扱い、内部で frequencies を使って数える。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/recipes.py
lines: [8, 23]
function: countby
difficulty: 2
format: 2
tags: [関数型, アルゴリズム, 可読性]
---

## ひとことで

`countby(key, seq)` は、**列の要素を、キーごとに分けて個数を数える** 関数です。
`countby(len, ['cat', 'mouse', 'dog'])` は、長さ 3 が 2 個、長さ 5 が 1 個なので、`{3: 2, 5: 1}` を返します。

## コード

::: code-group

```python:line-numbers=8 [日本語訳]
def countby(key, seq):
    """ 列の要素を、キー関数で分けて数える

    >>> countby(len, ['cat', 'mouse', 'dog'])
    {3: 2, 5: 1}

    >>> def iseven(x): return x % 2 == 0
    >>> countby(iseven, [1, 2, 3])  # doctest:+SKIP
    {True: 1, False: 2}

    See Also:
        groupby
    """
    if not callable(key):
        key = getter(key)
    return frequencies(map(key, seq))
```

```python:line-numbers=8 [原文]
def countby(key, seq):
    """ Count elements of a collection by a key function

    >>> countby(len, ['cat', 'mouse', 'dog'])
    {3: 2, 5: 1}

    >>> def iseven(x): return x % 2 == 0
    >>> countby(iseven, [1, 2, 3])  # doctest:+SKIP
    {True: 1, False: 2}

    See Also:
        groupby
    """
    if not callable(key):
        key = getter(key)
    return frequencies(map(key, seq))
```

:::

## 前提知識

- **キー関数**: 各要素を受け取り、分類に使う値を返す関数です。`len` のような組み込み関数も使えます。
- **添字で取るキー**: 要素の中の一部（例えば最初の値）を、キーとして使う書き方です。
- **`frequencies`**: 要素ごとの出現回数を辞書にする、toolz の関数です。
- **`map`**: 列の各要素に関数を当てて、その結果を順に出す組み込み関数です。

## 何をしているか

### 1. キーが関数でなければ、添字として扱う

```python:line-numbers=21
    if not callable(key):
        key = getter(key)
```

`callable(key)` で、渡されたものが関数かを確かめます。関数でなければ、`getter` で添字を取り出す関数に変えます。たとえば `countby(0, rows)` のように書けます。

### 2. 各要素のキーを作り、数える

```python:line-numbers=23
    return frequencies(map(key, seq))
```

`map(key, seq)` で、各要素からキーを作ります。その列を `frequencies` に渡し、キーごとの個数の辞書にします。

## ここがすごい

### 数える処理を部品に任せる

個数を数えるのは `frequencies` の仕事です。`countby` は、キーを作る部分だけに集中しています。

### キーを関数でも添字でも渡せる

関数を渡せば、要素の長さや変換後の値で分けられます。添字を渡せば、タプルの一部の列で分けられます。同じ名前の引数で、両方に対応しています。

### 分類の種類が、結果の辞書の鍵になる

結果は、キーを鍵とした辞書です。キーの値の種類を変えるだけで、同じ列をいろいろな視点で数えられます。

## まとめ

- キー関数で分けて数える処理は、`map` と `frequencies` の組み合わせで書ける。
- キーが関数でなければ添字と見なす設計で、使い方の幅が広がる。
- 同じ列を、違うキーで数えると、別の視点の集計になる。
