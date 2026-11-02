---
title: "文字列の読み取り位置を 1 バイト進める Reader.ReadByte。終わりなら EOF"
description: "strings.Reader の ReadByte。読み取り位置の 1 バイトを返して、位置を 1 進める。文字列の終わりに達していれば、io.EOF を返す。直前の文字の記録は捨てる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/reader.go"
lines: [66, 74]
function: "ReadByte"
difficulty: 1
tags: [文字列処理, 入出力, 標準ライブラリ]
---

## ひとことで

`r.ReadByte()` は、`strings.Reader` の読み取り位置にある 1 バイトを返し、位置を 1 つ進めます。文字列の終わりに達していれば、`io.EOF` というエラーを返します。

`strings.Reader` は、文字列を少しずつ読むための道具です。この関数は、その中で最も小さな単位、1 バイトずつ読むときに使われます。

## コード

```go:line-numbers=66
func (r *Reader) ReadByte() (byte, error) {
	r.prevRune = -1
	if r.i >= int64(len(r.s)) {
		return 0, io.EOF
	}
	b := r.s[r.i]
	r.i++
	return b, nil
}
```

## 前提知識

- **読み取り位置**: 次に読むバイトの番号です。読むたびに、この番号が 1 つずつ進みます。
- **`io.EOF`**: 読み取るデータがもうないことを表すエラーです。エラーではなく、「終わり」の合図として使われます。
- **`prevRune`**: 直前に読んだ文字の情報を覚えておく欄です。`UnreadRune` などのために使われます。
- **バイト**: 文字列の最も小さな単位です。1 つの文字が、複数のバイトになることもあります。

## 何をしているか

### 1. 直前の文字の記録を捨てる

```go:line-numbers=67
	r.prevRune = -1
```

1 バイト読んだら、直前の文字の記録は意味を失います。`-1` にして、「戻すべき文字はない」ことを表します。

### 2. 終わりなら EOF を返す

```go:line-numbers=68
	if r.i >= int64(len(r.s)) {
		return 0, io.EOF
	}
```

読み取り位置 `r.i` が、文字列の長さ以上なら、もう読めるものがありません。`0` と `io.EOF` を返して、終わりを知らせます。

### 3. 1 バイト読んで進める

```go:line-numbers=71
	b := r.s[r.i]
	r.i++
	return b, nil
```

位置のバイトを取り出し、位置を 1 進めます。エラーはないので、`nil` を一緒に返します。

## ここがすごい

- **範囲の判定を先に行う**: 読む前に、終わりかどうかを確かめます。範囲の外のバイトを、誤って読むことはありません。
- **EOF は特別な値**: 終わりを「エラー」として返すので、呼び出し側は `for` のループで、読み切ったかどうかを簡単に判定できます。
- **少ない処理で進む**: 1 バイトの取り出しと、位置の加算だけです。大量のバイトを読むときも、無駄がありません。

## まとめ

- `ReadByte` は、読み取り位置の 1 バイトを返し、位置を 1 進めます。
- 文字列の終わりに達していれば、`io.EOF` を返します。
- 読む前に範囲を確かめるので、安全に 1 バイトずつ読めます。
