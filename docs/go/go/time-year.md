---
title: "時刻の年を求める time.Time.Year"
description: "time.Time.Year は、時刻の西暦の年を返します。内部の日数を、世紀、世紀内の年、年の中の日数に分けて、年を計算します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [817, 821]
function: "Year"
difficulty: 2
format: 2
tags: [日時, 数値計算, 標準ライブラリ]
---

## ひとことで

`t.Year()` は、`2024` のような西暦の年を返します。日付の一部を取り出すときに、最初に使われる関数の一つです。

## コード

```go:line-numbers=817
func (t Time) Year() int {
	century, cyear, ayday := t.absSec().days().split()
	janFeb := ayday.janFeb()
	return century.year(cyear, janFeb)
}
```

## 前提知識

- **絶対秒と日数**: 時刻は、基準からの秒数で内部に持たれています。秒を日数に直すと、日付を計算しやすくなります。
- **世紀と年**: 日数を 400 年の周期で分けると、年の計算が簡単になります。`split` は、その分け方を行う内部の関数です。
- **年初からの日数**: 年の中の何日目かを表す値です。`janFeb` は、年の並べ替えの基準になる内部の値です。
- **`century` と `cyear`**: 世紀の番号と、その世紀の中での年を表します。

## 何をしているか

### 1. 時刻を日数に直して分ける

```go:line-numbers=818
	century, cyear, ayday := t.absSec().days().split()
```

`t.absSec().days()` で、時刻を基準からの日数にします。`split` で、世紀、世紀内の年、年の中の日数の 3 つに分けます。

### 2. 年の並べ方の基準を求める

```go:line-numbers=819
	janFeb := ayday.janFeb()
```

`janFeb` で、1 月と 2 月の並べ方の基準を求めます。閏年の 2 月 29 日を、正しく扱うための準備です。

### 3. 西暦の年を組み立てる

```go:line-numbers=820
	return century.year(cyear, janFeb)
```

世紀と世紀内の年、基準を使って、西暦の年を組み立てて返します。

## ここがすごい

- **日付計算を 1 か所に集める**: 年、月、日の計算が、同じ分け方を使うので、食い違いが起きにくいです。
- **閏年を計算で扱う**: 年の中の日数と基準を使うので、閏年の日数も特別な表を持たずに済みます。
- **利用者には 1 行**: 中の計算は隠れて、呼び出し側は年だけを受け取ります。

## まとめ

- 時刻を日数に直し、世紀、年、年の中の日数に分ける。
- 閏年を含めた基準を使って、西暦の年を組み立てる。
- 利用者からは、年を 1 行で得られる。
