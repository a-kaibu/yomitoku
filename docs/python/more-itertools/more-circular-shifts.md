---
title: deque を回して、循環シフトを重複なく出す
description: more_itertools.circular_shifts は、列を左右に回した並びを順に出す。collections.deque の rotate で回し、回り終わるまでの回数を要素数と gcd から求めて、同じ並びを繰り返さない。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [3237, 3264]
function: circular_shifts
difficulty: 2
format: 2
tags: [イテレータ, アルゴリズム, データ構造]
---

## ひとことで

`circular_shifts(iterable, steps=1)` は、**列の要素を 1 つずつずらした並び（循環シフト）を、順に出す** 関数です。
`circular_shifts(range(4))` は `(0, 1, 2, 3)`、`(1, 2, 3, 0)`、`(2, 3, 0, 1)`、`(3, 0, 1, 2)` を出します。

## コード

::: code-group

```python:line-numbers=3237 [日本語訳]
def circular_shifts(iterable, steps=1):
    """*iterable* の循環シフトを順に出す。

    >>> list(circular_shifts(range(4)))
    [(0, 1, 2, 3), (1, 2, 3, 0), (2, 3, 0, 1), (3, 0, 1, 2)]

    Set *steps* to the number of places to rotate to the left
    (or to the right if negative).  Defaults to 1.

    >>> list(circular_shifts(range(4), 2))
    [(0, 1, 2, 3), (2, 3, 0, 1)]

    >>> list(circular_shifts(range(4), -1))
    [(0, 1, 2, 3), (3, 0, 1, 2), (2, 3, 0, 1), (1, 2, 3, 0)]

    """
    buffer = deque(iterable)
    if steps == 0:
        raise ValueError('Steps should be a non-zero integer')

    buffer.rotate(steps)
    steps = -steps
    n = len(buffer)
    n //= math.gcd(n, steps)

    for _ in repeat(None, n):
        buffer.rotate(steps)
        yield tuple(buffer)
```

```python:line-numbers=3237 [原文]
def circular_shifts(iterable, steps=1):
    """Yield the circular shifts of *iterable*.

    >>> list(circular_shifts(range(4)))
    [(0, 1, 2, 3), (1, 2, 3, 0), (2, 3, 0, 1), (3, 0, 1, 2)]

    Set *steps* to the number of places to rotate to the left
    (or to the right if negative).  Defaults to 1.

    >>> list(circular_shifts(range(4), 2))
    [(0, 1, 2, 3), (2, 3, 0, 1)]

    >>> list(circular_shifts(range(4), -1))
    [(0, 1, 2, 3), (3, 0, 1, 2), (2, 3, 0, 1), (1, 2, 3, 0)]

    """
    buffer = deque(iterable)
    if steps == 0:
        raise ValueError('Steps should be a non-zero integer')

    buffer.rotate(steps)
    steps = -steps
    n = len(buffer)
    n //= math.gcd(n, steps)

    for _ in repeat(None, n):
        buffer.rotate(steps)
        yield tuple(buffer)
```

:::

`deque` は、両端から効率よく出し入れできる箱です。`rotate` は、箱の要素を回転させるメソッドです。`math.gcd` は、2 つの数の最大公約数を返す関数です。

## 前提知識

- **循環シフト**: 先頭から取り出した要素を、後ろに回した並びです。何回か繰り返すと、元の並びに戻ります。
- **`deque.rotate(n)`**: 要素を `n` 個ぶん回転させます。正の数は右へ、負の数は左へ回します。
- **最大公約数（gcd）**: 2 つの数が両方とも割り切れる、最も大きな数です。
- **`repeat(None, n)`**: `n` 回だけ繰り返すイテレータです。

## 何をしているか

### 1. 箱に入れて、0 ステップは禁止する

```python:line-numbers=3253
    buffer = deque(iterable)
    if steps == 0:
        raise ValueError('Steps should be a non-zero integer')
```

列を `deque` に入れます。`steps` が 0 なら、回さない意味がないのでエラーです。

### 2. 最初の位置へ回し、回数を求める

```python:line-numbers=3257
    buffer.rotate(steps)
    steps = -steps
    n = len(buffer)
    n //= math.gcd(n, steps)
```

最初に `steps` だけ回し、逆向きの `steps` を用意します。要素数 `n` を、`gcd(n, steps)` で割ります。この数が、同じ並びが一周するまでに出る回数です。

### 3. 回しながら、組にして出す

```python:line-numbers=3262
    for _ in repeat(None, n):
        buffer.rotate(steps)
        yield tuple(buffer)
```

ループで、毎回 `-steps` だけ回してから、今の並びを `tuple` にして出します。最初の回転で元の並びに戻るので、最初に元の並びが出ます。

## ここがすごい

### 同じ並びを繰り返さない

`n` 回回すと元に戻ってしまうので、全部を出すと同じ並びが何度も現れます。`gcd` で割ると、一周する途中で同じ並びが出るのを防げます。例えば要素数 4 で `steps = 2` なら、出るのは 2 通りだけです。

### 箱を回すだけで、ずらしが表せる

先頭を取って末尾に付けるという操作を、`deque.rotate` の 1 回の呼び出しで表しています。リストを作り直す必要がありません。

### 負の `steps` で逆向きも扱える

`steps` を負にすると、逆向きに回します。docstring の例のように、左向きと右向きを同じ関数で扱えます。

## まとめ

- 循環シフトは、`deque.rotate` で回すと簡単に表せる。
- 同じ並びを繰り返さないためには、一周する回数を `gcd` から求める。
- 向きは `steps` の符号で表せる。
