---
title: "読み手から可変長の符号付き整数を読む binary.ReadVarint"
description: "binary.ReadVarint は、io.ByteReader から 1 バイトずつ読み、符号付きの可変長整数を組み立てます。ZigZag の符号を戻し、読めた値とエラーを返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/encoding/binary/varint.go"
lines: [157, 164]
function: "ReadVarint"
difficulty: 2
format: 2
tags: [入出力, ビット演算, 標準ライブラリ]
---

## ひとことで

`binary.ReadVarint(r)` は、`bufio.Reader` などから、符号付きの可変長整数を読みます。ファイルやネットワークの途中から、必要なだけ読むときに使えます。

## コード

::: code-group

```go:line-numbers=157 [日本語訳]
func ReadVarint(r io.ByteReader) (int64, error) {
	ux, err := ReadUvarint(r) // エラーがあっても、続けて使ってよい。
	x := int64(ux >> 1)
	if ux&1 != 0 {
		x = ^x
	}
	return x, err
}
```

```go:line-numbers=157 [原文]
func ReadVarint(r io.ByteReader) (int64, error) {
	ux, err := ReadUvarint(r) // ok to continue in presence of error
	x := int64(ux >> 1)
	if ux&1 != 0 {
		x = ^x
	}
	return x, err
}
```

:::

## 前提知識

- **`io.ByteReader`**: 1 バイトずつ読めるインターフェースです。`ReadByte` を持ちます。
- **ZigZag 変換**: 符号付きの値を、非負の数に写した形で保存する方法です。読んだあとで、符号を元に戻します。
- **`ReadUvarint`**: 非負の可変長整数を、読み手から読む関数です。`ReadVarint` は、その結果を使います。
- **読めた量とエラー**: 途中で失敗したときも、読めた分の値とエラーの両方が返ります。

## 何をしているか

### 1. 符号なし版で読む

```go:line-numbers=158
	ux, err := ReadUvarint(r) // エラーがあっても、続けて使ってよい。
```

まず `ReadUvarint` で、ZigZag の値 `ux` を読みます。コメントにあるとおり、エラーがあってもこの後の処理は続けられるように作られています。

### 2. 絶対値を取り出す

```go:line-numbers=159
	x := int64(ux >> 1)
```

`ux >> 1` で、1 ビット右へずらします。これが、符号を除いた絶対値です。

### 3. 符号を戻して返す

```go:line-numbers=160
	if ux&1 != 0 {
		x = ^x
	}
	return x, err
```

最下位のビットが 1 なら、`^x` で負の値にします。最後に、読めた値と、エラーを一緒に返します。

## ここがすごい

- **読み手の抽象化**: `io.ByteReader` を受け取るので、どのデータ源からでも読めます。
- **必要な分だけ読む**: 1 バイトずつ読んで、値が終わったところで止まるので、余計なデータを消費しません。
- **エラーを隠さない**: 値とエラーを両方返すので、途中で途切れたことも分かります。

## まとめ

- `io.ByteReader` から、1 バイトずつ可変長の値を読む。
- ZigZag の符号を戻して、符号付きの値にする。
- 読めた値とエラーを一緒に返す。
