---
title: "経過日数から年月日を求める absDays.date。百年や四百年の周期で分けて計算する"
description: "time パッケージの absDays.date。1970 年からの経過日数を、年・月・日に変換する。日付を一度に求めず、四百年周期、百年周期、四年周期に分けて、閏年の計算を整理している。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/time.go"
lines: [747, 754]
function: "date"
difficulty: 3
tags: [日時, 数値計算, アルゴリズム]
---

## ひとことで

`days.date()` は、基準の日から数えた日数を、年・月・日の 3 つに変換します。例えば、基準から 0 日目なら、その日の年・月・日を返します。

カレンダーの計算は、閏年があるので複雑です。この関数は、日数を大きな周期に分けて、一つずつ小さくしていくことで、閏年を正しく扱います。

## コード

```go:line-numbers=747
func (days absDays) date() (year int, month Month, day int) {
	century, cyear, ayday := days.split()
	amonth, day := ayday.split()
	janFeb := ayday.janFeb()
	year = century.year(cyear, janFeb)
	month = amonth.month(janFeb)
	return
}
```

## 前提知識

- **閏年**: 2 月が 29 日まである年です。4 年に 1 度ですが、100 年に 1 度は閏年ではなく、400 年に 1 度は閏年になります。
- **周期**: 同じ並びが繰り返される長さです。ここでは、400 年、100 年、4 年の 3 つの周期を使います。
- **`split`**: 日数を、周期ごとの値に分ける内部の関数です。`century`、`cyear`、`ayday` の 3 つに分けます。
- **年の始まり**: この計算では、年を 3 月から始めて数えます。2 月の閏日を、年の最後に回すと、計算が簡単になるからです。

## 何をしているか

### 1. 日数を周期に分ける

```go:line-numbers=748
	century, cyear, ayday := days.split()
	amonth, day := ayday.split()
```

まず、日数を 400 年周期の「世紀」と、その中の年、そして年の中の日に分けます。次に、年の中の日を、月と日に分けます。この段階で、多くの計算がすでに終わっています。

### 2. 3 月始まりの位置を求める

```go:line-numbers=750
	janFeb := ayday.janFeb()
```

`janFeb` は、1 月と 2 月にあたるかを示す値です。3 月から数えるため、1 月と 2 月は年の後ろに回されます。その判定を、ここで行います。

### 3. 年と月を組み立てる

```go:line-numbers=751
	year = century.year(cyear, janFeb)
	month = amonth.month(janFeb)
	return
```

世紀と年から、西暦の年を求めます。1 月と 2 月なら、年を 1 つ戻す必要があるので、`janFeb` を使って調整します。月も同じように、3 月始まりの値から、実際の月に戻します。

## ここがすごい

- **大きな周期から小さい周期へ**: 400 年、100 年、4 年、1 年と順に分けていくので、閏年の例外をまとめて処理できます。
- **年の始まりを 3 月に**: 閏日を年末に回すと、2 月の日数の違いを、ひとつの式で扱えます。考え方を一度決めると、他の計算も単純になります。
- **役割の分担**: 日数を分ける処理、年を求める処理、月を求める処理が、それぞれ別の関数です。`date` は、それらを組み合わせるだけです。

## まとめ

- `date` は、基準からの日数を、年・月・日に変換します。
- 閏年の規則を、400 年、100 年、4 年の周期で分けて扱います。
- 3 月始まりで数えることで、閏日の扱いを簡単にしています。
