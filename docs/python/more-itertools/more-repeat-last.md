---
title: 尽きたあとも、最後の値を出し続ける
description: more_itertools.repeat_last は、イテラブルを先に最後まで出し、尽きた後は最後の要素を無限に繰り返す。空だった場合は default を繰り返す。islice で長さを切ると、パディングの代わりに使える。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [1846, 1862]
function: repeat_last
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, イディオム]
---

## ひとことで

`repeat_last(iterable, default=None)` は、**元の列を出し終えたあとも、最後の要素を無限に出し続ける** 関数です。
`islice(repeat_last(range(3)), 5)` は `[0, 1, 2, 2, 2]` になります。

## コード

::: code-group

```python:line-numbers=1846 [日本語訳]
def repeat_last(iterable, default=None):
    """*iterable* が尽きたあとも、最後の要素を出し続ける。

        >>> list(islice(repeat_last(range(3)), 5))
        [0, 1, 2, 2, 2]

    If the iterable is empty, yield *default* forever::

        >>> list(islice(repeat_last(range(0), 42), 5))
        [42, 42, 42, 42, 42]

    """
    item = _marker
    for item in iterable:
        yield item
    final = default if item is _marker else item
    yield from repeat(final)
```

```python:line-numbers=1846 [原文]
def repeat_last(iterable, default=None):
    """After the *iterable* is exhausted, keep yielding its last element.

        >>> list(islice(repeat_last(range(3)), 5))
        [0, 1, 2, 2, 2]

    If the iterable is empty, yield *default* forever::

        >>> list(islice(repeat_last(range(0), 42), 5))
        [42, 42, 42, 42, 42]

    """
    item = _marker
    for item in iterable:
        yield item
    final = default if item is _marker else item
    yield from repeat(final)
```

:::

## 前提知識

- **`yield`**: 値を 1 つずつ外へ渡すキーワードです。
- **`yield from`**: 別のイテラブルの要素を、順番にすべて出します。
- **`repeat(x)`**: `x` を無限に繰り返すイテレータです。
- **`islice(it, n)`**: 先頭から `n` 個だけを取り出します。無限のイテレータを、有限にするために使います。

## 何をしているか

### 1. 元の列を、そのまま出す

```python:line-numbers=1858
    item = _marker
    for item in iterable:
        yield item
```

`for` で元の要素を 1 つずつ出します。同時に、最後に読んだ値を `item` に残しておきます。

### 2. 最後の値を決める

```python:line-numbers=1861
    final = default if item is _marker else item
```

元の列が 1 件以上あれば、最後の値（`item`）を使います。1 件もなければ、`default` を使います。`_marker` は、読めた要素が 1 つもなかったことを表す目印です。

### 3. その値を無限に繰り返す

```python:line-numbers=1862
    yield from repeat(final)
```

`repeat(final)` は、その値を無限に出します。`yield from` で、それを外へ渡します。

## ここがすごい

### 「尽きた」を値で埋める

列が終わったあとに、同じ値で埋めたい場面があります。埋めるための長さを考えずに、`islice` で必要な数だけ切り出せばよくなります。

### 空の列でも、既定値で埋める

元の列が空だったときも、`default` が無限に出ます。`for` の中身が 1 回も回らなかったことを、`_marker` で判定しています。

### 1 回読むだけ

元の列は、先頭から 1 回だけ読みます。最後の値を覚えておくのは、1 つの変数だけです。長い列でも、メモリの使い方は変わりません。

## まとめ

- 列が終わったあとを、最後の値で埋めたいときは、この関数を使うと簡単。
- 空のときの値を指定できるので、「何もなければ既定値」を表せる。
- 無限の列は、`islice` で必要な数だけ切り出す。
