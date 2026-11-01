---
title: 最も多い値を 1 つ返す。同数なら最初に現れたもの
description: statistics.mode は、離散データや名義データの中で最も多く現れる値を 1 つ返す。内部では Counter の most_common(1) を使い、同じ回数なら最初に現れた値を選ぶ。空のデータは StatisticsError になる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/statistics.py
lines: [469, 496]
function: mode
difficulty: 2
format: 2
tags: [数値計算, 標準ライブラリ, データ構造]
---

## ひとことで

`mode(data)` は、**データの中で最も多く現れる値を 1 つ** 返す関数です。
`mode([1, 1, 2, 3, 3, 3, 3, 4])` は `3` を返します。数値だけでなく、`'red'` などの文字列でも使えます。

## コード

::: code-group

```python:line-numbers=469 [日本語訳]
def mode(data):
    """離散データや名義データで、最も多い値を返す。

    ``mode`` assumes discrete data, and returns a single value. This is the
    standard treatment of the mode as commonly taught in schools:

        >>> mode([1, 1, 2, 3, 3, 3, 3, 4])
        3

    This also works with nominal (non-numeric) data:

        >>> mode(["red", "blue", "blue", "red", "green", "red", "red"])
        'red'

    If there are multiple modes with same frequency, return the first one
    encountered:

        >>> mode(['red', 'red', 'green', 'blue', 'blue'])
        'red'

    If *data* is empty, ``mode``, raises StatisticsError.

    """
    pairs = Counter(iter(data)).most_common(1)
    try:
        return pairs[0][0]
    except IndexError:
        raise StatisticsError('no mode for empty data') from None
```

```python:line-numbers=469 [原文]
def mode(data):
    """Return the most common data point from discrete or nominal data.

    ``mode`` assumes discrete data, and returns a single value. This is the
    standard treatment of the mode as commonly taught in schools:

        >>> mode([1, 1, 2, 3, 3, 3, 3, 4])
        3

    This also works with nominal (non-numeric) data:

        >>> mode(["red", "blue", "blue", "red", "green", "red", "red"])
        'red'

    If there are multiple modes with same frequency, return the first one
    encountered:

        >>> mode(['red', 'red', 'green', 'blue', 'blue'])
        'red'

    If *data* is empty, ``mode``, raises StatisticsError.

    """
    pairs = Counter(iter(data)).most_common(1)
    try:
        return pairs[0][0]
    except IndexError:
        raise StatisticsError('no mode for empty data') from None
```

:::

`Counter` は、値ごとの出現回数を数える辞書型です。`most_common(1)` は、回数の一番多い組を 1 つだけ返します。

## 前提知識

- **離散データ・名義データ**: 「赤・青・緑」のように、大小や間隔に意味がないデータです。平均より、最頻値のほうが意味を持ちます。
- **`most_common(n)`**: 回数の多い順に `(値, 回数)` の組を `n` 個返します。
- **`from None`**: 例外を出し直すときに、元の例外の情報を隠す指定です。
- **`IndexError`**: 空のリストの先頭を取ろうとしたときに出る例外です。

## 何をしているか

### 1. 回数の一番多い組を取る

```python:line-numbers=492
    pairs = Counter(iter(data)).most_common(1)
```

`Counter(iter(data)).most_common(1)` で、最も多い `(値, 回数)` の組を 1 つ取ります。データが空なら、空のリストになります。

### 2. 先頭の値を返す

```python:line-numbers=493
    try:
        return pairs[0][0]
```

先頭の組の値（`pairs[0][0]`）を返します。

### 3. 空なら、統計のエラーにする

```python:line-numbers=495
    except IndexError:
        raise StatisticsError('no mode for empty data') from None
```

空のリストの先頭を取ると `IndexError` になるので、それを捕まえて `StatisticsError` に変えます。`from None` で、内部のエラーの詳細は隠します。

## ここがすごい

### 数えるのは `Counter` に任せる

数える処理と、最も多いものを選ぶ処理を、`Counter.most_common` に任せています。自分で辞書を作って、最大を探す必要がありません。

### 同数のときは最初の値

docstring の例 `['red', 'red', 'green', 'blue', 'blue']` では、`red` と `blue` が同じ 2 回ですが、`red` が先に現れるので `red` を返します。`most_common` は同じ回数の要素を、最初に現れた順に並べるので、この規則が自然に成り立ちます。

### 数値でなくてもよい

`Counter` は値を比べるだけで数えるので、文字列でも同じように使えます。平均のように、数値の計算を必要としない点が特徴です。

## まとめ

- 最頻値は、`Counter` で数えて `most_common(1)` を取ると簡単に求まる。
- 同数のときに選ばれる値は、データに最初に現れた順で決まる。
- 空のときの例外は、ライブラリ独自のものに変えると呼ぶ側が扱いやすい。
