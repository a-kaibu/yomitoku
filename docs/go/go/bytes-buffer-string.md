---
title: "バッファの内容を文字列にして返す bytes.Buffer.String"
description: "bytes.Buffer.String は、まだ読んでいない内容を文字列にして返します。バイト列をコピーして文字列にするので、元のバッファは変わりません。nil のバッファでは \"<nil>\" を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [72, 78]
function: "String"
difficulty: 1
format: 2
tags: [文字列処理, 入出力, 標準ライブラリ]
---

## ひとことで

`buf.String()` は、読み残しの内容を `string` として返します。ログに出したり、比べたりするときに使われます。`fmt.Println(buf)` でも、この関数が使われます。

## コード

::: code-group

```go:line-numbers=72 [日本語訳]
func (b *Buffer) String() string {
	if b == nil {
		// デバッグのときに役立つ特別な場合。
		return "<nil>"
	}
	return string(b.buf[b.off:])
}
```

```go:line-numbers=72 [原文]
func (b *Buffer) String() string {
	if b == nil {
		// Special case, useful in debugging.
		return "<nil>"
	}
	return string(b.buf[b.off:])
}
```

:::

## 前提知識

- **`string` と `[]byte` の違い**: 文字列は変えられず、バイト列は書き換えられます。`string(b)` は、中身をコピーして文字列を作ります。
- **読み残し**: `off` より後ろのバイトが、まだ読んでいない部分です。
- **nil のレシーバ**: `nil` の `*Buffer` にメソッドを呼ぶことができます。この関数は、それを確かめます。
- **デバッグでの使い方**: 値を表示するときに、中身をそのまま見せられるようにする工夫です。

## 何をしているか

### 1. nil のバッファを特別扱いする

```go:line-numbers=73
	if b == nil {
		// デバッグのときに役立つ特別な場合。
		return "<nil>"
	}
```

レシーバが `nil` なら、中身が無いので `"<nil>"` を返します。コメントにあるとおり、デバッグのときに表示でパニックしないための処理です。

### 2. 読み残しを文字列にする

```go:line-numbers=77
	return string(b.buf[b.off:])
```

`string(b.buf[b.off:])` は、読み残しのバイトをコピーして文字列にします。コピーなので、元のバッファはそのまま残ります。

## ここがすごい

- **nil でも表示できる**: 表示のための関数が、パニックで止まらないように作られています。
- **元を変えない**: 文字列にするときにコピーするので、後でバッファを書き換えても、文字列の内容は変わりません。
- **読み残しだけを返す**: 読んだ部分を含めないので、今から読める内容だけが表示されます。

## まとめ

- `nil` のときは `"<nil>"` を返す。
- 読み残しのバイトを、コピーして文字列にする。
- 元のバッファは変えない。
