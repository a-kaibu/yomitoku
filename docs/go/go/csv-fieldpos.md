---
title: "指定したフィールドの行と列を返す csv の FieldPos"
description: "encoding/csv の Reader.FieldPos。直前に読んだ行の中で、指定した番号のフィールドが始まる位置を、行と列で返す。番号が範囲の外なら panic する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/csv/reader.go"
lines: [213, 219]
function: "FieldPos"
difficulty: 2
tags: [入出力, 防御的プログラミング]
---

## ひとことで

`r.FieldPos(field)` は、直前に読んだ行の中で、`field` 番目のフィールドが始まる位置を、行と列で返します。

## コード

```go:line-numbers=213
func (r *Reader) FieldPos(field int) (line, column int) {
	if field < 0 || field >= len(r.fieldPositions) {
		panic("out of range index passed to FieldPos")
	}
	p := &r.fieldPositions[field]
	return p.line, p.col
}
```

## 前提知識

- **フィールド**: CSV の一行の中の、カンマで区切られた一つ分の値です。
- **fieldPositions**: 読み取りのときに、各フィールドの位置を記録しておく配列です。
- **panic**: 続けられない状態になったときに、プログラムを止める仕組みです。

## 何をしているか

### 1. 範囲を確かめる

```go:line-numbers=214
	if field < 0 || field >= len(r.fieldPositions) {
		panic("out of range index passed to FieldPos")
	}
```

番号が負か、記録されている数以上なら、範囲の外です。そのときは、理由を書いたメッセージで panic します。

### 2. 位置を取り出す

```go:line-numbers=217
	p := &r.fieldPositions[field]
	return p.line, p.col
```

記録しておいた位置を取り出して、行と列を返します。`p` は要素へのポインタなので、配列の中の値を直接読みます。

## ここがすごい

- **位置を前もって記録する**: 読みながら位置を覚えておくので、後から調べるときに、もう一度読み直す必要がありません。
- **範囲外は止める**: 誤った番号を渡されたら、すぐ panic するので、間違いに早く気づけます。

番号は 0 から数えます。たとえば、一行に 3 つのフィールドがあれば、有効な番号は 0、1、2 です。3 を渡すと、記録された位置の外になるので、この関数は panic します。範囲の確認は、関数の中で行われます。

## まとめ

- `FieldPos` は、フィールドの行と列を返します。
- 位置は、読み取りのときに記録したものを使います。
- 範囲外の番号では panic します。
