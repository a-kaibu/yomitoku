---
title: イテラブルを size 個ずつに分けて、必要な数だけリストにする
description: boltons.iterutils.chunked は、イテラブルを size 個ずつの塊に分けてリストで返す。count で塊の数を制限でき、fill を指定すると最後の塊を埋められる。内部では遅延評価のイテレータを使っている。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/iterutils.py
lines: [288, 308]
function: chunked
difficulty: 2
format: 2
tags: [イテレータ, データ構造, 遅延評価]
---

## ひとことで

`chunked(src, size, count=None)` は、**イテラブルを `size` 個ずつに区切ったリストを返す** 関数です。
`chunked(range(10), 3)` は `[[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]` を返します。最後の塊だけ、足りない分だけ短くなります。

## コード

::: code-group

```python:line-numbers=288 [日本語訳]
def chunked(src, size, count=None, **kw):
    """*count* 個の塊のリストを返す。各塊は *size* 個の要素を持つ。
    generated from iterable *src*. If *src* is not evenly divisible by
    *size*, the final chunk will have fewer than *size* elements.
    Provide the *fill* keyword argument to provide a pad value and
    enable padding, otherwise no padding will take place.

    >>> chunked(range(10), 3)
    [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
    >>> chunked(range(10), 3, fill=None)
    [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, None, None]]
    >>> chunked(range(10), 3, count=2)
    [[0, 1, 2], [3, 4, 5]]

    See :func:`chunked_iter` for more info.
    """
    chunk_iter = chunked_iter(src, size, **kw)
    if count is None:
        return list(chunk_iter)
    else:
        return list(itertools.islice(chunk_iter, count))
```

```python:line-numbers=288 [原文]
def chunked(src, size, count=None, **kw):
    """Returns a list of *count* chunks, each with *size* elements,
    generated from iterable *src*. If *src* is not evenly divisible by
    *size*, the final chunk will have fewer than *size* elements.
    Provide the *fill* keyword argument to provide a pad value and
    enable padding, otherwise no padding will take place.

    >>> chunked(range(10), 3)
    [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
    >>> chunked(range(10), 3, fill=None)
    [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, None, None]]
    >>> chunked(range(10), 3, count=2)
    [[0, 1, 2], [3, 4, 5]]

    See :func:`chunked_iter` for more info.
    """
    chunk_iter = chunked_iter(src, size, **kw)
    if count is None:
        return list(chunk_iter)
    else:
        return list(itertools.islice(chunk_iter, count))
```

:::

`chunked_iter` は、同じファイルにある、塊を 1 つずつ作るイテレータ版の関数です。`itertools.islice` は、先頭から一部だけを取り出します。

## 前提知識

- **塊（chunk）**: 元の列を、一定の個数ごとに区切った部分です。
- **イテレータ版とリスト版**: イテレータ版は必要なときに 1 つずつ塊を作り、リスト版はそれを全部まとめて返します。
- **`count`**: 作る塊の数の上限です。`None` なら、全部作ります。
- **`fill`**: 最後の塊を埋める値です。キーワード引数として `chunked_iter` に渡されます。

## 何をしているか

### 1. 塊を 1 つずつ作るイテレータを用意する

```python:line-numbers=304
    chunk_iter = chunked_iter(src, size, **kw)
```

`chunked_iter(src, size, **kw)` で、塊を遅延評価で作るイテレータを用意します。`fill` などの設定も、ここに渡されます。

### 2. 塊の数の上限がなければ、全部リストにする

```python:line-numbers=305
    if count is None:
        return list(chunk_iter)
```

`count` が `None` なら、イテレータの中身を全部 `list` にして返します。

### 3. 塊の数を制限する

```python:line-numbers=307
    else:
        return list(itertools.islice(chunk_iter, count))
```

`count` が指定されていれば、`islice` で先頭から `count` 個だけを取り出して、リストにします。残りの塊は作られません。

## ここがすごい

### 作る量を `count` で制限する

イテレータ版を使うので、`count` 個までしか読みません。全体が大きくても、必要な塊だけが作られます。

### 設定を内側に渡す

`fill` のような設定は、`**kw` でそのまま `chunked_iter` に渡します。外側の関数は、設定の中身を知らなくても済みます。

### 不足分の扱いを選べる

既定では、最後の塊は短いままです。`fill` を指定すると、足りない分を埋めてくれます。用途に合わせて選べる設計です。

## まとめ

- 塊に分けるときは、遅延評価のイテレータを作ってから、必要な分だけリストにする。
- 塊の数を制限すると、大きな入力でも必要な分だけを作れる。
- 設定は内側の関数に渡すと、外側の関数が簡潔に保てる。
