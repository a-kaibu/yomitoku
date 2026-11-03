---
title: "64 ビットの値を下の桁から 8 バイトで足す littleEndian.AppendUint64"
description: "encoding/binary の littleEndian.AppendUint64。uint64 の値を、下の桁のバイトから順に 8 バイト、b の末尾に足す。リトルエンディアンの書き込みに使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/binary/binary.go"
lines: [135, 146]
function: "AppendUint64"
difficulty: 2
tags: [入出力, ビット演算]
---

## ひとことで

`littleEndian.AppendUint64(b, v)` は、64 ビットの値 `v` を 8 バイトに分けて、`b` の末尾に足します。下の桁のバイトが先に来ます。

## コード

```go:line-numbers=135
func (littleEndian) AppendUint64(b []byte, v uint64) []byte {
	return append(b,
		byte(v),
		byte(v>>8),
		byte(v>>16),
		byte(v>>24),
		byte(v>>32),
		byte(v>>40),
		byte(v>>48),
		byte(v>>56),
	)
}
```

## 前提知識

- **リトルエンディアン**: 数の下の桁のバイトを、先頭に置く書き方です。
- **バイトの切り出し**: `byte(v>>8)` のように、ずらした値を 8 ビットに切り詰めると、その位置のバイトになります。
- **append の複数の値**: `append` には、一度に複数のバイトを渡せます。

## 何をしているか

### 1. 下の桁から順に 8 バイト並べる

```go:line-numbers=136
	return append(b,
		byte(v),
		byte(v>>8),
		byte(v>>16),
		byte(v>>24),
		byte(v>>32),
		byte(v>>40),
		byte(v>>48),
		byte(v>>56),
	)
```

`byte(v)` が最下位の 8 ビットです。以降は、8 ビットずつずらした値を `byte` に切り詰めます。そのため、一番目が最も小さい位、八番目が最も大きい位になります。

## ここがすごい

- **書く順番がそのまま位の順番**: 下の桁から並べるので、読む側は先頭から数えるだけで、値を組み立てられます。
- **切り詰めで位を取り出す**: ずらして `byte` に変えるだけで、必要なバイトを取り出せます。

たとえば `v` が `0x0102` なら、先頭に `0x02`、次に `0x01` が足され、残りの 6 バイトは 0 になります。`append` は `b` の末尾に足すので、既にあるバイト列は変わりません。この書き方で、どの環境でも同じバイト順の値を作れます。

## まとめ

- `AppendUint64` は、64 ビットの値を 8 バイトで足します。
- 下の桁のバイトが先頭に来ます。
- 各バイトは、ずらして `byte` に切り詰めて作ります。
