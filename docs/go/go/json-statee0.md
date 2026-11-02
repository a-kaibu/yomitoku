---
title: "JSON の指数の数字を読む状態。数字が続く間は留まり、そうでなければ値を閉じる"
description: "encoding/json のスキャナの stateE0。指数部の数字を読んでいる状態。数字が続く間は同じ状態に留まり、数字でなくなったら、値の終わりとして stateEndValue に渡す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [489, 494]
function: "stateE0"
difficulty: 1
tags: [パース, 状態機械, 数値計算]
---

## ひとことで

`stateE0(s, c)` は、JSON の数値の指数部で、数字を読んでいる状態です。例えば `1e+10` の `10` の部分で使われます。次の文字が数字なら、同じ状態に留まります。数字でなくなったら、数値が終わったものとして次の処理に任せます。

## コード

```go:line-numbers=489
func stateE0(s *scanner, c byte) int {
	if '0' <= c && c <= '9' {
		return scanContinue
	}
	return stateEndValue(s, c)
}
```

## 前提知識

- **指数部**: `e` の後ろの、10 のべき乗を表す部分です。`1e+10` の `+10` が指数部です。
- **数値の終わり**: 数字でない文字が来たら、数値は終わりです。次に来る `,` や `}` などを、値の終わりとして扱います。
- **`stateEndValue`**: 値が終わった後の処理をする状態です。区切りの記号が正しいかを確かめます。
- **`scanContinue`**: まだ値が続いていることを表す値です。

## 何をしているか

### 1. 数字が続く間は留まる

```go:line-numbers=490
	if '0' <= c && c <= '9' {
		return scanContinue
	}
```

文字が数字なら、状態を変えずに、`scanContinue` を返します。指数の数字が、まだ続いていることを表します。

### 2. 数字でなければ値を閉じる

```go:line-numbers=493
	return stateEndValue(s, c)
```

数字でなければ、指数部は終わりです。その文字を `stateEndValue` に渡して、値の終わりとして次の区切りを確かめてもらいます。

## ここがすごい

- **状態を変えずに留まる**: 数字が続く間は、関数が自分自身の状態を保ち続けます。読み進むたびに、同じ判定を繰り返すだけで済みます。
- **終わりの判断を次に任せる**: 数字でないときは、どんな文字なのかを自分では決めません。後続の状態が、区切りかどうかを判断します。
- **短い関数に限る**: 判定は一つだけで、残りは別の状態に渡します。役割がはっきり分かれています。

## まとめ

- `stateE0` は、指数の数字が続く間は同じ状態に留まります。
- 数字でなくなったら、値の終わりを `stateEndValue` に任せます。
- 数字の続きと、値の終わりの判断を、別々の状態に分けています。
