---
title: 重み付きの抽選を「累積和 + 二分探索」で高速に
description: random.choices は、重みに応じた確率で要素を k 個選ぶ。重みの累積和を作っておき、0〜合計の乱数がどの区間に落ちるかを bisect で探している。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [460, 495]
function: Random.choices
difficulty: 2
tags: [乱数, 探索, アルゴリズム, 標準ライブラリ]
---
## ひとことで

`choices(population, weights, k=...)` は、**重み（当たりやすさ）を付けて、要素を k 個選ぶ**（同じものを何度選んでもよい）メソッドです。
`choices(["A", "B", "C"], weights=[5, 3, 2], k=10)` なら、A が 50%、B が 30%、C が 20% の確率で選ばれます。
重みの「累積和」を作り、乱数がどこに落ちるかを二分探索で探すことで、1 回の抽選を高速にしています。

## コード

```python:line-numbers=460
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

`_floor`、`_accumulate`、`_bisect`、`_isfinite`、`_repeat` は、それぞれ `math.floor`、`itertools.accumulate`、`bisect.bisect`、`math.isfinite`、`itertools.repeat` を、ファイルの冒頭で別名で読み込んだものです。

## 前提知識

- **`random()`**: 0 以上 1 未満の小数をランダムに返します。
- **累積和（`accumulate`）**: `[5, 3, 2]` の累積和は `[5, 8, 10]` です。先頭から順に足していった途中の合計の並びです。
- **`bisect(a, x, lo, hi)`**: ソート済みのリスト `a` で、`x` を入れるべき位置（`x` より大きい最初の要素の位置）を二分探索で返します。
- **リスト内包表記**: `[式 for i in 何か]` は、繰り返しながら式の値を集めたリストを作ります。
- **`repeat(None, k)`**: `None` を k 回出すイテレータです。「k 回繰り返す」ためだけに使っています。
- **`f'{k=}'`**: f 文字列の書き方で、`k=3` のように「変数名=値」を埋め込みます。

## 何をしているか

### 1. 重みがない場合（470〜473 行目）

すべて等確率なら、`floor(random() * n)` で 0〜n-1 の位置を選ぶだけです。472 行目で `n` に `0.0` を足して小数にしておくのは、ループの中で毎回「整数 × 小数」の型変換が起きないようにするための、小さな高速化です。

### 2. 重みから累積和を作る（474〜482 行目）

`weights = [5, 3, 2]` なら `cum_weights = [5, 8, 10]` です。
`choices(pop, 3)` のように回数をうっかり位置引数で渡すと、`3` を重みとして累積和を作ろうとして失敗します。このときは「回数はキーワード引数で」というわかりやすいメッセージに置き換えています。

### 3. 入力の確認（483〜491 行目）

重みの数が要素数と違う、合計が 0 以下、合計が無限大、といった場合はエラーにします。

### 4. 乱数がどの区間に落ちるか探す（492〜495 行目）

合計 `total = 10` に対して `random() * 10` は 0〜10 未満の小数です。

- 0 以上 5 未満 → `bisect` は 0 → A
- 5 以上 8 未満 → 1 → B
- 8 以上 10 未満 → 2 → C

区間の長さが重みそのものなので、重みに比例した確率で選ばれます。

## ここがすごい

### 1 回の抽選は O(log n)

素直に書くと「重みを順に引いていき、0 を下回ったところで止める」という線形探索になり、1 回の抽選で最大 n 回の計算がかかります。累積和は最初に 1 回作るだけで、あとは二分探索なので、要素が 100 万個あっても 1 回の抽選は約 20 回の比較で済みます。k 回抽選するときに大きな差が出ます。

### `hi = n - 1` で端の誤差を防ぐ

小数の計算誤差で `random() * total` がちょうど `total` に一致するような極端な場合でも、探索範囲の上限を `n - 1` にしておけば、存在しない位置（n 番目）を返すことはありません。

### cum_weights を直接渡せる

同じ重みで何度も `choices` を呼ぶなら、累積和を一度作って `cum_weights=` で渡せば、毎回の累積和の計算すら省けます。API がそのような使い方を想定しています。

### ありがちなミスに親切

位置引数で回数を渡すミスを、`TypeError` を捕まえて具体的なメッセージに変えています（477〜482 行目）。しかも `weights` が整数だったときだけ置き換え、それ以外のエラーはそのまま投げ直しているので、本当の原因を隠しません。

## まとめ

- 重み付き抽選は、累積和を作って二分探索すると速い。
- 前処理（累積和）と本処理（探索）を分けると、前処理の結果を使い回せる。
- よくある使い方の間違いには、エラーメッセージで道案内をするとよい。
