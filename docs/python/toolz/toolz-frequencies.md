---
title: 列の中で、値ごとの出現回数を辞書にまとめる
description: toolz.frequencies は、列の中の各値が何回出現するかを数えて、辞書で返す。collections.defaultdict(int) を使い、初めて出た値を 0 として扱わずに数えられるようにしている。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [536, 549]
function: frequencies
difficulty: 1
format: 2
tags: [データ構造, イディオム, 標準ライブラリ]
---

## ひとことで

`frequencies(seq)` は、**列の中で各値が何回出てきたか** を辞書にまとめる関数です。
`frequencies(['cat', 'cat', 'ox', 'pig', 'pig', 'cat'])` は、`cat` が 3 回、`ox` が 1 回、`pig` が 2 回の辞書を返します。

## コード

::: code-group

```python:line-numbers=536 [日本語訳]
def frequencies(seq):
    """ seq の中の、各値の出現回数を数える

    >>> frequencies(['cat', 'cat', 'ox', 'pig', 'pig', 'cat'])  #doctest: +SKIP
    {'cat': 3, 'ox': 1, 'pig': 2}

    See Also:
        countby
        groupby
    """
    d = collections.defaultdict(int)
    for item in seq:
        d[item] += 1
    return dict(d)
```

```python:line-numbers=536 [原文]
def frequencies(seq):
    """ Find number of occurrences of each value in seq

    >>> frequencies(['cat', 'cat', 'ox', 'pig', 'pig', 'cat'])  #doctest: +SKIP
    {'cat': 3, 'ox': 1, 'pig': 2}

    See Also:
        countby
        groupby
    """
    d = collections.defaultdict(int)
    for item in seq:
        d[item] += 1
    return dict(d)
```

:::

`defaultdict` は、存在しないキーを参照したときに、決まった初期値を自動で作る辞書です。

## 前提知識

- **辞書（dict）**: キーに対応する値を持つ入れ物です。ここでは、キーが値、値が回数です。
- **`defaultdict(int)`**: 存在しないキーを読むと、`int()` の `0` が初期値として入ります。
- **`d[item] += 1`**: 今の回数に 1 を足します。最初は `0 + 1` になります。
- **`dict(d)`**: `defaultdict` を、普通の辞書に変えて返します。

## 何をしているか

### 1. 空の集計表を作る

```python:line-numbers=546
    d = collections.defaultdict(int)
```

`defaultdict(int)` で、まだ何も入っていない集計表を作ります。

### 2. 1 つずつ数える

```python:line-numbers=547
    for item in seq:
        d[item] += 1
```

列の要素を順に見て、その値の回数を 1 増やします。初めて出た値は、自動で `0` から数え始められます。

### 3. 普通の辞書にして返す

```python:line-numbers=549
    return dict(d)
```

最後に `dict(d)` で普通の辞書に変えて返します。

## ここがすごい

### 初めての値を `if` で分けない

「初めてなら 1 を入れ、そうでなければ足す」と書く代わりに、`defaultdict(int)` の初期値に任せています。数える処理が 1 行になります。

### どんな値でも数えられる

辞書のキーにできる値（文字列、数、タプルなど）なら、何でも数えられます。型の制限を意識せずに使えます。

### 返すときに普通の辞書へ

`defaultdict` のまま返すと、存在しないキーを読んだときに、勝手にキーが増えてしまいます。普通の辞書に変えておくと、呼ぶ側は予想外の動きを避けられます。

## まとめ

- 出現回数は、`defaultdict(int)` に 1 を足し続けると数えられる。
- 初めての値を特別扱いしなくてよいので、コードが短くなる。
- 返す前に普通の辞書に変えると、呼ぶ側が安全に使える。
