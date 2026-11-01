---
title: "符号付きの可変長整数を読む binary.Varint"
description: "encoding/binary の Varint は、符号付きの整数を可変長のバイト列から読みます。符号は、ZigZag という変換で 0 に近い値を小さなビットにまとめて扱います。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/encoding/binary/varint.go"
lines: [115, 122]
function: "Varint"
difficulty: 2
format: 2
tags: [入出力, ビット演算, 標準ライブラリ]
---

## ひとことで

`binary.Varint(buf)` は、`buf` の先頭から符号付きの整数を読み、その値と使ったバイト数を返します。`-1` のような負の数も、小さなバイト数で表せるように作られています。

## コード

::: code-group

```go:line-numbers=115 [日本語訳]
func Varint(buf []byte) (int64, int) {
	ux, n := Uvarint(buf) // エラーがあっても、続けて使ってよい。
	x := int64(ux >> 1)
	if ux&1 != 0 {
		x = ^x
	}
	return x, n
}
```

```go:line-numbers=115 [原文]
func Varint(buf []byte) (int64, int) {
	ux, n := Uvarint(buf) // ok to continue in presence of error
	x := int64(ux >> 1)
	if ux&1 != 0 {
		x = ^x
	}
	return x, n
}
```

:::

## 前提知識

- **可変長整数（varint）**: 値が小さいほど、少ないバイト数で書く方式です。各バイトの最上位ビットが、続きがあるかを示します。
- **ZigZag 変換**: 符号を、0、-1、1、-2 の順に 0、1、2、3 のような非負の数へ写す変換です。負の数を、絶対値の小ささのまま短く書けます。
- **`Uvarint`**: 非負の整数だけを読む関数です。`Varint` は、その結果を符号付きに戻します。
- **戻り値の `n`**: 読んだバイト数です。0 以下なら、読めなかったことを表します。

## 何をしているか

### 1. 符号なし版で読む

```go:line-numbers=116
	ux, n := Uvarint(buf) // エラーがあっても、続けて使ってよい。
```

まず `Uvarint` で、ZigZag に変換された値 `ux` と、読んだバイト数 `n` を取り出します。この時点では、符号はまだ変換されたままです。コメントにあるとおり、エラーがあっても、この後の処理はそのまま続けられます。

### 2. ZigZag を元に戻す

```go:line-numbers=117
	x := int64(ux >> 1)
```

`ux >> 1` で、1 ビットぶん右へずらします。この値が絶対値に当たります。

### 3. 符号を付け直す

```go:line-numbers=118
	if ux&1 != 0 {
		x = ^x
	}
```

最下位のビットが 1 なら、負の数です。そのときは `^x` で、ビットを反転して負の値にします。`^x` は、`-x - 1` と同じ値になるので、ZigZag の決まりに合っています。

## ここがすごい

- **小さな負の数も短く書ける**: ZigZag を使うので、`-1` は 1 バイト、`-64` 程度までも 1 バイトで書けます。符号のビットを先頭に置く方式より、短くなる場面が多くなります。
- **読みと符号を分けている**: 非負の読み方を `Uvarint` に任せ、`Varint` は符号を戻すだけにしているので、処理がとても短くなります。
- **エラーの扱いを正直に返す**: `n` が 0 以下なら、読めなかったことが分かります。値の方は、呼び出し側が `n` を見て判断します。

## まとめ

- 符号付きの値は、ZigZag で非負の数に写してから書く。
- 読むときは、非負の読み方を使い、最後に符号を戻す。
- 読んだバイト数を返すので、続きの位置を計算できる。
