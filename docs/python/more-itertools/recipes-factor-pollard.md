---
title: ウサギとカメの追いかけっこで約数を見つけるポラードのロー法
description: more_itertools の素因数分解で使われる内部関数。x² + b の計算をくり返し、速い列と遅い列の差と n の最大公約数を見ることで、大きな数の約数を見つけ出す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [1054, 1067]
function: _factor_pollard
difficulty: 3
format: 2
tags: [アルゴリズム, 数値計算, 乱数]
---

## ひとことで

`_factor_pollard(n)` は、**合成数 n の約数（1 と n 以外）を 1 つ見つける** 関数です。素因数分解をする `factor()` の中で、小さい素数で割り切れなかった大きな数に使われます。
アルゴリズムは **ポラードのロー法** と呼ばれ、割り算を順に試す方法よりはるかに速く、大きな約数を見つけられます。

## コード

::: code-group

```python:line-numbers=1054 [日本語訳]
def _factor_pollard(n):
    # ポラードのロー法で n の約数を 1 つ返す。
    # n が奇数の合成数のとき効率がよい。
    for b in range(1, n):
        x = y = 2
        d = 1
        while d == 1:
            x = (x * x + b) % n
            y = (y * y + b) % n
            y = (y * y + b) % n
            d = gcd(x - y, n)
        if d != n:
            return d
    raise ValueError('prime or under 5')  # pragma: no cover
```

```python:line-numbers=1054 [原文]
def _factor_pollard(n):
    # Return a factor of n using Pollard's rho algorithm.
    # Efficient when n is odd and composite.
    for b in range(1, n):
        x = y = 2
        d = 1
        while d == 1:
            x = (x * x + b) % n
            y = (y * y + b) % n
            y = (y * y + b) % n
            d = gcd(x - y, n)
        if d != n:
            return d
    raise ValueError('prime or under 5')  # pragma: no cover
```

:::

`gcd` は `math.gcd`（最大公約数）です。

## 前提知識

- **合成数と約数**: 1 と自分以外の約数を持つ数が合成数です。`91 = 7 × 13` など。
- **`%`（余り）**: `a % n` は a を n で割った余りで、0〜n-1 の値になります。
- **最大公約数（gcd）**: 2 つの数を両方割り切る最大の数です。`gcd(14, 91)` は 7 です。負の数を渡しても正しく計算されます。
- **ループの検出（フロイドの方法）**: 1 歩ずつ進む「カメ」と 2 歩ずつ進む「ウサギ」を同時に走らせると、道が輪になっていれば必ずどこかで同じ場所に来る、という方法です。

## 何をしているか

### 1. 数列を作るルールを決める

```python:line-numbers=1057
    for b in range(1, n):
        x = y = 2
        d = 1
```

`f(x) = (x * x + b) % n` という計算を繰り返して数列を作ります。`x` と `y` はどちらも 2 から始めます。

### 2. カメとウサギを進める

```python:line-numbers=1060
        while d == 1:
            x = (x * x + b) % n
            y = (y * y + b) % n
            y = (y * y + b) % n
            d = gcd(x - y, n)
```

`x` は 1 回、`y` は 2 回 `f` を適用します。そのたびに `gcd(x - y, n)` を計算し、1 でなくなるまで続けます。

`n = 91`、`b = 1` で追ってみます。

| ステップ | x | y | gcd(x - y, 91) |
| --- | --- | --- | --- |
| 1 | 5 | 26 | gcd(-21, 91) = 7 |

1 回目で 7 が見つかりました。

### 3. 失敗したら b を変える

```python:line-numbers=1065
        if d != n:
            return d
    raise ValueError('prime or under 5')  # pragma: no cover
```

`d` が n そのものになったら（x と y が完全に一致してしまった）、この `b` では見つからなかったので、次の `b` で最初からやり直します。最後まで見つからなければ、`ValueError` を出します。

## ここがすごい

### 「n の約数 p」で見ると早く輪になる

数列 `x → x² + b (mod n)` は、いつか必ず同じ値に戻り、輪になります。ここで、n の未知の約数 p（91 なら 7）で割った余りの世界を考えると、値は 0〜p-1 の p 通りしかないので、**n で見るよりずっと早く輪になります**（誕生日のパラドックスと同じ理屈で、およそ √p ステップ）。

p の世界で x と y が同じ値になると、`x - y` は p の倍数です。p を知らなくても、`gcd(x - y, n)` を計算すれば p（またはその倍数）が出てきます。直接は見えない約数の世界での一致を、gcd で間接的に検出しているのがこのアルゴリズムの核心です。

### 輪の検出にメモリを使わない

「同じ値が出たか」を調べるのに、出た値を全部覚えておく必要はありません。カメとウサギの方法なら、`x` と `y` の 2 つの数だけで輪を検出できます。

### 試し割りとの比較

素直に「2, 3, 5, ... で順に割ってみる」と、約数 p を見つけるのに p 回程度の割り算が必要です。ロー法なら約 √p 回で済みます。p が 100 万なら、100 万回が 1000 回程度になります。
ただし、これは確率的なアルゴリズムで、運が悪いと失敗します。そのときは `b` を変えてやり直す、という単純な対策で十分に機能します。

## まとめ

- ポラードのロー法は、x² + b の数列とカメとウサギの方法で、合成数の約数を約 √p ステップで見つける。
- 見えない世界（約数 p で割った余り）での一致を、gcd で見つけ出す発想が鍵。
- 確率的な方法は、失敗したら条件を変えてやり直せばよい。
