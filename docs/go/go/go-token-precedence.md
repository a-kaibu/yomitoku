---
title: "Go の二項演算子の優先順位を表す token.Precedence。5 段階で整理する"
description: "go/token の Precedence。論理演算子、比較、加減、乗除の 5 段階に演算子を分けて、式の結合の強さを数字で返す。数字が大きいほど先に計算される。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/go/token/token.go"
lines: [266, 280]
function: "Precedence"
difficulty: 2
tags: [パース, イディオム, コンパイラ]
---

## ひとことで

`a + b * c` を `(a + b) * c` ではなく `a + (b * c)` と読むのは、演算子に **優先順位** があるからです。`token.Precedence` は、各演算子がどのくらい強く結びつくかを数字で返します。数字が大きいほど、先に計算されます。

Go の文法を解析するツールは、この関数を使って式の木を正しい形に組み立てます。

## コード

```go:line-numbers=266
func (op Token) Precedence() int {
	switch op {
	case LOR:
		return 1
	case LAND:
		return 2
	case EQL, NEQ, LSS, LEQ, GTR, GEQ:
		return 3
	case ADD, SUB, OR, XOR:
		return 4
	case MUL, QUO, REM, SHL, SHR, AND, AND_NOT:
		return 5
	}
	return LowestPrec
}
```

## 前提知識

- **優先順位**: 同じ式の中で、どの演算子を先に計算するかを決めるルールです。`*` は `+` より先に計算されます。
- **演算子の種類**: `LOR`（`||`）、`LAND`（`&&`）、`EQL`（`==`）、`ADD`（`+`）、`MUL`（`*`）などの、トークンの名前です。
- **`LowestPrec`**: 演算子ではないものに与える、最も低い優先順位の値です。0 です。
- **式の木**: 式を、演算子を親、オペランドを子とする木の形で表したものです。優先順位が高いほど、木の下のほうに入ります。

## 何をしているか

### 1. 論理和と論理積

```go:line-numbers=267
	switch op {
	case LOR:
		return 1
	case LAND:
		return 2
```

`||` は最も弱く結びつくので、優先順位は 1 です。`&&` はそれより強く、2 です。`a || b && c` は `a || (b && c)` になります。

### 2. 比較と四則演算

```go:line-numbers=272
	case EQL, NEQ, LSS, LEQ, GTR, GEQ:
		return 3
	case ADD, SUB, OR, XOR:
		return 4
```

`==`、`<` などの比較は 3 です。`+`、`-`、`|`、`^` は 4 です。比較は、加減算より弱く結びつきます。`a + b == c` は `(a + b) == c` になります。

### 3. 乗除とシフト

```go:line-numbers=276
	case MUL, QUO, REM, SHL, SHR, AND, AND_NOT:
		return 5
	}
	return LowestPrec
```

`*`、`/`、`%`、シフト、`&` は最も強く結びつくので 5 です。どれにも当てはまらなければ、演算子ではないので `LowestPrec` を返します。

## ここがすごい

- **同じ段階は同じ数字**: 同じ優先順位の演算子を、1 つの `case` にまとめています。数字の表を別に持つ必要がありません。
- **`&` が乗算側にある**: `a + b & c` は、Go では `a + (b & c)` になります。C 言語と違う点で、`&` を乗算と同じ強さに置くことで、この仕様を表しています。
- **未知の値を安全に返す**: 演算子でない値には `LowestPrec` を返すので、解析の処理で誤った結合が起きません。

## まとめ

- `Precedence` は、二項演算子の結合の強さを数字で返します。
- 論理和 1、論理積 2、比較 3、加減 4、乗除とシフト 5 です。
- 数字が大きいほど、先に計算されます。
- 演算子でないものには、最低の `LowestPrec` を返します。
