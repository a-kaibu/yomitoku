---
title: "時間帯データから 4 バイトの整数を読む big4。足りなければエラーにする"
description: "time パッケージの dataIO.big4。読み取り位置から 4 バイトを取り、ビッグエンディアンの 32 ビットの値として返す。足りなければ error を立てて、ok を false にする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/zoneinfo_read.go"
lines: [69, 76]
function: "big4"
difficulty: 2
tags: [入出力, 防御的プログラミング]
---

## ひとことで

`d.big4()` は、時間帯データの読み取り位置から 4 バイトを読み、32 ビットの整数として返します。残りが 4 バイトに満たないときは、失敗を記録して `ok` を `false` にします。

## コード

```go:line-numbers=69
func (d *dataIO) big4() (n uint32, ok bool) {
	p := d.read(4)
	if len(p) < 4 {
		d.error = true
		return 0, false
	}
	return uint32(p[3]) | uint32(p[2])<<8 | uint32(p[1])<<16 | uint32(p[0])<<24, true
}
```

## 前提知識

- **dataIO**: 時間帯データのバイト列を、先頭から順に読み進めるための型です。読んだ位置を内部に持ちます。
- **ビッグエンディアン**: 数の上の桁のバイトを、並びの先頭に置く書き方です。時間帯データは、この形式で数を書いています。
- **名前付きの戻り値**: `n` と `ok` に名前を付けると、`return` で値を返せます。

## 何をしているか

### 1. 4 バイトを読む

```go:line-numbers=70
	p := d.read(4)
	if len(p) < 4 {
		d.error = true
		return 0, false
	}
```

`read(4)` で、次の 4 バイトを取り出します。取り出せた数が 4 に満たなければ、データが途中で終わっています。その場合は、`error` を立てて、`0` と `false` を返します。

### 2. ビッグエンディアンとして組み合わせる

```go:line-numbers=75
	return uint32(p[3]) | uint32(p[2])<<8 | uint32(p[1])<<16 | uint32(p[0])<<24, true
```

`p[0]` を最も大きい位に、`p[3]` を最も小さい位に置きます。ビッグエンディアンなので、先頭のバイトが上の桁になります。組み合わせた値と `true` を返します。

## ここがすごい

- **失敗を記録する**: 読めなかったことを `error` に残すので、後でまとめて確かめられます。読み取りのたびに、個別にエラーを返す必要がありません。
- **読みと確認を一か所に**: 4 バイトを読む処理と、足りるかの確認を、この関数の中でまとめています。呼び出し側は、`ok` だけを見れば済みます。

## まとめ

- `big4` は、4 バイトをビッグエンディアンの整数として読みます。
- 足りなければ `error` を立てて、`false` を返します。
- 上の桁から順に、バイトを組み合わせます。
