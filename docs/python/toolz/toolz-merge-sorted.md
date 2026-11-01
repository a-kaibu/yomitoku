---
title: 並べ替え済みの列を、1 本の並べ替え済みの列にまとめる
description: toolz.merge_sorted は、並べ替え済みの複数の列を、遅延評価で 1 本の並べ替え済みの列にする。各列から一度に保持するのは 1 つの値だけで、大きな列でもメモリを使いすぎない。key で比べ方も変えられる。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [107, 132]
function: merge_sorted
difficulty: 3
format: 2
tags: [アルゴリズム, ソート, 遅延評価]
---

## ひとことで

`merge_sorted(*seqs, key=None)` は、**並べ替え済みの列を複数受け取り、全体を並べ替えた 1 本の列を作る** 関数です。
`list(merge_sorted([1, 3, 5], [2, 4, 6]))` は `[1, 2, 3, 4, 5, 6]` を返します。

## コード

::: code-group

```python:line-numbers=107 [日本語訳]
def merge_sorted(*seqs, **kwargs):
    """ 並べ替え済みの列の集まりを、1 本の並べ替え済みの列にまとめる

    This works lazily and only keeps one value from each iterable in memory.

    >>> list(merge_sorted([1, 3, 5], [2, 4, 6]))
    [1, 2, 3, 4, 5, 6]

    >>> ''.join(merge_sorted('abc', 'abc', 'abc'))
    'aaabbbccc'

    The "key" function used to sort the input may be passed as a keyword.

    >>> list(merge_sorted([2, 3], [1, 3], key=lambda x: x // 3))
    [2, 1, 3, 3]
    """
    if len(seqs) == 0:
        return iter([])
    elif len(seqs) == 1:
        return iter(seqs[0])

    key = kwargs.get('key', None)
    if key is None:
        return _merge_sorted_binary(seqs)
    else:
        return _merge_sorted_binary_key(seqs, key)
```

```python:line-numbers=107 [原文]
def merge_sorted(*seqs, **kwargs):
    """ Merge and sort a collection of sorted collections

    This works lazily and only keeps one value from each iterable in memory.

    >>> list(merge_sorted([1, 3, 5], [2, 4, 6]))
    [1, 2, 3, 4, 5, 6]

    >>> ''.join(merge_sorted('abc', 'abc', 'abc'))
    'aaabbbccc'

    The "key" function used to sort the input may be passed as a keyword.

    >>> list(merge_sorted([2, 3], [1, 3], key=lambda x: x // 3))
    [2, 1, 3, 3]
    """
    if len(seqs) == 0:
        return iter([])
    elif len(seqs) == 1:
        return iter(seqs[0])

    key = kwargs.get('key', None)
    if key is None:
        return _merge_sorted_binary(seqs)
    else:
        return _merge_sorted_binary_key(seqs, key)
```

:::

`_merge_sorted_binary` は、2 本ずつ順にまとめる内部の関数です。`_merge_sorted_binary_key` は、`key` で比べながら同じことをする版です。

## 前提知識

- **並べ替え済みの列**: 小さい順（または指定の順）に並んだ列です。
- **合流（マージ）**: 並べ替え済みの列を 2 本から順に比べて、小さいほうを先に出していく操作です。
- **遅延評価**: 必要になったときに 1 つずつ作る仕組みです。
- **`key`**: 比べる前に値を変換する関数です。

## 何をしているか

### 1. 列の数で分ける

```python:line-numbers=123
    if len(seqs) == 0:
        return iter([])
    elif len(seqs) == 1:
        return iter(seqs[0])
```

列が 0 本なら、空のイテレータを返します。1 本なら、その列をそのままイテレータにして返すだけで済みます。

### 2. `key` がないかで方法を選ぶ

```python:line-numbers=128
    key = kwargs.get('key', None)
    if key is None:
        return _merge_sorted_binary(seqs)
```

`key` がなければ、値そのものを比べる内部の関数に任せます。

### 3. `key` があれば、その値で比べる

```python:line-numbers=131
    else:
        return _merge_sorted_binary_key(seqs, key)
```

`key` があれば、比べる値を変換しながら合流させる内部の関数に任せます。

## ここがすごい

### 全部を並べ直さない

列が並べ替え済みであることを使い、先頭どうしを比べて小さいほうを出すだけです。全体を並べ直す `sorted` より、少ない手間で済みます。

### 各列から保持するのは 1 つずつ

docstring にあるとおり、各列から一度に覚えておくのは、先頭の 1 つだけです。大きなファイルを何本も合流させるような場合でも、メモリはほとんど使いません。

### 比べ方を `key` で変えられる

`key=lambda x: x // 3` のように書けば、比べる値を変換した結果で並べ替えられます。`key` の有無で、使う内部の関数を分けています。

## まとめ

- 並べ替え済みの列どうしは、先頭を比べて小さいほうから出すと、1 本にまとめられる。
- 遅延評価にすると、大きな列でもメモリを節約できる。
- 比べ方は、`key` で変えられるように分けておくと便利。
