---
title: 整数の列に関数を当てて、結果を次々に出す
description: more_itertools.tabulate は、func(start)、func(start + 1) と続く結果を、無限に出すイテレータを返す。標準の count と map を組み合わせ、必要な分だけ値を読む遅延評価の形になっている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [129, 144]
function: tabulate
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`tabulate(function, start=0)` は、**`function(start)`、`function(start + 1)` と続く結果を、順に出すイテレータ** を返す関数です。
`tabulate(lambda x: x ** 2, -3)` は、`9`、`4`、`1`、`0` と続きます。終わりはなく、必要な分だけ読みます。

## コード

::: code-group

```python:line-numbers=129 [日本語訳]
def tabulate(function, start=0):
    """``func(start)`` の結果を順に返すイテレータを返す。
    ``func(start + 1)``、``func(start + 2)``……

    *func* は、整数を 1 つ受け取る関数でなければならない。

    *start* を省略すると 0 になり、
    イテレータを 1 つ進めるたびに 1 ずつ増える。

        >>> square = lambda x: x ** 2
        >>> iterator = tabulate(square, -3)
        >>> take(4, iterator)
        [9, 4, 1, 0]

    """
    return map(function, count(start))
```

```python:line-numbers=129 [原文]
def tabulate(function, start=0):
    """Return an iterator over the results of ``func(start)``,
    ``func(start + 1)``, ``func(start + 2)``...

    *func* should be a function that accepts one integer argument.

    If *start* is not specified it defaults to 0. It will be incremented each
    time the iterator is advanced.

        >>> square = lambda x: x ** 2
        >>> iterator = tabulate(square, -3)
        >>> take(4, iterator)
        [9, 4, 1, 0]

    """
    return map(function, count(start))
```

:::

## 前提知識

- **イテレータ**: 値を 1 つずつ順に出す仕組みです。
- **`count(start)`**: `start` から 1 ずつ増える、終わりのない数の列を作る `itertools` の関数です。
- **`map`**: 列の各要素に関数を当てて、その結果を順に出す組み込み関数です。
- **遅延評価**: 値が必要になるまで、計算を後回しにすることです。

## 何をしているか

### 1. 増えていく整数の列を作る

```python:line-numbers=144
    return map(function, count(start))
```

`count(start)` は、`start` から始まる整数の列を、終わりなく作ります。ここでは、まだ値は計算されていません。

## ここがすごい

### 終わりのない列を、そのまま渡せる

`count` は無限に続きますが、`map` は読まれた分だけ関数を当てます。`take` や `next` で必要な数だけ読めば、止まる仕組みを自分で書かずに済みます。

### 関数と添字を分けて考える

関数の形は `function` に任せ、どの値から始めるかは `start` で決めます。同じ関数を、別の範囲で使い回せます。

### 1 行で書ける

整数の列と、関数を当てる処理を、1 行にまとめています。読み手は、何を出すかをすぐに理解できます。

## まとめ

- `count` と `map` を組み合わせると、無限の結果の列が 1 行で作れる。
- 必要な分だけ読むので、終わりのない列も安全に扱える。
- 関数と開始位置を分けると、同じ仕組みを別の範囲に使い回せる。
