---
title: 小さい値が多く、たまに大きな値が出る乱数を作る
description: random.paretovariate は、パレート分布に従う乱数を返す。べき乗の式 u ** (-1/alpha) で作り、alpha が小さいほど大きな値が出やすくなる。富の分布や、ファイルサイズの分布のような、偏った現象のモデルに使う。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [768, 773]
function: Random.paretovariate
difficulty: 1
format: 2
tags: [乱数, 数値計算]
---

## ひとことで

`paretovariate(alpha)` は、**パレート分布に従う乱数** を返す関数です。
ほとんどは 1 に近い小さな値ですが、ときどき非常に大きな値が出ます。`alpha` は形を決めるパラメータで、小さいほど大きな値が出やすくなります。

## コード

::: code-group

```python:line-numbers=768 [日本語訳]
    def paretovariate(self, alpha):
        """パレート分布。alpha は形状パラメータ。"""
        # Jain, pg. 495（出典）

        u = 1.0 - self.random()
        return u ** (-1.0 / alpha)
```

```python:line-numbers=768 [原文]
    def paretovariate(self, alpha):
        """Pareto distribution.  alpha is the shape parameter."""
        # Jain, pg. 495

        u = 1.0 - self.random()
        return u ** (-1.0 / alpha)
```

:::

## 前提知識

- **パレート分布**: 小さな値が多く、大きな値は少ないけれどたまに出る、偏った分布です。「上位 20% が全体の 80% を持つ」といった現象のモデルに使われます。
- **形状パラメータ（alpha）**: 分布の形を決める数です。小さいほど、裾が長く、大きな値が出やすくなります。
- **べき乗 `**`**: 数の累乗を表す演算子です。`x ** y` は `x` の `y` 乗です。
- **一様乱数**: 0 以上 1 未満の数で、どの値も同じ確率で出ます。

## 何をしているか

### 1. 0 にならない一様乱数を作る

```python:line-numbers=772
        u = 1.0 - self.random()
```

`1.0 - self.random()` は、0 より大きく 1 以下の値です。0 を避けることで、次の計算で 0 の負のべき乗を求めずに済みます。

### 2. べき乗で乱数にする

```python:line-numbers=773
        return u ** (-1.0 / alpha)
```

`u ** (-1.0 / alpha)` で、1 以上の値を作ります。`u` が小さいほど、結果は大きくなります。小さい `u` は、まれにしか出ないので、大きな値もまれです。

## ここがすごい

### 1 行で偏った分布が作れる

べき乗の 1 つの式で、裾の長い分布ができます。特別な表や複雑な計算は必要ありません。

### `alpha` で偏りの強さを調整する

`alpha` を小さくすると、大きな値が出やすくなります。現象に合わせて偏りの強さを変えられるので、モデル化に向いています。

### 値は必ず 1 以上

`u` は 1 以下なので、`u ** (-1/alpha)` は必ず 1 以上になります。最小値が 1 の分布だと分かる作りです。

## まとめ

- 偏った分布は、べき乗の式で一様乱数から作れる。
- 形状パラメータを変えると、大きな値の出やすさを調整できる。
- 0 にならない一様乱数を使うと、計算の途中で困ることがない。
