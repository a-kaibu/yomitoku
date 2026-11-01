---
title: 重複のある並べ替えを辞書順に列挙する「次の順列」アルゴリズム
description: more_itertools.distinct_permutations の内部関数。今の並びから「辞書順で次の並び」を直接作ることで、同じ要素があっても重複なく、すべての並べ替えを出す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [812, 833]
function: distinct_permutations._full
difficulty: 3
format: 2
tags: [アルゴリズム, ソート, イテレータ]
---

## ひとことで

`distinct_permutations` は、同じ要素を含むデータの **重複のない並べ替え** をすべて出す関数です。`[1, 1, 2]` なら `(1, 1, 2), (1, 2, 1), (2, 1, 1)` の 3 通りです（`itertools.permutations` だと、同じものが重複して 6 通り出ます）。
`_full` はその中心となる内部関数で、ソート済みの並びから始めて **「辞書順で次の並び」を直接作る** ことを繰り返します。

## コード

::: code-group

```python:line-numbers=812 [日本語訳]
    def _full(A):
        while True:
            # いま持っている並びを出力する
            yield tuple(A)

            # A[i] < A[i + 1] を満たす、最も右の位置 i を探す
            for i in range(size - 2, -1, -1):
                if A[i] < A[i + 1]:
                    break
            #  そのような i がなければ、この並びが最後の並びである
            else:
                return

            # A[i] < A[j] を満たす、i より右で最も右の位置 j を探す
            for j in range(size - 1, i, -1):
                if A[i] < A[j]:
                    break

            # A[i] と A[j] を入れ替えてから、
            # A[i + 1] 以降を反転して、次の並びを作る
            A[i], A[j] = A[j], A[i]
            A[i + 1 :] = A[: i - size : -1]  # A[i + 1:][::-1]
```

```python:line-numbers=812 [原文]
    def _full(A):
        while True:
            # Yield the permutation we have
            yield tuple(A)

            # Find the largest index i such that A[i] < A[i + 1]
            for i in range(size - 2, -1, -1):
                if A[i] < A[i + 1]:
                    break
            #  If no such index exists, this permutation is the last one
            else:
                return

            # Find the largest index j greater than j such that A[i] < A[j]
            for j in range(size - 1, i, -1):
                if A[i] < A[j]:
                    break

            # Swap the value of A[i] with that of A[j], then reverse the
            # sequence from A[i + 1] to form the new permutation
            A[i], A[j] = A[j], A[i]
            A[i + 1 :] = A[: i - size : -1]  # A[i + 1:][::-1]
```

:::

`size` は外側の関数で決めた、並べる要素の個数です。`A` は最初にソートされたリストとして渡されます。

## 前提知識

- **辞書順**: 先頭から比べて大小を決める並べ方です。`(1, 1, 2) < (1, 2, 1) < (2, 1, 1)` です。
- **`range(a, b, -1)`**: a から b の手前まで、1 ずつ減らしながら数えます。
- **`for ... else`**: `for` が `break` せずに最後まで回ったときだけ `else` が実行されます。
- **スライス代入**: `A[i + 1 :] = ...` で、i+1 番目以降をまとめて置き換えます。
- **負のステップのスライス**: `A[: i - size : -1]` は、末尾から逆向きに i+1 番目まで取り出す、つまり `A[i + 1:]` を逆順にしたものです。

## 何をしているか

`A = [1, 2, 2, 3]` から始めた 1 ステップを追います。今は `(1, 2, 2, 3)` を出したところです。

### 1. 右から見て、初めて「上り」になる位置 i を探す

```python:line-numbers=817
            # A[i] < A[i + 1] を満たす、最も右の位置 i を探す
            for i in range(size - 2, -1, -1):
                if A[i] < A[i + 1]:
                    break
            #  そのような i がなければ、この並びが最後の並びである
            else:
                return
```

右から順に `A[i] < A[i+1]` を探します。`2 < 3`（位置 2）が見つかるので `i = 2` です。
見つからない（全体が下り順）なら、それが最後の並びなので終わります。

### 2. A[i] より大きい、いちばん右の要素 j を探す

```python:line-numbers=825
            # A[i] < A[j] を満たす、i より右で最も右の位置 j を探す
            for j in range(size - 1, i, -1):
                if A[i] < A[j]:
                    break
```

右から `A[2] = 2` より大きいものを探すと、`A[3] = 3` なので `j = 3` です。

### 3. 入れ替えて、右側を反転する

```python:line-numbers=830
            # A[i] と A[j] を入れ替えてから、
            # A[i + 1] 以降を反転して、次の並びを作る
            A[i], A[j] = A[j], A[i]
            A[i + 1 :] = A[: i - size : -1]  # A[i + 1:][::-1]
```

`A[2]` と `A[3]` を入れ替えて `[1, 2, 3, 2]`。位置 3 以降（`[2]`）を反転しても同じなので、次の並びは `(1, 2, 3, 2)` です。

## ここがすごい

### 重複を「捨てる」のではなく「作らない」

素直な方法は `set(permutations(data))` ですが、これは重複も含めて n! 通りを全部作ってから取り除くので、`[1] * 10 + [2]` のように重複が多いと、11! ≒ 4000 万通りを作って 11 通りしか残らない、というひどい無駄が起きます。
「次の順列」アルゴリズムは、`A[i] < A[i+1]` と **厳密な不等号** で比べるため、同じ値どうしの入れ替えを自然に飛ばします。結果として、重複のない並びだけを、1 つずつ順番に作ります。

### なぜ「次」になるのか

位置 i より右側は下り順（もう大きくできない）なので、変えるなら i の値を「少しだけ大きく」するしかありません。右側の中で A[i] より大きい最小の値（右から探した最初のもの）と入れ替え、右側を反転して上り順（最小）にすると、ちょうど辞書順で次の並びになります。この「次の順列」の作り方は古くから知られた定番のアルゴリズムです。

### 状態はリスト 1 本だけ

今の並び `A` 自体が「どこまで進んだか」を表しているので、余分な記録がいりません。メモリは要素数ぶんだけです。

## まとめ

- 「辞書順で次の並び」は、上りになる位置を探し、入れ替えて、右側を反転すれば作れる。
- 厳密な不等号で比べると、重複する要素の並べ替えが自然に飛ばされる。
- 全部作ってから重複を消すより、最初から重複を作らない方がはるかに効率がよい。
