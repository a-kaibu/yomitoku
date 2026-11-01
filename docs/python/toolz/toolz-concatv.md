---
title: 引数を並べて渡すだけで、列を 1 本につなぐ
description: toolz.concatv は、concat の可変長引数版である。複数の列を引数として並べて渡せば、それらを 1 本の列につなぐ。内部では引数をタプルにまとめて concat に渡す。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [489, 498]
function: concatv
difficulty: 1
format: 2
tags: [関数型, イテレータ]
---

## ひとことで

`concatv(*seqs)` は、**引数として並べた複数の列を、1 本の列につなぐ** 関数です。
`concatv([], ['a'], ['b', 'c'])` は `'a'`、`'b'`、`'c'` の順に値を出します。列をリストにまとめて渡す必要がありません。

## コード

::: code-group

```python:line-numbers=489 [日本語訳]
def concatv(*seqs):
    """ concat の可変長引数版

    >>> list(concatv([], ["a"], ["b", "c"]))
    ['a', 'b', 'c']

    See also:
        itertools.chain
    """
    return concat(seqs)
```

```python:line-numbers=489 [原文]
def concatv(*seqs):
    """ Variadic version of concat

    >>> list(concatv([], ["a"], ["b", "c"]))
    ['a', 'b', 'c']

    See also:
        itertools.chain
    """
    return concat(seqs)
```

:::

## 前提知識

- **可変長引数（`*args`）**: 関数に、いくつでも引数を渡せる書き方です。渡された引数は、タプルにまとめられます。
- **`concat`**: 列の列を 1 本の列につなぐ関数です。列の列を、1 つの引数として受け取ります。
- **空の列**: 要素が 1 つもない列です。つないでも、何も追加されません。

## 何をしているか

### 1. 引数をまとめて、列の列にする

`*seqs` で受け取った引数は、タプルとして `seqs` に入ります。たとえば `concatv([], ['a'])` なら、`seqs` は `([], ['a'])` です。これは、列の列の形になっています。

### 2. `concat` に渡す

```python:line-numbers=498
    return concat(seqs)
```

`concat(seqs)` で、タプルの中の列を順につなぎます。引数を並べて書くだけで、`concat` と同じ結果が得られます。

## ここがすごい

### 書く側が楽になる

`concat([a, b, c])` と、リストに包んで書く代わりに、`concatv(a, b, c)` と並べて書けます。呼び出しの形が、普通の関数と同じになります。

### 中身は `concat` に任せる

引数をまとめる部分だけを担当し、つなぐ処理は `concat` に任せています。部品を分けた、簡潔な作りです。

### 空の列も問題ない

空のリストを渡しても、つなぐ結果には影響しません。`concatv([], ['a'])` も、`'a'` だけを出します。

## まとめ

- 可変長引数にすると、列を並べて書くだけで 1 本につなげられる。
- 中身は `concat` に任せ、引数をまとめる部分だけを担当させている。
- 空の列は、結果に影響しない。
