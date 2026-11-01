---
title: 要素をキーごとに組にして、辞書に分けて入れる
description: toolz.groupby は、列の要素をキー関数で分類し、同じキーの要素をまとめたリストを辞書にして返す。キーが関数でなければ、要素の中の項目を使う。defaultdict と、追加関数を値として持つ工夫で、リストへの追加を簡潔に書いている。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [71, 104]
function: groupby
difficulty: 3
format: 2
tags: [関数型, データ構造, 可読性]
---

## ひとことで

`groupby(key, seq)` は、**列の要素を、キーの値ごとにまとめた辞書** を返す関数です。
`groupby(len, ['Bob', 'Dan', 'Alice'])` は、長さ 3 の `Bob` と `Dan` を 1 つのリストに、長さ 5 の `Alice` を別のリストにまとめて返します。

## コード

::: code-group

```python:line-numbers=71 [日本語訳]
def groupby(key, seq):
    """ 列の要素を、キー関数で組に分ける

    >>> names = ['Alice', 'Bob', 'Charlie', 'Dan', 'Edith', 'Frank']
    >>> groupby(len, names)  # doctest: +SKIP
    {3: ['Bob', 'Dan'], 5: ['Alice', 'Edith', 'Frank'], 7: ['Charlie']}

    >>> iseven = lambda x: x % 2 == 0
    >>> groupby(iseven, [1, 2, 3, 4, 5, 6, 7, 8])  # doctest: +SKIP
    {False: [1, 3, 5, 7], True: [2, 4, 6, 8]}

    キーが関数でなければ、要素の中の項目で分ける。

    >>> groupby('gender', [{'name': 'Alice', 'gender': 'F'},
    ...                    {'name': 'Bob', 'gender': 'M'},
    ...                    {'name': 'Charlie', 'gender': 'M'}]) # doctest:+SKIP
    {'F': [{'gender': 'F', 'name': 'Alice'}],
     'M': [{'gender': 'M', 'name': 'Bob'},
           {'gender': 'M', 'name': 'Charlie'}]}

    ``itertools.groupby`` とは別物なので注意。

    See Also:
        countby
    """
    if not callable(key):
        key = getter(key)
    d = collections.defaultdict(lambda: [].append)
    for item in seq:
        d[key(item)](item)
    rv = {}
    for k, v in d.items():
        rv[k] = v.__self__
    return rv
```

```python:line-numbers=71 [原文]
def groupby(key, seq):
    """ Group a collection by a key function

    >>> names = ['Alice', 'Bob', 'Charlie', 'Dan', 'Edith', 'Frank']
    >>> groupby(len, names)  # doctest: +SKIP
    {3: ['Bob', 'Dan'], 5: ['Alice', 'Edith', 'Frank'], 7: ['Charlie']}

    >>> iseven = lambda x: x % 2 == 0
    >>> groupby(iseven, [1, 2, 3, 4, 5, 6, 7, 8])  # doctest: +SKIP
    {False: [1, 3, 5, 7], True: [2, 4, 6, 8]}

    Non-callable keys imply grouping on a member.

    >>> groupby('gender', [{'name': 'Alice', 'gender': 'F'},
    ...                    {'name': 'Bob', 'gender': 'M'},
    ...                    {'name': 'Charlie', 'gender': 'M'}]) # doctest:+SKIP
    {'F': [{'gender': 'F', 'name': 'Alice'}],
     'M': [{'gender': 'M', 'name': 'Bob'},
           {'gender': 'M', 'name': 'Charlie'}]}

    Not to be confused with ``itertools.groupby``

    See Also:
        countby
    """
    if not callable(key):
        key = getter(key)
    d = collections.defaultdict(lambda: [].append)
    for item in seq:
        d[key(item)](item)
    rv = {}
    for k, v in d.items():
        rv[k] = v.__self__
    return rv
```

:::

## 前提知識

- **キー関数**: 各要素を受け取り、分類に使う値を返す関数です。
- **`defaultdict`**: 存在しない鍵にアクセスしたとき、既定の値を自動で作る辞書です。
- **束縛されたメソッド**: `obj.method` のように、特定のオブジェクトに結びついた関数です。`__self__` で、そのオブジェクトを取り出せます。
- **`itertools.groupby`**: 隣り合う要素だけを組にする、別の標準関数です。ここでは、列全体を分類します。

## 何をしているか

### 1. キーが関数でなければ、項目として扱う

```python:line-numbers=96
    if not callable(key):
        key = getter(key)
```

キーが関数でなければ、`getter` で、その添字の値を取り出す関数に変えます。辞書の要素をキーで分けるような使い方ができます。

### 2. 値を「追加する関数」として作る

```python:line-numbers=98
    d = collections.defaultdict(lambda: [].append)
```

`defaultdict` の既定値を、`[].append` を返す関数にします。新しいキーが来ると、空のリストの `append` が値として登録されます。

### 3. 要素を、キーに対応する関数で追加する

```python:line-numbers=99
    for item in seq:
        d[key(item)](item)
```

各要素について、キーを求め、その値に登録された `append` を要素を渡して呼びます。これで、同じキーの要素が同じリストに集まります。

### 4. リストを取り出して返す

```python:line-numbers=101
    rv = {}
    for k, v in d.items():
        rv[k] = v.__self__
    return rv
```

登録されていた `append` の `__self__` から、元のリストを取り出します。それを、通常の辞書に詰めて返します。

## ここがすごい

### 追加の関数を値にする工夫

`defaultdict` の値に `append` を入れておくと、「まだリストがなければ作る」と「要素を追加する」を、1 つの呼び出しにまとめられます。`if` の分岐を書かずに済みます。

### 1 回の走査で分類できる

列を一度だけ読み、要素をキーの場所へ振り分けます。同じ列を何度も探す必要がありません。

### `itertools.groupby` との違い

標準の `itertools.groupby` は、隣り合う同じキーだけをまとめます。この関数は、列全体から同じキーを集めます。並びを事前に揃える必要がありません。

## まとめ

- キーごとのリストを、`defaultdict` と `append` の組み合わせで 1 回の走査で作れる。
- キーが関数でなければ項目として扱うので、辞書の列も分類できる。
- 標準の `groupby` と違い、隣り合わなくても同じキーを集める。
