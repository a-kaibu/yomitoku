---
title: "文字列の先頭が小文字かを調べる startsWithLowerCase。空の文字列は false"
description: "time パッケージの startsWithLowerCase。文字列の先頭 1 バイトが、ASCII の小文字 a から z の範囲にあるかを返す。空の文字列は小文字とは見なさない。時刻の書式を読むときに、英字の判別に使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/format.go"
lines: [183, 189]
function: "startsWithLowerCase"
difficulty: 1
tags: [文字列処理, 日時, 防御的プログラミング]
---

## ひとことで

`startsWithLowerCase(str)` は、文字列の先頭が小文字の英字かどうかを返します。`"month"` なら `true`、`"Jan"` や空の文字列なら `false` です。

時刻の書式を読むときには、「`Jan` のような大文字で始まる名前」と「小文字で始まる書式の要素」を区別する必要があります。この関数は、その区別のための小さな判定です。

## コード

```go:line-numbers=183
func startsWithLowerCase(str string) bool {
	if len(str) == 0 {
		return false
	}
	c := str[0]
	return 'a' <= c && c <= 'z'
}
```

## 前提知識

- **ASCII の小文字**: `a` から `z` までの 26 文字です。文字コードでは連続した番号になっています。
- **範囲による判定**: `'a' <= c && c <= 'z'` のように、文字コードの範囲で判定します。文字を一つずつ並べるより短く書けます。
- **空の文字列**: 先頭の文字そのものがありません。`str[0]` を読むと範囲外になるので、最初に確かめます。
- **バイト**: 文字列の先頭は、1 バイトの値として取り出せます。ASCII の文字は、この 1 バイトで表されます。

## 何をしているか

### 1. 空の文字列を弾く

```go:line-numbers=184
	if len(str) == 0 {
		return false
	}
```

文字列が空なら、先頭の文字がないので、小文字で始まるとは言えません。`false` を返します。この確認がないと、次の行で範囲外の場所を読んでしまいます。

### 2. 先頭のバイトを小文字の範囲と比べる

```go:line-numbers=187
	c := str[0]
	return 'a' <= c && c <= 'z'
```

先頭の 1 バイトを `c` に取り出し、`a` 以上で `z` 以下なら `true` を返します。

## ここがすごい

- **先に範囲外を確かめる**: 空の文字列を最初に弾くので、安全に先頭を読めます。
- **1 行の範囲判定**: 26 文字の一覧を書かずに、文字コードの範囲で判定します。
- **書式の解析に役立つ**: 時刻の書式は英字の名前で書かれるので、大文字と小文字の違いで、要素の種類を見分けられます。

## まとめ

- `startsWithLowerCase` は、先頭が小文字の英字なら `true` を返します。
- 空の文字列は `false` で、範囲外を読まないように最初に弾きます。
- 文字コードの範囲で、1 行の判定をしています。
