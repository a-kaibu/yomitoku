---
title: "通算日から年と年内の日を求める time の yearYday"
description: "time パッケージの absDays.yearYday。絶対日数から、西暦の年と、その年の中の何日目かを求める。世紀、年、1 月と 2 月からの日数の順に計算する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/time.go"
lines: [757, 763]
function: "yearYday"
difficulty: 3
tags: [日時, 数値計算]
---

## ひとことで

`days.yearYday()` は、基準日からの絶対日数 `days` を、西暦の年と、その年の中で何日目かに直します。`time` パッケージが日付を計算するときの土台になる関数です。

## コード

```go:line-numbers=757
func (days absDays) yearYday() (year, yday int) {
	century, cyear, ayday := days.split()
	janFeb := ayday.janFeb()
	year = century.year(cyear, janFeb)
	yday = ayday.yday(janFeb, century.leap(cyear))
	return
}
```

## 前提知識

- **絶対日数（absDays）**: ある基準日から数えた日数です。日付をひとつの整数で表せるので、計算が楽になります。
- **世紀と年**: 日数を 400 年の周期や、世紀の周期に分けて、その中の年を求めます。
- **1 月と 2 月**: うるう日の扱いを分かりやすくするために、年の始まりを 3 月にずらして数えることがあります。`janFeb` はそのずらした日数です。

## 何をしているか

### 1. 日数を世紀、年、年内の日に分ける

```go:line-numbers=758
	century, cyear, ayday := days.split()
	janFeb := ayday.janFeb()
```

`split` で、絶対日数を世紀、世紀の中の年、年の中の日に分けます。続けて、1 月と 2 月かどうかで必要なずらしを `janFeb` に求めます。

### 2. 年を求める

```go:line-numbers=760
	year = century.year(cyear, janFeb)
```

世紀と、その中の年、ずらしの情報から、西暦の年を求めます。

### 3. 年の中の日を求める

```go:line-numbers=761
	yday = ayday.yday(janFeb, century.leap(cyear))
	return
```

年が閏年かどうかも使って、年の中で何日目かを求めます。最後に、名前付きの戻り値 `year` と `yday` を返します。

## ここがすごい

- **名前付き戻り値で書く**: 戻り値に名前を付けているので、`return` だけで二つの値を返せます。
- **閏年の扱いを一か所に集める**: 閏年かどうかは `century.leap` で決めるので、年の計算の中に閏年の規則が散らばりません。

## まとめ

- `yearYday` は、絶対日数を西暦の年と年内の日に直します。
- 世紀、年、1 月と 2 月からのずらしの順に計算します。
- 閏年の判定は、専用の関数に任せます。
