---
title: "日付の曜日を求める time.Time.Weekday"
description: "time.Time.Weekday は、時刻の日付がどの曜日かを返します。時刻を絶対秒に直し、そこから日数を取り出して、曜日の計算を行います。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [838, 840]
function: "Weekday"
difficulty: 1
format: 2
tags: [日時, 数値計算, 標準ライブラリ]
---

## ひとことで

`t.Weekday()` は、`time.Sunday` から `time.Saturday` までの値を返します。2024 年 1 月 1 日なら `time.Monday` です。

## コード

```go:line-numbers=838
func (t Time) Weekday() Weekday {
	return t.absSec().days().weekday()
}
```

## 前提知識

- **`Weekday` 型**: 日曜を 0、土曜を 6 とする整数の型です。`String` メソッドで英語の名前に変えられます。
- **絶対秒**: 時刻を、ある基準の時点からの秒数で表した値です。内部の計算で使われます。
- **日数への変換**: 秒を 1 日の秒数で割ると、基準からの日数になります。
- **曜日の周期**: 曜日は 7 日ごとに繰り返すので、日数を 7 で割った余りで決まります。

## 何をしているか

### 1. 絶対秒から日数を取り出す

```go:line-numbers=839
	return t.absSec().days().weekday()
```

`t.absSec()` で、時刻を内部の絶対秒に直します。そのあと `days()` で、基準からの日数を取り出し、`weekday()` で曜日を計算します。

## ここがすごい

- **内部の計算を再利用する**: 日付や年の計算と同じ基準を使うので、曜日だけ別の規則を持つ必要がありません。
- **1 行で完結する**: 利用者からは、単に曜日を得る関数に見えます。
- **場所の影響を受けない**: 絶対秒は、時刻を場所の情報と切り離して扱うので、計算が一貫します。

## まとめ

- 時刻を絶対秒に直し、日数を取り出す。
- 日数から曜日を計算して返す。
- 内部の日付計算を再利用するので、規則が 1 か所にまとまっている。
