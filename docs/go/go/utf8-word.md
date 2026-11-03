---
title: "先頭の数バイトを一つの整数として読む utf8 の word"
description: "unicode/utf8 の word。文字列またはバイト列の先頭の 4 バイトか 8 バイトを、小さい位のバイトから順に組み合わせて、一つの uintptr として読み取る。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/unicode/utf8/utf8.go"
lines: [462, 467]
function: "word"
difficulty: 3
tags: [ビット演算, 移植性]
---

## ひとことで

`word(s)` は、`s` の先頭の数バイトを、一つの整数としてまとめて読み取ります。32 ビットの環境では 4 バイト、64 ビットの環境では 8 バイトを読みます。

## コード

```go:line-numbers=462
func word[T string | []byte](s T) uintptr {
	if ptrSize == 4 {
		return uintptr(s[0]) | uintptr(s[1])<<8 | uintptr(s[2])<<16 | uintptr(s[3])<<24
	}
	return uintptr(uint64(s[0]) | uint64(s[1])<<8 | uint64(s[2])<<16 | uint64(s[3])<<24 | uint64(s[4])<<32 | uint64(s[5])<<40 | uint64(s[6])<<48 | uint64(s[7])<<56)
}
```

## 前提知識

- **uintptr**: ポインタと同じ大きさの整数型です。環境のワードの大きさに合わせて使われます。
- **ptrSize**: ポインタの大きさが 4 バイトか 8 バイトかを表す定数です。環境ごとに決まります。
- **ビットのずらし `<<`**: 数を左にずらして、各バイトの位置に合わせます。
- **論理和 `|`**: ずらした各バイトを、一つの整数に合わせます。

## 何をしているか

### 1. 32 ビット環境では 4 バイトを組み合わせる

```go:line-numbers=463
	if ptrSize == 4 {
		return uintptr(s[0]) | uintptr(s[1])<<8 | uintptr(s[2])<<16 | uintptr(s[3])<<24
	}
```

ポインタの大きさが 4 バイトなら、先頭の 4 バイトを組み合わせます。`s[0]` が最も小さい位に来て、`s[3]` が最も大きい位に来ます。このように、バイトの並びを整数の位に対応させます。

### 2. 64 ビット環境では 8 バイトを組み合わせる

```go:line-numbers=466
	return uintptr(uint64(s[0]) | uint64(s[1])<<8 | uint64(s[2])<<16 | uint64(s[3])<<24 | uint64(s[4])<<32 | uint64(s[5])<<40 | uint64(s[6])<<48 | uint64(s[7])<<56)
```

それ以外は、8 バイトを `uint64` に広げて組み合わせ、`uintptr` に変えて返します。

## ここがすごい

- **一度の整数比較に使える**: バイトを一つの整数にまとめるので、数バイトをまとめて比べられます。
- **環境の大きさに合わせる**: `ptrSize` で式を切り替えるので、32 ビットと 64 ビットで、同じ意味の値を作れます。

## まとめ

- `word` は、先頭の数バイトを一つの整数にまとめます。
- 小さい位のバイトが先頭に来ます。
- 環境のポインタの大きさに合わせて、4 バイトか 8 バイトを読みます。
