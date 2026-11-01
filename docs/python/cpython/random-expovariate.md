---
title: 一様な乱数を対数に通して、待ち時間の乱数を作る
description: random.expovariate は、指数分布に従う乱数を返す。一様乱数の対数を取り、平均の逆数で割る逆関数法で作る。1 - random() を使い、0 の対数を取らないようにしている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [605, 623]
function: Random.expovariate
difficulty: 2
format: 2
tags: [乱数, 数値計算, アルゴリズム]
---

## ひとことで

`expovariate(lambd)` は、**指数分布に従う乱数** を返す関数です。
待ち時間（次の電話が来るまでの時間など）のように、「同じ確率で、いつ起きてもおかしくない出来事」の間隔に使われます。`lambd` は 1 秒あたりに起きる回数の目安で、平均は `1 / lambd` になります。

## コード

::: code-group

```python:line-numbers=605 [日本語訳]
    def expovariate(self, lambd=1.0):
        """指数分布。

        lambd is 1.0 divided by the desired mean.  It should be
        nonzero.  (The parameter would be called "lambda", but that is
        a reserved word in Python.)  Returned values range from 0 to
        positive infinity if lambd is positive, and from negative
        infinity to 0 if lambd is negative.

        The mean (expected value) and variance of the random variable are:

            E[X] = 1 / lambd
            Var[X] = 1 / lambd ** 2

        """
        # log(0) を避けるため、random() ではなく 1-random() を使う。
        # 0 の対数を取る可能性を排除するためである。

        return -_log(1.0 - self.random()) / lambd
```

```python:line-numbers=605 [原文]
    def expovariate(self, lambd=1.0):
        """Exponential distribution.

        lambd is 1.0 divided by the desired mean.  It should be
        nonzero.  (The parameter would be called "lambda", but that is
        a reserved word in Python.)  Returned values range from 0 to
        positive infinity if lambd is positive, and from negative
        infinity to 0 if lambd is negative.

        The mean (expected value) and variance of the random variable are:

            E[X] = 1 / lambd
            Var[X] = 1 / lambd ** 2

        """
        # we use 1-random() instead of random() to preclude the
        # possibility of taking the log of zero.

        return -_log(1.0 - self.random()) / lambd
```

:::

`_log` は、`math.log` を短い名前で使えるようにしたものです。

## 前提知識

- **一様乱数**: 0 以上 1 未満の数を、どの値も同じ確率で返す乱数です。`random()` がこれにあたります。
- **指数分布**: 出来事の間隔の分布です。平均より短い間隔が出やすく、長い間隔は少なくなります。
- **対数（log）**: 指数の逆の計算です。`log(1) = 0`、`log(0.5)` は負の数になります。
- **逆関数法**: 一様乱数を、目的の分布の逆関数に通して乱数を作る方法です。

## 何をしているか

### 1. 一様乱数を対数に通す

```python:line-numbers=623
        return -_log(1.0 - self.random()) / lambd
```

`1.0 - self.random()` は、0 より大きく 1 以下の数です。その対数を取り、マイナスを付けると、正の値になります。最後に `lambd` で割って、指定した平均の乱数にします。

### 2. 0 の対数を避ける

```python:line-numbers=620
        # log(0) を避けるため、random() ではなく 1-random() を使う。
        # 0 の対数を取る可能性を排除するためである。
```

コメントにあるように、`random()` は 0 を返すことがあります。`log(0)` はエラーになるので、`1 - random()` を使って、0 を避けています。

## ここがすごい

### 一様乱数だけから作る

指数分布は、一様乱数と対数だけで作れます。複雑な確率の計算をしなくても、分布の形が正しく再現されます。

### 平均は `lambd` で決まる

`lambd` が大きいほど、間隔は短くなります。平均が `1 / lambd` なので、「平均何秒」で考えたいときは、その逆数を渡せばよくなります。

### 負の値を避ける

`-log(u)` は、`u` が 0 から 1 の間なら正の値になります。そのため、間隔が負になることはありません。

## まとめ

- 指数分布の乱数は、一様乱数の対数を取って作れる。
- 対数の引数が 0 にならないよう、`1 - random()` を使う。
- パラメータを平均の逆数で持つと、間隔の計算が直感的になる。
