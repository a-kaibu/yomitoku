---
title: 値を関数に左から順に通して、読みやすい流れを作る
description: toolz.pipe は、値を最初の関数に渡し、その結果を次の関数に渡す、という処理を並べて書く。pipe(data, f, g, h) は h(g(f(data))) と同じだが、処理の順番が左から右へ読める。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/functoolz.py
lines: [699, 721]
function: pipe
difficulty: 1
format: 2
tags: [関数型, 可読性, イディオム]
---

## ひとことで

`pipe(data, *funcs)` は、**値を関数に順番に通していく** 関数です。
`pipe(3, double, str)` は、まず `double(3)` で `6`、次に `str(6)` で `'6'` を返します。

## コード

::: code-group

```python:line-numbers=699 [日本語訳]
def pipe(data, *funcs):
    """ 値を、関数の列に順に通す

    I.e. ``pipe(data, f, g, h)`` is equivalent to ``h(g(f(data)))``

    We think of the value as progressing through a pipe of several
    transformations, much like pipes in UNIX

    ``$ cat data | f | g | h``

    >>> double = lambda i: 2 * i
    >>> pipe(3, double, str)
    '6'

    See Also:
        compose
        compose_left
        thread_first
        thread_last
    """
    for func in funcs:
        data = func(data)
    return data
```

```python:line-numbers=699 [原文]
def pipe(data, *funcs):
    """ Pipe a value through a sequence of functions

    I.e. ``pipe(data, f, g, h)`` is equivalent to ``h(g(f(data)))``

    We think of the value as progressing through a pipe of several
    transformations, much like pipes in UNIX

    ``$ cat data | f | g | h``

    >>> double = lambda i: 2 * i
    >>> pipe(3, double, str)
    '6'

    See Also:
        compose
        compose_left
        thread_first
        thread_last
    """
    for func in funcs:
        data = func(data)
    return data
```

:::

## 前提知識

- **関数の合成**: 関数 `f` の結果を、関数 `g` に渡すことです。`g(f(x))` と書きます。
- **入れ子の読みにくさ**: `h(g(f(data)))` は、内側から読まないと処理の順番が分かりません。
- **UNIX のパイプ**: `cat data | f | g | h` のように、左から右へデータを流す書き方です。`pipe` は、この考え方を Python の関数に当てはめたものです。

## 何をしているか

### 1. 関数を順に取り出す

```python:line-numbers=719
    for func in funcs:
```

`funcs` の先頭から順に、関数を 1 つずつ取り出します。

### 2. 結果を次の関数に渡す

```python:line-numbers=720
        data = func(data)
```

今の `data` を関数に渡し、その結果で `data` を置き換えます。次の関数は、その結果を受け取ります。

### 3. 最後の結果を返す

```python:line-numbers=721
    return data
```

すべての関数を通ったら、最後の値を返します。

## ここがすごい

### 処理の順番が左から右に読める

`h(g(f(data)))` では、`f` が最初に動くのに、書く位置は最後の方になります。`pipe` では、`data` から始まり、関数を並べた順に処理が進むので、読む順番と実行の順番が一致します。

### 関数の数を増やしやすい

処理を 1 つ増やしたいときは、引数の列に関数を 1 つ足すだけです。入れ子の括弧を書き直す必要がありません。

### 関数の数が固定されない

`*funcs` で可変長の引数を受け取るので、いくつ関数を並べても同じ書き方で動きます。`compose` と違い、最初の引数がデータなので、値を先頭に置くだけで使えます。

## まとめ

- 入れ子の関数呼び出しは、左から右に流す形に書き換えると読みやすい。
- 処理の並びは、関数の列として 1 か所にまとめられる。
- 値が先頭、処理が続くという形は、データ変換の読みやすさにつながる。
