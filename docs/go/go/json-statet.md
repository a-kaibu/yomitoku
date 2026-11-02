---
title: "JSON の true を読む状態。t の次は r しか認めない"
description: "encoding/json のスキャナの stateT。値 true の先頭の文字 t を読んだ直後の状態。次の文字は必ず r でなければならず、そうでなければ true ではないとしてエラーを返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [497, 503]
function: "stateT"
difficulty: 1
tags: [パース, 状態機械, 防御的プログラミング]
---

## ひとことで

`stateT(s, c)` は、JSON の `true` を読んでいて、先頭の `t` の直後にいるときの状態です。次の文字は、必ず `r` でなければなりません。

`true` は、一文字ずつ `t`、`r`、`u`、`e` の順に読まれます。この関数は、その 2 文字目を確かめる役目を持ちます。

## コード

```go:line-numbers=497
func stateT(s *scanner, c byte) int {
	if c == 'r' {
		s.step = stateTr
		return scanContinue
	}
	return s.error(c, "in literal true (expecting 'r')")
}
```

## 前提知識

- **固定の綴り**: `true` の綴りは決まっています。途中の一文字が違えば、それは別の語です。
- **`stateTr`**: `tr` まで読んだ状態です。次に `u` を確かめる関数へ進みます。
- **`scanContinue`**: まだ値が続いていることを表す値です。
- **誤りの報告**: 期待した文字と違うときは、`s.error` で、何を期待していたかを伝えます。

## 何をしているか

### 1. r なら次の状態へ進む

```go:line-numbers=498
	if c == 'r' {
		s.step = stateTr
		return scanContinue
	}
```

文字が `r` なら、次の状態 `stateTr` に進みます。`t` と `r` が揃ったことを表します。

### 2. r でなければ誤りとする

```go:line-numbers=502
	return s.error(c, "in literal true (expecting 'r')")
```

`r` 以外の文字なら、`true` ではありません。エラーの理由には、「`r` を期待していた」と書かれます。どこで違ったかが分かります。

## ここがすごい

- **一文字ずつ綴りを確かめる**: 語全体を一度に比べず、一文字ずつ状態を進めます。途中で違えば、すぐに誤りを見つけられます。
- **期待する文字を明記**: エラーのメッセージに、期待していた文字が書かれます。利用者が原因を理解しやすくなっています。
- **状態を一つずつ持つ**: `t`、`tr`、`tru`、`true` と、それぞれの段階が別の関数です。流れが一目で分かる作りです。

## まとめ

- `stateT` は、`t` の次が `r` かを確かめます。
- `r` なら次の状態へ進み、それ以外は誤りとしてエラーを返します。
- 一文字ずつ綴りを確かめる、状態機械の典型的な形です。
