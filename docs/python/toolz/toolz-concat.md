---
title: 列の列を、無限の列があっても 1 本につなげる
description: toolz.concat は、0 個以上のイテラブルを 1 本の列につなげる。chain.from_iterable を使うので、外側の列が遅延評価される。途中に無限の列があると、その後ろは読まれない。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [471, 486]
function: concat
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`concat(seqs)` は、**列の列（列を並べた列）を、1 本の列につなげる** 関数です。
`list(concat([[], [1], [2, 3]]))` は `[1, 2, 3]` になります。空の列は、何も加えません。

## コード

::: code-group

```python:line-numbers=471 [日本語訳]
def concat(seqs):
    """ 0 個以上のイテラブルを連結する。どれかは無限でもよい。

    An infinite sequence will prevent the rest of the arguments from
    being included.

    We use chain.from_iterable rather than ``chain(*seqs)`` so that seqs
    can be a generator.

    >>> list(concat([[], [1], [2, 3]]))
    [1, 2, 3]

    See also:
        itertools.chain.from_iterable  equivalent
    """
    return itertools.chain.from_iterable(seqs)
```

```python:line-numbers=471 [原文]
def concat(seqs):
    """ Concatenate zero or more iterables, any of which may be infinite.

    An infinite sequence will prevent the rest of the arguments from
    being included.

    We use chain.from_iterable rather than ``chain(*seqs)`` so that seqs
    can be a generator.

    >>> list(concat([[], [1], [2, 3]]))
    [1, 2, 3]

    See also:
        itertools.chain.from_iterable  equivalent
    """
    return itertools.chain.from_iterable(seqs)
```

:::

`chain.from_iterable` は、`itertools` にある関数です。受け取った列の列を、順に 1 本につなげます。

## 前提知識

- **`chain(a, b, c)`**: 複数の列を、引数として順につなげます。
- **`chain.from_iterable(xs)`**: 列の列 `xs` を受け取り、その中の列を順につなげます。
- **無限の列**: 終わらない列です。`itertools.count()` などがあります。
- **`*` による展開**: `chain(*seqs)` は、列の列を先に全部並べて引数にします。

## 何をしているか

### 1. 列の列を受け取る

```python:line-numbers=486
    return itertools.chain.from_iterable(seqs)
```

`chain.from_iterable(seqs)` は、`seqs` の中の列を 1 つずつ取り出し、順に出します。列の列全体を、先に作る必要はありません。

## ここがすごい

### 外側の列も遅延評価

`chain(*seqs)` と書くと、`seqs` の全部を先に取り出して引数にします。`from_iterable` なら、`seqs` そのものがジェネレータでも、必要になったときに 1 つずつ取り出せます。docstring に書かれた理由です。

### 無限の列には注意

途中の列が無限だと、その列をずっと読み続けて、後ろの列は一度も読まれません。関数の説明にも、「無限の列があると後ろが含まれない」と書かれています。

### 標準の部品と同じ働き

docstring にもあるとおり、`itertools.chain.from_iterable` と同じです。自分で作った別名として、読み手に意図を伝えるために用意されています。

## まとめ

- 列の列をつなぐなら、`chain.from_iterable` を使うと遅延評価が保てる。
- 無限の列は、後ろの列を読めなくするので、並べる順番に注意する。
- 同じ働きの標準の部品があるときは、その名前をよく見ると理解が早い。
