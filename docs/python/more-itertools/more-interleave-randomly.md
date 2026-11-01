---
title: 入力をランダムに選んで、順番を保ったまま混ぜ合わせる
description: more_itertools.interleave_randomly は、複数の入力からランダムに 1 つ選んで次の要素を出す。各入力の中の順番は保たれ、尽きた入力は配列の末尾と入れ替えて外す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [1398, 1418]
function: interleave_randomly
difficulty: 2
format: 2
tags: [乱数, イテレータ, アルゴリズム]
---

## ひとことで

`interleave_randomly(*iterables)` は、**入力のどれかをランダムに選び、その次の要素を出す** ことを繰り返す関数です。
`interleave_randomly([1, 2, 3], 'abc')` は、`'a', 'b', 1, 'c', 2, 3` のような、毎回違う混ざり方を出します。各入力の中の順番は、必ず保たれます。

## コード

::: code-group

```python:line-numbers=1398 [日本語訳]
def interleave_randomly(*iterables):
    """入力の *iterables* のどれかをランダムに選び、そこから次の要素を出すことを繰り返す。
    item from it.

        >>> iterables = [1, 2, 3], 'abc', (True, False, None)
        >>> list(interleave_randomly(*iterables))  # doctest: +SKIP
        ['a', 'b', 1, 'c', True, False, None, 2, 3]

    The relative order of the items in each input iterable will preserved. Note the
    sequences of items with this property are not equally likely to be generated.

    """
    iterators = [iter(e) for e in iterables]
    while iterators:
        idx = randrange(len(iterators))
        try:
            yield next(iterators[idx])
        except StopIteration:
            # list.pop と同じ働きだが、少しだけ速い
            iterators[idx] = iterators[-1]
            del iterators[-1]
```

```python:line-numbers=1398 [原文]
def interleave_randomly(*iterables):
    """Repeatedly select one of the input *iterables* at random and yield the next
    item from it.

        >>> iterables = [1, 2, 3], 'abc', (True, False, None)
        >>> list(interleave_randomly(*iterables))  # doctest: +SKIP
        ['a', 'b', 1, 'c', True, False, None, 2, 3]

    The relative order of the items in each input iterable will preserved. Note the
    sequences of items with this property are not equally likely to be generated.

    """
    iterators = [iter(e) for e in iterables]
    while iterators:
        idx = randrange(len(iterators))
        try:
            yield next(iterators[idx])
        except StopIteration:
            # equivalent to `list.pop` but slightly faster
            iterators[idx] = iterators[-1]
            del iterators[-1]
```

:::

`randrange` は、指定した範囲の整数を、ランダムに 1 つ返す関数です。

## 前提知識

- **イテレータ**: 1 回ずつ要素を取り出せるものです。尽きると `StopIteration` を出します。
- **ランダムな選択**: どの入力を選ぶかを、乱数で決めます。
- **`list.pop` と `del`**: リストから要素を取り除く方法です。末尾の要素を取り除くのは、速いです。

## 何をしているか

### 1. 入力をイテレータにする

```python:line-numbers=1410
    iterators = [iter(e) for e in iterables]
```

それぞれの入力を、順に取り出せるイテレータにします。

### 2. ランダムに 1 つ選んで、次の要素を出す

```python:line-numbers=1411
    while iterators:
        idx = randrange(len(iterators))
        try:
            yield next(iterators[idx])
```

まだ残っているイテレータの中から、ランダムに 1 つ選びます。そのイテレータの次の要素を `yield` します。

### 3. 尽きたイテレータを外す

```python:line-numbers=1415
        except StopIteration:
            # list.pop と同じ働きだが、少しだけ速い
            iterators[idx] = iterators[-1]
            del iterators[-1]
```

`StopIteration` が出たら、そのイテレータを末尾のものと入れ替えて、末尾を消します。並びの途中を詰め直す必要がないので、速く外せます。

## ここがすごい

### 各入力の中の順番は保たれる

選ばれたイテレータが尽きていなければ、そこから次の要素が出ます。そのため、1 つの入力の中の要素は、元の順番どおりに並びます。混ざるのは、入力どうしの間だけです。

### 尽きた入力は、末尾との入れ替えで外す

尽きたイテレータを外すために、リストの途中を詰めると、全体を動かす手間がかかります。末尾の要素と入れ替えてから末尾を消すと、1 回の操作で済みます。コメントはこれを `list.pop` と同じ働きだと説明しています。

### 混ざり方は一様ではない

docstring にあるとおり、すべての混ざり方が同じ確率で出るわけではありません。入力の長さが違うと、尽きるタイミングが変わるため、出やすい並びと出にくい並びが生じます。

## まとめ

- 複数の列を混ぜるときは、ランダムに選んだ列から次の要素を出すと、順番を崩さずに混ぜられる。
- 尽きた入力は、末尾と入れ替えて消すと速く外せる。
- ランダムな混ぜ方は、すべての組み合わせが等しい確率とは限らないと知っておく。
