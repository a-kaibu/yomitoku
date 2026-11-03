---
title: "符号化された長さから元の長さを求める base32 の decodedLen"
description: "encoding/base32 の decodedLen。符号化された文字数 n から、元のバイト数を求める。パディングがなければ端数の分も数え、あれば 8 文字ごとに 5 バイトとして数える。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/base32/base32.go"
lines: [589, 594]
function: "decodedLen"
difficulty: 2
tags: [数値計算, 可読性]
---

## ひとことで

`decodedLen(n, padChar)` は、符号化された文字数 `n` から、元のバイト数を求めます。パディングの有無で、計算の仕方が変わります。

## コード

```go:line-numbers=589
func decodedLen(n int, padChar rune) int {
	if padChar == NoPadding {
		return n/8*5 + n%8*5/8
	}
	return n / 8 * 5
}
```

## 前提知識

- **base32**: 5 バイトの元データを、8 文字の符号で表す符号化です。
- **パディング**: 符号化の長さを 8 文字の倍数に揃えるための、`=` の印です。`NoPadding` のときは、印を付けません。
- **端数**: 8 で割り切れない残りの文字です。その分は、元のバイトの一部に当たります。

## 何をしているか

### 1. パディングがない場合は端数も数える

```go:line-numbers=590
	if padChar == NoPadding {
		return n/8*5 + n%8*5/8
	}
```

`NoPadding` のとき、文字数は 8 の倍数とは限りません。`n/8*5` で、8 文字ごとの 5 バイトを数えます。`n%8*5/8` で、残りの端数に当たるバイト数を足します。

### 2. パディングがある場合は 8 文字ごとに数える

```go:line-numbers=593
	return n / 8 * 5
```

パディングがあるときは、文字数が 8 の倍数になっています。8 文字ごとに 5 バイトとして数えるだけで、元のバイト数になります。

## ここがすごい

- **場合分けが二つだけ**: パディングの有無で式が分かれるだけなので、規則が見やすくなっています。
- **割り算と余りで端数を出す**: 端数を、余りと掛け算だけで計算するので、ループは要りません。

## まとめ

- `decodedLen` は、文字数から元のバイト数を求めます。
- パディングがなければ、端数の分も数えます。
- パディングがあれば、8 文字ごとに 5 バイトで計算します。
