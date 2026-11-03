---
title: "バイト列の先頭から語を読む bigEndianWord"
description: "math/big の bigEndianWord。ビッグエンディアンのバイト列から、語の大きさに合わせて 64 ビットか 32 ビットの値を読み、Word として返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/nat.go"
lines: [1064, 1069]
function: "bigEndianWord"
difficulty: 1
tags: [移植性, 入出力]
---

## ひとことで

`bigEndianWord(buf)` は、ビッグエンディアンの形で並んだバイト列から、一つの語を読み取って返します。語の大きさは、環境に合わせて変わります。

## コード

```go:line-numbers=1064
func bigEndianWord(buf []byte) Word {
	if _W == 64 {
		return Word(byteorder.BEUint64(buf))
	}
	return Word(byteorder.BEUint32(buf))
}
```

## 前提知識

- **ビッグエンディアン**: 数の上の桁のバイトを、並びの先頭に置く書き方です。
- **Word**: `math/big` で、一つの語を表す型です。環境によって 32 ビットか 64 ビットになります。
- **`byteorder`**: バイト列と整数を相互に変換する、内部のパッケージです。

## 何をしているか

### 1. 語が 64 ビットなら 8 バイトを読む

```go:line-numbers=1065
	if _W == 64 {
		return Word(byteorder.BEUint64(buf))
	}
```

語が 64 ビットなら、先頭の 8 バイトを、ビッグエンディアンの 64 ビットの値として読みます。読んだ値を `Word` に変換して返します。

### 2. それ以外は 4 バイトを読む

```go:line-numbers=1068
	return Word(byteorder.BEUint32(buf))
```

語が 32 ビットなら、先頭の 4 バイトを 32 ビットの値として読みます。

## ここがすごい

- **読み方を語の大きさに合わせる**: 同じ関数が、環境に応じて読むバイト数を変えるので、呼び出し側は環境を気にしなくて済みます。
- **読み取りを専用の関数に任せる**: バイト順の扱いは `byteorder` に任せるので、この関数は、語の大きさを選ぶだけです。

## まとめ

- `bigEndianWord` は、先頭から一つの語を読み取ります。
- 64 ビットなら 8 バイト、32 ビットなら 4 バイトを読みます。
- バイト順の扱いは、`byteorder` に任せます。
