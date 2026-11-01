---
title: リストを末尾から順に、ランダムな位置と入れ替えて並べ替える
description: random.shuffle は、リストの要素をその場で並べ替える。末尾から 1 つずつ、先頭側からランダムに選んだ位置と交換する Fisher-Yates の方法で、すべての並び方が同じ確率になる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [356, 363]
function: Random.shuffle
difficulty: 2
format: 2
tags: [乱数, アルゴリズム]
---

## ひとことで

`shuffle(x)` は、**リスト `x` の要素を、ランダムな順番に並べ替える** メソッドです。
新しいリストは作らず、元のリストをその場で書き換えて、戻り値は `None` です。トランプを切るように、要素の順番を混ぜたいときに使えます。

## コード

::: code-group

```python:line-numbers=356 [日本語訳]
    def shuffle(self, x):
        """リスト x をその場で並べ替える。戻り値は None。"""

        randbelow = self._randbelow
        for i in reversed(range(1, len(x))):
            # x[i] と入れ替える相手を、x[:i+1] の中から選ぶ
            j = randbelow(i + 1)
            x[i], x[j] = x[j], x[i]
```

```python:line-numbers=356 [原文]
    def shuffle(self, x):
        """Shuffle list x in place, and return None."""

        randbelow = self._randbelow
        for i in reversed(range(1, len(x))):
            # pick an element in x[:i+1] with which to exchange x[i]
            j = randbelow(i + 1)
            x[i], x[j] = x[j], x[i]
```

:::

## 前提知識

- **並べ替え（順列）**: 要素を並べる順番のことです。3 個なら、6 通りの並び方があります。
- **Fisher-Yates 法**: 末尾から順に、残りの中からランダムに 1 つを選んで交換する、公平な並べ替えの方法です。
- **`_randbelow(n)`**: `0` 以上 `n` 未満の整数を、同じ確率で返す内部の関数です。
- **その場で（in place）**: 新しいリストを作らず、元のリストの中身を変えることです。

## 何をしているか

### 1. 末尾から順に位置を選ぶ

```python:line-numbers=360
        for i in reversed(range(1, len(x))):
```

`reversed(range(1, len(x)))` で、末尾の位置から、2 番目の位置まで順に進みます。先頭は、最後に残った 1 つなので、交換する必要がありません。

### 2. 先頭側からランダムな位置を選ぶ

```python:line-numbers=362
            j = randbelow(i + 1)
```

`randbelow(i + 1)` で、`0` から `i` までのどれかの位置 `j` を選びます。`i` より後ろは、すでに決まった要素なので、選ぶ対象に入りません。

### 3. 2 つの位置の要素を入れ替える

```python:line-numbers=363
            x[i], x[j] = x[j], x[i]
```

`x[i]` と `x[j]` を入れ替えます。Python の複数代入を使うと、一時的な変数がなくても、2 つの値を入れ替えられます。

## ここがすごい

### すべての並び方が同じ確率になる

各段階で、残りの中から 1 つを一様に選ぶので、どの並び方も同じ確率で出ます。単に `random()` の値で並べ替えるより、偏りが出にくい方法です。

### 新しいリストを作らない

元のリストを直接書き換えるので、メモリを余分に使いません。大きなリストを混ぜるときにも向いています。

### 入れ替えの回数が決まっている

ループは `len(x) - 1` 回だけ回ります。並べ替えにかかる時間は、要素数に比例して決まります。

## まとめ

- 末尾から順に、残りの中からランダムに 1 つを選んで入れ替えると、公平な並べ替えになる。
- その場で書き換えるので、余分なメモリを使わない。
- 入れ替えの回数は要素数で決まり、予測しやすい。
