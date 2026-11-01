---
title: 区切りを先頭に余分に入れてから、先頭の 1 つを捨てて要素の間に挟む
description: more_itertools.intersperse は、要素の間に埋め要素を挟む。n が 1 なら interleave で交互に並べ、先頭の余分な埋め要素を islice で捨てる。n が 2 以上なら chunked で塊にしてから同じ手順で挟む。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [980, 1003]
function: intersperse
difficulty: 2
format: 2
tags: [イテレータ, イディオム, 関数型]
---

## ひとことで

`intersperse(e, iterable, n=1)` は、**要素と要素の間に埋め要素 `e` を挟んだ列** を返す関数です。
`intersperse('!', [1, 2, 3])` は `1`、`'!'`、`2`、`'!'`、`3` の順に値を出します。`n` を 2 にすると、2 個ごとに `e` を挟みます。

## コード

::: code-group

```python:line-numbers=980 [日本語訳]
def intersperse(e, iterable, n=1):
    """*iterable* の要素の間に、埋め要素 *e* を挟む。
    埋め要素と埋め要素の間には、*n* 個の要素を残す。

        >>> list(intersperse('!', [1, 2, 3, 4, 5]))
        [1, '!', 2, '!', 3, '!', 4, '!', 5]

        >>> list(intersperse(None, [1, 2, 3, 4, 5], n=2))
        [1, 2, None, 3, 4, None, 5]

    """
    if n == 0:
        raise ValueError('n must be > 0')
    elif n == 1:
        # interleave(repeat(e), iterable) は e, x_0, e, x_1, e, x_2... を作る
        # islice(..., 1, None) で先頭の e を捨てて、x_0, e, x_1, e, x_2... にする
        return islice(interleave(repeat(e), iterable), 1, None)
    else:
        # interleave(filler, chunks) は [e], [x_0, x_1], [e], [x_2, x_3]... を作る
        # islice(..., 1, None) で先頭の [e] を捨てる
        # flatten で平らにすると x_0, x_1, e, x_2, x_3... になる
        filler = repeat([e])
        chunks = chunked(iterable, n)
        return flatten(islice(interleave(filler, chunks), 1, None))
```

```python:line-numbers=980 [原文]
def intersperse(e, iterable, n=1):
    """Intersperse filler element *e* among the items in *iterable*, leaving
    *n* items between each filler element.

        >>> list(intersperse('!', [1, 2, 3, 4, 5]))
        [1, '!', 2, '!', 3, '!', 4, '!', 5]

        >>> list(intersperse(None, [1, 2, 3, 4, 5], n=2))
        [1, 2, None, 3, 4, None, 5]

    """
    if n == 0:
        raise ValueError('n must be > 0')
    elif n == 1:
        # interleave(repeat(e), iterable) -> e, x_0, e, x_1, e, x_2...
        # islice(..., 1, None) -> x_0, e, x_1, e, x_2...
        return islice(interleave(repeat(e), iterable), 1, None)
    else:
        # interleave(filler, chunks) -> [e], [x_0, x_1], [e], [x_2, x_3]...
        # islice(..., 1, None) -> [x_0, x_1], [e], [x_2, x_3]...
        # flatten(...) -> x_0, x_1, e, x_2, x_3...
        filler = repeat([e])
        chunks = chunked(iterable, n)
        return flatten(islice(interleave(filler, chunks), 1, None))
```

:::

## 前提知識

- **`interleave`**: 複数の列から、順番に 1 つずつ値を取り出して交互に並べる関数です。
- **`islice`**: 列の一部だけを切り出すイテレータです。ここでは先頭を捨てるのに使います。
- **`chunked`**: 列を長さ `n` の塊に区切る関数です。
- **`flatten`**: 列の列を 1 本の列にする関数です。

## 何をしているか

### 1. 塊の数が 0 なら、エラーにする

```python:line-numbers=991
    if n == 0:
        raise ValueError('n must be > 0')
```

`n` が 0 では、挟む間隔が決まらないので、`ValueError` で止めます。

### 2. `n` が 1 なら、埋め要素と要素を交互に並べる

```python:line-numbers=993
    elif n == 1:
        # interleave(repeat(e), iterable) は e, x_0, e, x_1, e, x_2... を作る
        # islice(..., 1, None) で先頭の e を捨てて、x_0, e, x_1, e, x_2... にする
        return islice(interleave(repeat(e), iterable), 1, None)
```

`repeat(e)` と元の列を `interleave` で交互に並べると、先頭が `e` になります。`islice` で、その先頭の `e` を 1 つ捨てます。残るのは、要素と要素の間にだけ `e` が入った列です。

### 3. `n` が 2 以上なら、塊にしてから挟む

```python:line-numbers=1001
        filler = repeat([e])
        chunks = chunked(iterable, n)
        return flatten(islice(interleave(filler, chunks), 1, None))
```

元の列を長さ `n` の塊に区切り、塊の間に `[e]` を挟みます。先頭の `[e]` を捨てて、最後に `flatten` で塊を平らにします。これで、`n` 個の要素ごとに `e` が入ります。

## ここがすごい

### 余分に作って、先頭だけ捨てる

先頭に `e` が余分に付くのを、わざわざ作ってから捨てる形にしています。区切りを挟む位置の判定を、個別に書かずに済みます。

### 同じ仕組みを、塊の単位で使い回す

`n` が 1 の場合と、塊を使う場合は、同じ `interleave` と `islice` の組み合わせです。`n` が 1 の場合を、塊が 1 個ずつの特別な形として扱えます。

### 途中の段階をコメントで説明している

各段階で、列がどんな形になるかをコメントに書いています。読み手は、列の形の変化を追いながら、仕組みを理解できます。

## まとめ

- 余分な区切りを先頭に作ってから捨てると、挟む処理が単純になる。
- `n` が 1 なら `interleave`、2 以上なら塊を使い、同じ考え方で扱う。
- 途中の形をコメントで示すと、複雑な組み合わせも追いやすくなる。
