---
title: 各列に関数を当てて、結果の列を 1 本につなげる
description: toolz.mapcat は、列の列の各要素に関数を当て、その結果の列を順に 1 本につなげる。map と concat を組み合わせて、関数の結果が列になる場合を扱う。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [501, 508]
function: mapcat
difficulty: 1
format: 2
tags: [関数型, イテレータ]
---

## ひとことで

`mapcat(func, seqs)` は、**列の列の各要素に関数を当て、返された列を 1 本につなげる** 関数です。
`mapcat(lambda s: [c.upper() for c in s], [['a', 'b'], ['c', 'd', 'e']])` は、`'A'`、`'B'`、`'C'`、`'D'`、`'E'` を返します。

## コード

::: code-group

```python:line-numbers=501 [日本語訳]
def mapcat(func, seqs):
    """ seqs の各列に func を当て、結果をつなげる。

    >>> list(mapcat(lambda s: [c.upper() for c in s],
    ...             [["a", "b"], ["c", "d", "e"]]))
    ['A', 'B', 'C', 'D', 'E']
    """
    return concat(map(func, seqs))
```

```python:line-numbers=501 [原文]
def mapcat(func, seqs):
    """ Apply func to each sequence in seqs, concatenating results.

    >>> list(mapcat(lambda s: [c.upper() for c in s],
    ...             [["a", "b"], ["c", "d", "e"]]))
    ['A', 'B', 'C', 'D', 'E']
    """
    return concat(map(func, seqs))
```

:::

## 前提知識

- **`map`**: 列の各要素に関数を当てて、結果を順に出す組み込み関数です。
- **`concat`**: 列の列を、1 本の列につなげる toolz の関数です。
- **列を返す関数**: 1 つの値を受け取り、リストなどの列を返す関数です。
- **`flatMap` の考え方**: 関数型の言語で、変換と平坦化を一度に行う操作の呼び名です。

## 何をしているか

### 1. 各列に関数を当てる

```python:line-numbers=508
    return concat(map(func, seqs))
```

`map(func, seqs)` で、`seqs` の各要素に `func` を当てます。ここでは、各要素がリストを返すので、結果は「リストの列」になります。

## ここがすごい

### 2 つの操作を 1 行で書ける

「変換して、結果の列を平らにする」という操作が、`map` と `concat` の組み合わせで書けます。二重のループを書く必要がありません。

### 遅延評価のまま動く

`map` も `concat` も、必要になるまで値を計算しません。大きな列の列でも、読んだ分だけ処理されます。

### 関数型の考え方を表す

`mapcat` は、関数型の言語で `flatMap` と呼ばれる操作にあたります。名前から、変換と平坦化を一度にする処理だと分かります。

## まとめ

- 関数の結果が列になるとき、`map` と `concat` で 1 本につなげられる。
- 遅延評価なので、必要な分だけ計算される。
- 関数型の `flatMap` にあたる操作として理解できる。
