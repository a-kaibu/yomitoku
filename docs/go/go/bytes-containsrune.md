---
title: "文字列に指定した rune が含まれるかを調べる containsRune"
description: "bytes パッケージの containsRune。文字列を先頭から一文字ずつ読み、指定した rune と同じ文字があれば true を返す。見つからなければ false を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bytes/bytes.go"
lines: [977, 984]
function: "containsRune"
difficulty: 1
tags: [文字列処理, Unicode]
---

## ひとことで

`containsRune(s, r)` は、文字列 `s` の中に、文字 `r` が含まれるかどうかを調べます。含まれていれば `true`、なければ `false` を返します。

## コード

```go:line-numbers=977
func containsRune(s string, r rune) bool {
	for _, c := range s {
		if c == r {
			return true
		}
	}
	return false
}
```

## 前提知識

- **rune**: Unicode の一文字を表す整数の型です。
- **range による反復**: 文字列を `range` で回すと、バイトではなく、一文字ずつ取り出せます。
- **UTF-8**: 文字列の一文字が、1 から 4 バイトで表される形式です。`range` は、その切れ目を正しく扱います。

## 何をしているか

### 1. 一文字ずつ比べる

```go:line-numbers=978
	for _, c := range s {
		if c == r {
			return true
		}
	}
```

`s` を先頭から一文字ずつ取り出し、`r` と同じかを比べます。同じ文字が見つかった時点で、すぐ `true` を返します。

`range` は、`s` の中の文字を、左から右へ順に一つずつ渡します。先頭にある文字から比べていくので、途中で見つかれば、その後ろの文字は読まずに済みます。空の文字列なら、ループは一度も回らず、そのまま `false` になります。

### 2. 見つからなければ false を返す

```go:line-numbers=983
	return false
```

最後まで同じ文字がなければ、`false` を返します。

## ここがすごい

- **見つかった時点で止まる**: 見つけたら残りを読まないので、無駄な比較が減ります。
- **文字単位で比べる**: `range` が多バイトの文字を一つにまとめるので、バイトの途中で誤って比べることがありません。

## まとめ

- `containsRune` は、文字列に指定した文字があるかを調べます。
- 見つかった時点で、`true` を返します。
- 文字単位で比べるので、多バイトの文字も正しく扱えます。
