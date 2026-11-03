---
title: "長さを必要なバイト数だけ書き足す asn1 の appendLength"
description: "encoding/asn1 の appendLength。整数 i を表すのに必要なバイト数だけ、上の桁から順に dst に書き足す。DER の長さの符号化に使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/asn1/marshal.go"
lines: [229, 237]
function: "appendLength"
difficulty: 2
tags: [入出力, 数値計算]
---

## ひとことで

`appendLength(dst, i)` は、長さ `i` を、表すのに必要なバイト数だけ `dst` の末尾に書き足します。ASN.1 のデータでは、長さの後に中身が続くので、この長さ部分を作るために使われます。

## コード

```go:line-numbers=229
func appendLength(dst []byte, i int) []byte {
	n := lengthLength(i)

	for ; n > 0; n-- {
		dst = append(dst, byte(i>>uint((n-1)*8)))
	}

	return dst
}
```

## 前提知識

- **ASN.1 の長さ**: データの中身が何バイトかを、バイト列で前に書いたものです。
- **`lengthLength`**: 長さ `i` を表すのに必要なバイト数を返す、別の関数です。
- **`byte(...)`**: 値を 1 バイトに切り詰めます。

## 何をしているか

### 1. 必要なバイト数を求める

```go:line-numbers=230
	n := lengthLength(i)
```

長さ `i` を表すのに、何バイト必要かを `lengthLength` で求めます。

### 2. 上の桁から 1 バイトずつ書く

```go:line-numbers=232
	for ; n > 0; n-- {
		dst = append(dst, byte(i>>uint((n-1)*8)))
	}
```

必要なバイト数だけ回します。`i` を `(n-1)*8` ビット右にずらして、その位置の 8 ビットを 1 バイトとして書きます。上の桁から順に書くので、先頭のバイトが一番大きい位です。

### 3. 書き足した結果を返す

```go:line-numbers=236
	return dst
```

書き足し済みの `dst` を返します。

## ここがすごい

- **個数を先に決める**: 何バイト書くかを先に決めるので、ループの回数が決まり、余分なバイトは出ません。
- **同じ式で全部書ける**: 桁の位置を `(n-1)*8` と式で表すので、バイト数が何であっても同じ書き方になります。

## まとめ

- `appendLength` は、長さを必要なバイト数だけ、上の桁から書きます。
- 何バイト必要かは `lengthLength` で求めます。
- 書き足すだけで、新しい配列を作る処理は含みません。
