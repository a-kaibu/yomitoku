---
title: 全部並べずに「n 番目の並べ替え」を直接作る、階乗進数の考え方
description: more_itertools.nth_permutation は、並べ替えを辞書順に並べたときの n 番目を、すべてを生成せずに計算で求める。番号を階乗進数に直し、各桁を「残りの中の何番目を取るか」として使う。
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
tags: [アルゴリズム, 数値計算]
---
## ひとことで

`nth_permutation(iterable, r, index)` は、`itertools.permutations(iterable, r)` が出す並べ替えのうち、**index 番目のものだけを直接求める** 関数です。
`nth_permutation('abcde', 5, 10**0)` のように使い、10 個の要素の並べ替え（362 万通り以上）の何番目でも、全部を作らずに一瞬で答えます。
番号を **階乗進数**（各桁の重みが 1!, 2!, 3!, … になる数の表し方）に直して、各桁を「残りの要素の何番目を取るか」として使います。

## コード

```python:line-numbers=4340
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

`perm(n, r)` は `math.perm` で、n 個から r 個を選んで並べる方法の数です。

## 前提知識

- **並べ替え（順列）の数**: 3 個の要素を全部並べる方法は 3 × 2 × 1 = 6 通りです。
- **`divmod(q, d)`**: 商と余りを同時に返します。
- **`[0] * r`**: 0 を r 個並べたリストです。
- **`pool.pop(i)`**: リストの i 番目を取り出して削除し、その値を返します。
- **`map(pool.pop, result)`**: `result` の各値を順に `pool.pop` に渡します。`pool` は呼ぶたびに短くなります。
- **負の index**: Python では -1 が最後を表すので、ここでも `index += c` で後ろから数えられるようにしています。

## 何をしているか

`pool = ['a', 'b', 'c']`、`r = 3`、`index = 3` で追います。辞書順の並べ替えは `abc, acb, bac, bca, cab, cba` なので、3 番目（0 始まり）は `bca` のはずです。

### 1. 範囲の確認（4354〜4363 行目）

並べ替えの総数は `perm(3, 3) = 6`。index が 0〜5 に入っているか確かめます。

### 2. 番号を「選ぶ位置」に分解する（4365〜4371 行目）

`d` を 1, 2, 3 と増やしながら `divmod` していきます。

| d | divmod(q, d) | result |
| --- | --- | --- |
| 1 | (3, 0) | result[2] = 0 |
| 2 | (1, 1) | result[1] = 1 |
| 3 | (0, 1) | result[0] = 1 |

`result = [1, 1, 0]` は、「最初は残りの 1 番目、次は残りの 1 番目、最後は残りの 0 番目を取る」という意味です。

### 3. 順に取り出す（4373 行目）

- `pool.pop(1)` → `'b'`（残り `['a', 'c']`）
- `pool.pop(1)` → `'c'`（残り `['a']`）
- `pool.pop(0)` → `'a'`

結果は `('b', 'c', 'a')` で、予想どおりです。

## ここがすごい

### 番号と並べ替えを 1 対 1 に対応させる

3 個の並べ替えでは、先頭の選び方が 3 通り、それぞれに残りの並べ方が 2! = 2 通りあります。つまり **index ÷ 2! の商が先頭の位置**、余りが「残りの中での番号」です。これを繰り返すと、番号の各桁が「残りの中の何番目を取るか」になります。これは階乗進数（下の桁から 1, 2, 3, … で割っていく表し方）そのものです。

### 全部作らずに答えが出る

素直に `list(permutations(...))[index]` とすると、n! 個を全部作ります。10 個なら 362 万個、20 個なら 2.4 × 10^18 個で、とても作れません。この方法なら、割り算を r 回するだけです。

### 早めに打ち切る

4370 行目で `q == 0` になったら、残りの桁はすべて 0（「残りの先頭を取る」）なので、ループを抜けます。`result` は最初から 0 で埋めてあるので、そのままで正しく動きます。

### r < n にも対応

r 個だけ選ぶ場合は、`d` を `n - r + 1` から始めることで、選ばない部分の重みを正しく扱っています。

## まとめ

- 並べ替えの番号は、階乗進数に直すと「各段階で何番目を取るか」に分解できる。
- 全部を生成しなくても、数え上げの構造がわかれば n 番目を直接計算できる。
- 残りの桁が 0 なら打ち切れるように、結果を 0 で初期化しておく。
