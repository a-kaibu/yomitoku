---
title: 列から n 個おきに要素を取り出す
description: toolz.take_nth は、列の先頭から数えて n 個おきの要素を取り出す。itertools.islice の歩幅（step）を指定して作るので、列を全部読まずに、間引いた結果を返す。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [354, 360]
function: take_nth
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, 最適化]
---

## ひとことで

`take_nth(n, seq)` は、**列から `n` 個おきに要素を取り出す** 関数です。
`take_nth(2, [10, 20, 30, 40, 50])` は、`10`、`30`、`50` を返します。数分ごとのデータを抜き出すような場面に使えます。

## コード

::: code-group

```python:line-numbers=354 [日本語訳]
def take_nth(n, seq):
    """ 列の n 個おきの要素

    >>> list(take_nth(2, [10, 20, 30, 40, 50]))
    [10, 30, 50]
    """
    return itertools.islice(seq, 0, None, n)
```

```python:line-numbers=354 [原文]
def take_nth(n, seq):
    """ Every nth item in seq

    >>> list(take_nth(2, [10, 20, 30, 40, 50]))
    [10, 30, 50]
    """
    return itertools.islice(seq, 0, None, n)
```

:::

## 前提知識

- **歩幅（step）**: 次の要素まで何個進むかを表す数です。`step` が `2` なら、1 個おきに取ります。
- **`itertools.islice`**: イテレータの一部を、開始・終了・歩幅を指定して切り出す関数です。
- **`0` と `None`**: 開始位置は先頭の `0`、終了位置は最後までの `None` です。

## 何をしているか

### 1. 歩幅を指定して切り出す

```python:line-numbers=360
    return itertools.islice(seq, 0, None, n)
```

`islice(seq, 0, None, n)` は、先頭から始めて、`n` 個進むごとに 1 つ取り出すイテレータを作ります。終了位置を `None` にしているので、列の最後まで続きます。

## ここがすごい

### 間引きを 1 行で書ける

「n 個おきに取る」という処理を、ループや条件分岐なしで書けます。`islice` の歩幅を変えるだけです。

### 列を全部読まずに済む

イテレータなので、取らない値も含めて順に読むだけで、一時的なリストは作りません。大きなファイルの行を間引くときにも向いています。

### 最初の要素は必ず含まれる

`islice` は先頭の `0` から始まるので、`n` の倍数番目の要素ではなく、先頭が必ず含まれます。`take_nth(3, ...)` なら、先頭、4 番目、7 番目の順に取られます。

## まとめ

- 歩幅を指定した `islice` で、n 個おきの要素を 1 行で取り出せる。
- イテレータなので、大きな列も一時的なリストを作らずに間引ける。
- 先頭の要素は必ず含まれるので、取り出し位置が分かりやすい。
