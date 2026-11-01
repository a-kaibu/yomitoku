---
title: "大文字を小文字にする unicode.ToLower"
description: "unicode.ToLower は、rune を小文字にします。ASCII の範囲は、大文字の範囲の差を足すだけで変換し、それ以外は Unicode の表を引いて変換します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/letter.go"
lines: [279, 287]
function: "ToLower"
difficulty: 1
format: 2
tags: [Unicode, 最適化, 標準ライブラリ]
---

## ひとことで

`unicode.ToLower('A')` は `'a'` を返します。英字の大文字を、対応する小文字に変えます。ASCII の場合は、計算だけで変換できます。

## コード

```go:line-numbers=279
func ToLower(r rune) rune {
	if r <= MaxASCII {
		if 'A' <= r && r <= 'Z' {
			r += 'a' - 'A'
		}
		return r
	}
	return To(LowerCase, r)
}
```

## 前提知識

- **`MaxASCII`**: ASCII の最大値（0x7F）を表す定数です。
- **大文字と小文字の差**: ASCII では、`'A'` と `'a'` の差は 32 です。その差を足すと、大文字が小文字になります。
- **`To(LowerCase, r)`**: Unicode の変換表を引いて、小文字を求める関数です。
- **早期の `return`**: ASCII の範囲なら、表を引かずに答えを返します。

## 何をしているか

### 1. ASCII の範囲は計算で変える

```go:line-numbers=280
	if r <= MaxASCII {
		if 'A' <= r && r <= 'Z' {
			r += 'a' - 'A'
		}
		return r
```

`r` が ASCII なら、`'A'` から `'Z'` の範囲にあるかを調べます。そこに入っていれば、`'a' - 'A'` を足して小文字にします。それ以外の ASCII の文字は、そのまま返します。

### 2. それ以外は Unicode の表で変える

```go:line-numbers=286
	return To(LowerCase, r)
```

ASCII より大きい文字は、`To(LowerCase, r)` で変換表を引きます。ギリシャ文字や、キリル文字なども、この表で扱われます。

## ここがすごい

- **よくある場合を速くする**: 英字の多くは ASCII なので、計算だけで変換が終わります。
- **大文字と小文字の差を利用する**: ASCII の並びが規則的なので、差を足すだけで済みます。
- **表で広く対応する**: ASCII 以外は、Unicode の表に任せるので、多くの言語の文字に対応します。

## まとめ

- ASCII の大文字は、差を足すだけで小文字にする。
- ASCII 以外は、Unicode の変換表を引く。
- よく使われる場合を、計算だけで速く処理する。
