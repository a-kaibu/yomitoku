---
title: "入力を 1 バイトずつ切り出す bufio.ScanBytes"
description: "bufio.ScanBytes は、Scanner の区切り関数の 1 つです。データを 1 バイトずつトークンとして切り出し、入力の終わりでは何も返さずに止まります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2013 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bufio/scan.go"
lines: [297, 302]
function: "ScanBytes"
difficulty: 1
format: 2
tags: [入出力, パース, 標準ライブラリ]
---

## ひとことで

`scanner.Split(bufio.ScanBytes)` とすると、入力を 1 バイトずつ読めます。行や単語の代わりに、バイトの列を順に扱いたいときに使います。

## コード

```go:line-numbers=297
func ScanBytes(data []byte, atEOF bool) (advance int, token []byte, err error) {
	if atEOF && len(data) == 0 {
		return 0, nil, nil
	}
	return 1, data[0:1], nil
}
```

## 前提知識

- **`bufio.Scanner`**: 入力を、区切り関数が決めた単位で順に読む仕組みです。
- **区切り関数 `SplitFunc`**: 残りのデータから、次のトークンと、進める量を決める関数です。
- **`advance`**: 次の呼び出しで、どこまで進めるかを表す値です。
- **`atEOF`**: 入力が終わったかを表す真偽です。

## 何をしているか

### 1. 入力の終わりを確かめる

```go:line-numbers=298
	if atEOF && len(data) == 0 {
		return 0, nil, nil
	}
```

入力が終わっていて、データも空なら、トークンは無いので、進める量 0 で終わります。

### 2. 先頭の 1 バイトを返す

```go:line-numbers=301
	return 1, data[0:1], nil
```

それ以外は、先頭の 1 バイトを `token` にして、進める量を 1 にします。`data[0:1]` は、コピーせずに先頭 1 バイトを指します。

## ここがすごい

- **単位が明確**: 1 バイトずつなので、バイトの値をそのまま扱えます。文字の境界を気にせずに読めます。
- **コピーが起きない**: トークンは、元のデータの一部を指すだけです。大きな入力でも、余分な領域を使いません。
- **区切り関数の見本になる**: 残りのデータと `atEOF` から判断する形は、他の区切り関数を書くときの手本になります。

## まとめ

- 入力の終わりでデータが無ければ、何も返さずに終わる。
- それ以外は、先頭 1 バイトを 1 つのトークンとして返す。
- コピーをせず、元のデータの一部を指す。
