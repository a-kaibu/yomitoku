---
title: 列の最初の要素を、読むのは 1 つだけにして取り出す
description: toolz.first は、列の最初の要素を返す。iter で反復を始め、next で 1 つだけ取り出すので、リストでもジェネレータでも同じ書き方で使える。空の列では StopIteration が出る。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [363, 369]
function: first
difficulty: 1
format: 2
tags: [イテレータ, 可読性]
---

## ひとことで

`first(seq)` は、**列の最初の要素** を返す関数です。
`first('ABC')` は `'A'` を返します。リストでも文字列でも、ジェネレータでも同じ書き方で最初の値が取れます。

## コード

::: code-group

```python:line-numbers=363 [日本語訳]
def first(seq):
    """ 列の最初の要素

    >>> first('ABC')
    'A'
    """
    return next(iter(seq))
```

```python:line-numbers=363 [原文]
def first(seq):
    """ The first element in a sequence

    >>> first('ABC')
    'A'
    """
    return next(iter(seq))
```

:::

## 前提知識

- **反復可能（iterable）**: `for` 文で順に値を取り出せるものです。リスト、文字列、ジェネレータなどがあたります。
- **`iter`**: 値を順に取り出すための、イテレータを作る組み込み関数です。
- **`next`**: イテレータから次の値を 1 つ取り出します。空なら `StopIteration` を出します。

## 何をしているか

### 1. 反復を始めて、1 つだけ取り出す

```python:line-numbers=369
    return next(iter(seq))
```

`iter(seq)` で、列の先頭から読むイテレータを作ります。`next` で、その 1 つ目の値だけを取り出して返します。残りの値は読まれません。

## ここがすごい

### 添字がなくても取れる

`seq[0]` と違い、添字が使えない列でも動きます。ジェネレータや、ファイルの行のように、添字がない列の先頭を取るのに向いています。

### 全部を読まない

`list(seq)[0]` と書くと、全部を先にリストにしてしまいます。この関数は、先頭の 1 つだけを読むので、大きな列でも時間とメモリが小さく済みます。

### 空の列は呼び出し側が決める

空の列では `StopIteration` が出ます。この関数は、その例外を捕まえずに返すので、既定値を付けたいときは呼び出し側で扱う必要があります。

## まとめ

- `iter` と `next` で、列の先頭だけを読めば、添字がない列の先頭も取れる。
- 全体をリストにしないので、大きな列でも軽く動く。
- 空の列の扱いは、呼び出し側で決めるのがこの関数の設計である。
