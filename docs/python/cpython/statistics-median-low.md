---
title: 偶数個のとき、真ん中の 2 つのうち小さいほうを選ぶ
description: statistics.median_low は、データの下側の中央値を返す。データを並べ替えてから、個数が偶数なら中央の 2 つのうち小さいほうを選ぶ。個数が空なら StatisticsError を出す。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/statistics.py
lines: [353, 375]
function: median_low
difficulty: 1
format: 2
tags: [数値計算, ソート, 標準ライブラリ]
---

## ひとことで

`median_low(data)` は、データの **下側の中央値** を返す関数です。
`median_low([1, 3, 5])` は `3`、`median_low([1, 3, 5, 7])` は `3` を返します。個数が偶数のときは、真ん中の 2 つのうち小さいほうを選びます。

## コード

::: code-group

```python:line-numbers=353 [日本語訳]
def median_low(data):
    """数値データの下側の中央値を返す。

    When the number of data points is odd, the middle value is returned.
    When it is even, the smaller of the two middle values is returned.

    >>> median_low([1, 3, 5])
    3
    >>> median_low([1, 3, 5, 7])
    3

    """
    # 並べ替えの代わりに quickselect を使える可能性がある。
    # ただし、現在の sort に勝つには優れた実装が必要になる。
    # 現在の sort は、非常に最適化された組み込みの関数である。
    data = sorted(data)
    n = len(data)
    if n == 0:
        raise StatisticsError("no median for empty data")
    if n % 2 == 1:
        return data[n // 2]
    else:
        return data[n // 2 - 1]
```

```python:line-numbers=353 [原文]
def median_low(data):
    """Return the low median of numeric data.

    When the number of data points is odd, the middle value is returned.
    When it is even, the smaller of the two middle values is returned.

    >>> median_low([1, 3, 5])
    3
    >>> median_low([1, 3, 5, 7])
    3

    """
    # Potentially the sorting step could be replaced with a quickselect.
    # However, it would require an excellent implementation to beat our
    # highly optimized builtin sort.
    data = sorted(data)
    n = len(data)
    if n == 0:
        raise StatisticsError("no median for empty data")
    if n % 2 == 1:
        return data[n // 2]
    else:
        return data[n // 2 - 1]
```

:::

`StatisticsError` は、統計の計算ができないときに投げられる例外です。

## 前提知識

- **中央値（メディアン）**: 並べたときの真ん中の値です。データの平均より、極端な値の影響を受けにくい代表値として使われます。
- **偶数個のときの中央値**: 真ん中が 2 つあるので、どちらかを選ぶか、平均を取るかを決める必要があります。`median_low` は小さいほうを選びます。
- **`sorted(data)`**: データを小さい順に並べた、新しいリストを作ります。元のデータは変わりません。
- **`n // 2`**: 個数を 2 で割った商です。並べたデータの番号（0 から数える）を求めるのに使います。

## 何をしているか

### 1. 並べ替えて、個数を数える

```python:line-numbers=368
    data = sorted(data)
    n = len(data)
```

`sorted` で、小さい順に並べ直したリストを作ります。`n` は、その個数です。

### 2. 空のデータはエラーにする

```python:line-numbers=370
    if n == 0:
        raise StatisticsError("no median for empty data")
```

中央値は、データがなければ決められません。`StatisticsError` を出して、呼び出し側に知らせます。

### 3. 個数で位置を決める

```python:line-numbers=372
    if n % 2 == 1:
        return data[n // 2]
    else:
        return data[n // 2 - 1]
```

個数が奇数なら、真ん中の番号 `n // 2` の値を返します。偶数なら、真ん中の 2 つのうち小さいほう、つまり番号 `n // 2 - 1` の値を返します。

## ここがすごい

### 平均を取らない

中央値は、平均を取るという選び方もあります。しかし平均だと、結果が元のデータにない値になります。`median_low` は必ず元のデータの中の値を返すので、整数のデータなら整数のまま結果を得られます。

### 偶数のときの選び方を名前で表す

`median_low` と `median_high` は、偶数のときにどちらを選ぶかだけが違います。下側か上側かを関数名で分けることで、呼ぶ側が意図を明確に書けます。

### 並べ替えは組み込みに任せる

コメントにあるとおり、もっと速い方法（quickselect）も考えられます。しかし、組み込みの `sorted` はとても速く作られているので、そちらを使うほうが実際には速いと判断しています。

## まとめ

- 中央値は、並べ替えてから真ん中を取ると求められる。
- 偶数個のときは、真ん中の 2 つのどちらを選ぶかを決める必要がある。
- 速さの判断は、理論上の速い方法より、組み込みの実装の強さを考えて決めることもある。
