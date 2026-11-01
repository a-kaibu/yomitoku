---
title: 漸化式と符号の反転だけで「完全順列の数」を数える
description: more_itertools.subfactorial は、全員が自分以外のプレゼントを受け取る並べ方（完全順列）の数を求める。D(n) = n·D(n-1) + (-1)^n という漸化式を、変数 2 つのループで計算している。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [5593, 5616]
function: subfactorial
difficulty: 2
tags: [数値計算, アルゴリズム]
---
## ひとことで

`subfactorial(n)` は、n 個のものを並べ替えたとき、**どれも元の位置に来ない並べ方の数**（完全順列、攪乱順列）を返す関数です。記号では `!n` と書きます。
たとえば 3 人がプレゼントを交換して、誰も自分のプレゼントを受け取らない方法は 2 通りなので、`subfactorial(3)` は `2` です。`subfactorial(4)` は `9` です。
計算は 4 行のループで、掛け算と、符号を交互に変える足し算だけです。

## コード

```python:line-numbers=5593
def subfactorial(n):
    """Number of permutations of *n* elements with no fixed points.

    The :func:`subfactorial` function computes the length of
    :func:`derangements`.  For example, there are 1,854 ways to
    rearrange the letters in word "epsilon" without leaving any
    letter in its original position:

        >>> from more_itertools import derangements, ilen
        >>> ilen(derangements('epsilon'))
        1854
        >>> subfactorial(len('epsilon'))
        1854

    Reference:  https://oeis.org/A000166

    """
    if n < 0:
        raise ValueError
    sf = adj = 1
    for i in range(n + 1):
        sf = sf * i + adj
        adj = -adj
    return sf
```

## 前提知識

- **完全順列**: `[1, 2, 3]` の並べ替えで、1 番目が 1、2 番目が 2、3 番目が 3、のどれも起きないものです。`[2, 3, 1]` と `[3, 1, 2]` の 2 通りがあります。
- **漸化式**: 前の値から次の値を計算する式です。
- **`sf = adj = 1`**: 2 つの変数に同じ値を一度に代入します。
- **`adj = -adj`**: 符号を反転します。1 → -1 → 1 → ……と交互に変わります。
- **`range(n + 1)`**: 0, 1, 2, ..., n です。

## 何をしているか

完全順列の数には、`D(n) = n × D(n-1) + (-1)^n` という漸化式が知られています（`D(0) = 1`）。

### 1. 負の数はエラー（5610〜5611 行目）

### 2. ループで漸化式を計算する（5612〜5615 行目）

`adj` が `(-1)^i` の役割で、毎回符号が反転します。

| i | 計算 | sf | 次の adj |
| --- | --- | --- | --- |
| 0 | 1 × 0 + 1 | 1 | -1 |
| 1 | 1 × 1 - 1 | 0 | 1 |
| 2 | 0 × 2 + 1 | 1 | -1 |
| 3 | 1 × 3 - 1 | 2 | 1 |
| 4 | 2 × 4 + 1 | 9 | -1 |

`D(0) = 1, D(1) = 0, D(2) = 1, D(3) = 2, D(4) = 9` と、正しく求まります。

### 3. 結果を返す（5616 行目）

## ここがすごい

### `i = 0` から回して初期値を自然に作る

`sf = 1` から始めて `i = 0` のステップを計算すると、`1 × 0 + 1 = 1` で `D(0) = 1` になります。`D(0)` を特別扱いする if 文を書かずに、ループの最初の 1 回で初期値ができあがります。

### `(-1)^n` をべき乗で計算しない

`(-1) ** i` と書けば符号は求まりますが、毎回べき乗を計算することになります。変数 `adj` を毎回反転するだけなら、計算はほぼゼロです。「交互に変わる値」は、反転を繰り返す変数で持つのが定番です。

### 素直な方法との比較

定義どおりにすべての並べ替えを作って、元の位置に来るものがないか調べると、n! 通りを調べることになります。n = 20 で 2.4 × 10^18 通りです。漸化式なら 21 回のループで済みます。

また、`!n` は `n! / e` に最も近い整数であることも知られていますが、小数の `e` を使うと、n が大きいときに誤差で正しい整数が得られなくなります。整数だけで計算するこの方法なら、Python の大きな整数を使って、どれだけ大きな n でも正確です。

## まとめ

- 完全順列の数は `D(n) = n·D(n-1) + (-1)^n` で計算できる。
- 交互に変わる符号は、べき乗ではなく反転する変数で持つ。
- 小数の公式より、整数の漸化式の方が大きな値でも正確。
