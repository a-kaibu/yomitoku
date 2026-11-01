---
title: 入れ子のリストを、1 段だけ外して並べる
description: more_itertools.flatten は、リストの中に入ったリストを 1 段だけ外して、順に値を出す。標準の itertools.chain.from_iterable を使うので、中身を先にリストへ作らずに済む。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [301, 310]
function: flatten
difficulty: 1
format: 2
tags: [イテレータ, 可読性, 遅延評価]
---

## ひとことで

`flatten(list_of_lists)` は、**リストの中にあるリストを 1 段だけ外して、値を順に並べ直す** 関数です。
`flatten([[0, 1], [2, 3]])` は `0, 1, 2, 3` という順に値を出します。二重のリストを 1 本の列にしたいときに使えます。

## コード

::: code-group

```python:line-numbers=301 [日本語訳]
def flatten(list_of_lists):
    """入れ子のリストを 1 段だけ平らにするイテレータを返す。

        >>> list(flatten([[0, 1], [2, 3]]))
        [0, 1, 2, 3]

    関連: :func:`collapse`。こちらは何段でも平らにできる。

    """
    return chain.from_iterable(list_of_lists)
```

```python:line-numbers=301 [原文]
def flatten(list_of_lists):
    """Return an iterator flattening one level of nesting in a list of lists.

        >>> list(flatten([[0, 1], [2, 3]]))
        [0, 1, 2, 3]

    See also :func:`collapse`, which can flatten multiple levels of nesting.

    """
    return chain.from_iterable(list_of_lists)
```

:::

## 前提知識

- **入れ子（ネスト）**: リストの中に、さらにリストが入っている形です。
- **イテレータ**: 値を 1 つずつ順に出す仕組みです。全部を先に作らずに済みます。
- **`itertools.chain`**: 複数の列をつなげて、1 本の列として扱う標準ライブラリの関数です。
- **`from_iterable`**: 列の列を受け取り、中の列を順につなぐ `chain` の書き方です。

## 何をしているか

### 1. 列の列を、1 本の列につなぐ

```python:line-numbers=310
    return chain.from_iterable(list_of_lists)
```

`chain.from_iterable` は、渡された列の列を 1 つずつ順に読み、中の値を出していきます。外側のリストは 1 回だけ読まれ、中身は読まれるときに取り出されます。

## ここがすごい

### 1 行で済む

標準ライブラリの `chain` に任せるので、関数の中身は 1 行です。ループを書く必要がなく、何をしているかがすぐ分かります。

### 中身を先にコピーしない

イテレータなので、平らにした結果を全部リストに作りません。大きなデータでも、必要な分だけ値が出てきます。

### 1 段だけという約束

この関数は、中のリストがさらにリストを含んでいても、もう 1 段は外しません。何段も外したいときは、`collapse` のような別の関数を使います。範囲を 1 段に絞ることで、結果の形が予想しやすくなります。

## まとめ

- 入れ子のリストを 1 段だけ外すには、`chain.from_iterable` が 1 行で使える。
- イテレータで返すと、大きなデータも全部をコピーせずに扱える。
- 何段まで外すかを関数ごとに決めると、結果の形が分かりやすくなる。
