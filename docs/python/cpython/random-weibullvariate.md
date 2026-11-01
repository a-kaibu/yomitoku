---
title: 故障までの時間のような、寿命の乱数を二重の対数で作る
description: random.weibullvariate は、ワイブル分布に従う乱数を返す。一様乱数の対数を取り、べき乗で尺度をかける。故障までの時間や部品の寿命のモデルに使われる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [775, 784]
function: Random.weibullvariate
difficulty: 2
format: 2
tags: [乱数, 数値計算, アルゴリズム]
---

## ひとことで

`weibullvariate(alpha, beta)` は、**ワイブル分布に従う乱数** を返す関数です。
機械の故障までの時間や、部品の寿命のように、時間とともに壊れやすさが変わる現象のモデルに使われます。`alpha` は尺度（だいたいの大きさ）、`beta` は形状（壊れやすさの変化の仕方）です。

## コード

::: code-group

```python:line-numbers=775 [日本語訳]
    def weibullvariate(self, alpha, beta):
        """ワイブル分布。

        alpha is the scale parameter and beta is the shape parameter.

        """
        # Jain, pg. 499。バグ修正は Bill Arms による

        u = 1.0 - self.random()
        return alpha * (-_log(u)) ** (1.0 / beta)
```

```python:line-numbers=775 [原文]
    def weibullvariate(self, alpha, beta):
        """Weibull distribution.

        alpha is the scale parameter and beta is the shape parameter.

        """
        # Jain, pg. 499; bug fix courtesy Bill Arms

        u = 1.0 - self.random()
        return alpha * (-_log(u)) ** (1.0 / beta)
```

:::

## 前提知識

- **ワイブル分布**: 寿命のモデルとして広く使われる分布です。`beta` が 1 のときは指数分布と同じになります。
- **尺度パラメータ（alpha）**: 分布の大きさを決める数です。大きいほど、寿命が長くなります。
- **形状パラメータ（beta）**: 分布の形を決める数です。1 より大きいと、時間とともに壊れやすくなり、1 より小さいと、初期に壊れやすくなります。
- **対数とべき乗**: 対数を取ってからべき乗を計算する、という 2 段階の変換です。

## 何をしているか

### 1. 0 にならない一様乱数を作る

```python:line-numbers=783
        u = 1.0 - self.random()
```

`1.0 - self.random()` で、0 より大きく 1 以下の値を作ります。次の対数計算で、0 の対数を避けるためです。

### 2. 対数を取り、べき乗をかけて、尺度をかける

```python:line-numbers=784
        return alpha * (-_log(u)) ** (1.0 / beta)
```

`-log(u)` は、指数分布に従う値です。それを `1 / beta` 乗すると、形状が変わります。最後に `alpha` をかけて、大きさを決めます。

## ここがすごい

### 指数分布を、形で広げる

ワイブル分布は、指数分布の乱数に、べき乗を 1 回かけただけで作れます。`beta` を 1 にすると、指数分布そのものに戻ります。

### 2 つのパラメータで、寿命の現象を表す

「どのくらいの寿命か」を `alpha` で、「壊れやすさがどう変わるか」を `beta` で表せます。同じ関数で、いろいろな寿命の現象を表現できます。

### 出典コメントを残す

コメントには、元になった本のページと、バグ修正をした人が書かれています。数学の式の出典を残すことで、後から確かめられます。

## まとめ

- ワイブル分布の乱数は、指数分布の乱数にべき乗と尺度をかけて作れる。
- 形状パラメータは、壊れやすさの変化の仕方を表す。
- 式の出典を残すと、アルゴリズムの正しさを後から確認できる。
