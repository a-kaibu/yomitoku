---
title: 重みを付けて、重複を許しながら要素を選ぶ
description: random.choices は、母集団から重複を許して k 個の要素を選んで、リストとして返す。重みがなければ等確率で選び、重みがあれば累積の重みを作って、乱数の位置を二分探索で当てはめる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [460, 495]
function: Random.choices
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, 数値計算]
---

## ひとことで

`choices(population, weights=None, *, cum_weights=None, k=1)` は、**母集団から重複を許して `k` 個の要素を選び、リストで返す** メソッドです。
`choices(['赤', '青'], weights=[3, 1], k=4)` のように書くと、赤が出やすい結果になります。

## コード

::: code-group

```python:line-numbers=460 [日本語訳]
    def choices(self, population, weights=None, *, cum_weights=None, k=1):
        """重複を許して、母集団の要素から k 個のリストを選んで返す。

        相対的な重みも累積の重みも指定されていなければ、
        すべての要素が同じ確率で選ばれる。

        """
        random = self.random
        n = len(population)
        if cum_weights is None:
            if weights is None:
                floor = _floor
                n += 0.0    # 速くするため、float に変換しておく
                return [population[floor(random() * n)] for i in _repeat(None, k)]
            try:
                cum_weights = list(_accumulate(weights))
            except TypeError:
                if not isinstance(weights, int):
                    raise
                k = weights
                raise TypeError(
                    f'The number of choices must be a keyword argument: {k=}'
                ) from None
        elif weights is not None:
            raise TypeError('Cannot specify both weights and cumulative weights')
        if len(cum_weights) != n:
            raise ValueError('The number of weights does not match the population')
        total = cum_weights[-1] + 0.0   # float に変換する
        if total <= 0.0:
            raise ValueError('Total of weights must be greater than zero')
        if not _isfinite(total):
            raise ValueError('Total of weights must be finite')
        bisect = _bisect
        hi = n - 1
        return [population[bisect(cum_weights, random() * total, 0, hi)]
                for i in _repeat(None, k)]
```

```python:line-numbers=460 [原文]
    def choices(self, population, weights=None, *, cum_weights=None, k=1):
        """Return a k sized list of population elements chosen with replacement.

        If the relative weights or cumulative weights are not specified,
        the selections are made with equal probability.

        """
        random = self.random
        n = len(population)
        if cum_weights is None:
            if weights is None:
                floor = _floor
                n += 0.0    # convert to float for a small speed improvement
                return [population[floor(random() * n)] for i in _repeat(None, k)]
            try:
                cum_weights = list(_accumulate(weights))
            except TypeError:
                if not isinstance(weights, int):
                    raise
                k = weights
                raise TypeError(
                    f'The number of choices must be a keyword argument: {k=}'
                ) from None
        elif weights is not None:
            raise TypeError('Cannot specify both weights and cumulative weights')
        if len(cum_weights) != n:
            raise ValueError('The number of weights does not match the population')
        total = cum_weights[-1] + 0.0   # convert to float
        if total <= 0.0:
            raise ValueError('Total of weights must be greater than zero')
        if not _isfinite(total):
            raise ValueError('Total of weights must be finite')
        bisect = _bisect
        hi = n - 1
        return [population[bisect(cum_weights, random() * total, 0, hi)]
                for i in _repeat(None, k)]
```

:::

## 前提知識

- **重複を許す（復元抽出）**: 一度選んだ要素を戻してから、次を選ぶ方法です。同じ要素が何度も出ます。
- **重み**: 要素ごとに付けた、選ばれやすさの比率です。`[3, 1]` なら、前者は後者の 3 倍選ばれやすくなります。
- **累積の重み**: 重みを先頭から足し合わせた列です。`[3, 1]` の累積は `[3, 4]` です。
- **二分探索（bisect）**: 整列された列の中で、ある値が入る位置を素早く見つける方法です。

## 何をしているか

### 1. 重みがなければ、等確率で選ぶ

```python:line-numbers=469
        if cum_weights is None:
            if weights is None:
                floor = _floor
```

重みも累積の重みもなければ、母集団の長さを掛けた乱数の位置を、添字として使います。どの位置も同じ確率になるので、等しく選ばれます。

```python:line-numbers=473
                return [population[floor(random() * n)] for i in _repeat(None, k)]
```

この 1 行で、`k` 個の要素を選んでリストにしています。

### 2. 重みから累積の重みを作る

```python:line-numbers=474
            try:
                cum_weights = list(_accumulate(weights))
```

重みが渡されていれば、先頭からの合計を `cum_weights` に作ります。`_accumulate` は、`itertools.accumulate` の内部名です。

### 3. 合計で割って、乱数の位置を決める

```python:line-numbers=488
        if total <= 0.0:
            raise ValueError('Total of weights must be greater than zero')
```

合計が 0 以下なら、選べる要素がないので例外にします。

```python:line-numbers=492
        bisect = _bisect
```

二分探索の関数 `bisect` を、ローカル変数に入れて速く呼べるようにします。

```python:line-numbers=493
        hi = n - 1
```

探索する範囲の上限を、母集団の最後の位置にします。

```python:line-numbers=494
        return [population[bisect(cum_weights, random() * total, 0, hi)]
                for i in _repeat(None, k)]
```

`random() * total` は、0 から合計の間の乱数です。`bisect` は、その値が累積のどこに入るかを探し、対応する要素を返します。

## ここがすごい

### 重みを 1 回の二分探索で当てはめる

一つずつ重みを引いていく方法より、要素が多いときも速く選べます。累積の重みを一度作れば、何個選ぶときも同じ列を使えます。

### 大きい重みほど、広い範囲を占める

累積の重みの中で、重みが大きい要素は、乱数が当たる区間が広くなります。だから、重みの比率どおりに選ばれます。

### 入力の不整合を先に見つける

累積の重みの数と母集団の数が違う、合計が 0 以下、無限大を含む、などのときは、例外で止めます。間違った結果を黙って返さない作りです。

## まとめ

- 重みを累積の列にすると、乱数を当てはめる区間が作れる。
- 二分探索を使うと、重みが多くても素早く要素を選べる。
- 重みの不整合は例外で止めると、誤った結果を防げる。
