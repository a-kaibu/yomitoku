---
title: 「ちょうど n 個」を、n 個目と n+1 個目だけ見て判定する
description: more_itertools.exactly_n は、真になる要素がちょうど n 個あるかを返す。filter で真の要素だけを残し、islice で n-1 個を飛ばして、そこから先の 2 個だけを確かめる。n+1 個目が見つかった時点で止まる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [3206, 3234]
function: exactly_n
difficulty: 2
format: 2
tags: [イテレータ, 最適化, イディオム]
---

## ひとことで

`exactly_n(iterable, n, predicate=bool)` は、**真になる要素がちょうど `n` 個あるか** を返す関数です。
`exactly_n([True, True, False], 2)` は `True`、`exactly_n([True, True, False], 1)` は `False` を返します。

## コード

::: code-group

```python:line-numbers=3206 [日本語訳]
def exactly_n(iterable, n, predicate=bool):
    """イテラブルの中で、*predicate* が真にする要素がちょうど ``n`` 個なら ``True`` を返す。
    *predicate* 関数による判定に従う。

        >>> exactly_n([True, True, False], 2)
        True
        >>> exactly_n([True, True, False], 1)
        False
        >>> exactly_n([0, 1, 2, 3, 4, 5], 3, lambda x: x < 3)
        True

    ``n + 1`` 個の真の要素が見つかるまで、イテラブルを読み進める。
    そのため、無限のイテラブルには使わないこと。

    """
    iterator = filter(predicate, iterable)
    if n <= 0:
        if n < 0:
            return False
        for _ in iterator:
            return False
        return True

    iterator = islice(iterator, n - 1, None)
    for _ in iterator:
        for _ in iterator:
            return False
        return True
    return False
```

```python:line-numbers=3206 [原文]
def exactly_n(iterable, n, predicate=bool):
    """Return ``True`` if exactly ``n`` items in the iterable are ``True``
    according to the *predicate* function.

        >>> exactly_n([True, True, False], 2)
        True
        >>> exactly_n([True, True, False], 1)
        False
        >>> exactly_n([0, 1, 2, 3, 4, 5], 3, lambda x: x < 3)
        True

    The iterable will be advanced until ``n + 1`` truthy items are encountered,
    so avoid calling it on infinite iterables.

    """
    iterator = filter(predicate, iterable)
    if n <= 0:
        if n < 0:
            return False
        for _ in iterator:
            return False
        return True

    iterator = islice(iterator, n - 1, None)
    for _ in iterator:
        for _ in iterator:
            return False
        return True
    return False
```

:::

## 前提知識

- **述語（predicate）**: 要素を受け取り、真か偽かを返す関数です。省略すると `bool` が使われます。
- **`filter`**: 述語が真になる要素だけを残すイテレータです。
- **`islice`**: 列の一部を切り出すイテレータです。ここでは先頭の数個を飛ばすのに使います。

## 何をしているか

### 1. 真の要素だけを残す

```python:line-numbers=3221
    iterator = filter(predicate, iterable)
```

`filter(predicate, iterable)` で、真になる要素だけを順に出すイテレータを作ります。以降は、この数だけを数えればよくなります。

### 2. `n` が 0 以下の場合

```python:line-numbers=3222
    if n <= 0:
        if n < 0:
            return False
        for _ in iterator:
            return False
        return True
```

`n` が 0 のときは、真の要素が 1 つもなければ `True` です。最初の真の要素が見つかった時点で `False` を返します。負の数なら、ちょうど負の個数は存在しないので `False` です。

### 3. `n` 個目を飛ばし、その次があるかを見る

```python:line-numbers=3229
    iterator = islice(iterator, n - 1, None)
    for _ in iterator:
        for _ in iterator:
            return False
        return True
```

`islice` で、真の要素を `n - 1` 個だけ飛ばします。そこから、次の真の要素を 1 つ取り、さらに次の真の要素があるかを確かめます。次があれば、個数が `n` を超えるので `False` です。なければ `True` です。

## ここがすごい

### 数え切らずに判定する

全部の真の要素を数える必要はありません。`n` 個目と `n+1` 個目だけを見れば、「ちょうど `n` 個」かが決まります。

### 読む量が `n+1` 個で止まる

判定に必要な分を読んだら、それ以上は読みません。大きな列でも、先頭の一部だけを読んで答えが出ます。

### 無限の列には使えない

「`n+1` 個見つかるまで」読むので、真の要素が十分に出てこない無限の列では終わりません。注意が必要です。

## まとめ

- 真の要素だけを残して、`n+1` 個目まで読めば、ちょうど `n` 個かを判定できる。
- 全部を数えないので、無駄な読み取りが減る。
- 無限のイテラブルには使えないので、呼び出す前に確かめる。
