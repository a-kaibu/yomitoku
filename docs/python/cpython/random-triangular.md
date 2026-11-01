---
title: 山の位置を 1 つ決めて、三角形の形に従う乱数を作る
description: random.triangular は、下限・上限・最頻値の 3 つを決めた三角分布に従う乱数を返す。逆関数法で作り、最頻値が左右どちらに偏っていても同じ式で扱えるように、鏡像を使っている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [511, 534]
function: Random.triangular
difficulty: 2
format: 2
tags: [乱数, 数値計算, アルゴリズム]
---

## ひとことで

`triangular(low, high, mode)` は、**下限 `low`、上限 `high`、最も多く出る値 `mode` を決めた三角形の分布** に従う乱数を返す関数です。
`triangular(0, 10, 2)` は、0 から 10 の範囲で、2 の近くが出やすい乱数を返します。

## コード

::: code-group

```python:line-numbers=511 [日本語訳]
    def triangular(self, low=0.0, high=1.0, mode=None):
        """三角分布。

        Continuous distribution bounded by given lower and upper limits,
        and having a given mode value in-between.

        http://en.wikipedia.org/wiki/Triangular_distribution

        The mean (expected value) and variance of the random variable are:

            E[X] = (low + high + mode) / 3
            Var[X] = (low**2 + high**2 + mode**2 - low*high - low*mode - high*mode) / 18

        """
        u = self.random()
        try:
            c = 0.5 if mode is None else (mode - low) / (high - low)
        except ZeroDivisionError:
            return low
        if u > c:
            u = 1.0 - u
            c = 1.0 - c
            low, high = high, low
        return low + (high - low) * _sqrt(u * c)
```

```python:line-numbers=511 [原文]
    def triangular(self, low=0.0, high=1.0, mode=None):
        """Triangular distribution.

        Continuous distribution bounded by given lower and upper limits,
        and having a given mode value in-between.

        http://en.wikipedia.org/wiki/Triangular_distribution

        The mean (expected value) and variance of the random variable are:

            E[X] = (low + high + mode) / 3
            Var[X] = (low**2 + high**2 + mode**2 - low*high - low*mode - high*mode) / 18

        """
        u = self.random()
        try:
            c = 0.5 if mode is None else (mode - low) / (high - low)
        except ZeroDivisionError:
            return low
        if u > c:
            u = 1.0 - u
            c = 1.0 - c
            low, high = high, low
        return low + (high - low) * _sqrt(u * c)
```

:::

## 前提知識

- **三角分布**: 山が 1 つの三角形の形をした分布です。山の頂点（最頻値）から、左右に直線的に減っていきます。
- **最頻値（mode）**: 最も出やすい値です。省略すると、真ん中（`(low + high) / 2`）になります。
- **逆関数法**: 一様乱数 `u` を、分布の累積の逆関数に通して乱数を作る方法です。
- **平方根**: 2 乗すると元の数になる数です。`_sqrt` は `math.sqrt` の短い名前です。

## 何をしているか

### 1. 一様乱数と、山の位置を求める

```python:line-numbers=525
        u = self.random()
        try:
            c = 0.5 if mode is None else (mode - low) / (high - low)
```

`u` は 0 以上 1 未満の一様乱数です。`c` は、最頻値が全体の範囲のどこにあるかを 0 から 1 で表したものです。最頻値が省略されていれば、真ん中の 0.5 になります。

### 2. 山が右寄りなら、鏡に映す

```python:line-numbers=528
        except ZeroDivisionError:
            return low
        if u > c:
            u = 1.0 - u
            c = 1.0 - c
            low, high = high, low
```

`u > c` の場合は、`u` と `c` を `1 - u`、`1 - c` にして、`low` と `high` を入れ替えます。山の位置を左側に寄せるための鏡像です。これで、同じ式を左右どちらの場合にも使えます。

### 3. 平方根で乱数を作る

```python:line-numbers=534
        return low + (high - low) * _sqrt(u * c)
```

`low + (high - low) * sqrt(u * c)` で乱数にします。`u` と `c` の積の平方根が、山の左側の形に従う値になります。

## ここがすごい

### 鏡像で場合分けを減らす

山が左にあるか右にあるかで、式を 2 通り書く必要がありません。`u > c` のときだけ、入力を鏡に映せば、1 つの式で済みます。

### 逆関数で正確な分布を作る

一様乱数から、分布の形をそのまま作れます。棄却法のように、捨てる回数が多くなる方法とは違い、1 回の乱数で 1 つの値が決まります。

### 最頻値が等しいときの扱い

`high - low` が 0 のときは、ゼロ除算になります。コードはこれを `ZeroDivisionError` として捕まえ、`low` を返します。範囲がないなら、その値しかないという考え方です。

## まとめ

- 三角分布の乱数は、一様乱数と平方根で逆関数法により作れる。
- 山の位置が左右どちらでも同じ式で扱えるように、鏡像を使うと場合分けが減る。
- 範囲がゼロの特別な場合は、例外を捕まえて答えを決める。
