---
title: リストを下から順に沈めて、O(n) でヒープを作る
description: heapq.heapify は、普通のリストをその場でヒープに変換する。葉の位置は調べる必要がないので、最後の親から先頭へ向かって _siftup を呼ぶだけで、全体が O(n) で済む。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/heapq.py
lines: [171, 180]
function: heapify
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 最適化]
---

## ひとことで

`heapify(x)` は、**普通のリスト `x` をその場でヒープに変換** する関数です。
`x = [5, 3, 8, 1]` に `heapify(x)` を実行すると、`x[0]` が最小の `1` になるように並べ替えられます。
新しいリストは作らず、元のリストを書き換えます。

## コード

::: code-group

```python:line-numbers=171 [日本語訳]
def heapify(x):
    """リストをその場でヒープに変換する。時間計算量は O(len(x))。"""
    n = len(x)
    # 下から順に変換する。調べる意味がある最大の添字は、
    # 子の添字が範囲内に入る最大の i なので、2*i + 1 < n、つまり
    # i < (n-1)/2 である。n が偶数 2*j なら (2*j-1)/2 = j-1/2 なので、
    # 最大は j-1、すなわち n//2 - 1 である。n が奇数 2*j+1 なら、これは
    # (2*j+1-1)/2 = j なので、最大は同じく n//2 - 1 である。
    for i in reversed(range(n//2)):
        _siftup(x, i)
```

```python:line-numbers=171 [原文]
def heapify(x):
    """Transform list into a heap, in-place, in O(len(x)) time."""
    n = len(x)
    # Transform bottom-up.  The largest index there's any point to looking at
    # is the largest with a child index in-range, so must have 2*i + 1 < n,
    # or i < (n-1)/2.  If n is even = 2*j, this is (2*j-1)/2 = j-1/2 so
    # j-1 is the largest, which is n//2 - 1.  If n is odd = 2*j+1, this is
    # (2*j+1-1)/2 = j so j-1 is the largest, and that's again n//2-1.
    for i in reversed(range(n//2)):
        _siftup(x, i)
```

:::

`_siftup` は、ある位置の値を、ヒープの性質を満たすまで下へ沈める関数です。

## 前提知識

- **ヒープの性質**: どの親の値も、その子の値以下である、という決まりです。先頭（`x[0]`）は必ず最小になります。
- **子の位置**: 添字 `i` の子は `2*i + 1` と `2*i + 2` です。子がない位置（葉）は、沈める必要がありません。
- **`_siftup(x, i)`**: 位置 `i` の値を、子と比べながら下へ移動させます。
- **`range(n//2)`**: `n//2` より小さい添字だけを並べます。ここには、子を持つ位置がすべて含まれます。

## 何をしているか

### 1. 長さを確かめる

```python:line-numbers=173
    n = len(x)
```

`n` は、後で範囲を決めるために使います。

### 2. 最後の親から先頭へ向かって沈める

```python:line-numbers=179
    for i in reversed(range(n//2)):
        _siftup(x, i)
```

`reversed(range(n//2))` で、子を持つ最後の位置から先頭へ向かって順に処理します。各位置で `_siftup` を呼び、下の段がすでにヒープになっている状態を作りながら上へ進みます。

### 3. なぜ `n//2` までか

```python:line-numbers=174
    # 下から順に変換する。調べる意味がある最大の添字は、
    # 子の添字が範囲内に入る最大の i なので、2*i + 1 < n、つまり
    # i < (n-1)/2 である。n が偶数 2*j なら (2*j-1)/2 = j-1/2 なので、
    # 最大は j-1、すなわち n//2 - 1 である。n が奇数 2*j+1 なら、これは
    # (2*j+1-1)/2 = j なので、最大は同じく n//2 - 1 である。
```

コメントが説明しているとおり、子を持つ最大の添字は `n//2 - 1` です。それより後ろの位置は葉なので、沈める必要がありません。

## ここがすごい

### 葉は何もしなくてよい

ヒープの半分は葉です。葉は、子がないので、沈める必要がありません。`range(n//2)` で、その半分を最初から除いています。

### 全体が O(n) で済む

要素を 1 つずつ `heappush` すると、1 回ごとに `log n` かかり、全体は `n log n` です。下から順に沈めると、深い位置ほど沈める距離が短いため、合計が `n` に比例する量で済みます。

### 順番を保つ必要がない

ヒープは、先頭が最小であることだけを保証します。`heapify` は、その条件を満たすために必要な移動だけを行い、他の並びは気にしません。

## まとめ

- 普通のリストは、後ろの親から先頭へ向かって沈めると、ヒープに変換できる。
- 葉を処理しなくてよいので、`n//2` までの添字だけを調べる。
- 1 つずつ追加するより、まとめて作るほうが速い。
