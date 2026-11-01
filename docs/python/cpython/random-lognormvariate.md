---
title: 正規分布に従う乱数の指数をとって、対数正規分布の乱数を作る
description: random.lognormvariate は、対数正規分布に従う乱数を返す。正規分布の乱数を作ってから指数関数に通すだけなので、結果の対数を取ると正規分布に戻る。株価や所得のような、掛け算で変化する量のモデルに使われる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [595, 603]
function: Random.lognormvariate
difficulty: 1
format: 2
tags: [乱数, 数値計算]
---

## ひとことで

`lognormvariate(mu, sigma)` は、**対数正規分布に従う乱数** を返す関数です。
この乱数の自然対数を取ると、平均 `mu`、標準偏差 `sigma` の正規分布になります。値が必ず正になるので、大きさを表す量のモデルに向いています。

## コード

::: code-group

```python:line-numbers=595 [日本語訳]
    def lognormvariate(self, mu, sigma):
        """対数正規分布。

        この分布の自然対数を取ると、
        平均 mu、標準偏差 sigma の正規分布になる。
        mu は任意の値でよく、sigma は 0 より大きくなければならない。

        """
        return _exp(self.normalvariate(mu, sigma))
```

```python:line-numbers=595 [原文]
    def lognormvariate(self, mu, sigma):
        """Log normal distribution.

        If you take the natural logarithm of this distribution, you'll get a
        normal distribution with mean mu and standard deviation sigma.
        mu can have any value, and sigma must be greater than zero.

        """
        return _exp(self.normalvariate(mu, sigma))
```

:::

## 前提知識

- **正規分布**: 平均の周りに、釣り鐘型に値が散らばる分布です。
- **自然対数と指数**: `exp` は自然対数の逆で、`exp(x)` は `e` の `x` 乗です。`log(exp(x))` は `x` に戻ります。
- **対数正規分布**: 対数を取ると正規分布になる分布です。値は必ず正です。
- **`normalvariate`**: 正規分布に従う乱数を返すメソッドです。

## 何をしているか

### 1. 正規分布の乱数を作る

```python:line-numbers=603
        return _exp(self.normalvariate(mu, sigma))
```

`self.normalvariate(mu, sigma)` で、平均 `mu`、標準偏差 `sigma` の正規分布に従う乱数を作ります。この段階では、値は正にも負にもなります。

### 2. 指数関数で、正の値にする

```python:line-numbers=603
        return _exp(self.normalvariate(mu, sigma))
```

`_exp` で、その乱数を指数の形に通します。`exp` の結果は必ず正なので、対数正規分布の乱数になります。元の正規分布の対数を取ると、もとの乱数に戻ります。

## ここがすごい

### 1 行で、分布が変わる

正規分布の乱数を作って、指数関数に通すだけで、別の分布になります。新しい分布のための計算を、一から書く必要がありません。

### 値が必ず正になる

指数関数は、どんな値でも正の値になります。株価や所得のように、負にならない量を扱うモデルに自然に合います。

### 掛け算の変化を足し算で表す

対数の世界では、掛け算の変化が足し算になります。だから、「毎回ある割合で変わる」現象を、正規分布のモデルで考えられます。

## まとめ

- 正規分布の乱数を指数関数に通すと、対数正規分布の乱数になる。
- 値が必ず正になるので、負にならない量のモデルに向いている。
- 対数を取ると正規分布に戻るので、解析がしやすい。
