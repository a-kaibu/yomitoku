---
title: 列の先頭に 1 つの要素を加えた、新しい列を作る
description: toolz.cons は、要素 1 つを列の先頭に加えたイテレータを返す。itertools.chain で、1 要素のリストと元の列をつなぐ。元の列は読まれるまで変わらず、無限の列にも使える。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [511, 517]
function: cons
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

`cons(el, seq)` は、**要素 `el` を先頭に加えた列** を返す関数です。
`list(cons(1, [2, 3]))` は `[1, 2, 3]` を返します。関数型の言語で、リストの先頭に要素を足す操作と同じ考え方です。

## コード

::: code-group

```python:line-numbers=511 [日本語訳]
def cons(el, seq):
    """ 要素 el を、（無限の列かもしれない）列 seq の先頭に加える。

    >>> list(cons(1, [2, 3]))
    [1, 2, 3]
    """
    return itertools.chain([el], seq)
```

```python:line-numbers=511 [原文]
def cons(el, seq):
    """ Add el to beginning of (possibly infinite) sequence seq.

    >>> list(cons(1, [2, 3]))
    [1, 2, 3]
    """
    return itertools.chain([el], seq)
```

:::

## 前提知識

- **`cons`**: Lisp などの関数型の言語で、先頭に要素を足す操作の名前です。
- **無限の列**: 終わりのない列です。`cons` は、その先頭にも値を足せます。
- **`itertools.chain`**: 複数の列を順につなぐ標準ライブラリの関数です。

## 何をしているか

### 1. 1 要素の列と元の列をつなぐ

```python:line-numbers=517
    return itertools.chain([el], seq)
```

`[el]` は、値 1 つだけの列です。`itertools.chain` が、それを先頭に、元の `seq` を後ろにつなぎます。元の `seq` は、ここでは読まれていません。

## ここがすごい

### 元の列を書き換えない

新しい列を作るだけで、元の列はそのまま残ります。同じ `seq` を、別の場所でも使い続けられます。

### 無限の列にも使える

`chain` は、読まれた分だけ値を出します。無限に続く列の先頭に、値を足すこともできます。

### 先頭に足す操作を、後ろでも同じ形で書ける

リストの先頭に足すには、通常は全体をコピーします。この関数は、イテレータとしてつなぐので、コピーをせずに先頭に値を足せます。

## まとめ

- 先頭に要素を足すには、`chain` で 1 要素の列と元の列をつなぐ。
- 元の列は書き換えず、読まれるまで計算も後回しにする。
- 無限の列の先頭にも、値を足せる。
