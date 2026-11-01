---
title: 列の先頭から n 個だけを、全部並べずに取り出す
description: toolz.take は、列の先頭から n 個の要素を取り出す。内部で itertools.islice を使うので、n 個を読んだら止まり、無限に続くイテレータにも使える。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [312, 322]
function: take
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, 最適化]
---

## ひとことで

`take(n, seq)` は、**列の先頭から `n` 個の要素** を取り出す関数です。
`take(2, [10, 20, 30, 40, 50])` は、`10` と `20` だけを順に出します。残りの値は、読まれないまま残ります。

## コード

::: code-group

```python:line-numbers=312 [日本語訳]
def take(n, seq):
    """ 列の先頭から n 個の要素

    >>> list(take(2, [10, 20, 30, 40, 50]))
    [10, 20]

    See Also:
        drop
        tail
    """
    return itertools.islice(seq, n)
```

```python:line-numbers=312 [原文]
def take(n, seq):
    """ The first n elements of a sequence

    >>> list(take(2, [10, 20, 30, 40, 50]))
    [10, 20]

    See Also:
        drop
        tail
    """
    return itertools.islice(seq, n)
```

:::

## 前提知識

- **イテレータ**: 値を 1 つずつ順に出す仕組みです。すべてを先に作らずに、必要な分だけ値を出せます。
- **遅延評価**: 値が必要になるまで、計算や読み込みを後回しにすることです。
- **`itertools.islice`**: イテレータの一部だけを切り出す標準ライブラリの関数です。`islice(seq, n)` は、先頭から `n` 個で終わるイテレータを作ります。
- **無限のイテレータ**: 終わりのない値の列です。`itertools.count()` などがあたります。

## 何をしているか

### 1. 切り出しの処理をまとめて返す

```python:line-numbers=322
    return itertools.islice(seq, n)
```

`islice(seq, n)` は、`seq` の先頭から `n` 個だけを出すイテレータを作ります。ここでは値を読まず、作っただけです。読まれたときに、必要な分だけ列から取り出されます。

## ここがすごい

### 全部を並べずに済む

長い列の先頭だけがほしいとき、リストに全部変換する必要はありません。`n` 個を読んだら止まるので、メモリも時間も節約できます。

### 無限の列にも使える

`take(3, itertools.count())` は、`0, 1, 2` を返します。`count()` は終わりがないので、`n` で止める仕組みがないと、永久に読み続けてしまいます。

### 関数を組み合わせやすい

`take` は、値を返す前に計算しないので、`map` や `filter` と組み合わせても、必要な分だけが処理されます。

## まとめ

- 先頭の `n` 個だけがほしいときは、`islice` で切り出すと全部を並べずに済む。
- イテレータは遅延評価なので、無限の列にも安全に使える。
- 関数を組み合わせると、読む量を最小限に抑えられる。
