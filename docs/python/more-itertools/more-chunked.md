---
title: リストを長さ n ごとに区切って、切れ端を順に出す
description: more_itertools.chunked は、イテラブルを長さ n のリストに分けて順に出す。最後の切れ端は短いことがある。strict=True にすると、割り切れない場合に ValueError を出す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [215, 250]
function: chunked
difficulty: 2
format: 2
tags: [イテレータ, データ構造, 防御的プログラミング]
---

## ひとことで

`chunked(iterable, n)` は、**イテラブルを長さ `n` のリストに区切って、順に出す** 関数です。
`chunked([1, 2, 3, 4, 5, 6, 7, 8], 3)` は、`[1, 2, 3]`、`[4, 5, 6]`、`[7, 8]` を出します。最後の切れ端は、足りなければ短くなります。

## コード

::: code-group

```python:line-numbers=215 [日本語訳]
def chunked(iterable, n, strict=False):
    """*iterable* を長さ *n* のリストに分ける:

        >>> list(chunked([1, 2, 3, 4, 5, 6], 3))
        [[1, 2, 3], [4, 5, 6]]

    By the default, the last yielded list will have fewer than *n* elements
    if the length of *iterable* is not divisible by *n*:

        >>> list(chunked([1, 2, 3, 4, 5, 6, 7, 8], 3))
        [[1, 2, 3], [4, 5, 6], [7, 8]]

    To use a fill-in value instead, see the :func:`grouper` recipe.

    If the length of *iterable* is not divisible by *n* and *strict* is
    ``True``, then ``ValueError`` will be raised before the last
    list is yielded.

    """
    if n is not None and n < 0:
        raise ValueError('n must be at least 0')

    iterator = iter(partial(take, n, iter(iterable)), [])
    if strict:
        if n is None:
            raise ValueError('n must not be None when using strict mode.')

        def ret():
            for chunk in iterator:
                if len(chunk) != n:
                    raise ValueError('iterable is not divisible by n.')
                yield chunk

        return ret()
    else:
        return iterator
```

```python:line-numbers=215 [原文]
def chunked(iterable, n, strict=False):
    """Break *iterable* into lists of length *n*:

        >>> list(chunked([1, 2, 3, 4, 5, 6], 3))
        [[1, 2, 3], [4, 5, 6]]

    By the default, the last yielded list will have fewer than *n* elements
    if the length of *iterable* is not divisible by *n*:

        >>> list(chunked([1, 2, 3, 4, 5, 6, 7, 8], 3))
        [[1, 2, 3], [4, 5, 6], [7, 8]]

    To use a fill-in value instead, see the :func:`grouper` recipe.

    If the length of *iterable* is not divisible by *n* and *strict* is
    ``True``, then ``ValueError`` will be raised before the last
    list is yielded.

    """
    if n is not None and n < 0:
        raise ValueError('n must be at least 0')

    iterator = iter(partial(take, n, iter(iterable)), [])
    if strict:
        if n is None:
            raise ValueError('n must not be None when using strict mode.')

        def ret():
            for chunk in iterator:
                if len(chunk) != n:
                    raise ValueError('iterable is not divisible by n.')
                yield chunk

        return ret()
    else:
        return iterator
```

:::

`take` は、イテレータから先頭の n 個をリストにして返す関数です。`partial` は、関数の一部の引数を先に固定した関数を作ります。

## 前提知識

- **`iter(callable, sentinel)`**: 関数を繰り返し呼び、戻り値が `sentinel` と等しくなったら止まるイテレータを作ります。ここでは、空のリスト `[]` が終わりの合図です。
- **`partial(take, n, it)`**: `take` の引数 `n` と `it` を固定した関数です。呼ぶたびに、次の `n` 個を取ります。
- **`strict`**: 割り切れないときにエラーにするかどうかを決める引数です。
- **`ValueError`**: 値は正しい型でも、内容が不正なときに投げられる例外です。

## 何をしているか

### 1. 長さを確かめる

```python:line-numbers=234
    if n is not None and n < 0:
        raise ValueError('n must be at least 0')
```

`n` が負の数なら、意味がないのでエラーにします。

### 2. 「次の n 個」を繰り返し取る関数を作る

```python:line-numbers=237
    iterator = iter(partial(take, n, iter(iterable)), [])
```

`partial(take, n, iter(iterable))` は、呼ぶたびに次の `n` 個をリストにして返します。取れなくなると空のリストになるので、`iter(..., [])` がそこで止まります。

### 3. strict モードの確認

```python:line-numbers=238
    if strict:
        if n is None:
            raise ValueError('n must not be None when using strict mode.')

        def ret():
            for chunk in iterator:
                if len(chunk) != n:
                    raise ValueError('iterable is not divisible by n.')
                yield chunk

        return ret()
```

`strict=True` のときは、各切れ端の長さを確かめます。`n` と違う長さの切れ端が出たら、`ValueError` を出します。ここで、最後の切れ端が短いことが分かります。

### 4. 普通のモードは、そのまま返す

```python:line-numbers=249
    else:
        return iterator
```

`strict` が偽なら、切れ端のイテレータをそのまま返します。短い最後の切れ端も、そのまま出ます。

## ここがすごい

### 「空のリストが来たら終わり」の形

関数を繰り返し呼ぶ `iter(callable, sentinel)` の形を使うと、「次の塊がなくなったら止まる」を 1 行で表せます。`while` と変数の管理がいりません。

### 途中で切れ端を作らない

各切れ端は、必要になったときに作られます。大きなデータでも、全部をリストにする必要はありません。

### 割り切れるかどうかを選べる

`strict=True` を選ぶと、割り切れないデータを見つけたときに止められます。データの形を確かめたい場面で、役立つ選択肢です。

## まとめ

- 「次の n 個」を取る関数を `iter` の番兵で繰り返すと、区切りのループを 1 行で書ける。
- 最後の切れ端が短いことを許すか、エラーにするかは、用途に合わせて選ぶ。
- 切れ端を必要になってから作ると、大きなデータでもメモリを節約できる。
