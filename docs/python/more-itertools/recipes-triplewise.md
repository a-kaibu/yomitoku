---
title: 列の中から、重なり合う 3 つ組を順に取り出す
description: more_itertools.triplewise は、列から重なり合う 3 つ組を順に返す。tee で列を 3 本に分け、読む位置を 1 つずつずらしてから zip でまとめる。ずらす処理が、3 つ組の始まりを揃える鍵になっている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [771, 784]
function: triplewise
difficulty: 3
format: 2
tags: [イテレータ, アルゴリズム, 遅延評価]
---

## ひとことで

`triplewise(iterable)` は、**列から、隣り合う 3 つの値の組を、1 つずつずらしながら順に返す** 関数です。
`triplewise('ABCDE')` は `('A', 'B', 'C')`、`('B', 'C', 'D')`、`('C', 'D', 'E')` の順に値を出します。

## コード

::: code-group

```python:line-numbers=771 [日本語訳]
def triplewise(iterable):
    """*iterable* から、重なり合う 3 つ組を返す。

    >>> list(triplewise('ABCDE'))
    [('A', 'B', 'C'), ('B', 'C', 'D'), ('C', 'D', 'E')]

    """
    # これは itertools のドキュメントのレシピから外れている。詳しくは
    # https://github.com/more-itertools/more-itertools/issues/889
    t1, t2, t3 = tee(iterable, 3)
    next(t3, None)
    next(t3, None)
    next(t2, None)
    return zip(t1, t2, t3)
```

```python:line-numbers=771 [原文]
def triplewise(iterable):
    """Return overlapping triplets from *iterable*.

    >>> list(triplewise('ABCDE'))
    [('A', 'B', 'C'), ('B', 'C', 'D'), ('C', 'D', 'E')]

    """
    # This deviates from the itertools documentation recipe - see
    # https://github.com/more-itertools/more-itertools/issues/889
    t1, t2, t3 = tee(iterable, 3)
    next(t3, None)
    next(t3, None)
    next(t2, None)
    return zip(t1, t2, t3)
```

:::

## 前提知識

- **重なり合う組（sliding window）**: 同じ列を、1 つずつずらしながら区切る取り方です。`A, B, C` の次は `B, C, D` になります。
- **`tee`**: 1 つのイテレータを、同じ値を読める複数のイテレータに分ける関数です。
- **`zip`**: 複数の列を、同じ位置どうしでまとめる関数です。
- **`next(t, None)`**: イテレータを 1 つ先に進める書き方です。値は捨てられます。

## 何をしているか

### 1. 元の列を 3 本に分ける

```python:line-numbers=780
    t1, t2, t3 = tee(iterable, 3)
```

`tee(iterable, 3)` で、同じ値を読める 3 本のイテレータを作ります。作った直後は、3 本とも同じ先頭から読めます。

### 2. 読む位置を 1 つずつずらす

```python:line-numbers=781
    next(t3, None)
    next(t3, None)
    next(t2, None)
```

`t3` を 2 つ先に進め、`t2` を 1 つ先に進めます。こうすると、`t1` が指す値が先頭、`t2` が 2 番目、`t3` が 3 番目になります。

### 3. 位置のそろった値をまとめる

```python:line-numbers=784
    return zip(t1, t2, t3)
```

`zip` で、3 本から同じ回で取れる値を組にします。これで、重なり合う 3 つ組が順に出ます。

## ここがすごい

### 列を 1 回だけ読む

`tee` で 3 本に分けるので、元の列を 3 回作り直さずに済みます。読み進めるたびに、3 本の位置が同じように進みます。

### ずらし方が位置を決める

`t3` を 2 つ、`t2` を 1 つずらすだけで、3 本の先頭が揃います。ずらす量を数えるだけで、位置関係を説明できる作りです。

### 別の書き方と違うと注意書きがある

コメントにあるように、この実装は itertools のドキュメントの書き方から変えられています。ドキュメントの版によって違いがあるので、移植するときはこの点を確かめるとよいです。

## まとめ

- `tee` で列を 3 本に分け、位置をずらして `zip` すると、重なった 3 つ組が作れる。
- 位置のずらし方が、組の先頭をそろえる仕組みになっている。
- 元のドキュメントのレシピと違う点があるので、必要なら確かめる。
