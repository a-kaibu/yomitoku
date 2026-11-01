---
title: 同じ関数を、同じ引数で何度も呼ぶ列を作る
description: more_itertools.repeatfunc は、関数を指定した引数で繰り返し呼び、その結果を並べたイテレータを返す。times を省略すると、終わらない列になる。repeat で引数の組を並べ、starmap で関数に渡す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [313, 337]
function: repeatfunc
difficulty: 2
format: 2
tags: [イテレータ, 関数型, 遅延評価]
---

## ひとことで

`repeatfunc(function, times=None, *args)` は、**同じ関数を同じ引数で繰り返し呼び、その結果を順に出す** 関数です。
`repeatfunc(add, 4, 3, 5)` は、`add(3, 5)` の結果の `8` を 4 回出します。

## コード

::: code-group

```python:line-numbers=313 [日本語訳]
def repeatfunc(function, times=None, *args):
    """*function* を *args* 付きで繰り返し呼び、その結果を並べたイテラブルを返す。
    結果を順に返す。

    *times* が指定されていれば、その回数で終わる。
    繰り返しの回数:

        >>> from operator import add
        >>> times = 4
        >>> args = 3, 5
        >>> list(repeatfunc(add, times, *args))
        [8, 8, 8, 8]

    *times* が ``None`` なら、終わらない:

        >>> from random import randrange
        >>> times = None
        >>> args = 1, 11
        >>> take(6, repeatfunc(randrange, times, *args))  # doctest:+SKIP
        [2, 4, 8, 1, 8, 4]

    """
    if times is None:
        return starmap(function, repeat(args))
    return starmap(function, repeat(args, times))
```

```python:line-numbers=313 [原文]
def repeatfunc(function, times=None, *args):
    """Call *function* with *args* repeatedly, returning an iterable over the
    results.

    If *times* is specified, the iterable will terminate after that many
    repetitions:

        >>> from operator import add
        >>> times = 4
        >>> args = 3, 5
        >>> list(repeatfunc(add, times, *args))
        [8, 8, 8, 8]

    If *times* is ``None`` the iterable will not terminate:

        >>> from random import randrange
        >>> times = None
        >>> args = 1, 11
        >>> take(6, repeatfunc(randrange, times, *args))  # doctest:+SKIP
        [2, 4, 8, 1, 8, 4]

    """
    if times is None:
        return starmap(function, repeat(args))
    return starmap(function, repeat(args, times))
```

:::

## 前提知識

- **`starmap`**: 引数の組を並べたイテレータから、関数に引数を展開して呼ぶ `itertools` の関数です。
- **`repeat`**: 同じ値を、指定した回数だけ（または無限に）出すイテレータです。
- **`times`**: 繰り返す回数です。`None` なら、終わりのない列になります。

## 何をしているか

### 1. 回数が指定されていなければ、終わりなく繰り返す

```python:line-numbers=335
    if times is None:
        return starmap(function, repeat(args))
```

`times` が `None` なら、`repeat(args)` は引数の組を無限に出します。`starmap` が、それを関数に 1 組ずつ渡します。

### 2. 回数が指定されていれば、その回数で止める

```python:line-numbers=337
    return starmap(function, repeat(args, times))
```

`repeat(args, times)` は、同じ引数の組を `times` 回だけ出します。その分だけ関数が呼ばれ、列も終わります。

## ここがすごい

### 繰り返しを 2 つの部品で表す

「同じ引数を何度も」という部分を `repeat` が、「関数に引数を渡す」という部分を `starmap` が受け持ちます。ループを書かずに済みます。

### 乱数や時刻のように、呼ぶたびに変わる値

関数の結果が呼ぶたびに違うなら、この列も毎回違う値を出します。`randrange` の例のように、乱数の列を作る使い方ができます。

### 終わりの有無を引数で選ぶ

`times` を渡すか省略するかで、有限の列か無限の列かが決まります。無限の列は、`take` などで必要な分だけ読んで使います。

## まとめ

- `repeat` で引数の組を並べ、`starmap` で関数に渡すと、同じ呼び出しを繰り返せる。
- 回数の指定の有無で、有限と無限を切り替えられる。
- 呼ぶたびに値が変わる関数なら、乱数の列のような使い方ができる。
