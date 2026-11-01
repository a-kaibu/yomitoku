---
title: 先頭の n 個を読み飛ばして、残りの列を取り出す
description: toolz.drop は、列の先頭から n 個の要素を読み飛ばし、その後ろの要素を順に返す。take と対になる関数で、itertools.islice の開始位置だけを指定して作る。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [341, 351]
function: drop
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, 可読性]
---

## ひとことで

`drop(n, seq)` は、**列の先頭から `n` 個を捨てて、残りの要素** を返す関数です。
`drop(2, [10, 20, 30, 40, 50])` は、`30`、`40`、`50` を順に出します。`take` と組み合わせると、列を前後に分けられます。

## コード

::: code-group

```python:line-numbers=341 [日本語訳]
def drop(n, seq):
    """ 先頭の n 個の要素の後に続く列

    >>> list(drop(2, [10, 20, 30, 40, 50]))
    [30, 40, 50]

    See Also:
        take
        tail
    """
    return itertools.islice(seq, n, None)
```

```python:line-numbers=341 [原文]
def drop(n, seq):
    """ The sequence following the first n elements

    >>> list(drop(2, [10, 20, 30, 40, 50]))
    [30, 40, 50]

    See Also:
        take
        tail
    """
    return itertools.islice(seq, n, None)
```

:::

## 前提知識

- **イテレータ**: 値を 1 つずつ順に出す仕組みです。読んだ値は、先に戻せません。
- **`itertools.islice`**: イテレータの一部を切り出す関数です。開始位置と終了位置を指定できます。
- **`None` の指定**: `islice` の終了位置に `None` を渡すと、最後まで続くという意味になります。

## 何をしているか

### 1. 開始位置だけを指定して切り出す

```python:line-numbers=351
    return itertools.islice(seq, n, None)
```

`islice(seq, n, None)` は、`n` 番目から最後までを出すイテレータを作ります。`n` 個の要素は、読まれないまま飛ばされます。

## ここがすごい

### 1 行で読み飛ばせる

先頭を捨てる処理を、ループを書かずに 1 行で書けます。`islice` の開始位置を変えるだけなので、読み方がすぐ分かります。

### `take` と対になっている

`take(n, seq)` が先頭の `n` 個を取るのに対し、`drop(n, seq)` は残りを取ります。2 つを組み合わせると、列を前半と後半に分けられます。

### 読み飛ばした値は作られない

イテレータは、飛ばされる値を一時的にリストに入れません。大きな列の先頭を捨てても、メモリを使う量は増えません。

## まとめ

- `islice` の開始位置を指定すると、先頭を簡単に読み飛ばせる。
- `take` と `drop` を組み合わせると、列を前後に分けられる。
- 読み飛ばす処理は、値を保存しないので軽く動く。
