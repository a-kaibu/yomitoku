---
title: 先頭の要素を見て、元の列を壊さずに戻す
description: toolz.peek は、列の先頭の要素を取り出し、その要素を先頭に戻した新しいイテラブルと一緒に返す。イテレータを 1 回しか読めない場合でも、先頭を確認してから続きを扱える。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [990, 1005]
function: peek
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, イディオム]
---

## ひとことで

`peek(seq)` は、**先頭の要素を 1 つ読んで、その要素を失わない形で元の列を返す** 関数です。
`first, seq = peek([0, 1, 2, 3, 4])` とすると、`first` は `0` で、`seq` を `list` にすると、また `[0, 1, 2, 3, 4]` が得られます。

## コード

::: code-group

```python:line-numbers=990 [日本語訳]
def peek(seq):
    """ 列の次の要素を取り出し、元の列と同じ内容を持つ列と一緒に返す

    Returns the first element and an iterable equivalent to the original
    sequence, still having the element retrieved.

    >>> seq = [0, 1, 2, 3, 4]
    >>> first, seq = peek(seq)
    >>> first
    0
    >>> list(seq)
    [0, 1, 2, 3, 4]
    """
    iterator = iter(seq)
    item = next(iterator)
    return item, itertools.chain((item,), iterator)
```

```python:line-numbers=990 [原文]
def peek(seq):
    """ Retrieve the next element of a sequence

    Returns the first element and an iterable equivalent to the original
    sequence, still having the element retrieved.

    >>> seq = [0, 1, 2, 3, 4]
    >>> first, seq = peek(seq)
    >>> first
    0
    >>> list(seq)
    [0, 1, 2, 3, 4]
    """
    iterator = iter(seq)
    item = next(iterator)
    return item, itertools.chain((item,), iterator)
```

:::

`chain((item,), iterator)` は、1 つの要素と残りのイテレータを、順につなげた新しいイテレータです。

## 前提知識

- **イテレータは 1 回しか読めない**: 先頭を読んでしまうと、その要素はもう取り出せません。
- **`iter(seq)`**: 列からイテレータを作ります。リストから作ると、リストの先頭から読み始めます。
- **`next(iterator)`**: 次の要素を 1 つ取り出します。空なら `StopIteration` になります。
- **`chain`**: 複数のイテラブルを順に 1 本につなげます。

## 何をしているか

### 1. イテレータを作り、先頭を読む

```python:line-numbers=1003
    iterator = iter(seq)
    item = next(iterator)
```

`iter(seq)` で読むための道具を作り、`next` で先頭の要素を 1 つ取り出します。

### 2. 取った要素を先頭に戻して返す

```python:line-numbers=1005
    return item, itertools.chain((item,), iterator)
```

取った要素だけからなるイテレータと、残りのイテレータを `chain` でつなぎ、もとの列と同じ内容の新しいイテレータを作ります。取った要素と一緒に返します。

## ここがすごい

### 読んだものを捨てない

イテレータは、読んだ要素を戻せません。`peek` は、読んだ先頭を `chain` で前に付け直すことで、「読んだのに消えていない」状態を作ります。

### 型を確かめずに使える

リストなら先頭を見るのは簡単ですが、ジェネレータでは特別な方法が必要です。どちらにも同じ方法で対応できます。

### 空の列には注意

列が空だと `next` が `StopIteration` を出します。`peek` を使う前に、列が空でないかを確かめるか、例外を受け止める必要があります。

## まとめ

- 1 回しか読めないイテレータも、先頭を読んで戻せば確認できる。
- 読んだ要素は、`chain` で前に付け直すと元の列を再現できる。
- 空の列は例外になるので、事前に確かめておく。
