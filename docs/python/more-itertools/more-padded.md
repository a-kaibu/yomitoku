---
title: 足りない分を埋め値で補い、必要な長さの列を作る
description: more_itertools.padded は、イテラブルの後ろに埋め値を足して、少なくとも n 個の要素を出す。next_multiple を指定すると、n の倍数になるまで埋める。n を省略すると、無限に埋め続ける。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [1792, 1834]
function: padded
difficulty: 2
format: 2
tags: [イテレータ, 防御的プログラミング, 遅延評価]
---

## ひとことで

`padded(iterable, fillvalue=None, n=None)` は、**元の列の後ろに埋め値を足して、少なくとも `n` 個の要素を出す** 関数です。
`padded([1, 2, 3], '?', 5)` は `1, 2, 3, '?', '?'` を出します。`n` を省略すると、埋め値を無限に出し続けます。

## コード

::: code-group

```python:line-numbers=1792 [日本語訳]
def padded(iterable, fillvalue=None, n=None, next_multiple=False):
    """*iterable* の要素を出し、そのあとに *fillvalue* を、少なくとも *n* 個になるまで出す。
    at least *n* items are emitted.

        >>> list(padded([1, 2, 3], '?', 5))
        [1, 2, 3, '?', '?']

    If *next_multiple* is ``True``, *fillvalue* will be emitted until the
    number of items emitted is a multiple of *n*:

        >>> list(padded([1, 2, 3, 4], n=3, next_multiple=True))
        [1, 2, 3, 4, None, None]

    If *n* is ``None``, *fillvalue* will be emitted indefinitely.

    To create an *iterable* of exactly size *n*, you can truncate with
    :func:`islice`.

        >>> list(islice(padded([1, 2, 3], '?'), 5))
        [1, 2, 3, '?', '?']
        >>> list(islice(padded([1, 2, 3, 4, 5, 6, 7, 8], '?'), 5))
        [1, 2, 3, 4, 5]

    """
    iterator = iter(iterable)
    iterator_with_repeat = chain(iterator, repeat(fillvalue))

    if n is None:
        return iterator_with_repeat
    elif n < 1:
        raise ValueError('n must be at least 1')
    elif next_multiple:

        def slice_generator():
            for first in iterator:
                yield (first,)
                yield islice(iterator_with_repeat, n - 1)

        # 要素がある間は、サイズ n の塊を作る
        return chain.from_iterable(slice_generator())
    else:
        # 最初の塊が少なくとも n 個になるようにしてから、残りを続ける
        return chain(islice(iterator_with_repeat, n), iterator)
```

```python:line-numbers=1792 [原文]
def padded(iterable, fillvalue=None, n=None, next_multiple=False):
    """Yield the elements from *iterable*, followed by *fillvalue*, such that
    at least *n* items are emitted.

        >>> list(padded([1, 2, 3], '?', 5))
        [1, 2, 3, '?', '?']

    If *next_multiple* is ``True``, *fillvalue* will be emitted until the
    number of items emitted is a multiple of *n*:

        >>> list(padded([1, 2, 3, 4], n=3, next_multiple=True))
        [1, 2, 3, 4, None, None]

    If *n* is ``None``, *fillvalue* will be emitted indefinitely.

    To create an *iterable* of exactly size *n*, you can truncate with
    :func:`islice`.

        >>> list(islice(padded([1, 2, 3], '?'), 5))
        [1, 2, 3, '?', '?']
        >>> list(islice(padded([1, 2, 3, 4, 5, 6, 7, 8], '?'), 5))
        [1, 2, 3, 4, 5]

    """
    iterator = iter(iterable)
    iterator_with_repeat = chain(iterator, repeat(fillvalue))

    if n is None:
        return iterator_with_repeat
    elif n < 1:
        raise ValueError('n must be at least 1')
    elif next_multiple:

        def slice_generator():
            for first in iterator:
                yield (first,)
                yield islice(iterator_with_repeat, n - 1)

        # While elements exist produce slices of size n
        return chain.from_iterable(slice_generator())
    else:
        # Ensure the first batch is at least size n then iterate
        return chain(islice(iterator_with_repeat, n), iterator)
```

:::

## 前提知識

- **埋め値（fillvalue）**: 元の列が足りないときに使う値です。`None` や `'?'` などを指定します。
- **`chain(a, b)`**: `a` の要素を出し終えてから、`b` の要素を出します。つなげる関数です。
- **`repeat(x)`**: `x` を無限に出すイテレータです。
- **`islice`**: 先頭から一部を取り出します。埋めた後の長さを決めるために使います。

## 何をしているか

### 1. 埋め値を無限に続けた列を作る

```python:line-numbers=1816
    iterator = iter(iterable)
    iterator_with_repeat = chain(iterator, repeat(fillvalue))
```

元の列の後ろに、埋め値を無限につなげた列を作ります。ここから必要な分だけ取れば、足りない分が埋められます。

### 2. `n` が省略されていれば、そのまま返す

```python:line-numbers=1818

    if n is None:
        return iterator_with_repeat
```

`n` がなければ、埋め値が無限に続く列をそのまま返します。

### 3. `next_multiple` の場合

```python:line-numbers=1821
    elif n < 1:
        raise ValueError('n must be at least 1')
    elif next_multiple:

        def slice_generator():
            for first in iterator:
                yield (first,)
                yield islice(iterator_with_repeat, n - 1)

        # 要素がある間は、サイズ n の塊を作る
        return chain.from_iterable(slice_generator())
```

`n` の倍数になるまで埋めます。元の列を `n` 個ずつの塊に分け、最後の塊が足りなければ、埋め値で補います。塊を作るたびに、先頭の 1 件と、残り `n - 1` 件を取ります。

### 4. 普通の場合

```python:line-numbers=1832
    else:
        # 最初の塊が少なくとも n 個になるようにしてから、残りを続ける
        return chain(islice(iterator_with_repeat, n), iterator)
```

最初の `n` 個だけを埋め値付きの列から取り、その後に元の列の残りをつなげます。元の列が `n` 個より多ければ、埋められることはありません。

## ここがすごい

### 埋める処理を、列のつなぎ方で表す

「足りなければ埋める」を `if` で書く代わりに、埋め値の列を元の列につなげておき、必要な分だけ取ります。判定がなくても、長さの条件が自然に満たされます。

### 塊の単位も選べる

`next_multiple` を指定すると、埋めた後の長さが、`n` の倍数になります。画面の表示やデータの分割など、塊の単位が決まっている場面に向いています。

### 長さを決めるのは呼ぶ側

`n` を省略すると、埋め値を無限に出すので、そのままでは終わりません。`islice` で切るか、`n` を指定して長さを決めてください。

## まとめ

- 足りない分を埋めるなら、埋め値の列を後ろにつないで必要な分だけ取ると簡潔。
- 塊の単位にそろえたいときは、`next_multiple` のように倍数で埋める。
- 無限の埋め値は、必ず長さを決めて使う。
