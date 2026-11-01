---
title: "バイト列を 1 文字ずつの rune の列にする bytes.Runes"
description: "bytes.Runes は、UTF-8 のバイト列を先頭から 1 文字ずつ読み、rune のスライスにします。先に文字数を数えて配列の大きさを決めるので、途中で作り直すことがありません。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/bytes.go"
lines: [1174, 1184]
function: "Runes"
difficulty: 1
format: 2
tags: [Unicode, 文字列処理, 標準ライブラリ]
---

## ひとことで

`bytes.Runes([]byte("あいう"))` は、`[あ い う]` の 3 つの `rune` を並べたスライスを返します。バイトのままでは見えない文字の単位を、1 つずつ取り出したいときに使います。

## コード

```go:line-numbers=1174
func Runes(s []byte) []rune {
	t := make([]rune, utf8.RuneCount(s))
	i := 0
	for len(s) > 0 {
		r, l := utf8.DecodeRune(s)
		t[i] = r
		i++
		s = s[l:]
	}
	return t
}
```

## 前提知識

- **`rune` のスライス**: `[]rune` は、1 文字ずつの値を並べたものです。文字の数と、要素の数が一致します。
- **`utf8.RuneCount`**: バイト列の中に、文字がいくつあるかを数えます。バイト数とは違うことに注意します。
- **`utf8.DecodeRune`**: 先頭の 1 文字を読み、その文字と、使ったバイト数を返します。
- **`make` と容量**: 大きさを先に決めて確保すると、途中で配列を作り直さずに済みます。

## 何をしているか

### 1. 文字の数だけ配列を用意する

```go:line-numbers=1175
	t := make([]rune, utf8.RuneCount(s))
```

`utf8.RuneCount` で、文字の数を先に数えます。その数の要素を持つ `[]rune` を、一度だけ確保します。文字数が分かっているので、`append` で何度も伸ばす必要がありません。

### 2. 先頭から 1 文字ずつ読む

```go:line-numbers=1176
	i := 0
	for len(s) > 0 {
		r, l := utf8.DecodeRune(s)
		t[i] = r
		i++
		s = s[l:]
```

`utf8.DecodeRune` で先頭の文字を読み、`t[i]` に入れます。`l` は使ったバイト数なので、`s = s[l:]` で、その文字の分だけ先へ進みます。残りのバイトが無くなるまで繰り返します。

### 3. 結果を返す

```go:line-numbers=1183
	return t
```

読み終えた `t` を返します。作ったスライスの長さは、先に数えた文字数と同じです。

## ここがすごい

- **二度走査して、配列を一度で作る**: 数えるために 1 回、読むために 1 回と、2 回だけバイト列を見ます。その代わり、確保は 1 回で済みます。
- **バイト数に頼らない**: 文字が 1 バイトとは限らないので、`l` の値で次の位置を決めています。位置を 1 つずつ数えると、日本語などで壊れてしまいます。
- **不正な UTF-8 も止まらない**: `DecodeRune` は、壊れたバイトを `RuneError` として 1 バイト進めて返すので、最後まで進みます。

## まとめ

- 文字の数を先に数えて、`[]rune` を一度に確保する。
- `DecodeRune` が返すバイト数で、次の文字の位置へ進む。
- バイト列の長さと、文字の数は違うので、区別して扱う。
