---
title: 条件に合わなくなった要素も、最後に 1 つだけ含める
description: more_itertools.takewhile_inclusive は、itertools.takewhile と似ているが、条件を満たさなくなった最初の要素も 1 つだけ出してから止まる。区切りになった値を結果に残したいときに使う。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [5087, 5098]
function: takewhile_inclusive
difficulty: 1
format: 2
tags: [イテレータ, 関数型, 遅延評価]
---

## ひとことで

`takewhile_inclusive(predicate, iterable)` は、**条件が真の間は要素を出し、初めて偽になった要素も出してから止まる** 関数です。
`takewhile_inclusive(lambda x: x < 5, [1, 4, 6, 4, 1])` は `[1, 4, 6]` を出します。`takewhile` なら `[1, 4]` で止まります。

## コード

::: code-group

```python:line-numbers=5087 [日本語訳]
def takewhile_inclusive(predicate, iterable):
    """:func:`takewhile` の変種で、条件を満たさなくなった要素も 1 つだけ出すもの。

        >>> list(takewhile_inclusive(lambda x: x < 5, [1, 4, 6, 4, 1]))
        [1, 4, 6]

    :func:`takewhile` would return ``[1, 4]``.
    """
    for x in iterable:
        yield x
        if not predicate(x):
            break
```

```python:line-numbers=5087 [原文]
def takewhile_inclusive(predicate, iterable):
    """A variant of :func:`takewhile` that yields one additional element.

        >>> list(takewhile_inclusive(lambda x: x < 5, [1, 4, 6, 4, 1]))
        [1, 4, 6]

    :func:`takewhile` would return ``[1, 4]``.
    """
    for x in iterable:
        yield x
        if not predicate(x):
            break
```

:::

## 前提知識

- **`takewhile(pred, it)`**: 条件が真の間の要素を出し、最初に偽になった要素で止まる関数です。その偽の要素は出しません。
- **述語（predicate）**: 要素を受け取って、真か偽を返す関数です。
- **`break`**: ループを途中で抜ける文です。
- **`yield`**: 値を 1 つずつ外へ渡す文です。

## 何をしているか

### 1. 要素を出す

```python:line-numbers=5095
    for x in iterable:
        yield x
```

`for` で要素を 1 つずつ取り出し、そのまま出します。

### 2. 条件を確かめて、偽なら止める

```python:line-numbers=5097
        if not predicate(x):
            break
```

要素を出した後で条件を確かめます。偽だった要素は、もう出してあります。そのあと `break` でループを抜けるので、以降の要素は読まれません。

## ここがすごい

### 「区切り」を結果に残せる

`takewhile` では、条件を破った要素はどこにも現れません。たとえば「5 未満の数だけを集める」と「最初に 5 以上になった数まで集める」は、少し違う結果になります。この関数は後者のように、区切りの値を 1 つ残します。

### 出す順番がポイント

判定を先にすると、偽の要素は出せません。出してから判定すると、偽の要素を含めて止められます。`yield` と `if` の順番を入れ替えるだけで、結果が変わります。

### 後ろは読まない

`break` で止まるので、その後の要素は読みません。無限のイテレータでも、条件を破った時点で終わります。

## まとめ

- 条件を満たさなくなった最初の要素を含めたいときは、出してから判定する。
- `takewhile` と違い、区切りの値が結果に残る。
- `yield` と判定の順番を変えるだけで、結果の意味が変わる。
