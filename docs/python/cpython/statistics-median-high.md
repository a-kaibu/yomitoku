---
title: 偶数個のとき、真ん中の 2 つのうち大きいほうを選ぶ
description: statistics.median_high は、データの上側の中央値を返す。median_low と同じく並べ替えてから真ん中を選ぶが、偶数個のときは大きいほうを選ぶ。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/statistics.py
lines: [378, 394]
function: median_high
difficulty: 1
format: 2
tags: [数値計算, ソート, 標準ライブラリ]
---

## ひとことで

`median_high(data)` は、データの **上側の中央値** を返す関数です。
`median_high([1, 3, 5, 7])` は `5` を返します。個数が偶数のときは、真ん中の 2 つのうち大きいほうを選びます。

## コード

::: code-group

```python:line-numbers=378 [日本語訳]
def median_high(data):
    """データの上側の中央値を返す。

    When the number of data points is odd, the middle value is returned.
    When it is even, the larger of the two middle values is returned.

    >>> median_high([1, 3, 5])
    3
    >>> median_high([1, 3, 5, 7])
    5

    """
    data = sorted(data)
    n = len(data)
    if n == 0:
        raise StatisticsError("no median for empty data")
    return data[n // 2]
```

```python:line-numbers=378 [原文]
def median_high(data):
    """Return the high median of data.

    When the number of data points is odd, the middle value is returned.
    When it is even, the larger of the two middle values is returned.

    >>> median_high([1, 3, 5])
    3
    >>> median_high([1, 3, 5, 7])
    5

    """
    data = sorted(data)
    n = len(data)
    if n == 0:
        raise StatisticsError("no median for empty data")
    return data[n // 2]
```

:::

## 前提知識

- **中央値**: 並べたときの真ん中の値です。
- **上側と下側**: 偶数個のとき、真ん中の 2 つのうち大きいほうが上側、小さいほうが下側です。
- **`n // 2`**: 個数を 2 で割った商です。偶数個の `[1, 3, 5, 7]` では `2` になり、番号 2 の値（`5`）が選ばれます。

## 何をしているか

### 1. 並べ替えて、空でないか確かめる

```python:line-numbers=390
    data = sorted(data)
    n = len(data)
    if n == 0:
        raise StatisticsError("no median for empty data")
```

`sorted` で並べ替え、データが空ならエラーにします。

### 2. 番号 `n // 2` の値を返す

```python:line-numbers=394
    return data[n // 2]
```

並べた後の番号 `n // 2` は、奇数個なら真ん中、偶数個なら真ん中の 2 つのうち大きいほうです。`median_low` と違い、1 を引く必要がありません。

## ここがすごい

### 1 行の違いだけ

`median_low` は偶数のとき番号を 1 つ減らします。`median_high` は減らしません。このわずかな違いだけで、上側と下側を使い分けられます。

### 奇数個では同じ結果

個数が奇数なら、どちらの関数も同じ値を返します。違いが出るのは、偶数個のときだけです。

## まとめ

- 中央値の選び方は、番号を 1 つ減らすかどうかの違いで決まる。
- 偶数個のときだけ、上側と下側の結果が変わる。
- 同じ仕組みの関数は、違いを一か所にまとめて読むと分かりやすい。
