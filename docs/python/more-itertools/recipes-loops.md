---
title: 数を作らずに、n 回だけ回るための列を作る
description: more_itertools.loops は、n 個の要素を持つ列を返す。range(n) と違って整数を作らず、None を n 回出す repeat を使うので、回数だけを数えたいときに軽く動く。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [1278, 1289]
function: loops
difficulty: 1
format: 2
tags: [イテレータ, 最適化, 可読性]
---

## ひとことで

`loops(n)` は、**`n` 回回るためだけの列** を返す関数です。
`for _ in loops(5):` は 5 回回ります。`range(5)` と同じ回数ですが、中で数を作らないので、ループ変数の値を使わないときに向いています。

## コード

::: code-group

```python:line-numbers=1278 [日本語訳]
def loops(n):
    """効率よく回すための、*n* 個の要素を持つイテラブルを返す。
    ``range(n)`` に似ているが、整数を作らない。

    >>> i = 0
    >>> for _ in loops(5):
    ...     i += 1
    >>> i
    5

    """
    return repeat(None, n)
```

```python:line-numbers=1278 [原文]
def loops(n):
    """Returns an iterable with *n* elements for efficient looping.
    Like ``range(n)`` but doesn't create integers.

    >>> i = 0
    >>> for _ in loops(5):
    ...     i += 1
    >>> i
    5

    """
    return repeat(None, n)
```

:::

## 前提知識

- **`range(n)`**: `0` から `n - 1` までの整数を、順に出す組み込みの関数です。
- **`repeat(None, n)`**: `None` を `n` 回出すイテレータです。
- **`_`（アンダースコア）**: 値を使わないことを示す、慣習的な変数名です。
- **整数オブジェクト**: Python では、数も 1 つずつ作られる値です。作る回数が少ないほど、メモリや時間を節約できます。

## 何をしているか

### 1. `None` を `n` 回出す

```python:line-numbers=1289
    return repeat(None, n)
```

`repeat(None, n)` は、`None` を `n` 回だけ出すイテレータを作ります。値そのものは使われず、回数だけが大切なときに使えます。

## ここがすごい

### 数を作らない

`range(n)` は、ループのたびに整数を作ります。`loops(n)` は `None` を出すだけなので、整数オブジェクトを作る必要がありません。

### 意図が読み取りやすい

`for _ in loops(n):` と書くと、「値は使わず、回数だけが大切」と読み手に伝わります。ループ変数に意味がないことを、形で示せます。

### 大きな回数でも軽い

回数が多くなるほど、作られる整数の数の差が効いてきます。回数だけを数える処理では、この差を利用できます。

## まとめ

- 値を使わない回数だけのループには、`repeat` を使うと整数を作らずに済む。
- `for _ in ...` と書くと、値を使わないという意図が伝わる。
- 回数だけが大切な場面では、軽く速く動く選択肢になる。
