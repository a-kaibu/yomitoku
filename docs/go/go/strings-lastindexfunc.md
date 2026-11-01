---
title: "後ろから条件に合う文字の位置を探す strings.lastIndexFunc"
description: "strings.lastIndexFunc は、文字列を後ろから 1 文字ずつ見て、関数の結果が指定した真偽になる最初の位置を返します。UTF-8 の文字の境界を守って後ろへ戻ります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [922, 931]
function: "lastIndexFunc"
difficulty: 2
format: 2
tags: [文字列処理, Unicode, 探索, 標準ライブラリ]
---

## ひとことで

`TrimRightFunc` などの内部で、文字列の末尾から条件に合う文字を探すために使われます。末尾から、1 文字ずつ UTF-8 の境界を見ながら後ろへ戻ります。

## コード

```go:line-numbers=922
func lastIndexFunc(s string, f func(rune) bool, truth bool) int {
	for i := len(s); i > 0; {
		r, size := utf8.DecodeLastRuneInString(s[0:i])
		i -= size
		if f(r) == truth {
			return i
		}
	}
	return -1
}
```

## 前提知識

- **UTF-8 の後ろ向きの復号**: 末尾の 1 文字を読むには、後ろから続きのバイトを見て、文字の先頭を見つける必要があります。`utf8.DecodeLastRuneInString` がそれを行います。
- **`truth` の意味**: 条件の関数の結果と比べる真偽です。`true` を指定すると「条件に合う文字」、`false` を指定すると「合わない文字」を探します。
- **位置の意味**: 戻り値は、見つかった文字の先頭のバイト位置です。見つからなければ `-1` です。
- **`range` の代わり**: 文字列を後ろから回すので、`for range` では書けず、位置を手で動かします。

## 何をしているか

### 1. 末尾の 1 文字を読む

```go:line-numbers=923
	for i := len(s); i > 0; {
		r, size := utf8.DecodeLastRuneInString(s[0:i])
		i -= size
```

`i` は、まだ調べていない部分の終わりです。`DecodeLastRuneInString` で、その末尾の 1 文字と、そのバイト数を取り出します。バイト数だけ `i` を戻すと、文字の先頭まで下がれます。

### 2. 条件と比べる

```go:line-numbers=926
		if f(r) == truth {
			return i
		}
```

`f(r)` の結果が `truth` と一致したら、その文字の先頭の位置 `i` を返します。一致しなければ、さらに前の文字を調べます。

### 3. 見つからなければ -1

```go:line-numbers=930
	return -1
```

先頭まで調べても一致が無ければ、`-1` を返します。

## ここがすごい

- **文字の境界を壊さない**: バイト単位で後ろへ戻すのではなく、文字単位で戻るので、多バイトの文字が途中で切れません。
- **条件を一つの関数に集める**: 「末尾から探す」処理を 1 か所に書き、`TrimRightFunc` などが使い回せます。
- **真偽を引数にする**: `truth` で「合う」と「合わない」を切り替えられるので、同じ関数で両方の探索ができます。

## まとめ

- 末尾の文字を、UTF-8 の規則に従って 1 文字ずつ読む。
- 条件の結果が `truth` に一致した位置を返す。
- 見つからなければ `-1` を返す。
