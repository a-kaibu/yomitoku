---
title: "空白で区切って単語を取り出す。Scanner に渡す分割関数"
description: "bufio.ScanWords は、bufio.Scanner に渡す分割関数です。入力から空白で区切られた単語を 1 つずつ取り出します。先頭の空白を飛ばし、単語の終わりを見つける 2 段の走査で書かれています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2013 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bufio/scan.go"
lines: [403, 427]
function: "ScanWords"
difficulty: 2
format: 2
tags: [入出力, パース, 文字列処理, 標準ライブラリ]
---

## ひとことで

`bufio.Scanner` は、入力を少しずつ読んで、「区切り」ごとに取り出す仕組みです。`ScanWords` は、その区切りを「空白」にする分割関数です。

`scanner.Split(bufio.ScanWords)` と指定すると、`scanner.Text()` で単語が 1 つずつ取り出せます。

## コード

::: code-group

```go:line-numbers=403 [日本語訳]
func ScanWords(data []byte, atEOF bool) (advance int, token []byte, err error) {
	// 先頭の空白を読み飛ばす。
	start := 0
	for width := 0; start < len(data); start += width {
		var r rune
		r, width = utf8.DecodeRune(data[start:])
		if !isSpace(r) {
			break
		}
	}
	// 空白に当たるまで読み、単語の終わりを決める。
	for width, i := 0, start; i < len(data); i += width {
		var r rune
		r, width = utf8.DecodeRune(data[i:])
		if isSpace(r) {
			return i + width, data[start:i], nil
		}
	}
	// EOF なら、空でない最後の単語を、終端なしで返す。
	if atEOF && len(data) > start {
		return len(data), data[start:], nil
	}
	// さらにデータを要求する。
	return start, nil, nil
}
```

```go:line-numbers=403 [原文]
func ScanWords(data []byte, atEOF bool) (advance int, token []byte, err error) {
	// Skip leading spaces.
	start := 0
	for width := 0; start < len(data); start += width {
		var r rune
		r, width = utf8.DecodeRune(data[start:])
		if !isSpace(r) {
			break
		}
	}
	// Scan until space, marking end of word.
	for width, i := 0, start; i < len(data); i += width {
		var r rune
		r, width = utf8.DecodeRune(data[i:])
		if isSpace(r) {
			return i + width, data[start:i], nil
		}
	}
	// If we're at EOF, we have a final, non-empty, non-terminated word. Return it.
	if atEOF && len(data) > start {
		return len(data), data[start:], nil
	}
	// Request more data.
	return start, nil, nil
}
```

:::

## 前提知識

- **`bufio.Scanner`**: 入力から、決まった区切りごとにデータを取り出す型です。`Scan()` を呼ぶと次の区切りまで読み、`Text()` でその内容を得ます。
- **分割関数**: `data` と `atEOF`（もう入力が終わったか）を受け取り、`advance`（何バイト進めるか）、`token`（取り出した内容）、`err` を返す関数です。
- **`isSpace`**: 1 文字が空白かを調べる、この関数の中で使われる関数です。
- **`utf8.DecodeRune`**: バイト列の先頭の 1 文字を取り出し、そのバイト数を返します。

## 何をしているか

`data = "  go lang "`、`atEOF = false` で追います。

### 1. 先頭の空白を飛ばす

```go:line-numbers=406
	for width := 0; start < len(data); start += width {
		var r rune
		r, width = utf8.DecodeRune(data[start:])
		if !isSpace(r) {
			break
		}
	}
```

先頭の 2 つの空白を読み飛ばし、`start = 2` になります。`g` で止まります。

### 2. 単語の終わりを探す

```go:line-numbers=414
	for width, i := 0, start; i < len(data); i += width {
		var r rune
		r, width = utf8.DecodeRune(data[i:])
		if isSpace(r) {
			return i + width, data[start:i], nil
		}
	}
```

`g`、`o` と進み、空白に当たった位置で止まります。`data[2:4]` の `"go"` を単語として返し、`advance` は空白の後ろまで進めた値になります。

### 3. 入力が終わった場合

```go:line-numbers=422
	if atEOF && len(data) > start {
		return len(data), data[start:], nil
	}
```

空白で終わらない最後の単語も、入力の終わりで返します。`atEOF` でないなら、まだ続きがあるかもしれないので、`nil` を返してもっと読むよう求めます。

## ここがすごい

- **データが途中で切れても正しく扱う**: 単語の途中でデータが切れていたら、`nil` を返して続きを待ちます。`Scanner` が追加の入力を読んで、もう一度呼び出してくれます。
- **空白の定義をまとめる**: 空白の判定は `isSpace` の 1 か所にあります。Unicode の空白も含めて扱えるように、ここで一貫させています。
- **進む量を返す**: 取り出した単語だけでなく、どこまで読んだかを `advance` で伝えます。だから `Scanner` は、同じ部分を二度読まずに済みます。

## まとめ

- 分割関数は、「何バイト進むか」と「取り出すもの」を返す約束で書ける。
- 入力が途中で切れている可能性を考えて、`nil` を返して続きを待つ。
- 区切りの判定は 1 か所にまとめると、動きが揃う。
