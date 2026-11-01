---
title: 列の中に同じ値がないかを、途中で止まりながら調べる
description: toolz.isdistinct は、列のすべての値が互いに異なるかを調べる。イテレータなら、重複を見つけた時点で False を返す。リストなどは、長さと集合の大きさを比べて判定する。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [287, 309]
function: isdistinct
difficulty: 2
format: 2
tags: [データ構造, イテレータ, 防御的プログラミング]
---

## ひとことで

`isdistinct(seq)` は、**列の中に同じ値が 2 つ以上ないか** を調べる関数です。
`isdistinct([1, 2, 3])` は `True`、`isdistinct([1, 2, 1])` は `False` を返します。`isdistinct("Hello")` は `l` が 2 回あるので `False` です。

## コード

::: code-group

```python:line-numbers=287 [日本語訳]
def isdistinct(seq):
    """ 列のすべての値が互いに異なるかどうか

    >>> isdistinct([1, 2, 3])
    True
    >>> isdistinct([1, 2, 1])
    False

    >>> isdistinct("Hello")
    False
    >>> isdistinct("World")
    True
    """
    if iter(seq) is seq:
        seen = set()
        seen_add = seen.add
        for item in seq:
            if item in seen:
                return False
            seen_add(item)
        return True
    else:
        return len(seq) == len(set(seq))
```

```python:line-numbers=287 [原文]
def isdistinct(seq):
    """ All values in sequence are distinct

    >>> isdistinct([1, 2, 3])
    True
    >>> isdistinct([1, 2, 1])
    False

    >>> isdistinct("Hello")
    False
    >>> isdistinct("World")
    True
    """
    if iter(seq) is seq:
        seen = set()
        seen_add = seen.add
        for item in seq:
            if item in seen:
                return False
            seen_add(item)
        return True
    else:
        return len(seq) == len(set(seq))
```

:::

`set` は、同じ値を 2 つ持たない集合です。`seen_add` は、集合に値を追加するメソッドを、変数に取り出したものです。

## 前提知識

- **イテレータ**: 1 回しか読めない列です。読み終わった要素は、もう取り出せません。
- **`iter(seq) is seq`**: `seq` 自体がイテレータかどうかを調べる判定です。イテレータなら `iter` は同じオブジェクトを返します。
- **集合の大きさ**: `len(set(seq))` は、重複を除いた個数です。元の個数と比べると、重複があったかが分かります。
- **早期の `return`**: 答えが決まった時点で、残りを調べずに関数を終わらせる書き方です。

## 何をしているか

### 1. イテレータの場合

```python:line-numbers=301
        seen = set()
        seen_add = seen.add
        for item in seq:
            if item in seen:
                return False
            seen_add(item)
```

イテレータは 1 回しか読めないので、長さを使えません。値を 1 つずつ集合に入れながら、すでにあったら `False` を返します。

### 2. 重複が見つかれば、すぐ止まる

```python:line-numbers=304
            if item in seen:
                return False
```

同じ値が 2 回目に出た時点で、残りを読まずに `False` を返します。

### 3. 最後まで重複がなければ `True`

```python:line-numbers=307
        return True
```

最後まで重複がなければ、すべての値が異なるので `True` です。

### 4. リストなどの場合

```python:line-numbers=309
        return len(seq) == len(set(seq))
```

リストのように何度でも読める列は、個数と、重複を除いた集合の大きさを比べます。同じなら重複がありません。

## ここがすごい

### 読み終わりを待たずに答えを出す

イテレータの場合、重複を見つけた時点で止まります。大きな列でも、重複が早く出れば、ほとんど読まずに答えが出ます。

### 型で方法を分ける

イテレータは 1 回しか読めないので、長さを調べる方法が使えません。`iter(seq) is seq` で、その違いを判定してから、それぞれに合った方法を使っています。

### 集合で重複を見つける

集合は同じ値を 2 つ持てないので、個数の差がそのまま重複の数になります。比べ方が 1 行で済みます。

## まとめ

- 重複の判定は、集合に入れながら探すと速く、途中で止められる。
- 1 回しか読めない列と、何度も読める列では、方法を分ける必要がある。
- 2 つの値を比べて差を見ると、重複の有無が分かりやすい。
