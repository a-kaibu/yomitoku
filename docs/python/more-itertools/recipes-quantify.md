---
title: 条件を満たす要素の数を、True を足し算して数える
description: more_itertools.quantify は、条件（述語）が真になる要素の個数を返す。map で各要素を真偽値に変え、sum で数えている。True は 1 として足されることを使った書き方。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [242, 251]
function: quantify
difficulty: 1
format: 2
tags: [イテレータ, 関数型, イディオム]
---

## ひとことで

`quantify(iterable, pred=bool)` は、**条件 `pred` を満たす要素が何個あるか** を返す関数です。
`quantify([True, False, True])` は `2` を返します。`pred` を省略すると、要素そのものの真偽で数えます。

## コード

::: code-group

```python:line-numbers=242 [日本語訳]
def quantify(iterable, pred=bool):
    """述語が真になる回数を返す。

    >>> quantify([True, False, True])
    2
    >>> quantify(range(100, 200), pred=lambda x: x<120)
    20

    """
    return sum(map(pred, iterable))
```

```python:line-numbers=242 [原文]
def quantify(iterable, pred=bool):
    """Return the how many times the predicate is true.

    >>> quantify([True, False, True])
    2
    >>> quantify(range(100, 200), pred=lambda x: x<120)
    20

    """
    return sum(map(pred, iterable))
```

:::

## 前提知識

- **述語（predicate）**: 要素を受け取り、真か偽を返す関数です。`lambda x: x < 120` のように書けます。
- **真偽値の足し算**: Python では `True` は `1`、`False` は `0` として扱われます。そのため `sum([True, False, True])` は `2` です。
- **`map(f, xs)`**: 各要素に `f` を適用した結果を、順に出すイテレータです。
- **`bool`**: 値を真偽値に変える組み込み関数です。`bool(0)` や `bool('')` は `False` です。

## 何をしているか

### 1. 各要素に述語を当てる

```python:line-numbers=251
    return sum(map(pred, iterable))
```

`map(pred, iterable)` は、各要素について `pred(x)` を求めます。結果は `True` か `False` の並びになります。

### 2. 真の数を合計する

```python:line-numbers=251
    return sum(map(pred, iterable))
```

`sum` は、その並びを足し合わせます。`True` が 1 として足されるので、結果は条件を満たす要素の数です。

## ここがすごい

### 数えるためのループを書かない

「条件を満たしたら数を 1 増やす」というループを書く代わりに、真偽値を足すだけで答えが出ます。コードが 1 行で、目的がはっきり読めます。

### リストを作らない

`map` はイテレータなので、判定結果を 1 つずつ作りながら `sum` が足していきます。巨大な入力でも、判定結果のリストは作られません。

### `bool` を既定値にする

`pred` を省略すると、要素の真偽で数えます。たとえば `quantify([0, 1, '', 'a'])` は `2` になります。

## まとめ

- 条件を満たす数は、真偽値に変えて `sum` すると数えられる。
- `map` と `sum` の組み合わせは、リストを作らずに使える。
- 既定の述語を `bool` にしておくと、条件がないときも同じ書き方で使える。
