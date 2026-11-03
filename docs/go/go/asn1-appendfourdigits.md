---
title: "年の 4 桁を数字の文字として書き足す appendFourDigits"
description: "encoding/asn1 の appendFourDigits。0 から 9999 までの整数を、千の位から一の位まで、4 桁の数字の文字として dst に書き足す。UTC 時刻の年の表記に使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/asn1/marshal.go"
lines: [355, 361]
function: "appendFourDigits"
difficulty: 2
tags: [文字列処理, 数値計算]
---

## ひとことで

`appendFourDigits(dst, v)` は、整数 `v` を 4 桁の数字の文字として、`dst` の末尾に書き足します。`v` が 1000 より小さくても、必ず 4 桁になります。

## コード

```go:line-numbers=355
func appendFourDigits(dst []byte, v int) []byte {
	return append(dst,
		byte('0'+(v/1000)%10),
		byte('0'+(v/100)%10),
		byte('0'+(v/10)%10),
		byte('0'+v%10))
}
```

## 前提知識

- **ASCII の数字**: `'0'` から `'9'` までの文字です。値に `'0'` を足すと、その数字の文字になります。
- **桁の取り出し**: `v/1000` や `v/100` を 10 で割った余りで、それぞれの桁を取り出せます。
- **`append` に複数の値**: Go の `append` は、一度に複数のバイトを足せます。

## 何をしているか

### 1. 各桁を数字の文字にする

```go:line-numbers=356
	return append(dst,
		byte('0'+(v/1000)%10),
		byte('0'+(v/100)%10),
		byte('0'+(v/10)%10),
		byte('0'+v%10))
```

千の位、百の位、十の位、一の位の順に、数字の文字を作ります。たとえば `v/1000` を 10 で割った余りは千の位で、それに `'0'` を足すと、その数字の文字になります。

たとえば `v` が 2024 なら、千の位は 2、百の位は 0、十の位は 2、一の位は 4 になり、文字の `"2024"` が書き足されます。`v` が 7 のときは、先頭の 3 つの桁が 0 になり、`"0007"` と書かれます。年を表すときに、桁数が揃うことが大切なので、この書き方が使われます。

## ここがすごい

- **桁数を固定する**: 4 つの式を並べるだけなので、ループがなく、必ず 4 バイトを書きます。
- **文字を作るのに足し算だけ**: `'0'` を足すだけで文字になるので、文字列を作る専用の処理は要りません。

## まとめ

- `appendFourDigits` は、整数を 4 桁の数字の文字として書き足します。
- 桁は、割り算と余りで取り出します。
- 桁数を固定するので、ループは使いません。
