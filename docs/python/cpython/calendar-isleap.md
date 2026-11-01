---
title: 4 で割り切れる年を、100 と 400 の例外で閏年と判定する
description: calendar.isleap は、西暦の年が閏年かどうかを返す。4 で割り切れる年が閏年だが、100 で割り切れる年は除き、400 で割り切れる年だけは閏年に戻す。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/calendar.py
lines: [162, 164]
function: isleap
difficulty: 1
format: 2
tags: [日時, 標準ライブラリ, 数値計算]
---

## ひとことで

`isleap(year)` は、**その年が閏年（2 月が 29 日まである年）かどうか** を返す関数です。
`isleap(2024)` は `True`、`isleap(1900)` は `False`、`isleap(2000)` は `True` です。

## コード

::: code-group

```python:line-numbers=162 [日本語訳]
def isleap(year):
    """閏年なら True、そうでなければ False を返す。"""
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
```

```python:line-numbers=162 [原文]
def isleap(year):
    """Return True for leap years, False for non-leap years."""
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
```

:::

## 前提知識

- **閏年**: 太陽暦の 1 年（約 365.2422 日）を、暦とずらさないために、2 月を 1 日増やす年です。
- **剰余 `%`**: 割り算の余りです。`year % 4 == 0` は「4 で割り切れる」という意味です。
- **論理演算 `and` / `or`**: 両方が真なら真、どちらかが真なら真になる演算です。

## 何をしているか

### 1. 4 で割り切れるかを確かめる

```python:line-numbers=164
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
```

まず、4 で割り切れない年は閏年ではないと判断します。`and` の左側が偽なら、右側は見ません。

### 2. 100 の例外を処理する

```python:line-numbers=164
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
```

4 で割り切れても、100 で割り切れる年は閏年になりません。ただし、400 で割り切れる年は、例外として閏年になります。

## ここがすごい

### 規則を 1 行で書ける

「4 の倍数、ただし 100 の倍数は除く、ただし 400 の倍数は含む」という決まりを、1 つの式で書いています。条件を 3 段の `if` で書くより、規則がそのまま読めます。

### 例外が重なる仕組み

2000 年は 100 の倍数ですが、400 の倍数でもあるので閏年です。1900 年は 100 の倍数で、400 の倍数ではないので閏年ではありません。この違いが、式の中の `or` で表されています。

### 短絡評価を利用する

`and` は左が偽なら右を評価しません。4 で割り切れない年（大半の年）では、後ろの判定を省くので、わずかに速くなります。

## まとめ

- 閏年の規則は、4、100、400 の 3 つの割り切れ方を組み合わせて表せる。
- 例外の規則は、`or` を使うと 1 行で書ける。
- `and` の短絡評価により、多くの年では後半の判定が省かれる。
