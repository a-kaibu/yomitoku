---
title: 最大値が最初に現れた位置を、enumerate と max で求める
description: more_itertools.argmax は、イテラブルの中で最大値が最初に現れる位置（0 から数える番号）を返す。enumerate で番号と値の組を作り、値だけで max を取ってから番号を取り出す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [5369, 5394]
function: argmax
difficulty: 1
format: 2
tags: [イテレータ, 探索, 関数型]
---

## ひとことで

`argmax(iterable)` は、**最大値がある場所の番号（添字）** を返す関数です。
`argmax([0, 1, 2, 3, 3, 2, 1, 0])` は `3` を返します。最大値の `3` は番号 3 と 4 にありますが、最初に現れた 3 を返します。

## コード

::: code-group

```python:line-numbers=5369 [日本語訳]
def argmax(iterable, *, key=None):
    """
    イテラブルの中で、最大値が最初に現れる位置（番号）。

        >>> argmax('abcdefghabcd')
        7
        >>> argmax([0, 1, 2, 3, 3, 2, 1, 0])
        3

    For example, identify the best machine learning model::

        >>> models =   ['svm', 'random forest', 'knn', 'naïve bayes']
        >>> accuracy = [  68,        61,          84,       72      ]

        # Most accurate model
        >>> models[argmax(accuracy)]
        'knn'

        # Best accuracy
        >>> max(accuracy)
        84

    """
    if key is not None:
        iterable = map(key, iterable)
    return max(enumerate(iterable), key=itemgetter(1))[0]
```

```python:line-numbers=5369 [原文]
def argmax(iterable, *, key=None):
    """
    Index of the first occurrence of a maximum value in an iterable.

        >>> argmax('abcdefghabcd')
        7
        >>> argmax([0, 1, 2, 3, 3, 2, 1, 0])
        3

    For example, identify the best machine learning model::

        >>> models =   ['svm', 'random forest', 'knn', 'naïve bayes']
        >>> accuracy = [  68,        61,          84,       72      ]

        # Most accurate model
        >>> models[argmax(accuracy)]
        'knn'

        # Best accuracy
        >>> max(accuracy)
        84

    """
    if key is not None:
        iterable = map(key, iterable)
    return max(enumerate(iterable), key=itemgetter(1))[0]
```

:::

`itemgetter(1)` は、組の 2 番目の要素を取り出す関数です。

## 前提知識

- **添字（インデックス）**: 0 から数えた位置の番号です。`[a, b, c]` の `b` は、添字 1 です。
- **`enumerate(iterable)`**: `(番号, 要素)` の組を順に作るイテレータです。
- **`max(iterable, key=...)`**: 比べる値を `key` で決めて、最大の要素を返します。同じ値が複数あれば、最初に現れたものを返します。
- **`key` 引数**: 比べる前に、値を変換する関数です。ここでは、組の 2 番目（値）で比べます。

## 何をしているか

### 1. 比べる値を変換する

```python:line-numbers=5392
    if key is not None:
        iterable = map(key, iterable)
```

`key` が指定されていれば、各要素をその関数で変換した値で比べられるようにします。

### 2. 番号と値の組を作り、値で最大を取る

```python:line-numbers=5394
    return max(enumerate(iterable), key=itemgetter(1))[0]
```

`enumerate` で `(番号, 要素)` の組を作り、`itemgetter(1)` で要素の値だけを比べて、最大の組を取ります。最後に `[0]` で番号を取り出します。

## ここがすごい

### 番号は `enumerate` が付ける

番号を別に数える変数はいりません。`enumerate` で組にしておけば、最大の組から番号をそのまま取れます。

### 最初に現れた位置になる

`max` は、同じ値のときに最初に現れた要素を返します。そのため、同点の場合も、一番前の位置が選ばれます。docstring の `argmax('abcdefghabcd')` が `7` になるのは、`h` が最初に現れる位置だからです。

### `key` で、比べ方を変えられる

`key` を渡せば、要素そのものでなく、別の値で最大を決められます。docstring の例のように、「最も精度の高いモデル」の位置を、名前の配列と組み合わせて取り出せます。

## まとめ

- 最大値の位置は、`enumerate` で番号を付けてから `max` を取ると求まる。
- `max` は同点のときに最初の要素を返すので、結果の位置が分かりやすい。
- 比べる値を `key` で決めると、同じ仕組みで別の基準の最大を探せる。
