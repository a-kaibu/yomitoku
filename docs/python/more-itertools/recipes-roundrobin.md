---
title: cycle と islice を入れ子にして、尽きた入力を自然に脱落させる
description: more_itertools.roundrobin は、複数のデータから 1 つずつ順番に取り出す。尽きた入力を取り除くために、cycle を「1 つ減らして作り直す」という巧妙な方法を使っている。
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
tags: [イテレータ, ハック, 遅延評価]
---
## ひとことで

`roundrobin(*iterables)` は、複数のデータから **順番に 1 つずつ** 取り出す関数です。トランプを配るように、1 周ごとに各入力から 1 つずつ出します。
`roundrobin('ABC', 'D', 'EF')` は `A, D, E, B, F, C` になります。
途中で尽きた入力は飛ばされ、すべてが尽きたら終わります。4 行のコードの中に、イテレータの性質を突いた技が詰まっています。

## コード

```python:line-numbers=391
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

`cycle`、`islice` は `itertools` の関数です。402 行目のコメントにある通り、このアルゴリズムは George Sakkis 氏によるものです。

## 前提知識

- **`map(iter, iterables)`**: 各入力をイテレータに変換します。
- **`cycle(x)`**: `x` の要素を **無限に繰り返し** 出すイテレータです。最初の 1 周で出した値を覚えておき、2 周目以降はそれを使います。
- **`islice(x, k)`**: `x` の先頭から k 個だけを取り出すイテレータです。
- **`map(next, iterators)`**: `iterators` から 1 つずつイテレータを取り出し、それぞれに `next()` を呼んだ結果を出します。どれかの `next()` が `StopIteration` を出すと、`map` 自体がそこで終わります。
- **`yield from`**: 別のイテレータが出す値を、すべて自分の値として出します。
- **`range(n, 0, -1)`**: n, n-1, ..., 1 と逆向きに数えます。

## 何をしているか

入力 `'ABC'`, `'D'`, `'EF'` のイテレータを `I1`, `I2`, `I3` とします。

### 1. 3 本とも生きている段階（`num_active = 3`）

`cycle(islice(iterators, 3))` で、`I1, I2, I3, I1, I2, I3, ...` と回り続けるイテレータを作ります。`map(next, ...)` で順に `next()` を呼ぶと、

`A`（I1）、`D`（I2）、`E`（I3）、`B`（I1）、ここで I2 の `next()` が `StopIteration` を出す

ので、`map` が終わります。ここで大事なのは、**cycle の現在位置が「I2 の次」で止まっている** ことです。

### 2. 2 本の段階（`num_active = 2`）

`islice(iterators, 2)` は、止まっていた cycle の続きから 2 つ、つまり `I3, I1` を取り出します。**尽きた I2 は自然に外れています。** これを新しい cycle にして、

`F`（I3）、`C`（I1）、ここで I3 が尽きて終わり

### 3. 1 本の段階（`num_active = 1`）

cycle の続きから 1 つ、`I1` を取り出します。`next(I1)` は即座に尽きるので終わりです。

結果は `A, D, E, B, F, C` です。

## ここがすごい

### 尽きたものの「直後」から作り直す

`map(next, ...)` が止まるのは、ちょうど尽きたイテレータに `next()` を呼んだときです。そのとき cycle は、尽きたイテレータの **次** を指しています。そこから「残りの本数ぶん」を `islice` で切り出すと、尽きたものだけがきれいに抜け、しかも **順番も崩れません**。尽きたイテレータを探して削除する処理は 1 行もありません。

### 素直な書き方との比較

素直に書くと、

```python
iters = [iter(x) for x in iterables]
while iters:
    for it in list(iters):
        try:
            yield next(it)
        except StopIteration:
            iters.remove(it)
```

のように、リストのコピーや削除、例外処理が必要です。Sakkis 氏の方法は、これらをすべて `cycle` と `islice` の性質に任せています。

### すべてが遅延評価

どの部品もイテレータなので、入力が巨大でも、無限に続くものが混ざっていても、必要な分だけ取り出されます。

## まとめ

- `cycle` は回り続け、止まった位置を覚えている。その性質を使うと、「続きから作り直す」ことができる。
- `map(next, ...)` は、最初に尽きたイテレータのところで止まる。
- 削除や例外処理を書かずに、部品の性質だけで複雑な振る舞いを作れることがある。
