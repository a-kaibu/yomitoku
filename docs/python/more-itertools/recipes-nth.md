---
title: 先頭から n 個飛ばして、1 つだけ取り出す
description: more_itertools.nth は、イテラブルの n 番目（0 から数える）の要素を返す。足りなければ default を返す。islice と next を組み合わせ、途中の要素をリストにせずに済ませている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [203, 213]
function: nth
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価]
---

## ひとことで

`nth(iterable, n, default=None)` は、**先頭から数えて n 番目の要素** を返す関数です。番号は 0 から始まります。
`nth('abcd', 2)` は `'c'` を返します。要素が足りないときは、`default` を返します。

## コード

::: code-group

```python:line-numbers=203 [日本語訳]
def nth(iterable, n, default=None):
    """n 番目の要素を返す。なければ default を返す。

    >>> l = range(10)
    >>> nth(l, 3)
    3
    >>> nth(l, 20, "zebra")
    'zebra'

    """
    return next(islice(iterable, n, None), default)
```

```python:line-numbers=203 [原文]
def nth(iterable, n, default=None):
    """Returns the nth item or a default value.

    >>> l = range(10)
    >>> nth(l, 3)
    3
    >>> nth(l, 20, "zebra")
    'zebra'

    """
    return next(islice(iterable, n, None), default)
```

:::

`islice` は `itertools.islice` で、イテレータの一部分だけを切り出す関数です。

## 前提知識

- **0 から始まる番号**: Python のリストやイテレータは、先頭を `0` と数えます。`nth(x, 0)` は先頭の要素です。
- **`islice(iterable, n, None)`**: `n` 番目から最後までを取り出すイテレータを作ります。`n` 個は読み飛ばされますが、リストには保存されません。
- **`next(it, default)`**: イテレータから 1 つ取り出します。もう要素がなければ、エラーにせず `default` を返します。

## 何をしているか

### 1. n 番目から最後まで切り出す

```python:line-numbers=213
    return next(islice(iterable, n, None), default)
```

`islice(iterable, n, None)` は、最初の `n` 個を読み飛ばしてから、残りを順に返すイテレータを作ります。この時点では、まだ何も読んでいません。

### 2. 先頭を 1 つだけ取り出す

```python:line-numbers=213
    return next(islice(iterable, n, None), default)
```

`next(...)` を 1 回呼ぶと、読み飛ばしが行われ、`n` 番目の要素が取り出されます。もし要素が足りなければ、`default` が返ります。

## ここがすごい

### 途中の要素を覚えない

`list(iterable)[n]` と書くと、全部をリストにしてから 1 つだけ取り出すことになります。巨大なファイルの行などでは、この無駄が大きくなります。`nth` は `n` 個を読み飛ばすだけで、保存しません。

### 足りないときの処理がいらない

`next` は、要素がなければ `default` を返します。`try` と `except StopIteration` を書かずに、「なければ既定値」を表せます。

### 負の番号は使えない

`islice` は負の値を受け付けないので、`nth(x, -1)` は `ValueError` になります。最後の要素が欲しいときは、`more_itertools.last` のような別の関数を使います。

## まとめ

- 先頭から n 個を読み飛ばすなら、`islice` と `next` の組み合わせが簡潔。
- `list(...)[n]` と違い、途中の要素を保存しない。
- 足りないときの値は `default` で指定でき、例外処理は不要。
