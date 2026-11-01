---
title: 同じ回数で最も多い値を、すべて集める
description: statistics.multimode は、最も多く現れる値をすべてリストで返す。Counter で数えてから、最大の回数と同じ値だけを、出現順に取り出している。空なら空のリストを返す。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/statistics.py
lines: [499, 517]
function: multimode
difficulty: 1
format: 2
tags: [数値計算, 標準ライブラリ, データ構造]
---

## ひとことで

`multimode(data)` は、**最も多く現れる値をすべて** リストで返す関数です。
`multimode([1, 1, 2, 2])` は `[1, 2]` を返します。1 と 2 が同じ回数で最多なので、両方を返します。

## コード

::: code-group

```python:line-numbers=499 [日本語訳]
def multimode(data):
    """最も多く現れる値のリストを返す。

    Will return more than one result if there are multiple modes
    or an empty list if *data* is empty.

    >>> multimode('aabbbbbbbbcc')
    ['b']
    >>> multimode('aabbbbccddddeeffffgg')
    ['b', 'd', 'f']
    >>> multimode('')
    []

    """
    counts = Counter(iter(data))
    if not counts:
        return []
    maxcount = max(counts.values())
    return [value for value, count in counts.items() if count == maxcount]
```

```python:line-numbers=499 [原文]
def multimode(data):
    """Return a list of the most frequently occurring values.

    Will return more than one result if there are multiple modes
    or an empty list if *data* is empty.

    >>> multimode('aabbbbbbbbcc')
    ['b']
    >>> multimode('aabbbbccddddeeffffgg')
    ['b', 'd', 'f']
    >>> multimode('')
    []

    """
    counts = Counter(iter(data))
    if not counts:
        return []
    maxcount = max(counts.values())
    return [value for value, count in counts.items() if count == maxcount]
```

:::

`Counter` は、値ごとの出現回数を数える辞書型です。

## 前提知識

- **最頻値（モード）**: データの中で最も多く現れる値です。最頻値は 1 つとは限りません。
- **`Counter(iter(data))`**: 各値の出現回数を数えます。`iter` をかけるのは、どんな反復可能なデータでも受け取るためです。
- **`dict.values()` と `dict.items()`**: 辞書の値だけ、または（キー, 値）の組を取り出します。
- **空のデータ**: 値が 1 つもない場合です。

## 何をしているか

### 1. 数えて、空なら空リストを返す

```python:line-numbers=513
    counts = Counter(iter(data))
    if not counts:
        return []
```

値ごとの回数を `Counter` で数えます。データが空なら、回数も空になるので、`[]` を返します。

### 2. 最大の回数を求める

```python:line-numbers=516
    maxcount = max(counts.values())
```

数えた回数の中で、一番多いものを `maxcount` とします。

### 3. 最大の回数と同じ値をすべて集める

```python:line-numbers=517
    return [value for value, count in counts.items() if count == maxcount]
```

回数が `maxcount` と同じ値を、順番に集めてリストにします。同点の値は、すべて入ります。

## ここがすごい

### 同点を取りこぼさない

最頻値を 1 つだけ返す関数（`mode` など）と違い、同じ回数の値をすべて返します。データの分布が 2 つの山を持つかどうかを知るときなどに役立ちます。

### 出現順が保たれる

`Counter` は、最初に現れた順に値を覚えています。そのため、結果のリストも、データに初めて現れた順になります。docstring の例 `['b', 'd', 'f']` は、その順です。

### 空のデータは例外にしない

`mode` は、空のデータでエラーにします。`multimode` は、空のリストを返すだけです。データがないことを、特別な例外にせずに表しています。

## まとめ

- 同点の最頻値をすべて欲しいときは、最大の回数と一致するものを集める。
- `Counter` は初めて現れた順を保つので、結果の順番も分かりやすい。
- 空のデータの扱いは、関数ごとに決めておくと呼ぶ側が迷わない。
