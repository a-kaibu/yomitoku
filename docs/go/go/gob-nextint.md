---
title: "次の符号付き整数を読む gob の nextInt。読みの失敗は err に残す"
description: "encoding/gob の Decoder.nextInt。バッファから次の符号なしの値を読み、toInt で符号付きの整数に戻す。読み取りに失敗したら、dec.err に記録し、その値を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/decoder.go"
lines: [121, 127]
function: "nextInt"
difficulty: 2
tags: [入出力, 防御的プログラミング]
---

## ひとことで

`dec.nextInt()` は、デコーダのバッファから次の符号付きの整数を読みます。読めなかったときは、エラーを `dec.err` に残します。

## コード

```go:line-numbers=121
func (dec *Decoder) nextInt() int64 {
	n, _, err := decodeUintReader(&dec.buf, dec.countBuf)
	if err != nil {
		dec.err = err
	}
	return toInt(n)
}
```

## 前提知識

- **Decoder**: gob のデータを読み、Go の値に戻す型です。内部にバッファを持ちます。
- **decodeUintReader**: バッファから、符号なしの整数を一つ読む関数です。読んだ値と、読んだバイト数、エラーを返します。
- **toInt**: 符号なしの値を、符号付きの整数に戻す関数です。

## 何をしているか

### 1. 符号なしの値を読む

```go:line-numbers=122
	n, _, err := decodeUintReader(&dec.buf, dec.countBuf)
```

バッファから次の符号なしの値を読みます。読んだバイト数は、ここでは使わないので、`_` で捨てます。

### 2. 失敗したら記録する

```go:line-numbers=123
	if err != nil {
		dec.err = err
	}
```

読み取りでエラーが起きたら、そのエラーを `dec.err` に記録します。後の処理で、そのエラーを確かめられます。

### 3. 符号付きに戻して返す

```go:line-numbers=126
	return toInt(n)
```

読んだ値を `toInt` で符号付きの整数に戻して返します。エラーがあったときも、値は返します。その値は、呼び出し側で `dec.err` を見て扱います。

## ここがすごい

- **エラーを値とは別に持つ**: 関数の戻り値は整数だけにして、エラーは `dec` の中に残します。呼び出しの連鎖が書きやすくなります。
- **読み取りと変換を分ける**: 読むのは `decodeUintReader`、戻すのは `toInt` に任せるので、役割が分かれています。

## まとめ

- `nextInt` は、次の符号付きの整数をバッファから読みます。
- 読み取りのエラーは、`dec.err` に記録します。
- 読んだ値は、`toInt` で符号付きに戻します。
