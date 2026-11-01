---
title: 述語が真になる要素を除いた、残りだけを遅延して取り出す
description: toolz.remove は、述語（predicate）が真になる要素を取り除き、残りを返す。filter の反対で、itertools.filterfalse に任せて実装されている。結果は遅延評価のイテレータになる。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [19, 27]
function: remove
difficulty: 1
format: 2
tags: [イテレータ, 関数型, イディオム]
---

## ひとことで

`remove(predicate, seq)` は、**述語が真になる要素を取り除いた残りを返す** 関数です。
`list(remove(iseven, [1, 2, 3, 4]))` は `[1, 3]` になります。偶数を除いて、奇数だけが残ります。

## コード

::: code-group

```python:line-numbers=19 [日本語訳]
def remove(predicate, seq):
    """ predicate(item) が偽になる要素だけを返す

    >>> def iseven(x):
    ...     return x % 2 == 0
    >>> list(remove(iseven, [1, 2, 3, 4]))
    [1, 3]
    """
    return filterfalse(predicate, seq)
```

```python:line-numbers=19 [原文]
def remove(predicate, seq):
    """ Return those items of sequence for which predicate(item) is False

    >>> def iseven(x):
    ...     return x % 2 == 0
    >>> list(remove(iseven, [1, 2, 3, 4]))
    [1, 3]
    """
    return filterfalse(predicate, seq)
```

:::

`filterfalse` は、`itertools` にある関数で、条件が偽の要素だけを出します。

## 前提知識

- **述語（predicate）**: 要素を受け取り、真か偽を返す関数です。
- **`filter`**: 条件が真の要素を残します。`remove` は、その逆に、真の要素を除きます。
- **`filterfalse`**: 条件が偽の要素だけを出します。`remove` はこれをそのまま使います。
- **遅延評価**: 必要になったときに、1 つずつ要素を作る仕組みです。

## 何をしているか

### 1. 述語の逆を取る

```python:line-numbers=27
    return filterfalse(predicate, seq)
```

`filterfalse(predicate, seq)` は、述語が真の要素を飛ばし、偽の要素だけを出します。つまり、「取り除かれないもの」を出します。

## ここがすごい

### 1 行で済む

`remove` の本体は、`filterfalse` を呼ぶだけです。数える、比べる、といった処理は、標準の部品に任せています。

### `filter` の反対を、わざわざ別の名前で

`filter(not_pred, seq)` と書くこともできます。しかし、述語を書き換えると読みにくくなります。`remove` という名前にすると、「この条件に合うものを取り除く」という意図が直接読めます。

### 遅延評価

結果はイテレータなので、全部を作ってからリストにする必要はありません。大きな列でも、必要な分だけ読まれます。

## まとめ

- 「取り除く」は、「偽のものだけを残す」と同じ。
- 標準の `filterfalse` に任せると、短く書ける。
- 名前を `remove` にすると、意図が読みやすくなる。
