---
title: "ASN.1 のビット文字列を読む parseBitString。余りのビットの数が正しいかを確かめる"
description: "encoding/asn1 の parseBitString。ビット文字列の先頭の 1 バイトは、末尾の余ったビットの数を表す。その数が 0 から 7 の範囲にあり、余りのビットがすべて 0 かを確かめてから、ビットの長さを計算する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/asn1/asn1.go"
lines: [198, 213]
function: "parseBitString"
difficulty: 2
tags: [パース, ビット演算, 防御的プログラミング]
---

## ひとことで

`parseBitString(bytes)` は、ASN.1 のビット文字列を読みます。ビット文字列は、最後のバイトに、使っていないビットが含まれることがあります。先頭の 1 バイトが、その余りの数を表します。

例えば、先頭が `3` なら、最後の 3 ビットは意味のないパディングです。この関数は、そのパディングが正しい形かを確かめ、本当のビットの長さを求めます。

## コード

```go:line-numbers=198
func parseBitString(bytes []byte) (ret BitString, err error) {
	if len(bytes) == 0 {
		err = SyntaxError{"zero length BIT STRING"}
		return
	}
	paddingBits := int(bytes[0])
	if paddingBits > 7 ||
		len(bytes) == 1 && paddingBits > 0 ||
		bytes[len(bytes)-1]&((1<<bytes[0])-1) != 0 {
		err = SyntaxError{"invalid padding bits in BIT STRING"}
		return
	}
	ret.BitLength = (len(bytes)-1)*8 - paddingBits
	ret.Bytes = bytes[1:]
	return
}
```

## 前提知識

- **ビット文字列**: 0 と 1 の並びを、バイトにまとめて表すデータ型です。
- **パディング**: 最後のバイトを埋めるために付ける、使わないビットです。
- **`paddingBits`**: 先頭のバイトが表す、パディングのビット数です。0 から 7 の範囲だけが許されます。
- **`BitLength`**: 本当のビットの長さです。バイト数から求めます。

## 何をしているか

### 1. 空のバイト列を弾く

```go:line-numbers=199
	if len(bytes) == 0 {
		err = SyntaxError{"zero length BIT STRING"}
		return
	}
```

ビット文字列には、少なくとも先頭のバイトが必要です。空ならエラーです。

### 2. パディングが正しいかを確かめる

```go:line-numbers=204
	if paddingBits > 7 ||
		len(bytes) == 1 && paddingBits > 0 ||
		bytes[len(bytes)-1]&((1<<bytes[0])-1) != 0 {
		err = SyntaxError{"invalid padding bits in BIT STRING"}
		return
	}
```

三つの条件のどれかに当たれば、パディングが不正です。パディングは 7 以下である必要があります。バイトが一つしかないのに余りがあるのも誤りです。さらに、末尾の余りのビットは、すべて 0 でなければなりません。

### 3. ビットの長さを求める

```go:line-numbers=210
	ret.BitLength = (len(bytes)-1)*8 - paddingBits
	ret.Bytes = bytes[1:]
```

先頭の一バイトを除いた部分のビット数から、パディングの数を引いて、本当の長さを求めます。データ本体は、先頭の一バイトより後ろです。

## ここがすごい

- **余りの正しさを確かめる**: パディングが 0 でない余りを含んでいれば、誤りとします。同じデータを、違う形で表すことを許さない作りです。
- **長さをビット単位で返す**: バイトの数ではなく、ビットの数で返すので、余りを含めても正確な長さが分かります。
- **データ本体を指すだけ**: `bytes[1:]` は、先頭の一バイトを除いた部分を指すだけで、コピーは作りません。

## まとめ

- `parseBitString` は、先頭のバイトが示すパディングを確かめてから、ビット文字列を読みます。
- 空のデータや、正しくないパディングは、エラーにします。
- ビット単位の長さと、データ本体を返します。
