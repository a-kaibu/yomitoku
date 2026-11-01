---
title: 年・月・日から曜日を求め、範囲外の年は 400 年周期に移す
description: calendar.weekday は、年・月・日から曜日（月曜を 0 とする 0〜6）を返す。datetime が扱えない範囲の年は、グレゴリオ暦の 400 年周期を使って近い年に移してから計算する。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/calendar.py
lines: [175, 179]
function: weekday
difficulty: 2
format: 2
tags: [日時, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`weekday(year, month, day)` は、**その日が何曜日か** を返す関数です。
月曜が `0`、日曜が `6` です。`weekday(2026, 11, 1)` は、その日の曜日を表す値を返します。

## コード

::: code-group

```python:line-numbers=175 [日本語訳]
def weekday(year, month, day):
    """年、月（1〜12）、日（1〜31）から曜日（0〜6、月〜日）を返す。"""
    if not datetime.MINYEAR <= year <= datetime.MAXYEAR:
        year = 2000 + year % 400
    return Day(datetime.date(year, month, day).weekday())
```

```python:line-numbers=175 [原文]
def weekday(year, month, day):
    """Return weekday (0-6 ~ Mon-Sun) for year, month (1-12), day (1-31)."""
    if not datetime.MINYEAR <= year <= datetime.MAXYEAR:
        year = 2000 + year % 400
    return Day(datetime.date(year, month, day).weekday())
```

:::

`datetime.MINYEAR` と `datetime.MAXYEAR` は、`datetime` モジュールで扱える年の最小と最大です。`Day` は、曜日を表す列挙型です。

## 前提知識

- **曜日の番号**: この関数では、月曜が 0、火曜が 1、……日曜が 6 です。
- **グレゴリオ暦の 400 年周期**: 400 年たつと、閏年のパターンも曜日の並びも、ちょうど元に戻ります。
- **`datetime.date(y, m, d)`**: 年月日から日付のオブジェクトを作ります。範囲外の年では `ValueError` になります。
- **列挙型（Enum）**: 決まった候補の名前と値を持つ型です。`Day.MONDAY` のように使います。

## 何をしているか

### 1. 年が扱える範囲か確かめる

```python:line-numbers=177
    if not datetime.MINYEAR <= year <= datetime.MAXYEAR:
        year = 2000 + year % 400
```

`datetime` が扱える年の範囲外なら、年を 2000 年から 2399 年の間に移します。`year % 400` を使うのは、400 年周期で曜日がちょうど戻るからです。

### 2. 日付から曜日を求めて返す

```python:line-numbers=179
    return Day(datetime.date(year, month, day).weekday())
```

`datetime.date` で日付を作り、その `weekday()` を取ります。結果は `Day` という列挙型に包んで返します。

## ここがすごい

### 周期性で範囲外も計算できる

400 年の間に、閏年の数も曜日の並びも同じパターンを繰り返します。そのため、遠い年でも、同じ周期の近い年に移せば、正しい曜日が求まります。

### 年を移す計算が 1 行

`2000 + year % 400` は、どんな年でも 2000 年から 2399 年のどれかに収めます。範囲に入らない年を例外にせず、計算で扱える形にしています。

### 列挙型で値の意味を明確にする

曜日を単なる数で返すと、0 が何を意味するか分かりにくくなります。`Day` という型に包むことで、意味を名前で表せます。

## まとめ

- 曜日は、日付のオブジェクトを作ると簡単に求まる。
- 周期がある数の性質を使うと、扱える範囲の外の値も計算できる。
- 数の結果は、列挙型に包むと読み手に意味が伝わる。
