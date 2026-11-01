---
title: 速度のような比率の平均は、逆数の算術平均から求める
description: statistics.harmonic_mean は、データの逆数の算術平均の逆数を返す。速さのような比率の平均に向く。重みを付けると、距離の割合で平均を取れる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/statistics.py
lines: [266, 326]
function: harmonic_mean
difficulty: 3
format: 2
tags: [数値計算, 標準ライブラリ, アルゴリズム]
---

## ひとことで

`harmonic_mean(data, weights=None)` は、**データの調和平均** を返す関数です。
`harmonic_mean([40, 60])` は `48.0` を返します。時速 40 km と 60 km で同じ距離を走った平均の速さは、単純な平均の `50` ではなく、この `48.0` になります。

## コード

::: code-group

```python:line-numbers=266 [日本語訳]
def harmonic_mean(data, weights=None):
    """データの調和平均を返す。

    The harmonic mean is the reciprocal of the arithmetic mean of the
    reciprocals of the data.  It can be used for averaging ratios or
    rates, for example speeds.

    Suppose a car travels 40 km/hr for 5 km and then speeds-up to
    60 km/hr for another 5 km. What is the average speed?

        >>> harmonic_mean([40, 60])
        48.0

    Suppose a car travels 40 km/hr for 5 km, and when traffic clears,
    speeds-up to 60 km/hr for the remaining 30 km of the journey. What
    is the average speed?

        >>> harmonic_mean([40, 60], weights=[5, 30])
        56.0

    If ``data`` is empty, or any element is less than zero,
    ``harmonic_mean`` will raise ``StatisticsError``.

    """
    if iter(data) is data:
        data = list(data)

    errmsg = 'harmonic mean does not support negative values'

    n = len(data)
    if n < 1:
        raise StatisticsError('harmonic_mean requires at least one data point')
    elif n == 1 and weights is None:
        x = data[0]
        if isinstance(x, (numbers.Real, Decimal)):
            if x < 0:
                raise StatisticsError(errmsg)
            return x
        else:
            raise TypeError('unsupported type')

    if weights is None:
        weights = repeat(1, n)
        sum_weights = n
    else:
        if iter(weights) is weights:
            weights = list(weights)
        if len(weights) != n:
            raise StatisticsError('Number of weights does not match data size')
        _, sum_weights, _ = _sum(w for w in _fail_neg(weights, errmsg))

    try:
        data = _fail_neg(data, errmsg)
        T, total, count = _sum(w / x if w else 0 for w, x in zip(weights, data))
    except ZeroDivisionError:
        return 0

    if total <= 0:
        raise StatisticsError('Weighted sum must be positive')

    return _convert(sum_weights / total, T)
```

```python:line-numbers=266 [原文]
def harmonic_mean(data, weights=None):
    """Return the harmonic mean of data.

    The harmonic mean is the reciprocal of the arithmetic mean of the
    reciprocals of the data.  It can be used for averaging ratios or
    rates, for example speeds.

    Suppose a car travels 40 km/hr for 5 km and then speeds-up to
    60 km/hr for another 5 km. What is the average speed?

        >>> harmonic_mean([40, 60])
        48.0

    Suppose a car travels 40 km/hr for 5 km, and when traffic clears,
    speeds-up to 60 km/hr for the remaining 30 km of the journey. What
    is the average speed?

        >>> harmonic_mean([40, 60], weights=[5, 30])
        56.0

    If ``data`` is empty, or any element is less than zero,
    ``harmonic_mean`` will raise ``StatisticsError``.

    """
    if iter(data) is data:
        data = list(data)

    errmsg = 'harmonic mean does not support negative values'

    n = len(data)
    if n < 1:
        raise StatisticsError('harmonic_mean requires at least one data point')
    elif n == 1 and weights is None:
        x = data[0]
        if isinstance(x, (numbers.Real, Decimal)):
            if x < 0:
                raise StatisticsError(errmsg)
            return x
        else:
            raise TypeError('unsupported type')

    if weights is None:
        weights = repeat(1, n)
        sum_weights = n
    else:
        if iter(weights) is weights:
            weights = list(weights)
        if len(weights) != n:
            raise StatisticsError('Number of weights does not match data size')
        _, sum_weights, _ = _sum(w for w in _fail_neg(weights, errmsg))

    try:
        data = _fail_neg(data, errmsg)
        T, total, count = _sum(w / x if w else 0 for w, x in zip(weights, data))
    except ZeroDivisionError:
        return 0

    if total <= 0:
        raise StatisticsError('Weighted sum must be positive')

    return _convert(sum_weights / total, T)
```

:::

`_sum` は、合計を正確に計算する内部関数です。`_fail_neg` は、負の値が来たら `StatisticsError` にする内部の関数です。`_convert` は、結果を適切な型に直します。

## 前提知識

- **調和平均**: 各値の逆数の算術平均を求め、その逆数を取った値です。
- **比率の平均**: 速さや単価のように、「1 単位あたり」の値の平均です。同じ距離を走るときの平均速度などに使われます。
- **逆数**: `x` の逆数は `1/x` です。`40` の逆数は `1/40` です。
- **重み（weights）**: 各値に与える割合です。重みが大きいほど、その値の影響が強くなります。

## 何をしているか

### 1. 入力を確かめて、1 件だけなら返す

```python:line-numbers=290
    if iter(data) is data:
        data = list(data)

    errmsg = 'harmonic mean does not support negative values'

    n = len(data)
    if n < 1:
        raise StatisticsError('harmonic_mean requires at least one data point')
    elif n == 1 and weights is None:
        x = data[0]
        if isinstance(x, (numbers.Real, Decimal)):
            if x < 0:
                raise StatisticsError(errmsg)
            return x
        else:
            raise TypeError('unsupported type')
```

イテレータなら、先にリストにします。データが 0 件ならエラーです。1 件だけなら、その値をそのまま返します（負の値はエラーです）。

### 2. 重みを用意する

```python:line-numbers=307
    if weights is None:
        weights = repeat(1, n)
        sum_weights = n
    else:
        if iter(weights) is weights:
            weights = list(weights)
        if len(weights) != n:
            raise StatisticsError('Number of weights does not match data size')
        _, sum_weights, _ = _sum(w for w in _fail_neg(weights, errmsg))
```

重みがなければ、全部 1 とみなします。重みがあれば、長さが合っているかを確かめ、重みの合計を求めます。

### 3. 逆数の合計を作る

```python:line-numbers=317
    try:
        data = _fail_neg(data, errmsg)
        T, total, count = _sum(w / x if w else 0 for w, x in zip(weights, data))
```

各データの `w / x`（重み ÷ 値）を足し合わせます。これが「逆数の重み付き合計」になります。`0` の重みは計算に入れません。

### 4. 重みの合計を割って返す

```python:line-numbers=323
    if total <= 0:
        raise StatisticsError('Weighted sum must be positive')

    return _convert(sum_weights / total, T)
```

`sum_weights / total` が調和平均です。合計が 0 以下なら、平均が定義できないのでエラーにします。

## ここがすごい

### 速さの平均は、逆数で考える

40 km/h で 5 km、60 km/h で 5 km 走ると、かかる時間は `5/40` と `5/60` です。全体の平均速度は「走った距離の合計 ÷ かかった時間の合計」になり、これが調和平均と一致します。単純な平均では、時間の違いを無視してしまいます。

### 重みで距離の割合を表す

docstring の例のように、40 km/h で 5 km、60 km/h で 30 km のときは、重みを `[5, 30]` にします。走った距離の割合で平均を取る形になります。

### 0 の扱いと負の値

重みが 0 の要素は計算から外します。また、負の値は速さとして意味がないので、エラーにしています。データの性質に合わせて、入力を絞っています。

## まとめ

- 比率の平均（速さなど）は、逆数の平均を取ってから逆数にする。
- 重みを付けると、距離や量の割合で平均を取れる。
- 入力の性質（負の値や 0）に合わせて、エラーや除外を決めておくと安全。
