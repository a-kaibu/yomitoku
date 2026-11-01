---
title: 同じ列を n 本に複製して、1 つずつずらしながら組にする
description: toolz.sliding_window は、重なり合う長さ n の部分列を順に作る。tee で同じ列を n 本に複製し、i 番目の列を i 個だけ先に進めてから zip する。空の deque を使って、先に進めるだけの操作をしている。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [662, 676]
function: sliding_window
difficulty: 3
format: 2
tags: [イテレータ, アルゴリズム, 遅延評価]
---

## ひとことで

`sliding_window(n, seq)` は、**長さ `n` の窓を 1 つずつずらしながら、部分列を順に作る** 関数です。
`list(sliding_window(2, [1, 2, 3, 4]))` は `[(1, 2), (2, 3), (3, 4)]` になります。隣り合う組が、1 つずつ重なっています。

## コード

::: code-group

```python:line-numbers=662 [日本語訳]
def sliding_window(n, seq):
    """ 重なり合う部分列の列

    >>> list(sliding_window(2, [1, 2, 3, 4]))
    [(1, 2), (2, 3), (3, 4)]

    This function creates a sliding window suitable for transformations like
    sliding means / smoothing

    >>> mean = lambda seq: float(sum(seq)) / len(seq)
    >>> list(map(mean, sliding_window(2, [1, 2, 3, 4])))
    [1.5, 2.5, 3.5]
    """
    return zip(*(collections.deque(itertools.islice(it, i), 0) or it
               for i, it in enumerate(itertools.tee(seq, n))))
```

```python:line-numbers=662 [原文]
def sliding_window(n, seq):
    """ A sequence of overlapping subsequences

    >>> list(sliding_window(2, [1, 2, 3, 4]))
    [(1, 2), (2, 3), (3, 4)]

    This function creates a sliding window suitable for transformations like
    sliding means / smoothing

    >>> mean = lambda seq: float(sum(seq)) / len(seq)
    >>> list(map(mean, sliding_window(2, [1, 2, 3, 4])))
    [1.5, 2.5, 3.5]
    """
    return zip(*(collections.deque(itertools.islice(it, i), 0) or it
               for i, it in enumerate(itertools.tee(seq, n))))
```

:::

`tee` は、1 つのイテレータを複数の独立したイテレータに複製します。`islice` は、先頭から一部を取り出します。

## 前提知識

- **窓（window）**: 一定の長さで、列の上をずらしていく範囲です。
- **`tee(seq, n)`**: 同じ内容を読める `n` 個のイテレータを作ります。
- **`islice(it, i)`**: `it` から先頭の `i` 個を取り出すイテレータです。
- **`deque(it, 0)`**: 長さ 0 の箱に流し込むと、中身は捨てられ、読むだけが行われます。
- **`zip`**: 複数の列から 1 つずつ取って組にします。

## 何をしているか

### 1. 同じ列を `n` 本に複製する

```python:line-numbers=675
    return zip(*(collections.deque(itertools.islice(it, i), 0) or it
               for i, it in enumerate(itertools.tee(seq, n))))
```

`tee(seq, n)` で、同じ列を `n` 本作ります。`enumerate` で、それぞれに番号 `i`（0 から `n-1`）を付けます。

### 2. 番号の分だけ先に進める

```python:line-numbers=675
    return zip(*(collections.deque(itertools.islice(it, i), 0) or it
               for i, it in enumerate(itertools.tee(seq, n))))
```

`i` 番目のイテレータを、`islice(it, i)` で `i` 個だけ先に進めます。`deque(..., 0)` は、取り出した要素を捨てるためのものです。

### 3. 先に進めた列を `zip` でまとめる

```python:line-numbers=675
    return zip(*(collections.deque(itertools.islice(it, i), 0) or it
               for i, it in enumerate(itertools.tee(seq, n))))
```

0 番目はそのまま、1 番目は 1 つ先、2 番目は 2 つ先と、位置がずれた列ができます。これを `zip` で組にすると、窓の中身が 1 つずつ重なったタプルになります。

## ここがすごい

### 「ずらす」を列の位置で表す

窓の幅 `n` 本の列を、先頭からの距離だけずらして読むと、それぞれの位置の要素を組にできます。窓の情報を持つ変数を、別に管理する必要がありません。

### `deque(..., 0)` で、読むだけにする

`islice` で進めるだけでは、結果が得られません。`deque` に長さ 0 で流し込むと、要素を捨てながら読むので、先に進める操作がきれいに書けます。

### `or it` は、空の箱の真偽を使う

`deque` が空（長さ 0）なら偽になるので、`or it` で元のイテレータを返します。取り出した後の列を、そのまま `zip` に渡すための工夫です。

## まとめ

- 窓を作るには、同じ列を複製して、位置を少しずつずらして組にする。
- 読むだけの操作は、長さ 0 の箱に流し込むと簡潔に書ける。
- 組み合わせを工夫すると、窓の情報を別に持たずに済む。
