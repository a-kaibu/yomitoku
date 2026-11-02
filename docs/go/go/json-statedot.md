---
title: "JSON の小数点の後ろを読む状態。数字が続かなければエラーにする"
description: "encoding/json のスキャナの stateDot。数値の小数点を読んだ直後にいるときの状態。次の文字が数字なら、小数部の状態へ進む。数字でなければ、小数点の後ろに数字がないという誤りとして報告する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [445, 451]
function: "stateDot"
difficulty: 2
tags: [パース, 状態機械, 防御的プログラミング]
---

## ひとことで

`stateDot(s, c)` は、JSON の数値で小数点 `.` を読んだ直後の状態です。小数点の後ろには、必ず数字が来なければなりません。例えば `1.5` は正しく、`1.` や `1.a` は誤りです。

この関数は、次の文字を見て、数字なら小数部の状態へ進みます。数字でなければ、誤った形として即座にエラーを返します。

## コード

```go:line-numbers=445
func stateDot(s *scanner, c byte) int {
	if '0' <= c && c <= '9' {
		s.step = stateDot0
		return scanContinue
	}
	return s.error(c, "after decimal point in numeric literal")
}
```

## 前提知識

- **状態機械**: 今の状態と次の文字で、次の状態が決まります。`s.step` に次の関数を入れておく仕組みです。
- **小数点**: 数値の整数部と小数部を分ける記号 `.` です。JSON では、小数点の後ろに数字が必要です。
- **`stateDot0`**: 小数点の後ろの数字を読む状態です。数字が続く間は、この状態に留まります。
- **`s.error`**: 誤りの位置と理由を記録して、エラーを返す内部の関数です。

## 何をしているか

### 1. 数字なら小数部へ進む

```go:line-numbers=446
	if '0' <= c && c <= '9' {
		s.step = stateDot0
		return scanContinue
	}
```

次の文字が数字なら、状態を `stateDot0` に変えます。小数部の読み取りが始まったことを表し、`scanContinue` を返します。

### 2. 数字でなければ誤りとする

```go:line-numbers=450
	return s.error(c, "after decimal point in numeric literal")
```

数字でなければ、小数点の後ろの形が正しくありません。`s.error` が、どの文字で問題が起きたかと、理由を記録してエラーを返します。

## ここがすごい

- **誤りを早く見つける**: `1.` のような途中で止まった数値を、読んだ瞬間に見つけられます。
- **理由を具体的に伝える**: 誤りのメッセージには、「小数点の後ろ」という場所が含まれます。どこを直せばいいかが分かります。
- **一つの文字で判断する**: 次の 1 文字だけで、正しい道か誤りかが決まります。小さな状態の集まりで、解析を組み立てています。

## まとめ

- `stateDot` は、小数点の直後の文字を見て、数字なら小数部へ進みます。
- 数字でなければ、理由を付けたエラーを返します。
- 1 文字ずつ、正しい形かどうかを確かめる仕組みです。
