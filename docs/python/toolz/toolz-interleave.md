---
title: 複数の列を 1 つずつ交互に取り、尽きた列は外して続ける
description: toolz.interleave は、列の列の各要素を順番に 1 つずつ取り出して交互に混ぜる。尽きた列は、takewhile と cycle を使って循環から外す。無限の列でも扱える遅延評価の関数。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [218, 239]
function: interleave
difficulty: 3
format: 2
tags: [イテレータ, アルゴリズム, 遅延評価]
---

## ひとことで

`interleave(seqs)` は、**複数の列から 1 つずつ交互に要素を取り出して、1 本の列にする** 関数です。
`''.join(interleave(('ABC', 'XY')))` は `'AXBYC'` になります。`XY` が尽きると、残りの `C` だけが続きます。

## コード

::: code-group

```python:line-numbers=218 [日本語訳]
def interleave(seqs):
    """ 列の列を、各列から 1 つずつ交互に取り出して混ぜる

    >>> list(interleave([[1, 2], [3, 4]]))
    [1, 3, 2, 4]

    >>> ''.join(interleave(('ABC', 'XY')))
    'AXBYC'

    Both the individual sequences and the sequence of sequences may be infinite

    Returns a lazy iterator
    """
    iters = itertools.cycle(map(iter, seqs))
    while True:
        try:
            for itr in iters:
                yield next(itr)
            return
        except StopIteration:
            predicate = partial(operator.is_not, itr)
            iters = itertools.cycle(itertools.takewhile(predicate, iters))
```

```python:line-numbers=218 [原文]
def interleave(seqs):
    """ Interleave a sequence of sequences

    >>> list(interleave([[1, 2], [3, 4]]))
    [1, 3, 2, 4]

    >>> ''.join(interleave(('ABC', 'XY')))
    'AXBYC'

    Both the individual sequences and the sequence of sequences may be infinite

    Returns a lazy iterator
    """
    iters = itertools.cycle(map(iter, seqs))
    while True:
        try:
            for itr in iters:
                yield next(itr)
            return
        except StopIteration:
            predicate = partial(operator.is_not, itr)
            iters = itertools.cycle(itertools.takewhile(predicate, iters))
```

:::

`cycle` は、与えられた列を無限に繰り返すイテレータです。`takewhile` は、条件が真の間だけ要素を取り出す関数です。

## 前提知識

- **`cycle(xs)`**: `xs` の要素を、最初から順に無限に出します。
- **`next(it)`**: イテレータから次の要素を取り出します。尽きていると `StopIteration` を出します。
- **`takewhile(pred, it)`**: 条件が真の間だけ要素を出し、偽になったら止まります。
- **`operator.is_not`**: 2 つが同じオブジェクトでないかを調べる関数です。

## 何をしているか

### 1. 各列をイテレータにして、循環させる

```python:line-numbers=231
    iters = itertools.cycle(map(iter, seqs))
```

`map(iter, seqs)` で、それぞれの列をイテレータにし、`cycle` で順番に回るようにします。

### 2. 1 つずつ交互に取り出す

```python:line-numbers=232
    while True:
        try:
            for itr in iters:
                yield next(itr)
```

循環の中のイテレータから、順に 1 つずつ取り出して `yield` します。どれかが尽きて `StopIteration` が出るまで続けます。

### 3. 尽きた列を外して、循環を作り直す

```python:line-numbers=236
            return
        except StopIteration:
            predicate = partial(operator.is_not, itr)
            iters = itertools.cycle(itertools.takewhile(predicate, iters))
```

すべてを回り終えたら終わりです。途中で尽きたイテレータに出会ったら、そのイテレータが再び現れるまでの、残りのイテレータだけを取り出して、新しい循環を作ります。尽きたものは、その中に入りません。

## ここがすごい

### 循環で「順番に回る」を表す

どの列が次に使われるかを、`cycle` が自動で決めます。カウンタや添字を管理する変数は要りません。

### 尽きたものを `takewhile` で除く

尽きたイテレータを探して削除するのは面倒です。`takewhile(is_not(尽きた列), 循環)` は、尽きた列の手前まで（循環の中で同じ列が再び来るまで）の残りを取り出すので、その列だけが外れます。

### 無限の列も扱える

それぞれの列が無限でも、取り出した分だけが作られます。遅延評価なので、大きな列を事前に作る必要がありません。

## まとめ

- 複数の列を交互に混ぜるには、`cycle` で順番を作ると簡単。
- 尽きた列は、循環から `takewhile` で外してから作り直す。
- 遅延評価のイテレータなので、無限の列とも組み合わせられる。
