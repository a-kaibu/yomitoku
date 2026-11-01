---
title: 先頭から n 番目の要素を、列の種類に合わせて取り出す
description: toolz.nth は、列の先頭から数えて n 番目の要素を返す。リストやタプルは添字で直接取り出し、イテレータは islice で必要な分だけ読み飛ばして、次の要素を取り出す。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [383, 392]
function: nth
difficulty: 1
format: 2
tags: [イテレータ, 最適化, 防御的プログラミング]
---

## ひとことで

`nth(n, seq)` は、**列の先頭から数えて `n` 番目の要素** を返す関数です。
`nth(1, 'ABC')` は `'B'` を返します。`n` は `0` から数えるので、先頭は `nth(0, ...)` で取れます。

## コード

::: code-group

```python:line-numbers=383 [日本語訳]
def nth(n, seq):
    """ 列の先頭から n 番目の要素

    >>> nth(1, 'ABC')
    'B'
    """
    if isinstance(seq, (tuple, list, Sequence)):
        return seq[n]
    else:
        return next(itertools.islice(seq, n, None))
```

```python:line-numbers=383 [原文]
def nth(n, seq):
    """ The nth element in a sequence

    >>> nth(1, 'ABC')
    'B'
    """
    if isinstance(seq, (tuple, list, Sequence)):
        return seq[n]
    else:
        return next(itertools.islice(seq, n, None))
```

:::

## 前提知識

- **添字と要素**: 先頭を `0` と数えて、何番目の値かを指定する方法です。
- **イテレータ**: 値を 1 つずつ順に取り出せる仕組みです。ファイルや `map` の結果などがあたります。
- **`islice`**: イテレータの一部だけを切り出す、`itertools` の関数です。読み飛ばしに使えます。
- **`next`**: イテレータから次の値を 1 つ取り出す組み込み関数です。

## 何をしているか

### 1. 添字で取り出せる列かを確かめる

```python:line-numbers=389
    if isinstance(seq, (tuple, list, Sequence)):
        return seq[n]
```

リスト、タプル、`Sequence` の仲間なら、添字で直接値を取り出せます。`seq[n]` は、列の長さに関係なく、すぐに答えが出ます。

### 2. イテレータは読み飛ばして取り出す

```python:line-numbers=391
    else:
        return next(itertools.islice(seq, n, None))
```

それ以外の列は、添字が使えないかもしれません。そこで `islice` で `n` 個分を読み飛ばし、`next` で次の 1 つを取り出します。読み飛ばした値は、そのまま捨てられます。

## ここがすごい

### 列の種類で、取り方を変える

添字が使える列は、一瞬で答えが出ます。添字が使えない列でも、必要な分だけを読むので、全部を並べる必要はありません。

### 大きな列でも、先頭側だけを読む

`islice` は、`n` 番目より後ろを読みません。何百万個ある列でも、最初の数個だけを読めば答えが出ます。

### 範囲外の扱いは呼び出し側に任せる

`n` が長さより大きいと、添字の場合は `IndexError`、イテレータの場合は `StopIteration` になります。この関数は、どちらも捕まえずに返すので、呼び出す側で決められます。

## まとめ

- 添字で取れる列は、直接取り出すと速い。
- 添字が使えない列は、`islice` と `next` で必要な分だけ読む。
- 範囲外のエラーは、呼び出し側で扱えるように残している。
