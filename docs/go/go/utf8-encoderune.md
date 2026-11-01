---
title: "文字を UTF-8 としてバッファへ書く utf8.EncodeRune"
description: "utf8.EncodeRune は、rune を UTF-8 のバイト列にして、与えられたバッファの先頭から書きます。書いたバイト数を返します。ASCII は 1 バイトを直接書き、それ以外は専用の関数に任せます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/utf8/utf8.go"
lines: [368, 375]
function: "EncodeRune"
difficulty: 1
format: 2
tags: [Unicode, 入出力, 最適化, 標準ライブラリ]
---

## ひとことで

`utf8.EncodeRune(buf, 'あ')` は、`buf` の先頭に `あ` の 3 バイトを書き、`3` を返します。バッファが十分な長さを持っている必要があります。

## コード

::: code-group

```go:line-numbers=368 [日本語訳]
func EncodeRune(p []byte, r rune) int {
	// この関数はインライン化しやすく小さく保ち、ASCII を速く扱う。
	if uint32(r) <= rune1Max {
		p[0] = byte(r)
		return 1
	}
	return encodeRuneNonASCII(p, r)
}
```

```go:line-numbers=368 [原文]
func EncodeRune(p []byte, r rune) int {
	// This function is inlineable for fast handling of ASCII.
	if uint32(r) <= rune1Max {
		p[0] = byte(r)
		return 1
	}
	return encodeRuneNonASCII(p, r)
}
```

:::

## 前提知識

- **`AppendRune` との違い**: `AppendRune` はスライスの末尾に追加し、`EncodeRune` は既にある領域の先頭から書きます。
- **バッファの長さ**: 書く先の長さが足りないと、`panic` が起きます。1 文字の最大は 4 バイトです。
- **ASCII の範囲**: 0 から 0x7F までの値は 1 バイトで書けます。
- **`encodeRuneNonASCII`**: ASCII 以外を、2 から 4 バイトに変換する内部の関数です。

## 何をしているか

### 1. ASCII は 1 バイトを直接書く

```go:line-numbers=369
	// この関数はインライン化しやすく小さく保ち、ASCII を速く扱う。
	if uint32(r) <= rune1Max {
		p[0] = byte(r)
		return 1
	}
```

コメントにあるとおり、ASCII の場合はこの関数の中で完結させて、速く動くようにしています。`p[0]` に 1 バイトを書き、書いたバイト数の `1` を返します。

### 2. それ以外は専用の関数に任せる

```go:line-numbers=374
	return encodeRuneNonASCII(p, r)
```

ASCII 以外は、`encodeRuneNonASCII` が必要なバイト数だけ書きます。その結果の長さを、そのまま返します。

## ここがすごい

- **範囲外の書き込みは `panic` で止まる**: 足りないバッファに書くと、Go の境界検査で止まります。誤りが黙って進むことはありません。
- **速い道を前に置く**: ASCII の場合の処理を短く保つことで、呼び出しの多い場面でも速く動きます。
- **書いた量を返す**: 呼び出し側は、どこまで使われたかをすぐに知ることができます。

## まとめ

- ASCII は、先頭の 1 バイトに直接書く。
- ASCII 以外は、内部の関数で 2 から 4 バイトを書く。
- 書いたバイト数を返すので、続きの書き込み位置が分かる。
