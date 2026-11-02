---
title: "文字列をバイト列に変える runtime.stringtoslicebyte。小さければ一時バッファを使う"
description: "string から []byte への変換を行う runtime.stringtoslicebyte。変換先が短く、呼び出し元が一時バッファを用意していれば、ヒープを使わずにそこへコピーする。そうでなければ新しいバイト列を確保する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/runtime/string.go"
lines: [231, 241]
function: "stringtoslicebyte"
difficulty: 3
tags: [メモリ管理, 文字列処理, 最適化]
---

## ひとことで

Go で `[]byte(s)` と書くと、コンパイラは `runtime.stringtoslicebyte` を呼びます。文字列 `s` の中身を、新しいバイト列にコピーして返します。変換先が小さく、一時的に使われるなら、呼び出し元が用意した一時バッファを使って、ヒープへの確保を避けます。

## コード

```go:line-numbers=231
func stringtoslicebyte(buf *tmpBuf, s string) []byte {
	var b []byte
	if buf != nil && len(s) <= len(buf) {
		*buf = tmpBuf{}
		b = buf[:len(s)]
	} else {
		b = rawbyteslice(len(s))
	}
	copy(b, s)
	return b
}
```

## 前提知識

- **文字列とスライス**: 文字列は読み取り専用のバイト列です。`[]byte` は書き換えられるので、変換のときは必ずコピーします。
- **`tmpBuf`**: 呼び出し元が、スタック上に用意する小さなバッファです。大きさは、固定の上限があります。
- **ヒープとスタック**: 関数の中だけで使う小さなデータは、スタックに置けます。ヒープは、GC の管理対象で、確保に費用がかかります。
- **`rawbyteslice`**: 大きさを指定して、ヒープに新しいバイト列を確保する関数です。

## 何をしているか

### 1. 一時バッファに入るなら、そこを使う

```go:line-numbers=233
	if buf != nil && len(s) <= len(buf) {
		*buf = tmpBuf{}
		b = buf[:len(s)]
	} else {
```

呼び出し元が一時バッファを渡していて、文字列がそこに収まるなら、そのバッファを使います。`*buf = tmpBuf{}` で、中身をゼロにしてから使います。古いデータが残らないようにするためです。

### 2. 入らなければヒープに確保する

```go:line-numbers=237
		b = rawbyteslice(len(s))
	}
	copy(b, s)
	return b
```

一時バッファに入らなければ、`rawbyteslice` で文字列と同じ長さのバイト列をヒープに確保します。そのあと、文字列の中身を `copy` で新しいバイト列にコピーして返します。

## ここがすごい

- **多くの変換をヒープなしで済ませる**: 短い文字列を `[]byte` にして、一時的に使う場面は多くあります。そのときは、スタックのバッファを使うので、GC の負担が減ります。
- **ゼロ化で安全を保つ**: バッファを使う前にゼロにするので、前の処理のデータが次の変換結果に混ざりません。
- **コピーは 1 回だけ**: どちらの経路でも、`copy` は 1 回です。余計なコピーが起きないように作られています。

## まとめ

- `stringtoslicebyte` は、文字列を `[]byte` にコピーします。
- 呼び出し元の一時バッファに収まるなら、そこを使います。
- 収まらなければ、ヒープに確保してからコピーします。
- 短い変換をヒープなしで済ませるので、メモリの負担が減ります。
