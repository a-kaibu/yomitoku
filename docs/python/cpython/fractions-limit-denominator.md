---
title: 円周率から 22/7 を見つけ出す、連分数による最良近似
description: fractions.Fraction.limit_denominator は、分母が上限以下で元の値に最も近い分数を返す。連分数の収束値と準収束値を順に作り、上限を超える直前の候補と比べて近い方を選ぶ。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/fractions.py
lines: [384, 439]
function: Fraction.limit_denominator
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`limit_denominator(max_denominator)` は、**分母が `max_denominator` 以下の分数のうち、元の値に最も近いもの** を返す関数です。
`Fraction('3.141592653589793').limit_denominator(10)` は `Fraction(22, 7)` を返します。円周率の近似として知られる `22/7` が出てきます。

## コード

::: code-group

```python:line-numbers=384 [日本語訳]
    def limit_denominator(self, max_denominator=1000000):
        """分母が max_denominator 以下で、self に最も近い Fraction。

        >>> Fraction('3.141592653589793').limit_denominator(10)
        Fraction(22, 7)
        >>> Fraction('3.141592653589793').limit_denominator(100)
        Fraction(311, 99)
        >>> Fraction(4321, 8765).limit_denominator(10000)
        Fraction(4321, 8765)

        """
        # アルゴリズムの注記: 任意の実数 x について、*最良の上からの近似* を定義する。
        # 次を満たす有理数 p/q を、x の最良の上からの近似とする:
        #
        #   (1) p/q >= x であり、かつ
        #   (2) 任意の有理数 r/s について、p/q > r/s >= x なら s > q
        #
        # 同様に *最良の下からの近似* を定義する。すると、
        # 有理数が x の最良の上または下からの近似であることは、
        # x に対応する連分数の、収束値か
        # 準収束値（唯一の最短の連分数）であることと同じである。
        # 対応する。
        #
        # 分母が M 以下の最良の有理近似を求めるには、
        # 分母が M 以下の、最良の上と下からの近似を求め、
        # そのうち x に近い方を選ぶ。
        # 距離が同じなら、分母の小さい方を選ぶ。
        # 両方の分母が等しい場合（これが起きるのは
        # max_denominator が 1 で、self が 2 つの整数の中間にあるときだけ）、
        # 下側の限界、つまり self の床関数の値を
        # 選ぶ。

        if max_denominator < 1:
            raise ValueError("max_denominator should be at least 1")
        if self._denominator <= max_denominator:
            return Fraction(self)

        p0, q0, p1, q1 = 0, 1, 1, 0
        n, d = self._numerator, self._denominator
        while True:
            a = n//d
            q2 = q0+a*q1
            if q2 > max_denominator:
                break
            p0, q0, p1, q1 = p1, q1, p0+a*p1, q2
            n, d = d, n-a*d
        k = (max_denominator-q0)//q1

        # 候補 (p0+k*p1)/(q0+k*q1) と p1/q1 のどちらが
        # self に近いかを判定する。両者の距離は 1/(q1*(q0+k*q1)) で、
        # p1/q1 と self の距離は d/(q1*self._denominator) なので、
        # 2*(q0+k*q1) と self._denominator/d を比べればよい。
        if 2*d*(q0+k*q1) <= self._denominator:
            return Fraction._from_coprime_ints(p1, q1)
        else:
            return Fraction._from_coprime_ints(p0+k*p1, q0+k*q1)
```

```python:line-numbers=384 [原文]
    def limit_denominator(self, max_denominator=1000000):
        """Closest Fraction to self with denominator at most max_denominator.

        >>> Fraction('3.141592653589793').limit_denominator(10)
        Fraction(22, 7)
        >>> Fraction('3.141592653589793').limit_denominator(100)
        Fraction(311, 99)
        >>> Fraction(4321, 8765).limit_denominator(10000)
        Fraction(4321, 8765)

        """
        # Algorithm notes: For any real number x, define a *best upper
        # approximation* to x to be a rational number p/q such that:
        #
        #   (1) p/q >= x, and
        #   (2) if p/q > r/s >= x then s > q, for any rational r/s.
        #
        # Define *best lower approximation* similarly.  Then it can be
        # proved that a rational number is a best upper or lower
        # approximation to x if, and only if, it is a convergent or
        # semiconvergent of the (unique shortest) continued fraction
        # associated to x.
        #
        # To find a best rational approximation with denominator <= M,
        # we find the best upper and lower approximations with
        # denominator <= M and take whichever of these is closer to x.
        # In the event of a tie, the bound with smaller denominator is
        # chosen.  If both denominators are equal (which can happen
        # only when max_denominator == 1 and self is midway between
        # two integers) the lower bound---i.e., the floor of self, is
        # taken.

        if max_denominator < 1:
            raise ValueError("max_denominator should be at least 1")
        if self._denominator <= max_denominator:
            return Fraction(self)

        p0, q0, p1, q1 = 0, 1, 1, 0
        n, d = self._numerator, self._denominator
        while True:
            a = n//d
            q2 = q0+a*q1
            if q2 > max_denominator:
                break
            p0, q0, p1, q1 = p1, q1, p0+a*p1, q2
            n, d = d, n-a*d
        k = (max_denominator-q0)//q1

        # Determine which of the candidates (p0+k*p1)/(q0+k*q1) and p1/q1 is
        # closer to self. The distance between them is 1/(q1*(q0+k*q1)), while
        # the distance from p1/q1 to self is d/(q1*self._denominator). So we
        # need to compare 2*(q0+k*q1) with self._denominator/d.
        if 2*d*(q0+k*q1) <= self._denominator:
            return Fraction._from_coprime_ints(p1, q1)
        else:
            return Fraction._from_coprime_ints(p0+k*p1, q0+k*q1)
```

:::

## 前提知識

- **有理数（分数）**: 2 つの整数の比で表せる数です。`Fraction` は、分子と分母を持つ分数の型です。
- **連分数**: `a + 1/(b + 1/(c + ...))` の形で表す数の表し方です。途中で打ち切った値を「収束値」と呼びます。
- **準収束値（semiconvergent）**: 収束値の間にある、分母がより大きい値です。
- **床関数（floor）**: 数を超えない最大の整数です。

## 何をしているか

### 1. 上限の確認と、そのまま返す場合

```python:line-numbers=416
        if max_denominator < 1:
            raise ValueError("max_denominator should be at least 1")
        if self._denominator <= max_denominator:
            return Fraction(self)
```

分母の上限が 1 より小さければ、`ValueError` で止めます。元の分母がすでに上限以下なら、自分自身をそのまま返します。

### 2. 連分数の収束値を作る

```python:line-numbers=421
        p0, q0, p1, q1 = 0, 1, 1, 0
        n, d = self._numerator, self._denominator
```

`p0, q0, p1, q1` は、2 つ前と 1 つ前の収束値の分子と分母です。`n, d` は、今の分数の分子と分母です。

```python:line-numbers=423
        while True:
            a = n//d
            q2 = q0+a*q1
            if q2 > max_denominator:
                break
            p0, q0, p1, q1 = p1, q1, p0+a*p1, q2
            n, d = d, n-a*d
```

`a = n//d` が、連分数の次の項です。`q2` は次の分母で、上限を超えたら止めます。超えなければ、収束値の分子と分母を更新し、分数の残りを次の段階へ回します。

### 3. 準収束値を求める

```python:line-numbers=430
        k = (max_denominator-q0)//q1
```

上限を超えない範囲で、準収束値に使える係数 `k` を求めます。

### 4. 近い方を選ぶ

```python:line-numbers=436
        if 2*d*(q0+k*q1) <= self._denominator:
            return Fraction._from_coprime_ints(p1, q1)
        else:
            return Fraction._from_coprime_ints(p0+k*p1, q0+k*q1)
```

候補 `(p0+k*p1)/(q0+k*q1)` と `p1/q1` のどちらが元の値に近いかを、比べて決めます。近い方の分数を返します。

## ここがすごい

### 連分数が、近似の候補を並べてくれる

連分数の収束値は、分母が小さい中で最も良い近似になることが知られています。連分数を順に作るだけで、上限までの候補が自然に並びます。

### 候補を 2 つに絞って比べる

すべての分母を試すのではなく、収束値と準収束値の 2 つだけを比べます。上限が大きくても、計算は連分数の長さの分だけで済みます。

### 同じ距離のときの決まり

コメントには、同じ距離なら分母の小さい方を選ぶという決まりが書かれています。どちらを返すかが、はっきり決められています。

## まとめ

- 連分数の収束値と準収束値を順に作ると、分母の上限以下の良い近似が得られる。
- 候補を 2 つに絞って比べるので、分母の上限が大きくても速く答えが出る。
- 同じ距離の場合の決まりを明確にしておくと、結果が予測しやすい。
