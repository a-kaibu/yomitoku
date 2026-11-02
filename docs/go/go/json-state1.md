---
title: "JSON の数字の並びを読む状態。数字が続く間は同じ状態に留まる"
description: "encoding/json のスキャナの state1。数字の続きを読む状態で、0 から 9 の文字が来ている間はこの状態に留まり、それ以外の文字は state0 に渡して、数字の終わりを判断する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [422, 428]
function: "state1"
difficulty: 2
tags: [パース, 状態機械, 数値計算]
---

## ひとことで

`state1(s, c)` は、JSON の数字を読んでいて、先頭の数字の後ろにいるときの状態です。次の文字が数字なら、同じ状態に留まります。数字でなければ、数字の終わりとして別の状態へ渡します。

例えば `123` を読むとき、`1` の後にこの状態が続きます。`2` と `3` も同じ処理を通ります。

## コード

```go:line-numbers=422
func state1(s *scanner, c byte) int {
	if '0' <= c && c <= '9' {
		s.step = state1
		return scanContinue
	}
	return state0(s, c)
}
```

## 前提知識

- **状態機械**: 今の状態と次の文字で、次の状態が決まる仕組みです。`s.step` に、次に呼ぶ関数を入れておきます。
- **`state0`**: 数字の並びの前半、例えば先頭の `0` の後ろなど、別の規則を持つ状態です。
- **`scanContinue`**: まだ値が続いていることを表す値です。
- **数字の範囲**: `'0'` から `'9'` の文字は、番号が連続しています。その性質で、数字かを判定できます。

## 何をしているか

### 1. 数字が続く間は同じ状態に留まる

```go:line-numbers=423
	if '0' <= c && c <= '9' {
		s.step = state1
		return scanContinue
	}
```

文字 `c` が数字なら、次も同じ状態 `state1` を使うように `s.step` を設定します。`scanContinue` を返して、数字の並びがまだ続くことを伝えます。

### 2. 数字でなければ別の状態に任せる

```go:line-numbers=427
	return state0(s, c)
```

数字でなければ、数字の並びは終わったかもしれません。この文字を `state0` に渡して、小数点、指数、区切りの記号などを判定してもらいます。

## ここがすごい

- **状態が自分自身を指す**: 数字が続く限り、`s.step` が同じ関数を指し続けます。繰り返しを、ループではなく状態の遷移で表しています。
- **判定の範囲が狭い**: 数字だけを見る短い関数です。その他の判定は、次の状態に任せています。
- **役割の分担**: 数字の続きだけを担当し、数字の後の規則は `state0` が持っています。関数ごとに、やることが明確です。

## まとめ

- `state1` は、数字が続いている間の状態です。
- 数字なら同じ状態に留まり、`scanContinue` を返します。
- 数字でなければ、`state0` に判断を任せます。
