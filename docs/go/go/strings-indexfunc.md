---
title: "前から条件に合う文字の位置を探す strings.indexFunc"
description: "strings.indexFunc は、文字列を先頭から 1 文字ずつ見て、関数の結果が指定した真偽になる最初の位置を返します。range 文によって、文字の境界が自動的に守られます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [910, 917]
function: "indexFunc"
difficulty: 1
format: 2
tags: [文字列処理, Unicode, 探索, 標準ライブラリ]
---

## ひとことで

`strings.IndexFunc("abc123", unicode.IsDigit)` は `3` を返します。先頭から見て、最初に数字になる位置です。`TrimLeftFunc` などの土台として使われます。

## コード

```go:line-numbers=910
func indexFunc(s string, f func(rune) bool, truth bool) int {
	for i, r := range s {
		if f(r) == truth {
			return i
		}
	}
	return -1
}
```

## 前提知識

- **`range` と文字列**: 文字列を `range` で回すと、1 文字ずつ取り出せます。添字は、その文字の先頭のバイト位置になります。
- **条件の関数**: 1 文字を受け取り、真偽を返す関数です。
- **`truth`**: 関数の結果と比べる値です。`true` で「一致」、`false` で「不一致」を探します。
- **`-1` の意味**: 見つからなかったことを表す慣用の値です。

## 何をしているか

### 1. 先頭から 1 文字ずつ見る

```go:line-numbers=911
	for i, r := range s {
```

`range s` で、文字の位置 `i` と文字 `r` を先頭から順に取り出します。Go の `range` は、UTF-8 の文字の境界を自動的に守ります。

### 2. 条件の結果を比べる

```go:line-numbers=912
		if f(r) == truth {
			return i
		}
```

`f(r)` の結果が `truth` と一致したら、その文字の位置 `i` を返します。最初に一致した位置で止まります。

### 3. 見つからなければ -1

```go:line-numbers=916
	return -1
```

最後まで一致が無ければ、`-1` を返します。

## ここがすごい

- **文字の境界を任せる**: `range` が文字単位で回るので、バイト単位の計算を書かずに済みます。
- **条件を一つにまとめる**: 「一致」と「不一致」を `truth` で切り替え、同じ関数で両方の探索ができます。
- **最初の一致で止まる**: 余分な走査をしないので、先頭の方に目的の文字があれば速く終わります。

## まとめ

- `range` で、文字の境界を守りながら先頭から見る。
- 条件の結果が `truth` に一致した最初の位置を返す。
- 見つからなければ `-1` を返す。
