---
title: 隣り合う組の違いが 1 つの要素だけになるように、直積を並べる
description: more_itertools.gray_product は、itertools.product と同じ組を、隣り合う組で 1 つの要素だけが変わる順番で出す。Knuth のアルゴリズム H を使い、各イテラブルの位置をフォーカスポインタで管理する。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [5011, 5054]
function: gray_product
difficulty: 3
format: 2
tags: [イテレータ, アルゴリズム, 最適化]
---

## ひとことで

`gray_product(*iterables)` は、`itertools.product` と同じ組み合わせを、**隣り合う組の違いが 1 つの要素だけになる順番** で出す関数です。
`gray_product('AB', 'CD')` は `('A', 'C'), ('B', 'C'), ('B', 'D'), ('A', 'D')` を出します。隣の組では、必ず片方だけが変わります。

## コード

::: code-group

```python:line-numbers=5011 [日本語訳]
def gray_product(*iterables, repeat=1):
    """itertools.product と似ているが、次の組との違いが 1 つの要素だけになる順番で組を返す。
    that only one element in the generated tuple changes from one iteration
    to the next.

        >>> list(gray_product('AB','CD'))
        [('A', 'C'), ('B', 'C'), ('B', 'D'), ('A', 'D')]

    The *repeat* keyword argument specifies the number of repetitions
    of the iterables.  For example, ``gray_product('AB', repeat=3)`` is
    equivalent to ``gray_product('AB', 'AB', 'AB')``.

    This function consumes all of the input iterables before producing output.
    If any of the input iterables have fewer than two items, ``ValueError``
    is raised.

    For information on the algorithm, see
    `this section <https://www-cs-faculty.stanford.edu/~knuth/fasc2a.ps.gz>`__
    of Donald Knuth's *The Art of Computer Programming*.
    """
    all_iterables = tuple(map(tuple, iterables)) * repeat
    iterable_count = len(all_iterables)
    for iterable in all_iterables:
        if len(iterable) < 2:
            raise ValueError("each iterable must have two or more items")

    # Knuth の「アルゴリズム H」（7.2.1.1 節、20 ページ）に基づく。
    # a は、次に出す n 個組の、各イテラブルの添字を保持する
    # f は「フォーカスポインタ」の配列
    # o は「向き」の配列
    a = [0] * iterable_count
    f = list(range(iterable_count + 1))
    o = [1] * iterable_count
    while True:
        yield tuple(all_iterables[i][a[i]] for i in range(iterable_count))
        j = f[0]
        f[0] = 0
        if j == iterable_count:
            break
        a[j] = a[j] + o[j]
        if a[j] == 0 or a[j] == len(all_iterables[j]) - 1:
            o[j] = -o[j]
            f[j] = f[j + 1]
            f[j + 1] = j + 1
```

```python:line-numbers=5011 [原文]
def gray_product(*iterables, repeat=1):
    """Like :func:`itertools.product`, but return tuples in an order such
    that only one element in the generated tuple changes from one iteration
    to the next.

        >>> list(gray_product('AB','CD'))
        [('A', 'C'), ('B', 'C'), ('B', 'D'), ('A', 'D')]

    The *repeat* keyword argument specifies the number of repetitions
    of the iterables.  For example, ``gray_product('AB', repeat=3)`` is
    equivalent to ``gray_product('AB', 'AB', 'AB')``.

    This function consumes all of the input iterables before producing output.
    If any of the input iterables have fewer than two items, ``ValueError``
    is raised.

    For information on the algorithm, see
    `this section <https://www-cs-faculty.stanford.edu/~knuth/fasc2a.ps.gz>`__
    of Donald Knuth's *The Art of Computer Programming*.
    """
    all_iterables = tuple(map(tuple, iterables)) * repeat
    iterable_count = len(all_iterables)
    for iterable in all_iterables:
        if len(iterable) < 2:
            raise ValueError("each iterable must have two or more items")

    # This is based on "Algorithm H" from section 7.2.1.1, page 20.
    # a holds the indexes of the source iterables for the n-tuple to be yielded
    # f is the array of "focus pointers"
    # o is the array of "directions"
    a = [0] * iterable_count
    f = list(range(iterable_count + 1))
    o = [1] * iterable_count
    while True:
        yield tuple(all_iterables[i][a[i]] for i in range(iterable_count))
        j = f[0]
        f[0] = 0
        if j == iterable_count:
            break
        a[j] = a[j] + o[j]
        if a[j] == 0 or a[j] == len(all_iterables[j]) - 1:
            o[j] = -o[j]
            f[j] = f[j + 1]
            f[j + 1] = j + 1
```

:::

## 前提知識

- **直積（product）**: 複数の列から 1 つずつ取る、すべての組み合わせです。`'AB'` と `'CD'` の直積は 4 組あります。
- **グレイコード**: 隣り合う値の違いが 1 ビットだけになる、2 進数の並べ方です。機械的な信号の誤りを減らす目的などで使われます。この関数は、その考え方を組み合わせに広げたものです。
- **添字（a）**: 各イテラブルの中で、今どの要素を使っているかを表す番号です。
- **向き（o）**: 添字を増やすか減らすかを表す値（1 か -1）です。

## 何をしているか

### 1. 入力を準備し、短すぎるものを除く

```python:line-numbers=5031
    all_iterables = tuple(map(tuple, iterables)) * repeat
    iterable_count = len(all_iterables)
    for iterable in all_iterables:
        if len(iterable) < 2:
            raise ValueError("each iterable must have two or more items")
```

すべての入力をタプルにし、`repeat` の回数だけ並べます。どれかが 2 個未満なら、順番を作れないので `ValueError` にします。

### 2. 添字・フォーカスポインタ・向きを用意する

```python:line-numbers=5041
    a = [0] * iterable_count
    f = list(range(iterable_count + 1))
    o = [1] * iterable_count
```

`a` は今の添字、`f` は次に動かすべき列を指すポインタ、`o` は各列の動く向きです。最初はすべて先頭から、増える向きで始めます。

### 3. 今の組を出して、次の組へ進める

```python:line-numbers=5044
    while True:
        yield tuple(all_iterables[i][a[i]] for i in range(iterable_count))
        j = f[0]
        f[0] = 0
        if j == iterable_count:
            break
        a[j] = a[j] + o[j]
```

今の添字で組を作って `yield` します。次に、`f[0]` が指す列を 1 つ動かします。`j` が列の数に等しくなったら、すべて終わりです。

### 4. 端に着いたら、向きを変えて次の列へ渡す

```python:line-numbers=5051
        if a[j] == 0 or a[j] == len(all_iterables[j]) - 1:
            o[j] = -o[j]
            f[j] = f[j + 1]
            f[j + 1] = j + 1
```

動かした列が端に着いたら、向きを反対にし、フォーカスポインタを 1 つ右の列へ移します。端に着いていなければ、ポインタは変わりません。

## ここがすごい

### 変わる要素は 1 つだけ

各ステップで動かすのは 1 つの列だけです。そのため、隣の組との違いが 1 つの要素だけになります。組み合わせの全体を、この動きの繰り返しで作ります。

### 全部をメモリに持つ

コメントにあるとおり、この関数は出力の前に、すべての入力を読みます。また、どれかの入力が 2 個未満だと順番が作れないので、事前に確かめます。

### 「フォーカスポインタ」で次を選ぶ

どの列を動かすかは、`f` の配列で決めます。動かした結果によって、ポインタの指す先が変わるので、毎回すべての列を調べる必要がありません。Knuth の「アルゴリズム H」は、この管理を巧妙に行う方法です。

## まとめ

- 隣り合う組の違いを 1 つにするには、動かす列を 1 つずつ決める。
- 端に着いた列は向きを変え、次の列へ動かす役目を渡す。
- 組み合わせの順番は、アルゴリズムを知ると、なぜその順になるかが分かる。
