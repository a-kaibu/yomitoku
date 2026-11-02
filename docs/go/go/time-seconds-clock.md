---
title: "一日の秒数から時・分・秒を求める absSeconds.clock。割り算と引き算で分ける"
description: "time パッケージの absSeconds.clock。一日の中の秒数を、時・分・秒に分ける。一日の長さで余りを取り、時で割った残りを分で割るという、筆算と同じ流れで求める。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/time.go"
lines: [875, 882]
function: "clock"
difficulty: 1
tags: [日時, 数値計算, 可読性]
---

## ひとことで

`abs.clock()` は、一日の始まりからの秒数を、時・分・秒の 3 つに分けて返します。例えば `3661` 秒は、1 時 1 分 1 秒です。

一日を超える秒数が入っても、この関数は一日の中の時刻だけを取り出します。その後で、時、分、秒を順番に切り出します。

## コード

```go:line-numbers=875
func (abs absSeconds) clock() (hour, min, sec int) {
	sec = int(abs % secondsPerDay)
	hour = sec / secondsPerHour
	sec -= hour * secondsPerHour
	min = sec / secondsPerMinute
	sec -= min * secondsPerMinute
	return
}
```

## 前提知識

- **一日の秒数**: 1 日は 86400 秒です。一日を超えた秒数は、余りを取れば、その日の中の時刻になります。
- **割り算と余り**: 時は、秒を 3600 で割った商です。残った秒を、今度は 60 で割れば、分になります。
- **`secondsPerDay`、`secondsPerHour`、`secondsPerMinute`**: 1 日、1 時間、1 分の秒数を表す定数です。
- **`absSeconds`**: 基準からの秒数を表す、この時刻計算の内部の型です。

## 何をしているか

### 1. 一日の中の秒数を取り出す

```go:line-numbers=876
	sec = int(abs % secondsPerDay)
```

`abs` を 1 日の秒数で割った余りを取ります。これで、日付を無視して、その日の中の何秒目かが分かります。

### 2. 時を求める

```go:line-numbers=877
	hour = sec / secondsPerHour
	sec -= hour * secondsPerHour
```

秒を 3600 で割った商が、時です。割り切れなかった分を、`sec` から引いておきます。残りは、その時間の中での秒数です。

### 3. 分と秒を求める

```go:line-numbers=879
	min = sec / secondsPerMinute
	sec -= min * secondsPerMinute
```

残った秒を 60 で割った商が分です。同じように引き算をすると、最後に残るのが秒です。

## ここがすごい

- **筆算と同じ流れ**: 大きい単位から順に割り、余りを次の単位へ渡します。時計の仕組みを、そのまま式にしています。
- **引き算で余りを保つ**: 割り算の余りを、わざわざ `%` で取り直さず、`sec` から引くことで求めています。どの単位の値も、一度の計算で確定します。
- **短い関数に限る**: 6 行ほどの中で、日、時、分、秒が全部求まります。読み手は、ひとつずつ順に追うだけで理解できます。

## まとめ

- `clock` は、一日の秒数を時・分・秒に分けて返します。
- 一日の余りを取り、時、分、秒の順に割り算と引き算で求めます。
- 大きい単位から順に処理する、筆算と同じ流れです。
