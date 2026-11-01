---
title: 円周率から 22/7 を見つけ出す、連分数による最良近似
description: fractions.Fraction.limit_denominator は、分母が指定以下の分数のうち、元の値にいちばん近いものを返す。連分数の考え方で候補を絞り、最後に 2 つを比べている。
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
tags: [数値計算, アルゴリズム, 標準ライブラリ]
---
## ひとことで

`limit_denominator(max_denominator)` は、**分母が `max_denominator` 以下の分数の中で、元の値にいちばん近いもの** を返すメソッドです。
`Fraction('3.141592653589793').limit_denominator(10)` は `22/7` を返します。昔から知られる円周率の近似値が、計算で自動的に見つかります。
分母を 1 から順に全部試すのではなく、**連分数** という数学の道具で、候補を一気に絞り込んでいます。

## コード

```python:line-numbers=384
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

`self._numerator` と `self._denominator` は分数の分子と分母です。`Fraction._from_coprime_ints(p, q)` は、`p` と `q` がすでに約分済みとわかっているときに、約分を省いて分数を作る内部用のメソッドです。

## 前提知識

- **`Fraction`**: 分数を正確に表すクラスです。`Fraction(1, 3)` は 1/3 で、小数のような誤差がありません。
- **連分数**: 数を「整数 + 1/(整数 + 1/(整数 + …))」の形で表したものです。円周率は `3 + 1/(7 + 1/(15 + 1/(1 + …)))` です。途中で打ち切ると、3、22/7、333/106、355/113……と、どんどん精度の良い分数（**近似分数**）が得られます。
- **`n // d`**: 切り捨ての割り算です。
- **多重代入**: `p0, q0, p1, q1 = p1, q1, p0+a*p1, q2` は、右辺を全部計算してから左辺に代入します。
- **`while True` と `break`**: 条件を満たすまで繰り返し、`break` で抜けます。

## 何をしているか

π（`n/d = 3141592653589793 / 1000000000000000`）、`max_denominator = 10` で追います。

### 1. すでに条件を満たすなら、そのまま（416〜419 行目）

分母がもともと 10 以下なら、自分自身を返します。

### 2. 連分数を展開して近似分数を作る（421〜429 行目）

`p1/q1` が最新の近似分数、`p0/q0` が 1 つ前の近似分数です。

| a（連分数の項） | 新しい分母 q2 | 近似分数 p1/q1 |
| --- | --- | --- |
| 3 | 1 | 3/1 |
| 7 | 7 | 22/7 |
| 15 | 106 > 10 | （打ち切り） |

各ステップで、`n/d` の整数部分 `a` を取り出し、`n, d = d, n - a*d` で「残りの小数部分の逆数」に進みます。これはユークリッドの互除法と同じ計算です。分母が 10 を超えたら止めます。

### 3. もう 1 つの候補を作る（430 行目）

近似分数の「間」にも良い候補（中間近似分数）があります。`k = (10 - 1) // 7 = 1` で、`(p0 + k*p1) / (q0 + k*q1) = 25/8` を作ります。分母が 10 以下に収まる最大の `k` です。

### 4. 2 つの候補のうち近い方を選ぶ（436〜439 行目）

候補は 22/7（≒3.1429）と 25/8（=3.125）です。π に近いのは 22/7 なので、これを返します。比較は小数を使わず、整数の掛け算だけで行っています。

## ここがすごい

### 「最良近似は近似分数か中間近似分数」という定理を使う

395〜414 行目のコメントにある通り、「分母がそれより小さい分数では、これより近づけない」という意味で最良の近似分数は、必ず連分数の **近似分数か中間近似分数** になることが証明されています。そのため、調べる必要があるのは最後の 2 つの候補だけです。
分母を 1 から M まで全部試すと M 回の計算が必要ですが、連分数の展開は数十回で終わります。`max_denominator` が 100 万でも一瞬です。

### 小数を一切使わない

比較の式 `2*d*(q0+k*q1) <= self._denominator` は、「どちらが近いか」を整数の掛け算に変形したものです（432〜435 行目のコメント）。小数を使うと丸め誤差で判定を誤る可能性がありますが、整数ならどれだけ大きくても正確です。

### 約分を省く

連分数から得られる近似分数は、性質上すでに約分済みです。それを知っているので `_from_coprime_ints` を使い、最大公約数の計算を省いています。

## まとめ

- 「分母が M 以下で最も近い分数」は、連分数の近似分数と中間近似分数の 2 つを比べれば求まる。
- 数学の定理を使うと、全探索を数十回の計算に減らせる。
- 大小の比較は、式を変形すれば整数だけで正確に行える。
