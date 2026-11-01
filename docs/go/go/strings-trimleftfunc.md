---
title: "先頭から条件に合う文字を取り除く strings.TrimLeftFunc"
description: "strings.TrimLeftFunc は、文字列の先頭から、条件の関数が true を返す文字を取り除きます。条件に合わない最初の文字の位置を indexFunc で探し、そこから後ろを残します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [868, 874]
function: "TrimLeftFunc"
difficulty: 1
format: 2
tags: [文字列処理, Unicode, 標準ライブラリ]
---

## ひとことで

`strings.TrimLeftFunc("  \tgo", unicode.IsSpace)` は `go` を返します。先頭の空白類を、条件に合わない文字に当たるまで取り除きます。

## コード

```go:line-numbers=868
func TrimLeftFunc(s string, f func(rune) bool) string {
	i := indexFunc(s, f, false)
	if i == -1 {
		return ""
	}
	return s[i:]
}
```

## 前提知識

- **条件の関数 `f`**: 1 文字を受け取り、取り除くかどうかを `bool` で返す関数です。
- **`indexFunc`**: 先頭から見て、条件の結果が指定した真偽になる最初の位置を探す関数です。
- **残す部分**: 取り除くのは先頭の連続した部分だけです。途中にある条件に合う文字は残ります。
- **`-1` の扱い**: 見つからなければ、残る文字が無いということです。

## 何をしているか

### 1. 残す文字の先頭を探す

```go:line-numbers=869
	i := indexFunc(s, f, false)
```

`indexFunc(s, f, false)` で、条件に合わない最初の文字の位置を探します。`false` を指定しているので、「`f` が false を返す文字」が残す側の先頭になります。

### 2. 見つからなければ空の文字列

```go:line-numbers=870
	if i == -1 {
		return ""
	}
```

すべての文字が条件に合っていたなら、残る文字は 1 つもありません。空の文字列を返します。

### 3. 先頭を捨てて残りを返す

```go:line-numbers=873
	return s[i:]
```

見つかった位置から後ろを、`s[i:]` で切り出して返します。切り出しなので、文字列の中身はコピーされません。

## ここがすごい

- **先頭だけを対象にする**: 途中の文字には触れないので、本文の中の空白などは残ります。
- **結果をコピーしない**: 残りは元の文字列の一部として返されるので、余分な領域を使いません。
- **`TrimRightFunc` と対になる**: 先頭版と末尾版が、同じ探索の仕組みを使って並んでいます。

## まとめ

- 残す文字の先頭を、`indexFunc` で探す。
- 見つからなければ空の文字列を返す。
- 見つかった位置から後ろを、コピーなしで返す。
