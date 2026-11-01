---
title: 「何個選ぶか」でループして、すべての部分集合をつなげる
description: more_itertools.powerset は、要素のすべての組み合わせ（部分集合）を、空の組から全部入りまで順に出す。combinations と chain の組み合わせで 1 行に収めている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [451, 469]
function: powerset
difficulty: 1
tags: [イテレータ, アルゴリズム, 関数型]
---
## ひとことで

`powerset(iterable)` は、要素のあらゆる選び方（**部分集合**）を順番に出す関数です。
`powerset([1, 2, 3])` は `(), (1,), (2,), (3,), (1, 2), (1, 3), (2, 3), (1, 2, 3)` を出します。
「0 個選ぶ」「1 個選ぶ」……「全部選ぶ」を順につなげるだけ、という発想で、本体は 2 行です。

## コード

```python:line-numbers=451
def powerset(iterable):
    """Yields all possible subsets of the iterable.

        >>> list(powerset([1, 2, 3]))
        [(), (1,), (2,), (3,), (1, 2), (1, 3), (2, 3), (1, 2, 3)]

    :func:`powerset` will operate on iterables that aren't :class:`set`
    instances, so repeated elements in the input will produce repeated elements
    in the output.

        >>> seq = [1, 1, 0]
        >>> list(powerset(seq))
        [(), (1,), (1,), (0,), (1, 1), (1, 0), (1, 0), (1, 1, 0)]

    For a variant that efficiently yields actual :class:`set` instances, see
    :func:`powerset_of_sets`.
    """
    s = list(iterable)
    return chain.from_iterable(combinations(s, r) for r in range(len(s) + 1))
```

`chain` と `combinations` は `itertools` の関数です。

## 前提知識

- **部分集合とべき集合**: `{1, 2, 3}` から好きなだけ選んだもの（何も選ばないものも含む）を部分集合、その全部を集めたものをべき集合（power set）と呼びます。n 個の要素なら 2^n 通りあります。
- **`combinations(s, r)`**: `s` から r 個を選ぶ組み合わせを、すべて順に出します。`combinations([1, 2, 3], 2)` は `(1, 2), (1, 3), (2, 3)` です。
- **ジェネレータ式**: `(式 for r in ...)` は、値を必要になったときに 1 つずつ作る、リスト内包表記の遅延版です。
- **`chain.from_iterable(xs)`**: 「イテレータの並び」を受け取って、順番につないだ 1 本にします。

## 何をしているか

### 1. いったんリストにする（468 行目）

`combinations` は同じデータを何度も使う（r ごとに最初から選び直す）ので、1 回しか読めないジェネレータが渡されても大丈夫なように、先にリストにしておきます。

### 2. 選ぶ個数ごとに組み合わせを作って、つなげる（469 行目）

`s = [1, 2, 3]` なら、`r` は 0, 1, 2, 3 です。

| r | `combinations(s, r)` |
| --- | --- |
| 0 | `()` |
| 1 | `(1,), (2,), (3,)` |
| 2 | `(1, 2), (1, 3), (2, 3)` |
| 3 | `(1, 2, 3)` |

これらを `chain.from_iterable` で順につないで返します。

## ここがすごい

### 問題を「個数ごと」に分ける

部分集合を全部作るには、ビット列（`000` 〜 `111`）を使って「各要素を選ぶか選ばないか」を決める方法もよく知られています。

```python
for mask in range(2 ** len(s)):
    yield tuple(x for i, x in enumerate(s) if mask >> i & 1)
```

この方法でも 2^n 通りが出ますが、順番が「小さい組から大きい組へ」になりません。`powerset` は「選ぶ個数」でまとめるので、**小さい組から順に** 出てきます。また、組み合わせを作る処理は C で書かれた `combinations` に任せているので、自分でビット演算を書くより速く、読みやすくなっています。

### 遅延評価で 2^n 個を一度に作らない

要素が 30 個あると、部分集合は 10 億通り以上になります。全部をリストにするとメモリが足りませんが、`powerset` はジェネレータ式と `chain` で **1 つずつ** 作るので、必要な分だけ取り出せます。

### 重複した要素もそのまま扱う

457〜463 行目の説明の通り、入力に同じ値が複数あっても、位置が違えば別のものとして扱います。集合として重複を取り除くかどうかは、使う側が決められます。

## まとめ

- べき集合は「0 個選ぶ」から「全部選ぶ」までの組み合わせをつなげれば作れる。
- 何度も読む必要がある入力は、先にリストにしておく。
- 巨大になりうる結果は、ジェネレータで少しずつ作る。
