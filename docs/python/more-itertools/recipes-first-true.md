---
title: 条件を満たす最初の値を、残りを読まずに取り出す
description: more_itertools.first_true は、列の中で最初に真になる要素を返す。pred を渡すと、その条件を満たす最初の要素を返す。見つからなければ default を返す。filter と next を組み合わせ、最初の 1 件で止まる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [568, 585]
function: first_true
difficulty: 1
format: 2
tags: [イテレータ, 探索, 遅延評価]
---

## ひとことで

`first_true(iterable, default=None, pred=None)` は、**列の中で最初に真になる値** を返す関数です。
`first_true(range(10))` は `1` を返します。`0` は偽なので、飛ばされます。

## コード

::: code-group

```python:line-numbers=568 [日本語訳]
def first_true(iterable, default=None, pred=None):
    """
    列の中で、最初に真になる値を返す。

    真の値がなければ *default* を返す。

    *pred* が None でなければ、次の条件を満たす最初の要素を返す:
    ``pred(item) == True`` を満たす要素。

        >>> first_true(range(10))
        1
        >>> first_true(range(10), pred=lambda x: x > 5)
        6
        >>> first_true(range(10), default='missing', pred=lambda x: x > 9)
        'missing'

    """
    return next(filter(pred, iterable), default)
```

```python:line-numbers=568 [原文]
def first_true(iterable, default=None, pred=None):
    """
    Returns the first true value in the iterable.

    If no true value is found, returns *default*

    If *pred* is not None, returns the first item for which
    ``pred(item) == True`` .

        >>> first_true(range(10))
        1
        >>> first_true(range(10), pred=lambda x: x > 5)
        6
        >>> first_true(range(10), default='missing', pred=lambda x: x > 9)
        'missing'

    """
    return next(filter(pred, iterable), default)
```

:::

## 前提知識

- **真と偽**: `0`、空の文字列、`None` などは偽として扱われ、それ以外は真として扱われます。
- **`filter`**: 条件に合う要素だけを残すイテレータを作る組み込み関数です。条件が `None` なら、真の要素を残します。
- **`next(it, default)`**: イテレータから次の値を取り出します。尽きていたら、`default` を返します。

## 何をしているか

### 1. 条件に合う要素だけを残す

`filter(pred, iterable)` は、`pred` が真を返す要素だけを順に出すイテレータを作ります。`pred` が `None` なら、要素そのものの真偽で選びます。

### 2. 最初の 1 件を取り出す

```python:line-numbers=585
    return next(filter(pred, iterable), default)
```

`next` で、条件に合う最初の要素を 1 つだけ取り出します。見つからなければ、`default` を返します。

## ここがすごい

### 最初の 1 件で止まる

`next` は 1 回しか呼ばれないので、残りの要素は読まれません。大きな列でも、答えが早く見つかれば、そこで終わります。

### 条件の省略と指定を両立する

`pred` を省略すれば、真の値を探せます。条件が必要なら、`pred` に関数を渡します。1 つの関数で、両方の使い方に対応しています。

### 見つからない場合を `default` で決める

見つからなかったときの答えを、呼び出し側が決められます。例外を使わずに、「ない」を値として扱えます。

## まとめ

- `filter` と `next` を組み合わせると、最初の該当要素を 1 件だけ読める。
- 条件を省略すると、真の値を探す使い方になる。
- 見つからない場合の答えは `default` で決められる。
