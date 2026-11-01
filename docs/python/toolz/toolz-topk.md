---
title: 全部並べずに、大きいほうから k 個だけ取り出す
description: toolz.topk は、列の中から最も大きい k 個の要素を、大きい順に返す。内部では heapq.nlargest を使い、列全体を並べ替えずに作業する。key で比べ方を変えられる。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [969, 987]
function: topk
difficulty: 2
format: 2
tags: [探索, アルゴリズム, イテレータ]
---

## ひとことで

`topk(k, seq, key=None)` は、**列の中で大きいほうから `k` 個の要素** を、タプルで返す関数です。
`topk(2, [1, 100, 10, 1000])` は `(1000, 100)` を返します。全部を並べてから先頭を取るより、効率よく答えを出します。

## コード

::: code-group

```python:line-numbers=969 [日本語訳]
def topk(k, seq, key=None):
    """ 列の中から、大きいほうから k 個の要素を見つける

    Operates lazily in ``n*log(k)`` time

    >>> topk(2, [1, 100, 10, 1000])
    (1000, 100)

    Use a key function to change sorted order

    >>> topk(2, ['Alice', 'Bob', 'Charlie', 'Dan'], key=len)
    ('Charlie', 'Alice')

    See also:
        heapq.nlargest
    """
    if key is not None and not callable(key):
        key = getter(key)
    return tuple(heapq.nlargest(k, seq, key=key))
```

```python:line-numbers=969 [原文]
def topk(k, seq, key=None):
    """ Find the k largest elements of a sequence

    Operates lazily in ``n*log(k)`` time

    >>> topk(2, [1, 100, 10, 1000])
    (1000, 100)

    Use a key function to change sorted order

    >>> topk(2, ['Alice', 'Bob', 'Charlie', 'Dan'], key=len)
    ('Charlie', 'Alice')

    See also:
        heapq.nlargest
    """
    if key is not None and not callable(key):
        key = getter(key)
    return tuple(heapq.nlargest(k, seq, key=key))
```

:::

`heapq.nlargest` は、大きいほうから n 個を取り出す標準ライブラリの関数です。`getter` は、添字やキーで値を取り出す関数を作ります。

## 前提知識

- **`k` 個の最大値**: 列の中で、一番大きいものから順に `k` 個を取ったものです。
- **`key` 関数**: 比べる前に値を変換する関数です。`key=len` なら、文字列の長さで比べます。
- **タプル**: 変えられない並びです。結果が途中で変わらないように、タプルで返しています。
- **遅延評価**: 必要になったときに作られる計算のことです。

## 何をしているか

### 1. `key` を関数として扱えるようにする

```python:line-numbers=985
    if key is not None and not callable(key):
        key = getter(key)
```

`key` が関数でなければ、`getter` で「その添字やキーの値を取り出す関数」に変えます。例えば `key=1` なら、組の 2 番目を比べます。

### 2. `nlargest` で上位 k 個を取る

```python:line-numbers=987
    return tuple(heapq.nlargest(k, seq, key=key))
```

`heapq.nlargest(k, seq, key=key)` で、大きいほうから `k` 個を取り出し、タプルにして返します。

## ここがすごい

### 全部並べない

列全体を並べ替えると、`n log n` の手間がかかります。`nlargest` は、`k` 個を覚えておくだけなので、`k` が小さいときは大きな列でも軽く済みます。ドキュメントにも `n*log(k)` の時間と書かれています。

### `key` で比べ方を変えられる

`key=len` にすると、文字列の長さで上位を選べます。docstring の `topk(2, ['Alice', 'Bob', 'Charlie', 'Dan'], key=len)` は、`('Charlie', 'Alice')` になります。

### 添字でも指定できる

`key` に数や文字列を渡すと、`getter` が値の取り出し関数に変えてくれます。辞書やタプルの特定の位置で比べるときに、関数を書かずに済みます。

## まとめ

- 上位 `k` 個だけが欲しいなら、全部並べずに `nlargest` で覚えておく。
- `key` を使うと、比べる基準を変えられる。
- 結果をタプルにすると、取り出した後に変わらない安心な値になる。
