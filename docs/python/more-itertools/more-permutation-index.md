---
title: 並べ替えから「辞書順で何番目か」を逆算する
description: more_itertools.permutation_index は、ある並べ替えが辞書順で何番目かを、全部を数えずに計算する。各段階で「残りの中の何番目を取ったか」を求め、階乗進数として組み立てる。
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
tags: [アルゴリズム, 数値計算]
---
## ひとことで

`permutation_index(element, iterable)` は、並べ替え `element` が、`permutations(iterable)` の結果の **何番目に出てくるか** を求める関数です。
`permutation_index('bca', 'abc')` は `3` を返します（`abc, acb, bac, bca, ...` の 3 番目、0 始まり）。
`nth_permutation`（番号から並べ替えを作る関数）のちょうど逆の計算です。

## コード

```python:line-numbers=4571
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

## 前提知識

- **並べ替えの辞書順**: `abc` の並べ替えを辞書順に並べると、`abc, acb, bac, bca, cab, cba` です。
- **`pool.index(x)`**: リストの中で `x` が最初に出てくる位置を返します。
- **`del pool[r]`**: リストの r 番目を削除します。
- **`zip(range(n, -1, -1), element)`**: `n, n-1, n-2, ...` という数と、`element` の各要素を組にして取り出します。
- **ホーナー法**: `index = index * i + r` を繰り返して、桁ごとの値から数を組み立てる方法です。10 進数の `3, 1, 4` から 314 を作るときの `((3 × 10) + 1) × 10 + 4` と同じ考え方です。

## 何をしているか

`element = ('b', 'c', 'a')`、`pool = ['a', 'b', 'c']` で追います。

| i | x | r = pool.index(x) | index = index * i + r | pool（削除後） |
| --- | --- | --- | --- | --- |
| 3 | b | 1 | 0 × 3 + 1 = 1 | [a, c] |
| 2 | c | 1 | 1 × 2 + 1 = 3 | [a] |
| 1 | a | 0 | 3 × 1 + 0 = 3 | [] |

答えは `3` です。

### 各段階の意味

- 最初に `b` を取りました。`b` は残り 3 つの中で 1 番目です。`a` で始まる並べ替え（2! = 2 通り）がすべて前にあります。
- 次に `c` を取りました。残り `[a, c]` の中で 1 番目です。`ba...` で始まる 1 通りが前にあります。
- 最後の `a` は残り 1 つの中で 0 番目です。

前にある数を足すと、`1 × 2! + 1 × 1! + 0 × 0! = 3` です。589 行目の `index * i + r` は、この足し算をホーナー法で組み立てています。

## ここがすごい

### 「自分より前にいくつあるか」を桁ごとに数える

ある並べ替えより辞書順で前にあるものは、

- 先頭が自分より小さいもの（その数 × 残りの並べ方の数）
- 先頭が同じで、2 番目が自分より小さいもの
- ……

の合計です。「残りの中で何番目か」（`pool.index(x)`）が「自分より小さいものの数」になるのは、`pool` を元の順番のまま保ち、使ったものを削除していくからです。

### 割り算の逆はかけ算

`nth_permutation` は `divmod` で番号を「各段階の位置」に分解しました。`permutation_index` はその逆で、「各段階の位置」をかけ算と足し算で番号に組み立てます。2 つの関数を並べて読むと、**階乗進数への変換と逆変換** になっていることがわかります。

### 全部を数えない

素直に `list(permutations(iterable)).index(element)` とすると n! 個を作ります。この方法なら、`index` と `del` を n 回するだけです。

## まとめ

- 並べ替えの番号は「各段階で、自分より小さい選択肢がいくつ残っていたか」から計算できる。
- 桁ごとの値から数を組み立てるには、ホーナー法（`index * i + r`）が便利。
- 番号 → 並べ替え（割り算）と、並べ替え → 番号（かけ算）は、ちょうど逆の操作になる。
