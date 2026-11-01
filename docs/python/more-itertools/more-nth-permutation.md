---
title: 全部並べずに、n 番目の並べ替えを階乗の桁で直接作る
description: more_itertools.nth_permutation は、列から長さ r の並べ替えのうち、辞書順で index 番目のものを直接作る。全部を並べずに、index を階乗の進数（ファクトリアル進数）の桁に分けて、要素を 1 つずつ選ぶ。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [4340, 4373]
function: nth_permutation
difficulty: 3
format: 2
tags: [アルゴリズム, 数値計算]
---

## ひとことで

`nth_permutation(iterable, r, index)` は、**列から長さ `r` の並べ替えを、辞書順で `index` 番目のものだけ直接作る** 関数です。
`nth_permutation('ghijk', 2, 5)` は `('h', 'i')` を返します。全部の並べ替えを作らずに、答えを 1 つだけ取り出せます。

## コード

::: code-group

```python:line-numbers=4340 [日本語訳]
def nth_permutation(iterable, r, index):
    """``list(permutations(iterable, r))[index]`` と同じ結果になる。

    *iterable* の長さ *r* の部分列のうち、順番が大事なものは、
    辞書順に並べられる。:func:`nth_permutation` は、
    並び順で *index* 番目の部分列を、
    前の部分列を計算せずに直接求める。

        >>> nth_permutation('ghijk', 2, 5)
        ('h', 'i')

    *r* が負なら ``ValueError`` を出す。
    *index* が範囲外なら ``IndexError`` を出す。
    """
    pool = list(iterable)
    n = len(pool)
    if r is None:
        r = n
    c = perm(n, r)

    if index < 0:
        index += c
    if not 0 <= index < c:
        raise IndexError

    result = [0] * r
    q = index
    for d in range(n - r + 1, n + 1):
        q, i = divmod(q, d)
        result[n - d] = i
        if q == 0:
            break

    return tuple(map(pool.pop, result))
```

```python:line-numbers=4340 [原文]
def nth_permutation(iterable, r, index):
    """Equivalent to ``list(permutations(iterable, r))[index]```

    The subsequences of *iterable* that are of length *r* where order is
    important can be ordered lexicographically. :func:`nth_permutation`
    computes the subsequence at sort position *index* directly, without
    computing the previous subsequences.

        >>> nth_permutation('ghijk', 2, 5)
        ('h', 'i')

    ``ValueError`` will be raised If *r* is negative.
    ``IndexError`` will be raised if the given *index* is invalid.
    """
    pool = list(iterable)
    n = len(pool)
    if r is None:
        r = n
    c = perm(n, r)

    if index < 0:
        index += c
    if not 0 <= index < c:
        raise IndexError

    result = [0] * r
    q = index
    for d in range(n - r + 1, n + 1):
        q, i = divmod(q, d)
        result[n - d] = i
        if q == 0:
            break

    return tuple(map(pool.pop, result))
```

:::

## 前提知識

- **辞書順**: 文字や数を、先頭から順に比べて並べる順番です。`ab` は `ba` より前にきます。
- **順列の数 `perm(n, r)`**: `n` 個から `r` 個を選んで並べる方法の数です。
- **`divmod`**: 割り算の商と余りを同時に返す組み込み関数です。
- **階乗の進数**: 各桁の位が、階乗の値で決まる数の表し方です。桁ごとに、残りの選択肢の数が決まります。

## 何をしているか

### 1. 候補をリストにして、全体の数を求める

```python:line-numbers=4354
    pool = list(iterable)
    n = len(pool)
    if r is None:
        r = n
    c = perm(n, r)
```

`pool` は並べる候補の一覧です。`perm(n, r)` で、全部で何通りの並べ替えがあるかを求めます。`r` を省略すると、全要素の並べ替えになります。

### 2. 番号の範囲を確かめる

```python:line-numbers=4360
    if index < 0:
        index += c
    if not 0 <= index < c:
        raise IndexError
```

負の番号は、後ろから数えた番号として扱います。それでも範囲の外なら、`IndexError` で止めます。

### 3. 番号を桁に分けて、要素を選ぶ

```python:line-numbers=4365
    result = [0] * r
    q = index
    for d in range(n - r + 1, n + 1):
        q, i = divmod(q, d)
        result[n - d] = i
        if q == 0:
            break
```

`divmod(q, d)` で、番号を `d` で割った商と余りに分けます。余りが、候補の中から選ぶ位置になります。商が 0 になったら、残りの桁は 0 なので終わります。

### 4. 選んだ位置の要素を取り出す

```python:line-numbers=4373
    return tuple(map(pool.pop, result))
```

選んだ位置を、候補の一覧から `pop` で順に取り出します。取り出した要素を並べたものが、答えです。

## ここがすごい

### 全部を作らずに、直接答えを出す

並べ替えを全部作って数える方法は、要素が多いと数が爆発します。この関数は、番号から直接、各位置の選び方を決めます。

### 番号が、そのまま選び方になる

番号を階乗の進数に直すと、各桁が「残りの候補のどれを選ぶか」になります。数の表し方を、並べ替えの選び方として使っています。

### 候補を取り出して減らす

`pop` で選ばれた要素を一覧から取り除くので、次の桁の選択肢は自然に少なくなります。重複を避ける処理を別に書く必要がありません。

## まとめ

- 番号を階乗の進数に分けると、並べ替えの選び方が直接決まる。
- 全部を作らないので、大きな列でも答えを 1 つだけ速く求められる。
- 取り出した要素を一覧から除くと、重複を避けながら選べる。
