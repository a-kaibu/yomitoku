---
title: "16 進数の 1 文字を値に変える strconv.unhex"
description: "strconv.unhex は、16 進数の数字 1 文字を、その値に変えます。0 から 9、a から f、A から F の 3 つの範囲を判定し、対応しなければ ok を false にします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strconv/quote.go"
lines: [228, 239]
function: "unhex"
difficulty: 2
format: 2
tags: [パース, 文字列処理, 標準ライブラリ]
---

## ひとことで

`unhex('7')` は `7`、`unhex('b')` は `11`、`unhex('x')` は `ok == false` になります。16 進数の桁を、数に直す最小の処理です。

## コード

```go:line-numbers=228
func unhex(b byte) (v rune, ok bool) {
	c := rune(b)
	switch {
	case '0' <= c && c <= '9':
		return c - '0', true
	case 'a' <= c && c <= 'f':
		return c - 'a' + 10, true
	case 'A' <= c && c <= 'F':
		return c - 'A' + 10, true
	}
	return
}
```

## 前提知識

- **16 進数**: 0 から 9 と、a から f（または A から F）で、0 から 15 を表します。
- **文字の差**: `'7' - '0'` のように、文字の番号の差を取ると、数字の値になります。
- **`rune` への変換**: 比べるための整数の型に変えて、範囲の判定を書きやすくします。
- **名前付きの戻り値**: `v` と `ok` が、この関数の結果です。`switch` を抜けたら、そのまま返ります。

## 何をしているか

### 1. 数字の範囲

```go:line-numbers=231
	case '0' <= c && c <= '9':
		return c - '0', true
```

`'0'` から `'9'` の文字なら、`c - '0'` で 0 から 9 の値にします。

### 2. 小文字の a から f

```go:line-numbers=233
	case 'a' <= c && c <= 'f':
		return c - 'a' + 10, true
```

`'a'` から `'f'` の文字なら、`c - 'a' + 10` で 10 から 15 の値にします。10 を足すのは、a が 10 を表すためです。

### 3. 大文字の A から F

```go:line-numbers=235
	case 'A' <= c && c <= 'F':
		return c - 'A' + 10, true
```

`'A'` から `'F'` の文字も、同じ考え方で 10 から 15 の値にします。大文字と小文字を別の範囲として書いています。

### 4. どれにも当てはまらない

```go:line-numbers=238
	return
```

どの範囲にも当てはまらなければ、名前付きの戻り値のまま返ります。`v` はゼロ値、`ok` は `false` です。

## ここがすごい

- **範囲で判定する**: 16 個の文字を 1 つずつ並べず、3 つの範囲で判定します。
- **失敗を値で伝える**: 無効な文字は、`ok` を `false` にして伝えます。例外や `panic` は使いません。
- **名前付きの戻り値を活かす**: 戻り値の省略形で、どの分岐からでも同じ形で返せます。

## まとめ

- 数字、小文字、大文字の 3 つの範囲で、値を計算する。
- 対応しない文字は、`ok` を `false` にして返す。
- 文字の番号の差で、簡単に値を求められる。
