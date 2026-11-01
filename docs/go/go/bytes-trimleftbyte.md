---
title: "先頭の同じ 1 バイトを連続して取り除く bytes.trimLeftByte"
description: "bytes.trimLeftByte は、バイト列の先頭にある同じバイトを、続く限り取り除きます。すべて取り除いた場合は、空の値として nil を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/bytes.go"
lines: [1024, 1033]
function: "trimLeftByte"
difficulty: 1
format: 2
tags: [文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`bytes.Trim([]byte("000123"), "0")` の内部で、先頭の `'0'` を取り除くために使われます。1 種類のバイトだけを扱う、最も単純な形の除去です。

## コード

::: code-group

```go:line-numbers=1024 [日本語訳]
func trimLeftByte(s []byte, c byte) []byte {
	for len(s) > 0 && s[0] == c {
		s = s[1:]
	}
	if len(s) == 0 {
		// これは従来からの動きなので、そのまま守る。
		return nil
	}
	return s
}
```

```go:line-numbers=1024 [原文]
func trimLeftByte(s []byte, c byte) []byte {
	for len(s) > 0 && s[0] == c {
		s = s[1:]
	}
	if len(s) == 0 {
		// This is what we've historically done.
		return nil
	}
	return s
}
```

:::

## 前提知識

- **同じバイトの連続**: 先頭から、同じ値のバイトが続く間だけ取り除きます。
- **スライスの `s[1:]`**: 先頭の 1 バイトを外して、同じ配列の残りを指します。
- **`nil` のスライス**: 要素が 1 つもない状態です。`len` は 0 になります。
- **空と nil の違い**: 空のスライスと `nil` は、どちらも長さ 0 ですが、比べたときに違う値になります。

## 何をしているか

### 1. 先頭が同じバイトの間は進める

```go:line-numbers=1025
	for len(s) > 0 && s[0] == c {
		s = s[1:]
	}
```

`s` が空でなく、先頭が `c` と同じ間は、`s[1:]` で先頭を進めます。

### 2. すべて取り除いたら nil を返す

```go:line-numbers=1028
	if len(s) == 0 {
		// これは従来からの動きなので、そのまま守る。
		return nil
	}
```

残りが空になったら、`nil` を返します。コメントにあるとおり、これは昔からの動きを守るための決まりです。

### 3. 残りを返す

```go:line-numbers=1032
	return s
```

まだ残りがあれば、その部分をそのまま返します。

## ここがすごい

- **コピーなしで進める**: 先頭を進めるだけなので、大きなバイト列でも余分なメモリを使いません。
- **結果の形を一定にする**: 全部取り除いたときは、必ず `nil` を返すので、呼び出し側は空の扱いを 1 通りに書けます。
- **昔の動きを守る**: 互換性を大切にする標準ライブラリらしく、既存の動きを変えないように残しています。

## まとめ

- 先頭が同じバイトの間、先頭を 1 つずつ進める。
- 全部取り除いたら、`nil` を返す。
- 残りは、コピーせずに元の配列を指したまま返す。
