---
title: "時刻の月を求める time.Time.Month"
description: "time.Time.Month は、時刻の月を time.Month の値で返します。年の中の日数から、その日が何月かを計算します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [824, 828]
function: "Month"
difficulty: 2
format: 2
tags: [日時, 数値計算, 標準ライブラリ]
---

## ひとことで

`t.Month()` は、`time.March` のような月の値を返します。`Month` 型の `String` メソッドを使うと、英語の月名になります。

## コード

```go:line-numbers=824
func (t Time) Month() Month {
	_, _, ayday := t.absSec().days().split()
	amonth, _ := ayday.split()
	return amonth.month(ayday.janFeb())
}
```

## 前提知識

- **`Month` 型**: 1 月から 12 月までを表す整数の型です。
- **年の中の日数**: 1 月 1 日から数えた、その年の何日目かを表します。
- **`janFeb`**: 1 月と 2 月の扱いを表す内部の基準です。閏年の計算にも使われます。
- **月の分け方**: 年の中の日数から、どの月に入るかを求める内部の処理です。

## 何をしているか

### 1. 年の中の日数を取り出す

```go:line-numbers=825
	_, _, ayday := t.absSec().days().split()
```

`t.absSec().days()` で基準からの日数を求め、`split` で年の中の日数 `ayday` を取り出します。

### 2. 月を計算する

```go:line-numbers=826
	amonth, _ := ayday.split()
	return amonth.month(ayday.janFeb())
```

`split` で月に関わる番号を分け、`month` で月の値に直します。`janFeb` の基準を使うので、閏年の 2 月も正しく扱えます。

## ここがすごい

- **年の計算と同じ部品を使う**: `Year` と分け方を共有しているので、年と月が食い違いません。
- **閏年を特別扱いしない**: 基準を 1 つ用意するだけで、月の境目が正しく決まります。
- **型で月を表す**: 数字ではなく `Month` の値を返すので、比べたり表示したりしやすくなります。

## まとめ

- 年の中の日数から、月の番号を計算する。
- `Year` と同じ部品を使い、食い違いを防ぐ。
- `Month` 型の値として返すので、扱いやすい。
