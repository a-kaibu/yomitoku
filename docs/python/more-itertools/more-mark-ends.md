---
title: 1 つ先を読んで、最初と最後の要素に印を付ける
description: more_itertools.mark_ends は、列の要素を (is_first, is_last, item) の 3 つ組で出す。1 つ先の要素を読んでから今の要素を出すことで、最後の要素を判定する。先頭や末尾だけ特別な処理をしたいときに使う。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [2532, 2559]
function: mark_ends
difficulty: 2
format: 2
tags: [イテレータ, イディオム]
---

## ひとことで

`mark_ends(iterable)` は、**要素を `(is_first, is_last, item)` の 3 つ組にして順に出す** 関数です。
`mark_ends('ABC')` は、先頭の `A` に `True` と `False`、末尾の `C` に `False` と `True` を付けて出します。先頭や末尾だけ特別な処理をする `for` 文が書けます。

## コード

::: code-group

```python:line-numbers=2532 [日本語訳]
def mark_ends(iterable):
    """``(is_first, is_last, item)`` の形の 3 つ組を出す。

    >>> list(mark_ends('ABC'))
    [(True, False, 'A'), (False, False, 'B'), (False, True, 'C')]

    列を回しながら、先頭や末尾の要素だけ特別な処理をしたいときに使う。
    先頭と末尾の要素について:

    >>> iterable = ['Header', 100, 200, 'Footer']
    >>> total = 0
    >>> for is_first, is_last, item in mark_ends(iterable):
    ...     if is_first:
    ...         continue  # ヘッダーを飛ばす
    ...     if is_last:
    ...         continue  # フッターを飛ばす
    ...     total += item
    >>> print(total)
    300
    """
    it = iter(iterable)
    for a in it:
        first = True
        for b in it:
            yield first, False, a
            a = b
            first = False
        yield first, True, a
```

```python:line-numbers=2532 [原文]
def mark_ends(iterable):
    """Yield 3-tuples of the form ``(is_first, is_last, item)``.

    >>> list(mark_ends('ABC'))
    [(True, False, 'A'), (False, False, 'B'), (False, True, 'C')]

    Use this when looping over an iterable to take special action on its first
    and/or last items:

    >>> iterable = ['Header', 100, 200, 'Footer']
    >>> total = 0
    >>> for is_first, is_last, item in mark_ends(iterable):
    ...     if is_first:
    ...         continue  # Skip the header
    ...     if is_last:
    ...         continue  # Skip the footer
    ...     total += item
    >>> print(total)
    300
    """
    it = iter(iterable)
    for a in it:
        first = True
        for b in it:
            yield first, False, a
            a = b
            first = False
        yield first, True, a
```

:::

## 前提知識

- **3 つ組（タプル）**: 3 つの値を 1 まとまりにしたものです。`for` 文で、3 つの変数に分けて受け取れます。
- **先読み**: 今の要素を出す前に、次の要素を読んでおくことです。次の要素があるかで、今の要素が最後かどうかが分かります。
- **イテレータ**: 値を 1 つずつ順に出す仕組みです。

## 何をしているか

### 1. イテレータを用意し、最初の要素を取る

```python:line-numbers=2552
    it = iter(iterable)
    for a in it:
```

`iter` で列を読むイテレータを作り、最初の要素 `a` を取り出します。空の列なら、外側の `for` がすぐ終わるので、何も出ません。

### 2. 次の要素を先に読んで、今の要素を出す

```python:line-numbers=2554
        first = True
        for b in it:
            yield first, False, a
```

内側の `for` で次の要素 `b` を読み、今の `a` を出します。このとき、`a` の後ろにもう要素があるので、最後ではありません。`first` は、この `a` が先頭かどうかを表します。

### 3. 最後の要素には `is_last` を立てる

```python:line-numbers=2557
            a = b
            first = False
        yield first, True, a
```

次の要素が読めなくなったら、今の `a` は最後の要素です。`a = b` で次を今の要素に移し、`first` を `False` にしてから、最後の印を付けて出します。

## ここがすごい

### 1 つ先を読むのが、最後の判定の鍵

「次があるか」を知るには、次を読むしかありません。そこで、今の要素を出す前に 1 つ先を読むという形で、最後の判定を実現しています。

### 最初の印も、同じ仕組みで付く

先頭かどうかは、`first` という変数を、要素を出すたびに `False` にすることで管理しています。新しい状態を別に持たず、ループの流れで自然に決まります。

### 利用側はループ 1 つで済む

呼び出し側は、3 つ組を分解して `if` で判定するだけです。ヘッダーやフッターを飛ばす処理が、読みやすい形で書けます。

## まとめ

- 1 つ先を読んでから出すと、今の要素が最後かどうかが分かる。
- 先頭かどうかは、ループの途中で変わる状態として持つと簡単に管理できる。
- 呼び出し側は、先頭や末尾だけ特別な処理を、`if` で素直に書ける。
