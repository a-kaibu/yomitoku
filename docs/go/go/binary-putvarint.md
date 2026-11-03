---
title: "符号付き整数を可変長で書く PutVarint。負の数は反転して小さくする"
description: "encoding/binary の PutVarint。符号付きの整数を、符号を最下位に寄せた値に変えてから、可変長の形で buf に書き込む。小さい絶対値は、短いバイト列になる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/binary/varint.go"
lines: [101, 107]
function: "PutVarint"
difficulty: 2
tags: [入出力, ビット演算]
---

## ひとことで

`PutVarint(buf, x)` は、符号付きの整数 `x` を、可変長の形で `buf` に書き込みます。書き込んだバイト数を返します。絶対値が小さい数は、短いバイト列で済みます。

## コード

```go:line-numbers=101
func PutVarint(buf []byte, x int64) int {
	ux := uint64(x) << 1
	if x < 0 {
		ux = ^ux
	}
	return PutUvarint(buf, ux)
}
```

## 前提知識

- **可変長整数**: 数の大きさに応じて、使うバイト数を変える表し方です。小さい数は 1 バイトで済みます。
- **符号付き整数**: 正と負の数を表せる整数です。負の数は、ビットの表し方のせいで、そのままでは大きな値になります。
- **ビット反転 `^`**: 各ビットを 0 と 1 で入れ替えます。負の数の表し方を、正の数の近くに寄せるために使います。

## 何をしているか

### 1. 左にずらして符号の位置を空ける

```go:line-numbers=102
	ux := uint64(x) << 1
```

`x` を `uint64` にして、一つ左にずらします。最下位のビットは、符号を表すために空けておきます。

### 2. 負の数なら、すべてのビットを反転する

```go:line-numbers=103
	if x < 0 {
		ux = ^ux
	}
```

`x` が負なら、`ux` のビットを反転します。たとえば `-1` は、反転すると `1` になります。`-2` は `3` になります。絶対値が小さい負の数が、小さい値になります。

### 3. 変換した値を可変長で書き込む

```go:line-numbers=106
	return PutUvarint(buf, ux)
```

変換した `ux` を、符号なしの可変長の形で `buf` に書き込み、そのバイト数を返します。

## ここがすごい

- **負の数も小さく書ける**: 符号を最下位に寄せるので、`-1` も `1` も、どちらも 1 バイトで書けます。
- **書き込みは既存の関数に任せる**: 変換を済ませた後は `PutUvarint` に渡すので、可変長の書き方は一か所にまとまります。

## まとめ

- `PutVarint` は、符号付きの整数を可変長で書き込みます。
- 符号を最下位に寄せるので、小さい絶対値は短く書けます。
- 書き込み自体は `PutUvarint` に任せます。
