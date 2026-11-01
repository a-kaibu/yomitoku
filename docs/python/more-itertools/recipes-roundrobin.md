---
title: 複数の列を、順番に 1 つずつ交互に取り出す
description: more_itertools.roundrobin は、いくつかの列から 1 つずつ順に値を取り出して並べる。空になった列は外しながら、残りの列を循環させる。cycle と islice を組み合わせて、列の数が減っていく処理を短く書いている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [391, 406]
function: roundrobin
difficulty: 3
format: 2
tags: [イテレータ, アルゴリズム, 遅延評価]
---

## ひとことで

`roundrobin(*iterables)` は、**複数の列から 1 つずつ順番に値を取り出して並べる** 関数です。
`roundrobin('ABC', 'D', 'EF')` は `A`、`D`、`E`、`B`、`F`、`C` の順に値を出します。ある列が先に終わっても、残りの列だけで続けます。

## コード

::: code-group

```python:line-numbers=391 [日本語訳]
def roundrobin(*iterables):
    """入力の列を順番に回り、どの列も尽きるまで値を取り出す。

        >>> list(roundrobin('ABC', 'D', 'EF'))
        ['A', 'D', 'E', 'B', 'F', 'C']

    この関数は :func:`interleave_longest` と同じ結果を返すが、
    入力によっては速く動くことがある（特に、列の数が
    少ないとき）。

    """
    # このアルゴリズムは George Sakkis による
    iterators = map(iter, iterables)
    for num_active in range(len(iterables), 0, -1):
        iterators = cycle(islice(iterators, num_active))
        yield from map(next, iterators)
```

```python:line-numbers=391 [原文]
def roundrobin(*iterables):
    """Visit input iterables in a cycle until each is exhausted.

        >>> list(roundrobin('ABC', 'D', 'EF'))
        ['A', 'D', 'E', 'B', 'F', 'C']

    This function produces the same output as :func:`interleave_longest`, but
    may perform better for some inputs (in particular when the number of
    iterables is small).

    """
    # Algorithm credited to George Sakkis
    iterators = map(iter, iterables)
    for num_active in range(len(iterables), 0, -1):
        iterators = cycle(islice(iterators, num_active))
        yield from map(next, iterators)
```

:::

## 前提知識

- **ラウンドロビン**: 順番に持ち回って、1 回ずつ仕事を割り当てる方法です。
- **`cycle`**: 渡された列を、終わりなく繰り返すイテレータを作る関数です。
- **`islice`**: 列の先頭から一部だけを切り出すイテレータです。
- **`map(next, ...)`**: 複数のイテレータから、順に次の値を取り出す書き方です。

## 何をしているか

### 1. 全部のイテレータを用意する

```python:line-numbers=403
    iterators = map(iter, iterables)
```

各入力を `iter` で、値を順に読むイテレータに変えます。元の入力は、ここで読み始められます。

### 2. 残りの数だけを循環させる

```python:line-numbers=404
    for num_active in range(len(iterables), 0, -1):
        iterators = cycle(islice(iterators, num_active))
```

最初は全部の列を使います。`num_active` は、まだ残っている列の数です。`islice` で、その数だけ先頭から取り出し、`cycle` で循環させます。

### 3. 1 つずつ次の値を出す

```python:line-numbers=406
        yield from map(next, iterators)
```

循環させたイテレータから、`next` で順に値を取り出して出します。ある列が尽きたら、次の周回では、その列を外した数だけで続けます。

## ここがすごい

### 列の数が減っても続く

`num_active` を 1 つずつ減らしながら、残りの列だけを回します。短い列が先に終わっても、ループの形を変えずに処理できます。

### 短く書けている

ループの中に、「この列は終わったか」の判定を書いていません。`range` で数を減らす仕組みと、`cycle` の組み合わせで、判定を省いています。

### 大きな入力でも全部をコピーしない

入力を全部リストにせず、イテレータのまま読みます。長い列を交互に並べるときも、メモリを多く使いません。

## まとめ

- 列を循環させ、尽きた列を外すと、交互に並べる処理が短く書ける。
- 残りの列の数を減らす書き方で、列の長さが違っても扱える。
- イテレータのまま読むので、大きな入力にも向いている。
