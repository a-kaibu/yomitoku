---
title: 数値を浮動小数点で合計して、平均を速く正確に求める
description: statistics.fmean は、データを float に直して算術平均を返す。必ず float を返し、長さが分からないイテレータにも対応する。合計には fsum を使い、誤差を小さくしている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/statistics.py
lines: [183, 223]
function: fmean
difficulty: 2
format: 2
tags: [数値計算, 標準ライブラリ, イテレータ]
---

## ひとことで

`fmean(data)` は、データの **算術平均（平均値）を float で** 返す関数です。
`fmean([3.5, 4.0, 5.25])` は `4.25` を返します。`mean()` より速く、結果は必ず小数になります。

## コード

::: code-group

```python:line-numbers=183 [日本語訳]
def fmean(data, weights=None):
    """データを float に変換してから、算術平均を計算する。

    This runs faster than the mean() function and it always returns a float.
    If the input dataset is empty, it raises a StatisticsError.

    >>> fmean([3.5, 4.0, 5.25])
    4.25

    """
    if weights is None:

        try:
            n = len(data)
        except TypeError:
            # __len__() を定義していないイテレータを扱う。
            counter = count(1)
            total = fsum(compress(data, counter))
            n = next(counter) - 1
        else:
            total = fsum(data)

        if not n:
            raise StatisticsError('fmean requires at least one data point')

        return total / n

    if not isinstance(weights, (list, tuple)):
        weights = list(weights)

    try:
        num = sumprod(data, weights)
    except ValueError:
        raise StatisticsError('data and weights must be the same length')

    den = fsum(weights)

    if not den:
        raise StatisticsError('sum of weights must be non-zero')

    return num / den
```

```python:line-numbers=183 [原文]
def fmean(data, weights=None):
    """Convert data to floats and compute the arithmetic mean.

    This runs faster than the mean() function and it always returns a float.
    If the input dataset is empty, it raises a StatisticsError.

    >>> fmean([3.5, 4.0, 5.25])
    4.25

    """
    if weights is None:

        try:
            n = len(data)
        except TypeError:
            # Handle iterators that do not define __len__().
            counter = count(1)
            total = fsum(compress(data, counter))
            n = next(counter) - 1
        else:
            total = fsum(data)

        if not n:
            raise StatisticsError('fmean requires at least one data point')

        return total / n

    if not isinstance(weights, (list, tuple)):
        weights = list(weights)

    try:
        num = sumprod(data, weights)
    except ValueError:
        raise StatisticsError('data and weights must be the same length')

    den = fsum(weights)

    if not den:
        raise StatisticsError('sum of weights must be non-zero')

    return num / den
```

:::

`fsum` は、浮動小数点の数を、誤差が少ないように足す関数です。`compress` と `count` は、`itertools` の関数です。

## 前提知識

- **算術平均**: 全部の値を足して、個数で割った値です。
- **浮動小数点数（float）**: 小数を表す型です。計算には、わずかな誤差が出ることがあります。
- **`len`**: 要素数を返します。ジェネレータなど、長さのないものでは `TypeError` になります。
- **重み付き平均**: 各値に重みをかけて足し、重みの合計で割る平均です。

## 何をしているか

### 1. 重みがない場合で、長さが分かるとき

```python:line-numbers=196
            n = len(data)
        except TypeError:
            # __len__() を定義していないイテレータを扱う。
            counter = count(1)
            total = fsum(compress(data, counter))
            n = next(counter) - 1
        else:
            total = fsum(data)
```

`len(data)` で個数が分かるときは、`fsum(data)` で合計を求めます。`fsum` は誤差が少ない方法で足し算をするので、正確な合計に近くなります。

### 2. 長さが分からないイテレータのとき

```python:line-numbers=197
        except TypeError:
            # __len__() を定義していないイテレータを扱う。
            counter = count(1)
            total = fsum(compress(data, counter))
            n = next(counter) - 1
```

`len` で `TypeError` が出たら、個数を数えながら合計します。`count(1)` を数える係として、`compress` でデータと組にします。そうすると、最後に `next(counter) - 1` で個数が分かります。

### 3. 0 個なら、エラーにする

```python:line-numbers=205
        if not n:
            raise StatisticsError('fmean requires at least one data point')
```

データが 1 つもないと、平均は決まりません。`StatisticsError` を出します。

### 4. 合計を個数で割る

```python:line-numbers=208
        return total / n
```

合計を個数で割って、平均を返します。

### 5. 重みがあるとき

```python:line-numbers=210
    if not isinstance(weights, (list, tuple)):
        weights = list(weights)

    try:
        num = sumprod(data, weights)
    except ValueError:
        raise StatisticsError('data and weights must be the same length')

    den = fsum(weights)

    if not den:
        raise StatisticsError('sum of weights must be non-zero')

    return num / den
```

重みがあるときは、データと重みの積の合計（`sumprod`）を、重みの合計で割ります。長さが違えばエラーにし、重みの合計が 0 なら割れないのでエラーにします。

## ここがすごい

### 長さを知らなくても数えられる

ジェネレータのように、先に長さが分からないデータにも対応しています。1 回だけ読みながら、合計と個数を同時に作ります。データを先にリストに入れなくて済むので、メモリも節約できます。

### 必ず float を返す

`mean` は、整数のデータなら整数の型で結果を返すことがあります。`fmean` は必ず float を返すので、結果の型が予想しやすくなります。

### 誤差の少ない合計

`fsum` は、足し算の途中で出る誤差を小さく保ちます。平均を取るときに、わずかな誤差がずれとなって残りにくくなります。

## まとめ

- 平均は、合計を個数で割るだけだが、長さが分からないデータへの対応が工夫どころ。
- 数える係を別に用意すると、1 回の読み込みで合計と個数を同時に求められる。
- 結果の型をそろえると、呼ぶ側が扱いやすくなる。
