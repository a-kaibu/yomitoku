---
title: 列の要素の間に、同じ値を挟んで並べ直す
description: toolz.interpose は、列の要素と要素の間に、指定した値を 1 つずつ挟んだイテレータを返す。zip と repeat を組み合わせて作り、先頭の挟み値を先に捨てて、空の列を正しく扱う。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [520, 533]
function: interpose
difficulty: 2
format: 2
tags: [イテレータ, イディオム, 遅延評価]
---

## ひとことで

`interpose(el, seq)` は、**列の要素と要素の間に、`el` を挟んだ列** を返す関数です。
`interpose("a", [1, 2, 3])` は `1, "a", 2, "a", 3` という順に値を出します。区切り文字を入れるときに便利です。

## コード

::: code-group

```python:line-numbers=520 [日本語訳]
def interpose(el, seq):
    """ 列の要素の組ごとに、要素を 1 つずつ挟む

    >>> list(interpose("a", [1, 2, 3]))
    [1, 'a', 2, 'a', 3]
    >>> list(interpose("a", []))
    []
    """
    inposed = concat(zip(itertools.repeat(el), seq))
    try:
        next(inposed)
    except StopIteration:
        return iter([])
    return inposed
```

```python:line-numbers=520 [原文]
def interpose(el, seq):
    """ Introduce element between each pair of elements in seq

    >>> list(interpose("a", [1, 2, 3]))
    [1, 'a', 2, 'a', 3]
    >>> list(interpose("a", []))
    []
    """
    inposed = concat(zip(itertools.repeat(el), seq))
    try:
        next(inposed)
    except StopIteration:
        return iter([])
    return inposed
```

:::

## 前提知識

- **イテレータ**: 値を 1 つずつ順に出す仕組みです。全部を作らずに、必要なときに値を出せます。
- **`zip`**: 2 つの列を、同じ位置どうしでまとめる組み込み関数です。
- **`itertools.repeat`**: 同じ値を何度も出すイテレータです。ここでは挟む値の供給に使います。
- **`concat`**: 列の列を 1 本の列にまとめる、toolz の関数です。

## 何をしているか

### 1. 挟む値と要素を組にする

```python:line-numbers=528
    inposed = concat(zip(itertools.repeat(el), seq))
```

`zip(itertools.repeat(el), seq)` で、`(el, 要素)` の組を作ります。この時点では、先頭に `el` が来るので、余分な値が 1 つ多くなります。

### 2. 先頭の余分な値を捨てる

```python:line-numbers=529
    try:
        next(inposed)
    except StopIteration:
        return iter([])
    return inposed
```

`concat` で組を平らにしたあと、`next` で 1 つ先に取り出して捨てます。これで、先頭に `el` が付かなくなります。列が空なら、`next` が `StopIteration` を出すので、空のイテレータを返します。

## ここがすごい

### 区切りを足すのに、ループを書かない

挟む処理を、`zip` と `repeat` だけで組み立てています。値を 1 つずつ足していく `for` の文を書かずに済みます。

### 遅延評価で、大きな列にも使える

`concat` も `zip` も、値を出すまで計算しません。長い列でも、全部をメモリに置かずに、順に値を出せます。

### 空の列を先に確かめる

`next` を 1 回呼んで、空かどうかを先に確かめています。空のときだけ別の答えを返すので、先頭の区切りが付く間違いを避けられます。

## まとめ

- 要素の間に値を挟むには、組を作って先頭だけを捨てる方法がある。
- イテレータの組み合わせで、ループを書かずに済む。
- 空の入力を先に確かめると、余計な区切りが付かない。
