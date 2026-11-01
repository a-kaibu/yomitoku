---
title: "制御文字を含むかを 1 バイトずつ調べる url.stringContainsCTLByte"
description: "net/url の stringContainsCTLByte は、文字列の中に、空白より小さい制御文字や DEL が含まれるかを調べます。URL の検査で、危険な文字を見つけるために使われます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/net/url/url.go"
lines: [1327, 1335]
function: "stringContainsCTLByte"
difficulty: 1
format: 2
tags: [防御的プログラミング, セキュリティ, 文字列処理, 標準ライブラリ]
---

## ひとことで

`stringContainsCTLByte("a\nb")` は `true` を返します。改行などの制御文字が含まれると、URL として安全でないとみなして、検査で弾くために使われます。

## コード

```go:line-numbers=1327
func stringContainsCTLByte(s string) bool {
	for i := 0; i < len(s); i++ {
		b := s[i]
		if b < ' ' || b == 0x7f {
			return true
		}
	}
	return false
}
```

## 前提知識

- **制御文字（CTL）**: 空白（0x20）より小さい値の文字と、DEL（0x7F）です。改行やタブなどが含まれます。
- **バイトの比較**: 文字列の `s[i]` は、1 バイトの値です。ASCII の制御文字は 1 バイトで表せます。
- **`' '`**: 空白の文字です。その番号は 0x20 です。
- **早期の `return`**: 1 つ見つかった時点で、残りを調べる必要はありません。

## 何をしているか

### 1. 1 バイトずつ見る

```go:line-numbers=1328
	for i := 0; i < len(s); i++ {
		b := s[i]
```

文字列の先頭から、1 バイトずつ取り出します。ここで取り出した値を、制御文字かどうかで判定します。

### 2. 制御文字かを調べる

```go:line-numbers=1330
		if b < ' ' || b == 0x7f {
			return true
```

値が空白より小さい、または DEL（0x7F）であれば、制御文字です。そのときは `true` を返します。

### 3. 最後まで無ければ false

```go:line-numbers=1334
	return false
```

すべてのバイトを調べて、制御文字が 1 つも無ければ `false` を返します。

## ここがすごい

- **バイト単位で判定する**: 制御文字は ASCII なので、1 バイトずつ見るだけで確実に判定できます。
- **見つけたら即座に止まる**: 1 つでも含まれていれば、残りを調べる必要はありません。
- **危険な入力を先に弾く**: URL に改行などが混ざると、ヘッダの偽造などに悪用されるおそれがあります。そのため、検査で早めに弾きます。

## まとめ

- 文字列を先頭から 1 バイトずつ見る。
- 空白より小さい値と DEL を、制御文字として `true` を返す。
- 制御文字が無ければ `false` を返す。
