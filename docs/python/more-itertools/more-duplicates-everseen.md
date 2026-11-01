---
title: 初めて現れた値を飛ばして、2 回目以降の重複だけを出す
description: more_itertools.duplicates_everseen は、同じ値が 2 回目以降に現れたものだけを順に出す。集合（set）で見た値を覚え、比べられない型のときは list で覚える。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [4783, 4815]
function: duplicates_everseen
difficulty: 2
format: 2
tags: [イテレータ, データ構造, アルゴリズム]
---

## ひとことで

`duplicates_everseen(iterable)` は、**2 回目以降に現れた要素だけを出す** 関数です。
`duplicates_everseen('mississippi')` は `['s', 'i', 's', 's', 'i', 'p', 'i']` を出します。初めて現れた `m`、`i`、`s`、`p` は出しません。

## コード

::: code-group

```python:line-numbers=4783 [日本語訳]
def duplicates_everseen(iterable, key=None):
    """重複した要素を、最初に現れたあとで出す。

    >>> list(duplicates_everseen('mississippi'))
    ['s', 'i', 's', 's', 'i', 'p', 'i']
    >>> list(duplicates_everseen('AaaBbbCccAaa', str.lower))
    ['a', 'a', 'b', 'b', 'c', 'c', 'A', 'a', 'a']

    This function is analogous to :func:`unique_everseen` and is subject to
    the same performance considerations.

    If you would like each duplicate to only appear once, much like ``uniq -d``
    in the Unix shell or ``Itertools::duplicates`` from the Rust ``itertools``
    crate, pass the return value of this function into :func:`unique_everseen`
    with the same ``key``.

    """
    seen_set = set()
    seen_list = []
    use_key = key is not None

    for element in iterable:
        k = key(element) if use_key else element
        try:
            if k not in seen_set:
                seen_set.add(k)
            else:
                yield element
        except TypeError:
            if k not in seen_list:
                seen_list.append(k)
            else:
                yield element
```

```python:line-numbers=4783 [原文]
def duplicates_everseen(iterable, key=None):
    """Yield duplicate elements after their first appearance.

    >>> list(duplicates_everseen('mississippi'))
    ['s', 'i', 's', 's', 'i', 'p', 'i']
    >>> list(duplicates_everseen('AaaBbbCccAaa', str.lower))
    ['a', 'a', 'b', 'b', 'c', 'c', 'A', 'a', 'a']

    This function is analogous to :func:`unique_everseen` and is subject to
    the same performance considerations.

    If you would like each duplicate to only appear once, much like ``uniq -d``
    in the Unix shell or ``Itertools::duplicates`` from the Rust ``itertools``
    crate, pass the return value of this function into :func:`unique_everseen`
    with the same ``key``.

    """
    seen_set = set()
    seen_list = []
    use_key = key is not None

    for element in iterable:
        k = key(element) if use_key else element
        try:
            if k not in seen_set:
                seen_set.add(k)
            else:
                yield element
        except TypeError:
            if k not in seen_list:
                seen_list.append(k)
            else:
                yield element
```

:::

## 前提知識

- **集合（set）**: 同じ値を 2 つ持たない入れ物です。`in` で「含まれているか」を素早く調べられます。
- **ハッシュ可能（hashable）**: 集合に入れられる型のことです。数や文字列はハッシュ可能ですが、リストや辞書はそうではありません。
- **`TypeError`**: ハッシュできない値を集合に入れようとしたときに出る例外です。
- **`key`**: 比べる前に値を変換する関数です。`str.lower` を使うと、大文字と小文字を同じとみなします。

## 何をしているか

### 1. 比べる値を決める

```python:line-numbers=4804
    for element in iterable:
        k = key(element) if use_key else element
```

`key` があれば、それで変換した値（`k`）で重複を判定します。なければ、要素そのものを使います。

### 2. 集合に入っていなければ覚える、いれば出す

```python:line-numbers=4806
        try:
            if k not in seen_set:
                seen_set.add(k)
            else:
                yield element
```

`k` が集合にまだなければ、覚えておきます。すでにあれば、2 回目以降の重複なので、`element` を出します。

### 3. ハッシュできないときは、リストで覚える

```python:line-numbers=4811
        except TypeError:
            if k not in seen_list:
                seen_list.append(k)
            else:
                yield element
```

`TypeError` が出たら、リストで同じことをします。リストは `in` の検索が遅いですが、どんな型でも覚えられます。

## ここがすごい

### 集合で、高速に重複を見つける

「これまでに見た値か」を、集合で 1 回の検索で調べられます。全部を比べ直すより、大きな入力で速くなります。

### 型によって覚える場所を変える

集合に入れられない値は、リストに覚えます。遅くなりますが、どんな型でも重複を判定できます。`try` と `except` で、型の違いを 1 か所にまとめています。

### 2 回目以降だけを出す

最初に現れたものは出さず、2 回目からを出すので、「重複している箇所」を見つけるのに向いています。docstring にあるとおり、`unique_everseen` と組み合わせると、重複した値を 1 つずつだけ出せます。

## まとめ

- 重複の判定は、覚えた値の集合で調べると速い。
- 集合に入れられない型は、リストで覚えて扱える。
- 最初の 1 回を飛ばすと、重複だけを取り出せる。
