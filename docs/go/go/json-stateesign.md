---
title: "JSON の指数の符号を読む状態。符号の後に数字が必要"
description: "encoding/json のスキャナの stateESign。指数を表す e の直後の符号 + や - を読んだ後にいるときの状態。次の文字が数字なら、指数部へ進む。数字がなければ、指数の形が誤りだとして報告する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [478, 484]
function: "stateESign"
difficulty: 2
tags: [パース, 状態機械, 防御的プログラミング]
---

## ひとことで

`stateESign(s, c)` は、JSON の数値の指数部で、符号 `+` や `-` を読んだ後の状態です。例えば `1e+5` の `+` の次にいるときに使われます。符号の後には、必ず数字が必要です。

次の文字が数字なら、指数の数字を読む状態へ進みます。数字でなければ、指数の形が誤りなので、エラーを返します。

## コード

```go:line-numbers=478
func stateESign(s *scanner, c byte) int {
	if '0' <= c && c <= '9' {
		s.step = stateE0
		return scanContinue
	}
	return s.error(c, "in exponent of numeric literal")
}
```

## 前提知識

- **指数表記**: `1e+5` のように、10 のべき乗を `e` で表す書き方です。`1e+5` は `100000` を意味します。
- **符号**: 指数の前に付く `+` や `-` です。省略もできますが、付いたら後ろに数字が必要です。
- **`stateE0`**: 指数の数字を読む状態です。数字が続く間は、この状態に留まります。
- **誤りの報告**: `s.error` で、位置と理由を記録してエラーを返します。

## 何をしているか

### 1. 数字なら指数部へ進む

```go:line-numbers=479
	if '0' <= c && c <= '9' {
		s.step = stateE0
		return scanContinue
	}
```

符号の後の文字が数字なら、状態を `stateE0` に変えます。これで、指数の数字を読む準備ができます。

### 2. 数字でなければ誤りとする

```go:line-numbers=483
	return s.error(c, "in exponent of numeric literal")
```

数字でなければ、`1e+` のように指数が途中で切れています。`s.error` が、その文字と理由を記録して、エラーを返します。

## ここがすごい

- **符号と数字を分けて確かめる**: 符号は省略できても、符号の後の数字は必須です。その規則を、状態として分けて書いています。
- **途中で切れた数値を見つける**: `1e+` のように、数字が来ないまま終わる誤りを、正確に見つけられます。
- **状態の数が少ない**: 1 文字の判定と、次の状態の指定だけで済みます。読み手は、流れを簡単に追えます。

## まとめ

- `stateESign` は、指数の符号の直後の文字を見て、数字なら指数部へ進みます。
- 数字でなければ、指数の形が誤りだとしてエラーを返します。
- 符号の後に数字が必要という規則を、状態として表しています。
