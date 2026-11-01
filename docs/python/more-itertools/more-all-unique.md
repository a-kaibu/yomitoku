---
title: ハッシュできる要素は集合で、できない要素はリストで重複を探す
description: more_itertools.all_unique は、イテラブルの要素がすべて異なるかを返す。ハッシュできる要素は集合で、ハッシュできない要素はリストで調べる。見つかった時点で False を返すので、途中で止まる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [4269, 4301]
function: all_unique
difficulty: 2
format: 2
tags: [ハッシュ, データ構造, エラー処理]
---

## ひとことで

`all_unique(iterable, key=None)` は、**イテラブルの要素がすべて異なっているか** を返す関数です。
`all_unique('ABCB')` は、`B` が 2 回出るので `False` を返します。

## コード

::: code-group

```python:line-numbers=4269 [日本語訳]
def all_unique(iterable, key=None):
    """
    ``*iterable*`` の要素がすべて一意なら ``True`` を返す（どの 2 つも
    等しくない）。

        >>> all_unique('ABCB')
        False

    *key* 関数を指定すると、それで比べる値を作る。

        >>> all_unique('ABCb')
        True
        >>> all_unique('ABCb', str.lower)
        False

    この関数は、重複する最初の要素が見つかった時点で返る。
    重複が見つかるとその時点で結果が決まる。ハッシュできる要素とできない要素が混ざったイテラブルも使えるが、
    ハッシュできない要素は遅くなる。
    """
    seenset = set()
    seenset_add = seenset.add
    seenlist = []
    seenlist_add = seenlist.append
    for element in map(key, iterable) if key else iterable:
        try:
            if element in seenset:
                return False
            seenset_add(element)
        except TypeError:
            if element in seenlist:
                return False
            seenlist_add(element)
    return True
```

```python:line-numbers=4269 [原文]
def all_unique(iterable, key=None):
    """
    Returns ``True`` if all the elements of *iterable* are unique (no two
    elements are equal).

        >>> all_unique('ABCB')
        False

    If a *key* function is specified, it will be used to make comparisons.

        >>> all_unique('ABCb')
        True
        >>> all_unique('ABCb', str.lower)
        False

    The function returns as soon as the first non-unique element is
    encountered. Iterables with a mix of hashable and unhashable items can
    be used, but the function will be slower for unhashable items.
    """
    seenset = set()
    seenset_add = seenset.add
    seenlist = []
    seenlist_add = seenlist.append
    for element in map(key, iterable) if key else iterable:
        try:
            if element in seenset:
                return False
            seenset_add(element)
        except TypeError:
            if element in seenlist:
                return False
            seenlist_add(element)
    return True
```

:::

## 前提知識

- **ハッシュ可能（hashable）**: 集合や辞書の要素にできる値です。`int`、`str`、タプルなどが該当します。リストは、中身が変わるのでハッシュできません。
- **集合（set）**: 同じ要素を 2 つ入れられない入れ物です。要素が入っているかを、素早く調べられます。
- **`TypeError`**: ハッシュできない値を集合に入れようとしたときに出るエラーです。

## 何をしているか

### 1. 比較用の入れ物を用意する

```python:line-numbers=4288
    seenset = set()
    seenset_add = seenset.add
    seenlist = []
    seenlist_add = seenlist.append
```

ハッシュできる要素を入れる集合と、できない要素を入れるリストを作ります。`add` と `append` は、よく使う操作を変数に入れておいたものです。

### 2. 要素を順に調べる

```python:line-numbers=4292
    for element in map(key, iterable) if key else iterable:
        try:
            if element in seenset:
                return False
            seenset_add(element)
```

`key` があれば、比べる値に変換します。要素を集合に入れようとして、すでに入っていれば `False` を返します。

```python:line-numbers=4297
        except TypeError:
            if element in seenlist:
                return False
            seenlist_add(element)
```

集合に入れられない（ハッシュできない）要素は、`TypeError` で受け止めます。リストの中を順に調べて、同じものがあれば `False` を返します。

### 3. 最後まで重複がなければ `True`

```python:line-numbers=4301
    return True
```

すべての要素で重複が見つからなければ、`True` を返します。

## ここがすごい

### 速い道と遅い道を分ける

ハッシュできる要素は集合で、素早く判定します。できない要素だけ遅いリストで調べます。型ごとに、いちばん合う道具を使い分けています。

### 例外で道を切り替える

ハッシュできるかを先に調べず、実際に集合へ入れてみて `TypeError` で切り替えます。型を一覧にしなくても、どんな値にも対応できます。

### 重複が見つかった時点で止まる

結果が決まった時点で `False` を返すので、残りの要素は読まれません。

## まとめ

- ハッシュできる値は集合で、できない値はリストで重複を調べると、両方に対応できる。
- 例外を使って道を切り替えると、型の一覧を書かずに済む。
- 重複が見つかった時点で止まるので、大きな列でも無駄が少ない。
