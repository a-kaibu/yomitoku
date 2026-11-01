---
title: 列を n 個ずつのタプルに区切る、同じイテレータを並べる技
description: toolz.partition は、列を長さ n のタプルに区切る。同じイテレータを n 回並べた引数で zip を呼ぶことで、n 個ずつ取り出している。余りは既定では捨て、pad を指定すると埋める。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [682, 704]
function: partition
difficulty: 2
format: 2
tags: [データ構造, イテレータ, イディオム]
---

## ひとことで

`partition(n, seq)` は、**列を長さ `n` のタプルに区切って並べる** 関数です。
`list(partition(2, [1, 2, 3, 4]))` は `[(1, 2), (3, 4)]` になります。最後に残った要素が `n` 個に足りないと、既定では捨てられます。

## コード

::: code-group

```python:line-numbers=682 [日本語訳]
def partition(n, seq, pad=no_pad):
    """ 列を、長さ n のタプルに区切る

    >>> list(partition(2, [1, 2, 3, 4]))
    [(1, 2), (3, 4)]

    If the length of ``seq`` is not evenly divisible by ``n``, the final tuple
    is dropped if ``pad`` is not specified, or filled to length ``n`` by pad:

    >>> list(partition(2, [1, 2, 3, 4, 5]))
    [(1, 2), (3, 4)]

    >>> list(partition(2, [1, 2, 3, 4, 5], pad=None))
    [(1, 2), (3, 4), (5, None)]

    See Also:
        partition_all
    """
    args = [iter(seq)] * n
    if pad is no_pad:
        return zip(*args)
    else:
        return zip_longest(*args, fillvalue=pad)
```

```python:line-numbers=682 [原文]
def partition(n, seq, pad=no_pad):
    """ Partition sequence into tuples of length n

    >>> list(partition(2, [1, 2, 3, 4]))
    [(1, 2), (3, 4)]

    If the length of ``seq`` is not evenly divisible by ``n``, the final tuple
    is dropped if ``pad`` is not specified, or filled to length ``n`` by pad:

    >>> list(partition(2, [1, 2, 3, 4, 5]))
    [(1, 2), (3, 4)]

    >>> list(partition(2, [1, 2, 3, 4, 5], pad=None))
    [(1, 2), (3, 4), (5, None)]

    See Also:
        partition_all
    """
    args = [iter(seq)] * n
    if pad is no_pad:
        return zip(*args)
    else:
        return zip_longest(*args, fillvalue=pad)
```

:::

`zip_longest` は、長さが違うものを組にするとき、足りない部分を埋める関数です。

## 前提知識

- **`zip(a, b)`**: 2 つの列から 1 つずつ取り出して組にします。どちらかが尽きると止まります。
- **`iter(seq)`**: 列から、1 回ずつ読めるイテレータを作ります。
- **`[x] * n`**: 同じものを `n` 個並べたリストを作ります。中身は同じ参照です。
- **`fillvalue`**: 足りない分を埋める値です。

## 何をしているか

### 1. 同じイテレータを `n` 個並べる

```python:line-numbers=700
    args = [iter(seq)] * n
```

`[iter(seq)] * n` は、同じイテレータを `n` 個並べたリストです。3 つのイテレータがあるように見えますが、実際は 1 つのイテレータを 3 回参照しているだけです。

### 2. `zip` で、順番に `n` 個ずつ取る

```python:line-numbers=701
    if pad is no_pad:
        return zip(*args)
```

`zip(*args)` は、同じイテレータから 1 つずつ取って組にします。`n` 回取るので、先頭から `n` 個ずつのタプルができます。余りが `n` 個に満たなければ、`zip` は止まり、余りは捨てられます。

### 3. 埋める場合

```python:line-numbers=703
    else:
        return zip_longest(*args, fillvalue=pad)
```

`pad` が指定されていれば、`zip_longest` で足りない分を `pad` で埋めます。

## ここがすごい

### 同じイテレータを使い回す仕掛け

`[iter(seq)] * n` は、1 つのイテレータを `n` 個の位置に入れておくだけです。`zip` が各位置から順番に取ると、読む位置は 1 つずつ進みます。この仕組みで、区切りのループを書かずに済みます。

### 余りの扱いを選べる

既定では、足りない最後の組を捨てます。きれいに割り切れない列を扱うときに、どちらにするかを `pad` で選べます。

### 短い書き方

区切るためのループや添字の管理がいりません。`zip` の 1 行に、区切りの仕組みが収まっています。

## まとめ

- 同じイテレータを `n` 回並べて `zip` すると、`n` 個ずつ区切れる。
- 余りを捨てるか埋めるかは、用途に合わせて決める。
- 区切る処理を、既存の部品の組み合わせで表せる。
