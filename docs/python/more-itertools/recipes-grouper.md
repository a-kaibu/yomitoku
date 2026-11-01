---
title: 列を固定長の組に区切り、端の扱いを 3 通りから選ぶ
description: more_itertools.grouper は、列を長さ n の組に区切る。最後の組が足りないとき、埋める・捨てる・例外にする、の 3 通りから選べる。同じイテレータを n 回並べた zip_longest や zip で区切る。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [350, 388]
function: grouper
difficulty: 3
format: 2
tags: [イテレータ, 可読性, 防御的プログラミング]
---

## ひとことで

`grouper(iterable, n, incomplete='fill')` は、**列を長さ `n` の組に区切って、順に出す** 関数です。
`grouper('ABCDEF', 3)` は `('A', 'B', 'C')` と `('D', 'E', 'F')` を返します。端が足りないときの扱いを、引数で選べます。

## コード

::: code-group

```python:line-numbers=350 [日本語訳]
def grouper(iterable, n, incomplete='fill', fillvalue=None):
    """*iterable* の要素を、長さ *n* の固定長のグループに分ける。

    >>> list(grouper('ABCDEF', 3))
    [('A', 'B', 'C'), ('D', 'E', 'F')]

    キーワード引数 *incomplete* と *fillvalue* は、
    長さが *n* の倍数でない列の扱いを決める。

    *incomplete* が `'fill'` のとき、最後のグループは
    *fillvalue* で埋められる。

    >>> list(grouper('ABCDEFG', 3, incomplete='fill', fillvalue='x'))
    [('A', 'B', 'C'), ('D', 'E', 'F'), ('G', 'x', 'x')]

    *incomplete* が `'ignore'` のとき、最後のグループは出さない。

    >>> list(grouper('ABCDEFG', 3, incomplete='ignore', fillvalue='x'))
    [('A', 'B', 'C'), ('D', 'E', 'F')]

    *incomplete* が `'strict'` のとき、`ValueError` を出す。

    >>> iterator = grouper('ABCDEFG', 3, incomplete='strict')
    >>> list(iterator)  # doctest: +IGNORE_EXCEPTION_DETAIL
    Traceback (most recent call last):
    ...
    ValueError

    """
    iterators = [iter(iterable)] * n
    match incomplete:
        case 'fill':
            return zip_longest(*iterators, fillvalue=fillvalue)
        case 'strict':
            return zip(*iterators, strict=True)
        case 'ignore':
            return zip(*iterators)
        case _:
            raise ValueError('Expected fill, strict, or ignore')
```

```python:line-numbers=350 [原文]
def grouper(iterable, n, incomplete='fill', fillvalue=None):
    """Group elements from *iterable* into fixed-length groups of length *n*.

    >>> list(grouper('ABCDEF', 3))
    [('A', 'B', 'C'), ('D', 'E', 'F')]

    The keyword arguments *incomplete* and *fillvalue* control what happens for
    iterables whose length is not a multiple of *n*.

    When *incomplete* is `'fill'`, the last group will contain instances of
    *fillvalue*.

    >>> list(grouper('ABCDEFG', 3, incomplete='fill', fillvalue='x'))
    [('A', 'B', 'C'), ('D', 'E', 'F'), ('G', 'x', 'x')]

    When *incomplete* is `'ignore'`, the last group will not be emitted.

    >>> list(grouper('ABCDEFG', 3, incomplete='ignore', fillvalue='x'))
    [('A', 'B', 'C'), ('D', 'E', 'F')]

    When *incomplete* is `'strict'`, a `ValueError` will be raised.

    >>> iterator = grouper('ABCDEFG', 3, incomplete='strict')
    >>> list(iterator)  # doctest: +IGNORE_EXCEPTION_DETAIL
    Traceback (most recent call last):
    ...
    ValueError

    """
    iterators = [iter(iterable)] * n
    match incomplete:
        case 'fill':
            return zip_longest(*iterators, fillvalue=fillvalue)
        case 'strict':
            return zip(*iterators, strict=True)
        case 'ignore':
            return zip(*iterators)
        case _:
            raise ValueError('Expected fill, strict, or ignore')
```

:::

## 前提知識

- **`zip`**: 複数の列を、同じ位置どうしでまとめる組み込み関数です。短い列に合わせて止まります。
- **`zip_longest`**: 長い列に合わせて、足りない分を埋め値で補う `itertools` の関数です。
- **`match` 文**: 値の形によって分岐する Python の文です。`case` で、場合ごとの処理を書きます。
- **同じイテレータを並べる**: `[it] * n` は、同じ 1 つのイテレータを `n` 個並べたリストです。順に読むと、同じ列から続きを取り出すことになります。

## 何をしているか

### 1. 同じイテレータを `n` 回並べる

```python:line-numbers=379
    iterators = [iter(iterable)] * n
```

`iter(iterable)` で 1 つのイテレータを作り、それを `n` 回並べます。`zip` に渡すと、同じイテレータから次々に値を取るので、列が `n` 個ずつに区切られます。

### 2. 端の扱いを `incomplete` で選ぶ

```python:line-numbers=380
    match incomplete:
        case 'fill':
            return zip_longest(*iterators, fillvalue=fillvalue)
```

`'fill'` なら、足りない部分を `fillvalue` で埋めます。`zip_longest` が、その役目を果たします。

```python:line-numbers=383
        case 'strict':
            return zip(*iterators, strict=True)
```

`'strict'` なら、`zip` の `strict=True` を使います。長さが合わないと、`ValueError` を出します。

```python:line-numbers=385
        case 'ignore':
            return zip(*iterators)
```

`'ignore'` なら、普通の `zip` を使います。足りない最後の組は、出されずに捨てられます。

```python:line-numbers=387
        case _:
            raise ValueError('Expected fill, strict, or ignore')
```

それ以外の値は、`ValueError` で止めます。間違った指定を、黙って通さない作りです。

## ここがすごい

### 同じイテレータを並べる工夫

同じイテレータを `n` 回並べるだけで、`zip` が 1 組ずつ `n` 個の値を取ります。組の分け方を、ループを書かずに表せます。

### 端の扱いを 3 つから選べる

足りない組を埋める、捨てる、例外にする、の 3 通りがあります。用途に合わせて、データの欠けを許すかどうかを決められます。

### 形を変える処理を 1 か所に集める

`match` 文で、端の扱いの分岐をまとめています。新しい方法を増やすときも、分岐を 1 つ足すだけで済みます。

## まとめ

- 同じイテレータを `n` 個並べて `zip` すると、列を固定長の組に区切れる。
- 端が足りない組は、埋める・捨てる・例外にするを選べる。
- 不正な指定は `ValueError` で止めると、誤った結果を防げる。
