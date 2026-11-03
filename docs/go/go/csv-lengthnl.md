---
title: "行の末尾が改行なら 1 を返す csv の lengthNL"
description: "encoding/csv の lengthNL。バイト列の最後の文字が改行なら 1 を、そうでなければ 0 を返す。読んだ行の長さを、改行の分だけ調整するときに使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/csv/reader.go"
lines: [284, 289]
function: "lengthNL"
difficulty: 1
tags: [文字列処理, 可読性]
---

## ひとことで

`lengthNL(b)` は、バイト列 `b` の末尾が改行の文字 `\n` なら 1 を返し、そうでなければ 0 を返します。

## コード

```go:line-numbers=284
func lengthNL(b []byte) int {
	if len(b) > 0 && b[len(b)-1] == '\n' {
		return 1
	}
	return 0
}
```

## 前提知識

- **改行 `\n`**: 行の終わりを表す文字です。
- **空のバイト列**: 長さが 0 のバイト列です。末尾の文字を読まないように、先に長さを確かめます。
- **CSV の読み取り**: 行を読むときに、改行の分を数えるかどうかで、長さが変わります。

## 何をしているか

### 1. 末尾が改行かを確かめる

```go:line-numbers=285
	if len(b) > 0 && b[len(b)-1] == '\n' {
		return 1
	}
```

長さが 0 より大きく、末尾のバイトが `\n` なら、改行が一つあります。その場合は 1 を返します。`len(b) > 0` を先に確かめるので、空のときに末尾を読むことはありません。

ここで見ているのは、末尾の 1 バイトだけです。改行の前の文字や、途中の改行は見ません。行の終わりに 1 つだけ付く改行を数えれば足りるので、この関数はそれだけに絞られています。`\r\n` で終わる行でも、末尾は `\n` なので、同じように 1 が返ります。

### 2. 改行がなければ 0 を返す

```go:line-numbers=288
	return 0
```

末尾が改行でなければ、0 を返します。

## ここがすごい

- **空の確認が先**: 条件の先頭で長さを確かめるので、空の入力でも安全です。
- **数を返すだけ**: 改行の有無を、そのまま 1 か 0 の数として返すので、呼び出し側で足し算に使えます。

## まとめ

- `lengthNL` は、末尾の改行の分を 1 か 0 で返します。
- 空のバイト列でも安全です。
- 呼び出し側は、この数を使って長さを調整できます。
