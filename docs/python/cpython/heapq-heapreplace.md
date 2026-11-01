---
title: 最小値を取り出してから入れる、1 回の操作で済ませる heapreplace
description: heapq.heapreplace は、ヒープの最小値を取り出し、新しい値を入れる操作を 1 回にまとめた関数。取り出してから追加するより速く、固定サイズの優先度キューで使いやすい。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/heapq.py
lines: [148, 162]
function: heapreplace
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`heapreplace(heap, item)` は、**最小値を取り出して、新しい値 `item` を入れる** 操作を 1 回の関数呼び出しで行います。
`h = [1, 4, 7]` に対して `heapreplace(h, 5)` を実行すると、`1` を返し、`h` は `5` を含む状態に変わります。

## コード

::: code-group

```python:line-numbers=148 [日本語訳]
def heapreplace(heap, item):
    """現在の最小値を取り出して返し、新しい項目を追加する。

    This is more efficient than heappop() followed by heappush(), and can be
    more appropriate when using a fixed-size heap.  Note that the value
    returned may be larger than item!  That constrains reasonable uses of
    this routine unless written as part of a conditional replacement:

        if item > heap[0]:
            item = heapreplace(heap, item)
    """
    returnitem = heap[0]    # 空なら適切な IndexError が発生する
    heap[0] = item
    _siftup(heap, 0)
    return returnitem
```

```python:line-numbers=148 [原文]
def heapreplace(heap, item):
    """Pop and return the current smallest value, and add the new item.

    This is more efficient than heappop() followed by heappush(), and can be
    more appropriate when using a fixed-size heap.  Note that the value
    returned may be larger than item!  That constrains reasonable uses of
    this routine unless written as part of a conditional replacement:

        if item > heap[0]:
            item = heapreplace(heap, item)
    """
    returnitem = heap[0]    # raises appropriate IndexError if heap is empty
    heap[0] = item
    _siftup(heap, 0)
    return returnitem
```

:::

`_siftup` は、ヒープの性質を保つために、値を下へ移動させる内部関数です。

## 前提知識

- **ヒープ**: 一番小さい値を、先頭（`heap[0]`）に必ず置く配列です。`heapq` モジュールは、リストをヒープとして使う関数を集めたものです。
- **`heappop`**: 最小値を取り出して返します。取り出したあとも、ヒープの性質を保ちます。
- **`_siftup`**: 先頭の値を、子の値と比べながら下へ沈めていく関数です。
- **`IndexError`**: 空のリストから要素を取り出そうとすると起きるエラーです。

## 何をしているか

### 1. 最小値を控えてから、新しい値で置き換える

```python:line-numbers=159
    returnitem = heap[0]    # 空なら適切な IndexError が発生する
    heap[0] = item
```

`heap[0]` を `returnitem` に保存してから、先頭を `item` で上書きします。ここで空のヒープなら、`heap[0]` の時点で `IndexError` が起きます。

### 2. ヒープの性質を直す

```python:line-numbers=161
    _siftup(heap, 0)
```

先頭に置いた `item` は、大きいかもしれません。そのため `_siftup` で、正しい位置まで下へ移動させます。

### 3. 取り出した値を返す

```python:line-numbers=162
    return returnitem
```

最後に、保存しておいた古い最小値を返します。

## ここがすごい

### 取り出して入れる、を 1 回の移動で

`heappop` のあとに `heappush` すると、ヒープの性質を直す作業が 2 回になります。`heapreplace` は、先頭を書き換えて 1 回だけ下へ移動させれば済みます。コメントの説明も、この違いに沿っています。

### 戻り値が `item` より大きいことがある

docstring にあるとおり、返る値は `item` より大きいことがあります。これは「取り出す値が必ず `item` 以下」とは限らないという意味です。そのため、「新しい値が先頭より大きいときだけ置き換える」という使い方が勧められています。

### 固定サイズのヒープに向く

要素数を一定に保ちたいとき（例えば上位 10 件だけを残すとき）は、この関数がよく使われます。新しい値が入るたびに、最小の値が 1 つ押し出される形になるからです。

## まとめ

- ヒープの先頭を置き換えると、取り出しと追加を 1 回の移動で済ませられる。
- 関数の戻り値とヒープの中身を、別々に理解すると混乱しにくい。
- 空のときのエラーは、`heap[0]` を読んだ時点で自然に起きる。
