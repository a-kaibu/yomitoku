---
title: "ファイル名と行・列を一つの文字列にする token.Position.String"
description: "go/token の Position.String。ファイル名、行、列を「ファイル名:行:列」の形にまとめる。ファイル名や位置が無いときは、足りない部分を省き、何もなければ「-」を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/go/token/position.go"
lines: [44, 59]
function: "String"
difficulty: 1
tags: [文字列処理, ログ, API設計]
---

## ひとことで

コンパイラのエラーメッセージでは、`main.go:12:5: undefined: x` のように、場所を `ファイル名:行:列` の形で表します。`token.Position` の `String()` は、その場所の文字列を作ります。ファイル名がないときは、行と列だけを、行がないときは `-` を返します。

## コード

```go:line-numbers=44
func (pos Position) String() string {
	s := pos.Filename
	if pos.IsValid() {
		if s != "" {
			s += ":"
		}
		s += strconv.Itoa(pos.Line)
		if pos.Column != 0 {
			s += fmt.Sprintf(":%d", pos.Column)
		}
	}
	if s == "" {
		s = "-"
	}
	return s
}
```

## 前提知識

- **`token.Position`**: ソースコード上の位置を表す型です。ファイル名、行、列、バイト位置を持ちます。
- **行と列**: 行は 1 から、列も 1 から数えます。列 0 は「列の情報がない」という意味です。
- **`IsValid()`**: 行の情報が有効かどうかを返すメソッドです。行が 0 なら無効です。
- **`strconv.Itoa`**: 整数を 10 進数の文字列にする関数です。

## 何をしているか

### 1. ファイル名と行を組み立てる

```go:line-numbers=45
	s := pos.Filename
	if pos.IsValid() {
		if s != "" {
			s += ":"
		}
		s += strconv.Itoa(pos.Line)
```

まずファイル名を `s` に入れます。位置が有効なら、ファイル名があるときだけコロンを付け、そのあとに行の番号を足します。ファイル名がなければ、行の番号だけになります。

### 2. 列があれば足す

```go:line-numbers=51
		if pos.Column != 0 {
			s += fmt.Sprintf(":%d", pos.Column)
		}
```

列の情報があれば、コロンと列の番号を続けます。列が 0 なら、行までで止めます。

### 3. 何もなければ「-」

```go:line-numbers=55
	if s == "" {
		s = "-"
	}
	return s
```

ファイル名も位置もないときは、空の文字列の代わりに `-` を返します。表示したときに、何も出ないことを防ぎます。

## ここがすごい

- **省略を自然に扱う**: ファイル名、行、列のどれが欠けても、残りをそのまま連ねます。コロンの付け方だけを条件にしているので、読みやすい形です。
- **空の表示を防ぐ**: 最後の `-` で、ログやエラーに、必ず何かが表示されます。
- **無効な位置は行を出さない**: `IsValid()` で、行が 0 の位置を正しく判定しています。

## まとめ

- `String` は、位置をファイル名、行、列の順で文字列にまとめます。
- ファイル名があるときだけ、コロンを付けます。
- 列が 0 のときは、列を省きます。
- 何もなければ `-` を返します。
