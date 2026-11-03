---
title: "時間帯データから 1 バイトを読む dataIO.byte。足りなければエラーにする"
description: "time パッケージの dataIO.byte。読み取り位置から 1 バイトを取り、そのバイトの値を返す。残りがなければ error を立てて、ok を false にする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/zoneinfo_read.go"
lines: [88, 95]
function: "byte"
difficulty: 1
tags: [入出力, 防御的プログラミング]
---

## ひとことで

`d.byte()` は、時間帯データの読み取り位置から 1 バイトを読んで返します。データが残っていなければ、失敗を記録して `false` を返します。

## コード

```go:line-numbers=88
func (d *dataIO) byte() (n byte, ok bool) {
	p := d.read(1)
	if len(p) < 1 {
		d.error = true
		return 0, false
	}
	return p[0], true
}
```

## 前提知識

- **dataIO**: 時間帯データを、先頭から順に読み進める型です。読み取り位置を内部に持ちます。
- **read**: 指定したバイト数を、読み取り位置から取り出す内部の関数です。取り出せた分だけを返します。
- **byte**: 1 バイトの値を表す型です。`uint8` と同じです。

## 何をしているか

### 1. 1 バイトを読み、足りるかを確かめる

```go:line-numbers=89
	p := d.read(1)
	if len(p) < 1 {
		d.error = true
		return 0, false
	}
```

`read(1)` で次のバイトを取り出します。取り出せた長さが 1 より小さければ、データが終わっています。その場合は `error` を立てて、`0` と `false` を返します。

### 2. 読んだバイトを返す

```go:line-numbers=94
	return p[0], true
```

読めたら、先頭のバイトをそのまま返します。`true` を付けて、読めたことを示します。

## ここがすごい

- **一バイトの読みも同じ形**: 複数バイトを読む関数と同じ書き方で、失敗の扱いを揃えています。
- **失敗を後でまとめて見られる**: `error` を立てるので、一連の読み取りの最後に、失敗があったかをまとめて確かめられます。

## まとめ

- `byte` は、読み取り位置から 1 バイトを読みます。
- 残りがなければ `error` を立てて、`false` を返します。
- 他の `big4` などと同じ形で、失敗を扱います。
