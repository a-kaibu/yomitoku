---
title: "時間帯データから 8 バイトの整数を読む big8。二回の big4 を組み合わせる"
description: "time パッケージの dataIO.big8。big4 を二回呼んで、上位と下位の 32 ビットずつを読む。どちらかが失敗したら、error を立てて ok を false にする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/zoneinfo_read.go"
lines: [78, 86]
function: "big8"
difficulty: 2
tags: [入出力, 数値計算]
---

## ひとことで

`d.big8()` は、時間帯データから 8 バイトを読み、64 ビットの整数として返します。32 ビットずつ二回に分けて読みます。

## コード

```go:line-numbers=78
func (d *dataIO) big8() (n uint64, ok bool) {
	n1, ok1 := d.big4()
	n2, ok2 := d.big4()
	if !ok1 || !ok2 {
		d.error = true
		return 0, false
	}
	return (uint64(n1) << 32) | uint64(n2), true
}
```

## 前提知識

- **big4**: 4 バイトを、ビッグエンディアンの 32 ビットの整数として読む関数です。
- **上位と下位**: 64 ビットの値を、上の 32 ビットと下の 32 ビットに分けたものです。
- **ビッグエンディアン**: 先頭のバイトが上の桁になる、数の書き方です。

## 何をしているか

### 1. 二回に分けて読む

```go:line-numbers=79
	n1, ok1 := d.big4()
	n2, ok2 := d.big4()
```

先に読んだ 4 バイトを上位の `n1`、続く 4 バイトを下位の `n2` とします。どちらも `big4` に任せるので、読み方の規則は一か所にまとまっています。

### 2. どちらかが失敗したら止める

```go:line-numbers=81
	if !ok1 || !ok2 {
		d.error = true
		return 0, false
	}
```

どちらかの読み取りが失敗したら、データが途中で終わっています。`error` を立てて、`0` と `false` を返します。失敗した後の読み取りで、中途半端な値を使わないためです。

### 3. 二つの値を合わせる

```go:line-numbers=85
	return (uint64(n1) << 32) | uint64(n2), true
```

上位の `n1` を 32 ビット左にずらし、下位の `n2` と `|` で合わせます。64 ビットの値になり、`true` とともに返します。

## ここがすごい

- **既存の関数を積み上げる**: 32 ビットを読む `big4` を二回使うだけで、64 ビットの読み取りを作っています。
- **失敗は一度の判定で扱う**: 二つの `ok` をまとめて確かめるので、途中で失敗しても、同じ処理で止まります。

## まとめ

- `big8` は、8 バイトを 64 ビットの整数として読みます。
- `big4` を二回使い、上位と下位に分けて読みます。
- どちらかが失敗したら、`false` を返します。
