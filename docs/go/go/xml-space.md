---
title: "XML の空白をすべて読み飛ばす Decoder.space。空白でない最初の文字を戻す"
description: "encoding/xml の Decoder.space。スペース、復帰、改行、タブが続く間、読み進めて捨てる。空白でない文字に出会ったら、その文字を読み戻して終わる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/xml/xml.go"
lines: [895, 908]
function: "space"
difficulty: 1
tags: [パース, 入出力, 状態機械]
---

## ひとことで

`d.space()` は、XML の入力の中で、空白の文字を続く限り読み飛ばします。空白とは、スペース、復帰、改行、タブの四つです。

空白でない文字に出会ったら、その文字を読み戻して、そこで止まります。読み戻しておけば、次の処理がその文字から続けられます。

## コード

```go:line-numbers=895
func (d *Decoder) space() {
	for {
		b, ok := d.getc()
		if !ok {
			return
		}
		switch b {
		case ' ', '\r', '\n', '\t':
		default:
			d.ungetc(b)
			return
		}
	}
}
```

## 前提知識

- **空白**: 見た目に隙間を作る文字です。XML では、タグの間や属性の間で、いくつ並んでも構いません。
- **`getc`**: 1 バイト読む内部の関数です。入力が終わったときは `ok` が偽になります。
- **`ungetc`**: 読んだ 1 バイトを、次に読み直せるように戻す関数です。空白でない文字を、捨てずに残すために使います。
- **`switch` の空の `case`**: `case ' ', '\r', '\n', '\t':` の本体が空なのは、この四つを何もせずに読み続けるという意味です。

## 何をしているか

### 1. 一文字ずつ読む

```go:line-numbers=897
		b, ok := d.getc()
		if !ok {
			return
		}
```

一バイト読みます。入力が終わったら、そこで止まります。

### 2. 空白なら読み飛ばし、そうでなければ戻す

```go:line-numbers=901
		switch b {
		case ' ', '\r', '\n', '\t':
		default:
			d.ungetc(b)
			return
		}
```

空白の四つなら、`case` の本体は空なので、何もせずに次の文字へ進みます。空白でない文字なら、`ungetc` で戻して、関数を終わります。

## ここがすごい

- **空の `case` で読み飛ばす**: 空白を捨てる処理を、何も書かずに表せます。空白の種類を、一か所に並べるだけで済みます。
- **読み過ぎを戻す**: 空白でない文字を一度読んでしまっても、`ungetc` で元に戻すので、後の処理は何も失いません。
- **止まる条件が二つだけ**: 入力の終わりと、空白でない文字の二つです。それ以外の場合は、ループが続きます。

## まとめ

- `space` は、続く空白をすべて読み飛ばします。
- 空白でない文字は、読み戻してから終わります。
- 空白の種類は `switch` の `case` で一覧にしています。
