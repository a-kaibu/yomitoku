---
title: "時刻の日を求める time.Time.Day"
description: "time.Time.Day は、時刻の月の中の日付を返します。年の中の日数を、月の中の日に直して返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [831, 835]
function: "Day"
difficulty: 1
format: 2
tags: [日時, 数値計算, 標準ライブラリ]
---

## ひとことで

`t.Day()` は、`1` から `31` までの日を返します。`2024-03-15` の時刻なら `15` です。日付の表示や、月末の判定などに使われます。

## コード

```go:line-numbers=831
func (t Time) Day() int {
	_, _, ayday := t.absSec().days().split()
	_, day := ayday.split()
	return day
}
```

## 前提知識

- **年の中の日数**: 1 月 1 日から数えた、その年の何日目かを表します。
- **年と月の日**: 年の中の日数を、月の中の日に直すと、日付の日の部分になります。
- **`split`**: 1 つの値を 2 つの部分に分ける内部の関数です。
- **`Month` との関係**: 月と日は、同じ年の中の日数から一緒に求められます。

## 何をしているか

### 1. 年の中の日数を取り出す

```go:line-numbers=832
	_, _, ayday := t.absSec().days().split()
```

`t.absSec().days()` で基準からの日数を求め、`split` で年の中の日数を取り出します。`_` は、使わない年の部分を捨てています。

### 2. 月の中の日を求める

```go:line-numbers=833
	_, day := ayday.split()
```

年の中の日数を、月の部分と日の部分に分けます。`day` が、月の中の日付です。

### 3. 日を返す

```go:line-numbers=834
	return day
```

求めた日を、そのまま返します。

## ここがすごい

- **年と月を共有する**: `Year` や `Month` と同じ分け方を使うので、日付の各部分が一致します。
- **不要な値を捨てる**: 使わない部分を `_` で捨てるので、何を使っているかが読み取れます。
- **1 行で日付が決まる**: 呼び出し側は、日の数字だけを受け取れます。

## まとめ

- 年の中の日数を、月の中の日に分けて返す。
- 年と月の計算と、同じ分け方を使う。
- 日の数字を、1 行で得られる。
