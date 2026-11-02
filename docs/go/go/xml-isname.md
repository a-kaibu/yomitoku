---
title: "XML の名前として正しい並びかを調べる isName。先頭と残りで許す文字を変える"
description: "encoding/xml の isName。バイト列全体が XML の名前として正しいかを返す。先頭の文字は英字や _ などの「first」の集合から、残りは「second」も含めた集合から選ぶ。UTF-8 の文字を一つずつ読んで判定する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/xml/xml.go"
lines: [1243, 1265]
function: "isName"
difficulty: 2
tags: [パース, Unicode, 防御的プログラミング]
---

## ひとことで

`isName(s)` は、バイト列 `s` が XML の名前として正しいかを返します。例えば `book-1` は正しく、`1book` は誤りです。先頭に数字は置けないからです。

先頭の文字と、その後の文字では、使える種類が違います。この関数は、その規則を Unicode の文字の集まりで確かめます。

## コード

```go:line-numbers=1243
func isName(s []byte) bool {
	if len(s) == 0 {
		return false
	}
	c, n := utf8.DecodeRune(s)
	if c == utf8.RuneError && n == 1 {
		return false
	}
	if !unicode.Is(first, c) {
		return false
	}
	for n < len(s) {
		s = s[n:]
		c, n = utf8.DecodeRune(s)
		if c == utf8.RuneError && n == 1 {
			return false
		}
		if !unicode.Is(first, c) && !unicode.Is(second, c) {
			return false
		}
	}
	return true
}
```

## 前提知識

- **UTF-8**: 1 文字を 1 バイト以上で表す文字コードです。日本語などは、複数バイトで表されます。`utf8.DecodeRune` は、先頭の 1 文字を取り出す関数です。
- **`utf8.RuneError`**: 文字として読めなかったことを表す値です。不正な並びを検出するために使います。
- **`first` と `second`**: XML の規格で定められた、名前の先頭と、その後で使える文字の集まりです。`unicode.Is` で、文字がその集まりに含まれるかを調べます。
- **名前の規則**: 先頭は英字など限られた文字、その後は数字や記号も許される、という決まりです。

## 何をしているか

### 1. 空の文字列と、最初の文字を確かめる

```go:line-numbers=1247
	c, n := utf8.DecodeRune(s)
	if c == utf8.RuneError && n == 1 {
		return false
	}
```

先頭の 1 文字を取り出します。読めない不正なバイトなら、名前ではないので `false` です。

```go:line-numbers=1251
	if !unicode.Is(first, c) {
		return false
	}
```

先頭の文字が、`first` の集まりに含まれなければ、名前の先頭として不正です。

### 2. 残りの文字を一つずつ確かめる

```go:line-numbers=1254
	for n < len(s) {
		s = s[n:]
		c, n = utf8.DecodeRune(s)
		if c == utf8.RuneError && n == 1 {
			return false
		}
		if !unicode.Is(first, c) && !unicode.Is(second, c) {
			return false
		}
	}
	return true
```

残りの文字を、先頭の 1 文字ずつ取り出して調べます。`first` にも `second` にも含まれない文字が出たら、`false` です。最後まで問題がなければ、`true` を返します。

## ここがすごい

- **先頭と残りを分ける**: 先頭だけ厳しい規則にして、数字や記号が後ろに付くことを許しています。規格の決まりを、そのまま二段階の判定にしています。
- **不正な文字を早く見つける**: 読めないバイトに出会ったら、そこで止まります。残りを見る必要はありません。
- **Unicode の集まりを使う**: 規格の文字の範囲を、`unicode` の集まりで表しています。日本語などの文字も、正しく扱えます。

## まとめ

- `isName` は、バイト列が XML の名前として正しいかを返します。
- 先頭の文字は `first`、残りは `first` か `second` の集まりから選びます。
- 不正な UTF-8 のバイトに出会えば、すぐに `false` を返します。
