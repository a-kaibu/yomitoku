---
title: "ASCII の大文字化は引き算 1 回。それ以外だけ表を引く ToUpper"
description: "unicode.ToUpper は、文字を大文字に変えます。ASCII の小文字なら、大文字との差 32 を引くだけで済ませ、それ以外の文字だけ Unicode の変換表を引きます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/letter.go"
lines: [268, 276]
function: "ToUpper"
difficulty: 2
format: 2
tags: [Unicode, 最適化, 文字列処理, 標準ライブラリ]
---

## ひとことで

`unicode.ToUpper('a')` は `'A'` を返します。大文字でも、変換できない記号でも、そのまま返ります。`unicode.ToUpper('é')` のように、ASCII の外の文字も扱えます。

ASCII の範囲では、変換はとても単純です。`a` から `z` は、`A` から `Z` より 32 大きいからです。この関数は、その性質を使って速く処理します。

## コード

```go:line-numbers=268
func ToUpper(r rune) rune {
	if r <= MaxASCII {
		if 'a' <= r && r <= 'z' {
			r -= 'a' - 'A'
		}
		return r
	}
	return To(UpperCase, r)
}
```

## 前提知識

- **ASCII の大文字と小文字**: `'A'` は 65、`'a'` は 97 です。その差は 32 で、ビットでは 6 番目（0 から数えて 5 番目）の 1 を変えるだけです。
- **`rune`**: 1 文字を表す整数の型です。
- **`MaxASCII`**: ASCII の最大値 `0x7F`（127）です。
- **`To(UpperCase, r)`**: Unicode の変換表を使って、大文字の形を探す内部の関数です。

## 何をしているか

### 1. ASCII の範囲なら引き算で変換する

```go:line-numbers=269
	if r <= MaxASCII {
		if 'a' <= r && r <= 'z' {
			r -= 'a' - 'A'
		}
		return r
	}
```

`r = 'a'` なら、`r -= 32` で `'A'` になります。`r = 'A'` や記号の場合は、範囲の外なので、そのまま返します。

### 2. ASCII 以外は表を引く

```go:line-numbers=275
	return To(UpperCase, r)
```

`'é'`（U+00E9）のような文字は、Unicode の表で大文字を探します。表は、文字によってはまったく別の文字に変わるものも含んでいます。

## ここがすごい

- **大部分の入力を計算だけで**: 英語のテキストは ASCII がほとんどです。その場合は、比較と引き算だけで終わります。表の検索は一度も起きません。
- **差が 32 だと分かっているから引き算でよい**: ASCII の大文字と小文字の関係は、規則的です。規則に頼れる範囲は規則で、そうでない範囲は表で。役割を分けています。
- **戻り値は同じ型のまま**: 変換できない文字は、そのまま返すので、呼び出し側は大文字の有無を気にせず使えます。

## まとめ

- 規則的な変換は、規則を式にして速く行う。
- 規則が使えない範囲だけ、表に任せる。
- ASCII の範囲を先に処理すると、よくある入力で速くなる。
