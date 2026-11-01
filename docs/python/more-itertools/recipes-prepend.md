---
title: 列の先頭に、1 つの値を付け足して返す
description: more_itertools.prepend は、1 つの値を列の先頭に付けたイテレータを返す。標準の itertools.chain に、1 要素のリストと元の列をつなげて作るので、元の列は読まれるまで変わらない。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [693, 705]
function: prepend
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, 可読性]
---

## ひとことで

`prepend(value, iterable)` は、**1 つの値を列の先頭に付けた列** を返す関数です。
`prepend('0', ['1', '2', '3'])` は、`'0'`、`'1'`、`'2'`、`'3'` の順に値を出します。

## コード

::: code-group

```python:line-numbers=693 [日本語訳]
def prepend(value, iterable):
    """*value* を先に出し、そのあとに *iterable* の要素を出す。

        >>> value = '0'
        >>> iterable = ['1', '2', '3']
        >>> list(prepend(value, iterable))
        ['0', '1', '2', '3']

    複数の値を先頭に付けたいときは、:func:`itertools.chain`
    または :func:`value_chain` を参照。

    """
    return chain([value], iterable)
```

```python:line-numbers=693 [原文]
def prepend(value, iterable):
    """Yield *value*, followed by the elements in *iterable*.

        >>> value = '0'
        >>> iterable = ['1', '2', '3']
        >>> list(prepend(value, iterable))
        ['0', '1', '2', '3']

    To prepend multiple values, see :func:`itertools.chain`
    or :func:`value_chain`.

    """
    return chain([value], iterable)
```

:::

## 前提知識

- **イテラブル（iterable）**: `for` 文で順に値を取り出せるものです。リスト、文字列、ジェネレータなどがあたります。
- **`itertools.chain`**: 複数の列を順につなげる標準ライブラリの関数です。
- **遅延評価**: 値が必要になるまで、計算や読み込みを後回しにすることです。

## 何をしているか

### 1. 1 要素のリストと元の列をつなぐ

```python:line-numbers=705
    return chain([value], iterable)
```

`[value]` は、値 1 つだけのリストです。`chain` は、これを先頭に、元の `iterable` を後ろにつないで、1 本の列にします。

## ここがすごい

### 新しい列を作る手間がない

先頭に値を足すために、リストを作り直したり、要素をずらしたりしていません。`chain` が、2 つの列を順に読むだけです。

### 元の列を変えない

`iterable` を書き換えないので、もとの列を別の場所でも使えます。値を足したあとで、元の列をそのまま読むこともできます。

### 複数の値には別の道具を使う

値が 1 つなら `prepend` が読みやすく、複数の値を付けるなら `chain` や `value_chain` が向いています。関数の名前を見れば、どの場面に使うかが分かります。

## まとめ

- 1 つの値を先頭に付けるには、1 要素のリストと元の列を `chain` でつなぐ。
- 元の列は書き換えないので、安全に使い回せる。
- 値の数に応じて、読みやすい道具を選ぶと良い。
