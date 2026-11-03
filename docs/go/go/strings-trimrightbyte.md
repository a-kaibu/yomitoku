---
title: "末尾の同じ 1 バイトを取り除く trimRightByte"
description: "strings パッケージの trimRightByte。文字列の末尾が指定したバイトと同じ間、そのバイトを取り除く。残りの文字列を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/strings.go"
lines: [1055, 1060]
function: "trimRightByte"
difficulty: 1
tags: [文字列処理, 可読性]
---

## ひとことで

`trimRightByte(s, c)` は、文字列 `s` の末尾から、バイト `c` が続く限り取り除きます。残った文字列を返します。

## コード

```go:line-numbers=1055
func trimRightByte(s string, c byte) string {
	for len(s) > 0 && s[len(s)-1] == c {
		s = s[:len(s)-1]
	}
	return s
}
```

## 前提知識

- **バイト**: 文字列の中の一文字分の値です。ASCII の文字なら、1 バイトで表せます。
- **スライス式 `s[:n]`**: 文字列の先頭から `n` バイトまでを指す部分文字列です。コピーは作りません。
- **空の文字列**: 長さが 0 の文字列です。これ以上取り除くものがないことを表します。

## 何をしているか

### 1. 末尾が同じバイトの間、取り除く

```go:line-numbers=1056
	for len(s) > 0 && s[len(s)-1] == c {
		s = s[:len(s)-1]
	}
```

長さが 0 より大きく、末尾のバイトが `c` と同じである間、末尾を一つ削ります。`len(s) > 0` を先に確かめるので、空の文字列の末尾を読むことはありません。

### 2. 残りの文字列を返す

```go:line-numbers=1059
	return s
```

末尾の `c` がなくなったところで、残りを返します。

## ここがすごい

- **コピーを作らない**: 末尾を削るときは、`s[:n]` で範囲を狭めるだけなので、新しいメモリを作りません。
- **空の確認が条件の先頭**: `len(s) > 0` を先に書くので、短い文字列でも安全に動きます。
- **同じ文字が続く数に制限がない**: 取り除く回数は、末尾が `c` である限り決まります。あらかじめ数を決める必要はありません。そのため、`"abc///"` のように `/` が何個続いても、同じ書き方で取り除けます。

## まとめ

- `trimRightByte` は、末尾にある同じバイトを取り除きます。
- 削るのは範囲を狭めるだけなので、コピーは作りません。
- 空の文字列に対しても、安全に動きます。
