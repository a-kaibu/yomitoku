---
title: "必要な量に届くまで、読んでは数えて続ける io.ReadAtLeast"
description: "io.ReadAtLeast は、バッファを指定した量以上に埋めるまで、Reader から読み続けます。1 回の読みで足りないことが多いので、読んだ量を数えながら残りを続けて読みます。途中で EOF が来たときの扱いも決めています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/io/io.go"
lines: [329, 344]
function: "ReadAtLeast"
difficulty: 2
format: 2
tags: [入出力, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`io.ReadAtLeast(r, buf, min)` は、`r` から `buf` へ、少なくとも `min` バイトになるまで読み続けます。`Read` は 1 回で必要な量を返すとは限らないので、この関数が繰り返しを引き受けます。

`io.ReadFull(r, buf)` は、`min` を `len(buf)` にした特別な場合です。バッファを、最後までいっぱいに埋めます。

## コード

```go:line-numbers=329
func ReadAtLeast(r Reader, buf []byte, min int) (n int, err error) {
	if len(buf) < min {
		return 0, ErrShortBuffer
	}
	for n < min && err == nil {
		var nn int
		nn, err = r.Read(buf[n:])
		n += nn
	}
	if n >= min {
		err = nil
	} else if n > 0 && err == EOF {
		err = ErrUnexpectedEOF
	}
	return
}
```

## 前提知識

- **`Read` の性質**: `Read` は、読める分だけを返します。要求したバイト数に届かないことは普通にあります。
- **`EOF`**: 入力の終わりを表すエラーです。読んだ量が 0 のときの EOF と、途中での EOF では、意味が違います。
- **`ErrShortBuffer`**: バッファが必要な量より小さいときのエラーです。
- **`ErrUnexpectedEOF`**: 必要な量に届く前に入力が終わったときのエラーです。

## 何をしているか

`min = 5`、入力が 3 バイトずつ 2 回に分けて読める場合で追います。

### 1. バッファが小さすぎるなら先に断る

```go:line-numbers=330
	if len(buf) < min {
		return 0, ErrShortBuffer
	}
```

バッファに `min` バイトも入らないなら、読んでも目標に届きません。読む前に断ります。

### 2. 届くまで読み続ける

```go:line-numbers=333
	for n < min && err == nil {
		var nn int
		nn, err = r.Read(buf[n:])
		n += nn
	}
```

1 回目に 3 バイト読んで、`n = 3` です。まだ `min` に届かないので、続きを読みます。2 回目に 2 バイト読んで、`n = 5` になります。ループを抜けます。読むたびに、残りのバッファ `buf[n:]` に読み込みます。

### 3. 結果を整える

```go:line-numbers=338
	if n >= min {
		err = nil
	} else if n > 0 && err == EOF {
		err = ErrUnexpectedEOF
	}
	return
```

`n >= min` なら、途中で `EOF` が出ていても成功とみなして `err` を `nil` にします。目標に届いたのに、`EOF` を返すと呼び出し側が混乱するからです。目標に届かず、少しでも読めていたのに `EOF` になったときは、`ErrUnexpectedEOF` にします。何も読めずに `EOF` なら、そのまま `EOF` を返します。

## ここがすごい

- **1 回の読みに期待しない**: `Read` の戻り値を信じて 1 回で済ませると、短い読みで壊れます。読んだ量を数えて、残りを続けることで、正しい量が揃います。
- **EOF の意味を 3 通りに分ける**: 目標に届いた、途中で切れた、何も読めなかった、の 3 つを区別しています。エラーの値を見れば、状況が分かります。
- **バッファの残りだけに読む**: `buf[n:]` を渡すので、すでに読んだ部分を上書きしません。小さな工夫ですが、正しさのために大切です。

## まとめ

- `Read` は要求した量を返すとは限らないので、必要な量になるまで繰り返す。
- EOF は、目標に届いたかどうかで意味が変わる。
- すでに読んだ部分を壊さないように、残りのバッファだけを渡す。
