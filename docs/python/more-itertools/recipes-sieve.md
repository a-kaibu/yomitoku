---
title: エラトステネスのふるいで、n より小さい素数を並べる
description: more_itertools.sieve は、n より小さい素数を順に出す。奇数だけを bytearray に持ち、各素数の平方から先の倍数を 0 にする。iter_index で、残っている位置だけを読んでいく。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [911, 929]
function: sieve
difficulty: 3
format: 2
tags: [アルゴリズム, 数値計算, 探索]
---

## ひとことで

`sieve(n)` は、**`n` より小さい素数を、小さい順に出す** 関数です。
`sieve(30)` は `2`、`3`、`5`、`7`、`11`、`13`、`17`、`19`、`23`、`29` を返します。

## コード

::: code-group

```python:line-numbers=911 [日本語訳]
def sieve(n):
    """n より小さい素数を、順に出す。

    >>> list(sieve(30))
    [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]

    """
    # この実装は、古い版の itertools のドキュメントから来ている。
    # 新しい版の実装は読みやすいが、
    # 遅延評価の度合いが低い。
    if n > 2:
        yield 2
    start = 3
    data = bytearray((0, 1)) * (n // 2)
    for p in iter_index(data, 1, start, stop=isqrt(n) + 1):
        yield from iter_index(data, 1, start, p * p)
        data[p * p : n : p + p] = bytes(len(range(p * p, n, p + p)))
        start = p * p
    yield from iter_index(data, 1, start)
```

```python:line-numbers=911 [原文]
def sieve(n):
    """Yield the primes less than n.

    >>> list(sieve(30))
    [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]

    """
    # This implementation comes from an older version of the itertools
    # documentation.  The newer implementation is easier to read but is
    # less lazy.
    if n > 2:
        yield 2
    start = 3
    data = bytearray((0, 1)) * (n // 2)
    for p in iter_index(data, 1, start, stop=isqrt(n) + 1):
        yield from iter_index(data, 1, start, p * p)
        data[p * p : n : p + p] = bytes(len(range(p * p, n, p + p)))
        start = p * p
    yield from iter_index(data, 1, start)
```

:::

## 前提知識

- **素数**: 1 と自分自身以外に約数がない、2 以上の整数です。
- **エラトステネスのふるい**: 2 から順に、その倍数を消していく素数の見つけ方です。消し残ったものが素数になります。
- **`bytearray`**: 0 から 255 までの数を、バイトの列として持つ可変の配列です。
- **平方根**: 2 乗すると元の数になる数です。ふるいでは、消す範囲の上限に使います。

## 何をしているか

### 1. 2 を先に出し、奇数の表を作る

```python:line-numbers=921
    if n > 2:
        yield 2
```

`n` が 3 より大きければ、2 は素数なので先に出します。`bytearray((0, 1)) * (n // 2)` で、位置が奇数のところだけ `1` になる表を作ります。`1` の位置が、まだ素数の候補です。

### 2. 小さい素数の倍数を消す

```python:line-numbers=923
    start = 3
    data = bytearray((0, 1)) * (n // 2)
    for p in iter_index(data, 1, start, stop=isqrt(n) + 1):
        yield from iter_index(data, 1, start, p * p)
```

平方根までの素数 `p` を順に探し、`p * p` から始めて、奇数の倍数の位置を `0` にします。`iter_index` は、表の中で値が `1` の位置を順に返す関数です。

```python:line-numbers=927
        data[p * p : n : p + p] = bytes(len(range(p * p, n, p + p)))
        start = p * p
```

`p * p` より前の位置は、それより小さい素数で消されているので、次の探し始めを `p * p` にします。

### 3. 残った候補を出す

```python:line-numbers=929
    yield from iter_index(data, 1, start)
```

最後の探し始めから後ろで、まだ `1` のままの位置を、素数として出します。

## ここがすごい

### 奇数だけを調べる

偶数はすべて 2 の倍数なので、最初から表に入れません。調べる数を半分にしています。

### 平方根までで十分

`p` の平方より小さい倍数は、より小さい素数によって消されています。そのため、平方根までの素数だけを使えば、すべての合成数を消せます。

### 遅延評価の形を取る

素数を全部並べてから返すのではなく、見つけたものから `yield` で出します。コメントにあるように、古い版の書き方を残しているので、新しい版より遅延評価の度合いが違います。

## まとめ

- 奇数だけを表に持つと、調べる数を半分にできる。
- 平方根までの素数で倍数を消せば、すべての合成数が消える。
- 見つけた順に出すと、大きな `n` でも結果を少しずつ使える。
