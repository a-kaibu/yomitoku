---
title: 月の 1 日の曜日と、その月の日数を一緒に返す
description: calendar.monthrange は、指定した年月について、1 日の曜日と日数（28〜31）の組を返す。2 月の日数は閏年かどうかで変わり、その判定に isleap を使う。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/calendar.py
lines: [186, 192]
function: monthrange
difficulty: 2
format: 2
tags: [日時, 標準ライブラリ, 数値計算]
---

## ひとことで

`monthrange(year, month)` は、**その月の 1 日の曜日と、その月の日数** を組にして返す関数です。
`monthrange(2024, 2)` は `(3, 29)` を返します。2024 年 2 月 1 日は木曜日（3）で、2 月は 29 日まであります。

## コード

::: code-group

```python:line-numbers=186 [日本語訳]
def monthrange(year, month):
    """月の 1 日の曜日（0〜6、月〜日）を返す
       年と月について、その月の日数（28〜31）も合わせて返す。"""
    _validate_month(month)
    day1 = weekday(year, month, 1)
    ndays = mdays[month] + (month == FEBRUARY and isleap(year))
    return day1, ndays
```

```python:line-numbers=186 [原文]
def monthrange(year, month):
    """Return weekday of first day of month (0-6 ~ Mon-Sun)
       and number of days (28-31) for year, month."""
    _validate_month(month)
    day1 = weekday(year, month, 1)
    ndays = mdays[month] + (month == FEBRUARY and isleap(year))
    return day1, ndays
```

:::

`_validate_month` は、月が 1 から 12 の範囲かを確かめる関数です。`mdays` は、各月の日数を並べた表です。

## 前提知識

- **曜日の番号**: 月曜が 0、日曜が 6 です。
- **`mdays`**: 1 月から 12 月までの日数の表です。2 月は通常 28 日として入っています。
- **`isleap(year)`**: 閏年かどうかを返します。閏年の 2 月は、1 日増えます。
- **`True + 28`**: Python では `True` は `1` として計算されます。

## 何をしているか

### 1. 月を確かめる

```python:line-numbers=189
    _validate_month(month)
```

月が 1 から 12 でなければ、エラーにします。

### 2. 1 日の曜日を求める

```python:line-numbers=190
    day1 = weekday(year, month, 1)
```

`weekday(year, month, 1)` で、その月の 1 日の曜日を求めます。

### 3. 日数を求める

```python:line-numbers=191
    ndays = mdays[month] + (month == FEBRUARY and isleap(year))
```

表から、その月の日数を取ります。2 月なら、閏年のときだけ 1 日を足します。`True` は `1`、`False` は `0` として計算されるので、そのまま足せます。

### 4. 組にして返す

```python:line-numbers=192
    return day1, ndays
```

曜日と日数を、タプルで返します。

## ここがすごい

### 1 日の曜日から、月のカレンダーが組める

月のカレンダーを作るには、1 日の曜日と日数の 2 つがあれば十分です。この関数は、その 2 つを 1 回の呼び出しで返します。

### 閏年の特例を 1 行に

2 月だけは閏年で日数が変わります。`mdays[month] + (month == FEBRUARY and isleap(year))` で、その特例を表の値に足すだけです。

### 真偽値を数として足す

`isleap` の結果と月の判定は真偽値ですが、足し算で 0 か 1 として扱えます。条件分岐を書かずに、日数の調整ができます。

## まとめ

- 月のカレンダーには、1 日の曜日と日数があれば足りる。
- 閏年の特例は、表の値に真偽値を足すと 1 行で書ける。
- 入力の検証は、計算の前に済ませておくと、誤った月の計算を防げる。
