---
title: 幅 n の窓を 1 つずつずらして、組を次々に作る
description: more_itertools.sliding_window は、イテラブルの上を幅 n の窓が 1 つずつ進むように、連続する n 個の組を出す。n の大きさによって、使う実装を切り替えている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [804, 826]
function: sliding_window
difficulty: 2
format: 2
tags: [イテレータ, アルゴリズム, 最適化]
---

## ひとことで

`sliding_window(iterable, n)` は、**連続する n 個の要素を 1 組として、1 つずつずらしながら** 出す関数です。
`sliding_window(range(6), 4)` は `(0, 1, 2, 3)`、`(1, 2, 3, 4)`、`(2, 3, 4, 5)` を順に出します。

## コード

::: code-group

```python:line-numbers=804 [日本語訳]
def sliding_window(iterable, n):
    """*iterable* の上を、幅 *n* の窓を順にずらしながら返す。

        >>> list(sliding_window(range(6), 4))
        [(0, 1, 2, 3), (1, 2, 3, 4), (2, 3, 4, 5)]

    *iterable* の要素が *n* 個より少なければ、何も出さない:

        >>> list(sliding_window(range(3), 4))
        []

    For a variant with more features, see :func:`windowed`.
    """
    if n > 20:
        return _sliding_window_deque(iterable, n)
    elif n > 2:
        return _sliding_window_islice(iterable, n)
    elif n == 2:
        return pairwise(iterable)
    elif n == 1:
        return zip(iterable)
    else:
        raise ValueError(f'n should be at least one, not {n}')
```

```python:line-numbers=804 [原文]
def sliding_window(iterable, n):
    """Return a sliding window of width *n* over *iterable*.

        >>> list(sliding_window(range(6), 4))
        [(0, 1, 2, 3), (1, 2, 3, 4), (2, 3, 4, 5)]

    If *iterable* has fewer than *n* items, then nothing is yielded:

        >>> list(sliding_window(range(3), 4))
        []

    For a variant with more features, see :func:`windowed`.
    """
    if n > 20:
        return _sliding_window_deque(iterable, n)
    elif n > 2:
        return _sliding_window_islice(iterable, n)
    elif n == 2:
        return pairwise(iterable)
    elif n == 1:
        return zip(iterable)
    else:
        raise ValueError(f'n should be at least one, not {n}')
```

:::

`_sliding_window_deque` と `_sliding_window_islice` は、同じファイルにある内部の関数です。どちらも、窓の作り方が違う実装です。

## 前提知識

- **窓（ウィンドウ）**: 一定の幅で、データの上を左から右へずらしていく範囲のことです。
- **`pairwise`**: 連続する 2 つの組を出す関数です。`sliding_window(x, 2)` と同じ結果になります。
- **`zip(iterable)`**: 1 つのイテラブルを受け取ると、1 要素の組を並べます。
- **`ValueError`**: 値は正しい型でも、範囲が不正なときに投げられる例外です。

## 何をしているか

### 1. 幅が大きいとき

```python:line-numbers=817
    if n > 20:
        return _sliding_window_deque(iterable, n)
```

`n` が 20 より大きいと、`deque` を使う実装に任せます。大きな窓では、古い要素を捨てる作業を専用の仕組みに任せた方が速いからです。

### 2. 幅が 3 から 20 のとき

```python:line-numbers=819
    elif n > 2:
        return _sliding_window_islice(iterable, n)
```

中くらいの幅では、`islice` を使う実装を選びます。

### 3. 幅が 2 または 1 のとき

```python:line-numbers=821
    elif n == 2:
        return pairwise(iterable)
    elif n == 1:
        return zip(iterable)
```

幅 2 は `pairwise`、幅 1 は `zip` で、簡単に作れます。特別な場合を、わざわざ一般の実装に通さずに済ませています。

### 4. 幅が 1 より小さいとき

```python:line-numbers=825
    else:
        raise ValueError(f'n should be at least one, not {n}')
```

幅 0 以下は意味がないので、`ValueError` にします。

## ここがすごい

### 幅によって、実装を切り替える

同じ仕事でも、幅が小さいときと大きいときでは、速い方法が違います。この関数は、`n` の大きさを見て、ふさわしい実装に振り分けています。呼ぶ側は、幅を変えても同じ書き方のままです。

### 短すぎるときは何も出ない

要素が `n` 個より少なければ、窓が 1 つも作れないので、何も出しません。エラーにはならない点に注意してください。

### 特別な場合を先に処理する

幅 1 と 2 は、既存の部品（`zip` と `pairwise`）で済みます。よく使う小さな場合を、わかりやすい部品に任せています。

## まとめ

- 連続する組を作るには、幅ごとに一番速い方法を選ぶと良い。
- 要素が足りないときは、エラーではなく空の結果になる。
- 小さい場合の特別扱いは、既存の部品に任せると分かりやすい。
