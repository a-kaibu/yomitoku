---
title: 並べ替えから、辞書順で何番目かを逆算する
description: more_itertools.permutation_index は、与えられた並べ替えが、辞書順で何番目かを返す。nth_permutation の逆の操作である。候補から要素を 1 つずつ探して位置を取り、位置を階乗の進数のように積み上げて番号を作る。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [4571, 4592]
function: permutation_index
difficulty: 3
format: 2
tags: [アルゴリズム, 数値計算]
---

## ひとことで

`permutation_index(element, iterable)` は、**並べ替え `element` が、辞書順で何番目にあるか** を返す関数です。
`permutation_index([1, 3, 2], range(5))` は `19` を返します。`nth_permutation` で番号から並べ替えを作る操作を、逆向きに行います。

## コード

::: code-group

```python:line-numbers=4571 [日本語訳]
def permutation_index(element, iterable):
    """``list(permutations(iterable, r)).index(element)`` と同じ結果になる。

    *iterable* の長さ *r* の部分列のうち、順番が大事なものは、
    辞書順に並べられる。:func:`permutation_index` は、
    最初に現れる *element* の番号を、
    それより前の並べ替えを計算せずに直接求める。

        >>> permutation_index([1, 3, 2], range(5))
        19

    与えられた *element* が、
    *iterable* の並べ替えの 1 つでなければ ``ValueError`` を出す。
    """
    index = 0
    pool = list(iterable)
    for i, x in zip(range(len(pool), -1, -1), element):
        r = pool.index(x)
        index = index * i + r
        del pool[r]

    return index
```

```python:line-numbers=4571 [原文]
def permutation_index(element, iterable):
    """Equivalent to ``list(permutations(iterable, r)).index(element)```

    The subsequences of *iterable* that are of length *r* where order is
    important can be ordered lexicographically. :func:`permutation_index`
    computes the index of the first *element* directly, without computing
    the previous permutations.

        >>> permutation_index([1, 3, 2], range(5))
        19

    ``ValueError`` will be raised if the given *element* isn't one of the
    permutations of *iterable*.
    """
    index = 0
    pool = list(iterable)
    for i, x in zip(range(len(pool), -1, -1), element):
        r = pool.index(x)
        index = index * i + r
        del pool[r]

    return index
```

:::

## 前提知識

- **辞書順**: 先頭から順に比べて並べる順番です。
- **`nth_permutation`**: 番号から、辞書順で同じ位置の並べ替えを作る関数です。この関数はその逆です。
- **`list.index`**: 要素が最初に現れる位置を返すメソッドです。
- **`del`**: リストから、指定した位置の要素を取り除く文です。

## 何をしているか

### 1. 初期値を用意する

```python:line-numbers=4585
    index = 0
    pool = list(iterable)
```

`index` は、ここまでの番号を積み上げる変数です。`pool` は、まだ使っていない候補の一覧です。最初は、すべての要素が候補になります。

### 2. 各位置で、候補の中の位置を求める

```python:line-numbers=4587
    for i, x in zip(range(len(pool), -1, -1), element):
        r = pool.index(x)
```

`zip` で、残りの候補の数を並べた値と、並べ替えの要素を組にして順に読みます。`pool.index(x)` で、今の要素が候補の何番目にあるかを求めます。

### 3. 位置を積み上げて、候補から外す

```python:line-numbers=4589
        index = index * i + r
        del pool[r]
```

`index * i + r` で、今の位置を次の桁として積み上げます。使った要素は `del` で候補から外し、次の位置の数を正しく数えられるようにします。

### 4. 番号を返す

```python:line-numbers=4592
    return index
```

すべての要素を読み終えると、`index` が辞書順の番号になります。

## ここがすごい

### `nth_permutation` の逆になっている

`nth_permutation` は、番号を桁に分けて要素を選びます。この関数は、要素の選ばれた位置を桁として積み上げて、番号に戻します。2 つを並べると、往復の関係がはっきりします。

### 全部の並べ替えを作らない

並べ替えを全部作って、その中から探すのではありません。各要素の位置だけを順に求めるので、並べ替えの全体を作る必要はありません。ただし、一覧の検索と削除が毎回かかるので、要素が多いと遅くなります。

### 見つからない要素は例外で止める

`pool.index` は、候補にない要素で `ValueError` を出します。与えられた並べ替えが正しくないと、すぐに分かります。

## まとめ

- 各位置で候補の中の位置を求め、階乗の進数のように積み上げると、辞書順の番号になる。
- `nth_permutation` と組み合わせると、番号と並べ替えを行き来できる。
- 候補にない要素は例外で知らせるので、誤った番号を返さない。
