---
title: 連続する同じ値だけ 1 つにまとめる、groupby の 1 行
description: more_itertools.unique_justseen は、連続して並んだ重複だけを取り除き、順番どおりに出す。itertools.groupby で同じ値のかたまりを作り、それぞれの先頭だけを取る。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [508, 520]
function: unique_justseen
difficulty: 2
format: 2
tags: [イテレータ, アルゴリズム, 遅延評価]
---

## ひとことで

`unique_justseen(iterable, key=None)` は、**連続して並んだ同じ値を 1 つにまとめて** 出す関数です。
`unique_justseen('AAAABBBCCDAABBB')` は `A, B, C, D, A, B` を出します。離れた場所にある同じ値は、まとめられません。

## コード

::: code-group

```python:line-numbers=508 [日本語訳]
def unique_justseen(iterable, key=None):
    """連続する重複を無視して、要素を順番どおりに出す

    >>> list(unique_justseen('AAAABBBCCDAABBB'))
    ['A', 'B', 'C', 'D', 'A', 'B']
    >>> list(unique_justseen('ABBCcAD', str.lower))
    ['A', 'B', 'C', 'A', 'D']

    """
    if key is None:
        return map(itemgetter(0), groupby(iterable))

    return map(next, map(itemgetter(1), groupby(iterable, key)))
```

```python:line-numbers=508 [原文]
def unique_justseen(iterable, key=None):
    """Yields elements in order, ignoring serial duplicates

    >>> list(unique_justseen('AAAABBBCCDAABBB'))
    ['A', 'B', 'C', 'D', 'A', 'B']
    >>> list(unique_justseen('ABBCcAD', str.lower))
    ['A', 'B', 'C', 'A', 'D']

    """
    if key is None:
        return map(itemgetter(0), groupby(iterable))

    return map(next, map(itemgetter(1), groupby(iterable, key)))
```

:::

`groupby` と `itemgetter` は、どちらも `itertools` と `operator` の標準の関数です。

## 前提知識

- **`groupby(iterable)`**: 連続して並んだ同じ値を、1 つのグループにまとめます。`'AAB'` なら、`A` のグループと `B` のグループになります。
- **`itemgetter(0)`**: タプルの 0 番目を取り出す関数を作ります。`groupby` の結果は `(キー, グループ)` の組なので、キーを取り出すために使います。
- **`key`**: 比べる前に値を変換する関数です。`str.lower` を渡すと、大文字と小文字を同じとみなします。
- **`next`**: イテレータの次の要素を取り出します。

## 何をしているか

### 1. `key` がない場合

```python:line-numbers=517
    if key is None:
        return map(itemgetter(0), groupby(iterable))
```

`groupby(iterable)` は、同じ値のかたまりごとに `(値, グループ)` を出します。`itemgetter(0)` で値だけを取り出せば、連続する重複を 1 つにまとめた結果になります。

### 2. `key` がある場合

```python:line-numbers=520
    return map(next, map(itemgetter(1), groupby(iterable, key)))
```

`groupby(iterable, key)` は、`key` で変換した値でかたまりを作ります。`itemgetter(1)` でグループを取り出し、`next` でそのグループの最初の要素を取ります。

## ここがすごい

### 「直前と同じか」だけを見る

重複を取り除く関数は、普通は `set` を使って全体を覚えます。この関数は、直前の値と同じかどうかだけを見るので、覚える量が 1 つ分で済みます。ただし、離れた重複は取り除けません。

### 元の値を出す

`key` を使っても、出てくるのは元の要素です。`'ABBCcAD'` を `str.lower` で比べると、`C` と `c` は同じとみなされます。最初に出た `C` が残り、`A, B, C, A, D` になります。

### groupby を再利用する

`groupby` は、自分で「直前と違うか」を判定する処理を書かずに済む部品です。1 行の関数に、かたまりを作る仕事を任せています。

## まとめ

- 連続する重複だけを取るなら、直前の値との比較で足りる。
- `groupby` は連続するかたまりを作るので、重複の除去に使える。
- `key` を使うと、比べ方を変えても元の値が出力される。
