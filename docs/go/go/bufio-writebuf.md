---
title: "バッファの中身を書き出す bufio の writeBuf。負の書き込み数は panic する"
description: "bufio パッケージの writeBuf。バッファの未処理の部分を w に書き出し、書いた量だけ読み取り位置を進める。書いた量が負なら、内部のエラーで panic する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bufio/bufio.go"
lines: [562, 569]
function: "writeBuf"
difficulty: 2
tags: [入出力, 防御的プログラミング]
---

## ひとことで

`b.writeBuf(w)` は、`Reader` のバッファにまだ読まれていない部分を、`w` に書き出します。書いた分だけ、読み取り位置を進めます。

## コード

```go:line-numbers=562
func (b *Reader) writeBuf(w io.Writer) (int64, error) {
	n, err := w.Write(b.buf[b.r:b.w])
	if n < 0 {
		panic(errNegativeWrite)
	}
	b.r += n
	return int64(n), err
}
```

## 前提知識

- **bufio.Reader のバッファ**: 入力から先読みしたデータを置いておく領域です。`b.r` が読んだ位置、`b.w` が溜めた終わりの位置です。
- **io.Writer**: 書き出し先を表すインターフェースです。`Write` メソッドを持ちます。
- **負の書き込み数**: `Write` は、書いた量を返します。量が負になるのは、書き出し側が正しく動いていない証拠です。

## 何をしているか

### 1. 未処理の部分を書き出す

```go:line-numbers=563
	n, err := w.Write(b.buf[b.r:b.w])
	if n < 0 {
		panic(errNegativeWrite)
	}
```

`b.buf[b.r:b.w]` が、まだ読まれていない部分です。その部分を `w` に書き出し、書いた量 `n` と、エラーを受け取ります。書いた量が負なら、書き出し側が壊れているので、内部のエラーで panic します。

### 2. 読み取り位置を進める

```go:line-numbers=567
	b.r += n
	return int64(n), err
```

書いた分だけ読み取り位置 `b.r` を進めます。書いた量と、`Write` が返したエラーをそのまま返します。

## ここがすごい

- **書いた分だけ進める**: 読み取り位置は、実際に書けた量で進むので、書けなかった部分が失われません。
- **壊れた書き出し側を検出**: 負の量を、誤った状態として扱い、panic で止めます。

## まとめ

- `writeBuf` は、未処理のバッファを `w` に書き出します。
- 書いた量だけ、読み取り位置を進めます。
- 負の書き込み数は、panic で知らせます。
