---
title: "整数を 7 ビットずつ分けて、バイト列に書き足す appendBase128Int"
description: "encoding/asn1 の appendBase128Int。整数 n を上の桁から 7 ビットずつ取り出し、続きがあるバイトには最上位ビットを立てて、dst に書き足す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/asn1/marshal.go"
lines: [179, 193]
function: "appendBase128Int"
difficulty: 3
tags: [数値計算, ビット演算]
---

## ひとことで

`appendBase128Int(dst, n)` は、整数 `n` を base128 の形でバイト列にして、`dst` の末尾に書き足します。大きい桁から順に書くので、読む側は先頭から数えられます。

## コード

```go:line-numbers=179
func appendBase128Int(dst []byte, n int64) []byte {
	l := base128IntLength(n)

	for i := l - 1; i >= 0; i-- {
		o := byte(n >> uint(i*7))
		o &= 0x7f
		if i != 0 {
			o |= 0x80
		}

		dst = append(dst, o)
	}

	return dst
}
```

## 前提知識

- **base128**: 1 バイトの下位 7 ビットに値を入れ、最上位の 1 ビットで「続きがある」かを示す表し方です。
- **`append`**: スライスの末尾に値を足します。足りなければ、新しい配列を確保します。
- **`byte(...)`**: 値を 1 バイトに切り詰めます。上位のビットは捨てられます。

## 何をしているか

### 1. 桁数を求めて、上の桁から順に回す

```go:line-numbers=180
	l := base128IntLength(n)
```

先ほどの `base128IntLength` で、塊の数を求めます。

```go:line-numbers=182
	for i := l - 1; i >= 0; i-- {
		o := byte(n >> uint(i*7))
		o &= 0x7f
		if i != 0 {
			o |= 0x80
		}

		dst = append(dst, o)
	}
```

最も上の塊から順に回します。`n >> (i*7)` で、その塊の 7 ビットを下位に持ってきて、`0x7f` との `&` で下位 7 ビットだけを残します。

最後の塊以外には、最上位ビット `0x80` を立てます。これは「まだ続く」という印です。

### 3. 書き足したバイト列を返す

```go:line-numbers=192
	return dst
```

書き足し済みの `dst` を返します。

## ここがすごい

- **大きい桁から書く**: 先頭のバイトだけを見れば、続くかどうかが分かります。読む側は、先頭から順に読めます。
- **印の付け方が一か所**: 続きの印は、最後の塊以外に付けるという一つの条件で決まります。

## まとめ

- `appendBase128Int` は、整数を base128 のバイト列にして、末尾に足します。
- 上の桁から 7 ビットずつ取り出し、続きの印を付けます。
- 桁数は `base128IntLength` で先に求めます。
