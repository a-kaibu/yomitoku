---
title: "整数を 7 ビットずつ分けるのに必要な桁数を数える base128IntLength"
description: "encoding/asn1 の base128IntLength。整数 n を 7 ビットずつの塊に分けたとき、塊が何個になるかを数える。0 は 1 個として数える。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/asn1/marshal.go"
lines: [166, 177]
function: "base128IntLength"
difficulty: 2
tags: [数値計算, ビット演算]
---

## ひとことで

`base128IntLength(n)` は、整数 `n` を 7 ビットずつの塊に分けたとき、塊が何個になるかを返します。ASN.1 の OID に含まれる数字を、バイト列へ書き出す前に、必要な長さを知るために使われます。

## コード

```go:line-numbers=166
func base128IntLength(n int64) int {
	if n == 0 {
		return 1
	}

	l := 0
	for i := n; i > 0; i >>= 7 {
		l++
	}

	return l
}
```

## 前提知識

- **base128**: 1 バイトの下位 7 ビットに値を入れ、最上位の 1 ビットを「まだ続きがある」という印に使う表し方です。
- **OID**: 機器や規格を一意に示す、数字の並びです。この数字の一つひとつを、base128 で書きます。
- **右シフト `>>`**: 数の各ビットを右にずらします。`i >>= 7` は、下位 7 ビットを捨てることに当たります。

## 何をしているか

### 1. 0 は特別に扱う

```go:line-numbers=167
	if n == 0 {
		return 1
	}
```

0 は、ビットがひとつもありませんが、バイトとしては 1 個必要です。ループに入る前に 1 を返します。

### 2. 7 ビットずつ右にずらして数える

```go:line-numbers=171
	l := 0
	for i := n; i > 0; i >>= 7 {
		l++
	}
```

`i` が 0 になるまで、7 ビットずつ右にずらし、そのたびに `l` を増やします。ずらした回数が、塊の数になります。

### 3. 数えた個数を返す

```go:line-numbers=176
	return l
```

数えた個数をそのまま返します。

## ここがすごい

- **書く前に長さが分かる**: 先に塊の数を数えるので、書き出し側は必要なバイト数を前もって確保できます。
- **0 の例外が一行で済む**: 0 のときだけ特別扱いすれば、残りのループは 0 を気にせず書けます。

## まとめ

- `base128IntLength` は、整数を 7 ビットずつ分けたときの塊の数を返します。
- 0 は 1 個として数えます。
- 数えるのは右シフトを繰り返すだけなので、短く書けます。
