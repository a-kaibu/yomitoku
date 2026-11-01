---
title: 長さが違っても、尽きたものを飛ばして交互に出す
description: more_itertools.interleave_longest は、複数のイテラブルから 1 つずつ順番に出す。短いものが尽きても、残りを止めずに続ける。zip_longest で空きを埋め、flatten でつなぎ、埋めた値を除く。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [1313, 1326]
function: interleave_longest
difficulty: 2
format: 2
tags: [イテレータ, アルゴリズム, 遅延評価]
---

## ひとことで

`interleave_longest(*iterables)` は、**複数のイテラブルから順番に 1 つずつ取り出し、長さが違っても最後まで出し続ける** 関数です。
`interleave_longest([1, 2, 3], [4, 5], [6, 7, 8])` は `1, 4, 6, 2, 5, 7, 3, 8` を出します。`roundrobin` と同じ結果です。

## コード

::: code-group

```python:line-numbers=1313 [日本語訳]
def interleave_longest(*iterables):
    """各イテラブルから順に 1 つずつ出す、新しいイテラブルを返す。
    skipping any that are exhausted.

        >>> list(interleave_longest([1, 2, 3], [4, 5], [6, 7, 8]))
        [1, 4, 6, 2, 5, 7, 3, 8]

    This function produces the same output as :func:`roundrobin`, but may
    perform better for some inputs (in particular when the number of iterables
    is large).

    """
    i = flatten(zip_longest(*iterables, fillvalue=_marker))
    return filter(partial(is_not, _marker), i)
```

```python:line-numbers=1313 [原文]
def interleave_longest(*iterables):
    """Return a new iterable yielding from each iterable in turn,
    skipping any that are exhausted.

        >>> list(interleave_longest([1, 2, 3], [4, 5], [6, 7, 8]))
        [1, 4, 6, 2, 5, 7, 3, 8]

    This function produces the same output as :func:`roundrobin`, but may
    perform better for some inputs (in particular when the number of iterables
    is large).

    """
    i = flatten(zip_longest(*iterables, fillvalue=_marker))
    return filter(partial(is_not, _marker), i)
```

:::

`zip_longest` は、長さが違うものを組にするとき、足りない部分を埋める関数です。`flatten` は、1 段の入れ子をほどく関数です。`is_not` は、2 つが同じオブジェクトでないかを調べる関数です。

## 前提知識

- **`zip_longest(*iterables, fillvalue=...)`**: 長いほうに合わせて組を作り、足りない部分を `fillvalue` で埋めます。
- **`zip` との違い**: `zip` は、一番短いものが尽きた時点で止まります。`zip_longest` は、一番長いものに合わせます。
- **`flatten`**: 組のリストを 1 本の列にほどきます。ここでは、組の中の要素を順番に出すために使います。
- **`_marker`**: 埋めるための専用の目印です。本物の値と区別するために使います。

## 何をしているか

### 1. 長さが違うものを、足りない分だけ埋めて組にする

```python:line-numbers=1325
    i = flatten(zip_longest(*iterables, fillvalue=_marker))
```

`zip_longest` で、同じ位置の要素をまとめます。短いものが尽きた場所は、目印（`_marker`）で埋められます。

### 2. 組をほどいて、1 本の列にする

```python:line-numbers=1325
    i = flatten(zip_longest(*iterables, fillvalue=_marker))
```

`flatten` で、組の中の要素を順番に並べます。`(1, 4, 6)`、`(2, 5, 7)` という組が、`1, 4, 6, 2, 5, 7` の列になります。

### 3. 埋めた目印を除く

```python:line-numbers=1326
    return filter(partial(is_not, _marker), i)
```

`filter(partial(is_not, _marker), ...)` で、目印だけを捨てます。残るのは、本物の要素だけです。

## ここがすごい

### 尽きたものを、自然に飛ばす

どの入力も、尽きた後は目印で埋まるだけです。除く処理を 1 か所に集めたので、特別な分岐を書かずに、残りの入力だけが順番に出てきます。

### 目印で本物と区別する

値として `None` などを使うと、本物の値と混同する恐れがあります。専用の目印を使うことで、どんな値が入っても除く判定を誤らずに済みます。

### `roundrobin` との違い

結果は `roundrobin` と同じです。docstring によると、入力の数が多いときなど、場合によっては速く動きます。どちらを選ぶかは、用途と性能で決めます。

## まとめ

- 長さが違う入力は、`zip_longest` で埋めると、同じ位置でそろえられる。
- 埋めた値は、専用の目印で区別して後から除くと安全。
- 同じ結果を出す方法が複数あるときは、入力の性質で選ぶとよい。
