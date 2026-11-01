---
title: 列の 2 番目の要素を、2 回だけ次へ進めて取り出す
description: toolz.second は、列の 2 番目の要素を返す。イテレータを作ってから next を 2 回呼び、1 つ目を捨てて 2 つ目を返す。添字が使えない列でも、同じように 2 番目を取り出せる。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [372, 380]
function: second
difficulty: 1
format: 2
tags: [イテレータ, 可読性]
---

## ひとことで

`second(seq)` は、**列の 2 番目の要素** を返す関数です。
`second('ABC')` は `'B'` を返します。`first` と同じ考え方で、一つ先の要素を取り出せます。

## コード

::: code-group

```python:line-numbers=372 [日本語訳]
def second(seq):
    """ 列の 2 番目の要素

    >>> second('ABC')
    'B'
    """
    seq = iter(seq)
    next(seq)
    return next(seq)
```

```python:line-numbers=372 [原文]
def second(seq):
    """ The second element in a sequence

    >>> second('ABC')
    'B'
    """
    seq = iter(seq)
    next(seq)
    return next(seq)
```

:::

## 前提知識

- **イテレータ**: 値を 1 つずつ順に出す仕組みです。読んだ値は戻せません。
- **`iter`**: 列から、値を順に読むイテレータを作る組み込み関数です。
- **`next`**: イテレータから次の値を 1 つ取り出します。列が尽きていれば `StopIteration` を出します。

## 何をしているか

### 1. イテレータを作る

```python:line-numbers=378
    seq = iter(seq)
```

`iter(seq)` で、列を先頭から順に読むイテレータを作ります。以降は、このイテレータに対して `next` を呼びます。

### 2. 1 つ目を捨てて、2 つ目を返す

```python:line-numbers=379
    next(seq)
    return next(seq)
```

最初の `next` で 1 つ目の値を読んで捨てます。次の `next` で 2 つ目の値を取り出し、返します。

## ここがすごい

### 添字がなくても取れる

`seq[1]` と書けない列、例えばジェネレータでも、同じ書き方で 2 番目を取り出せます。

### 必要な分しか読まない

2 つ目までしか読みません。大きな列や、無限に続く列でも、先頭の数個を読むだけで済みます。

### 足りないときは例外になる

列が 1 つしかないと、2 回目の `next` で `StopIteration` が出ます。空の列や 1 要素の列を、呼び出し側で扱う必要があります。

## まとめ

- イテレータを作って `next` を 2 回呼ぶと、添字がない列の 2 番目が取れる。
- 必要な分だけ読むので、大きな列でも軽く動く。
- 要素が足りないときは例外になるので、呼び出し側で扱う。
