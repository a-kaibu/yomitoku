---
title: "Go の識別子として使えるかを確かめる token.IsIdentifier"
description: "go/token の IsIdentifier。空でなく、キーワードでなく、先頭は文字か下線、2 文字目以降は文字・数字・下線だけかを、Unicode の判定で確かめる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/go/token/token.go"
lines: [331, 341]
function: "IsIdentifier"
difficulty: 2
tags: [パース, Unicode, 防御的プログラミング]
---

## ひとことで

`token.IsIdentifier(name)` は、文字列 `name` が Go の識別子（変数名や関数名として使える名前）になれるかを判定します。`count` や `_x` や `日本語` は使えます。`1abc` は先頭が数字なので使えず、`if` は予約語（キーワード）なので使えません。

Go の文法を扱うツール（フォーマッタやリンターなど）が、名前の正しさを確かめるために使う関数です。

## コード

```go:line-numbers=331
func IsIdentifier(name string) bool {
	if name == "" || IsKeyword(name) {
		return false
	}
	for i, c := range name {
		if !unicode.IsLetter(c) && c != '_' && (i == 0 || !unicode.IsDigit(c)) {
			return false
		}
	}
	return true
}
```

## 前提知識

- **識別子**: 変数名、関数名、型名などの名前のことです。
- **キーワード（予約語）**: `if`、`for`、`func` のように、文法の意味がすでに決まっていて、名前には使えない語です。
- **`unicode.IsLetter` と `unicode.IsDigit`**: 文字（英字や漢字など）と、数字（0〜9 や他の言語の数字）を判定する関数です。
- **`for i, c := range name`**: 文字列を 1 文字ずつ回し、`i` にバイト位置、`c` に文字を入れる書き方です。`i == 0` は、先頭の文字という意味です。

## 何をしているか

### 1. 空とキーワードを先に除く

```go:line-numbers=332
	if name == "" || IsKeyword(name) {
		return false
	}
```

空の名前は、そもそも名前ではありません。キーワードも、名前として使えないので、ここで `false` を返します。

### 2. 1 文字ずつ、文字の規則を確かめる

```go:line-numbers=335
	for i, c := range name {
		if !unicode.IsLetter(c) && c != '_' && (i == 0 || !unicode.IsDigit(c)) {
			return false
		}
	}
	return true
```

それぞれの文字 `c` について、「文字でも下線でもなく、かつ先頭でないなら数字でもない」という条件を見ます。その条件に当てはまる文字が 1 つでもあれば、`false` を返します。

`i == 0` の判定が重要です。先頭では数字が使えないので、`i == 0` のときは `IsDigit` を許さない形になっています。2 文字目以降は、数字も使えます。

## ここがすごい

- **Unicode の文字をそのまま許す**: `unicode.IsLetter` を使うので、日本語やギリシャ文字なども、名前として使えます。Go の仕様と同じ範囲です。
- **先頭だけ規則が違う**: 先頭の文字と、その後の文字の規則を、`i == 0` の 1 つの条件で書き分けています。
- **キーワードも同じ関数で弾く**: 文字の規則に加えて、予約語も判定することで、ツールは「文法的に正しい名前」かを 1 回の関数で確かめられます。

## まとめ

- `IsIdentifier` は、文字列が Go の識別子として使えるかを判定します。
- 空の文字列とキーワードは、最初に除きます。
- 先頭は文字か下線、2 文字目以降は文字・数字・下線を許します。
- 文字の判定に `unicode` を使うので、日本語などの名前も扱えます。
