---
title: "表示できる文字かを判定する unicode.IsGraphic"
description: "unicode.IsGraphic は、rune が表示できる文字かを返します。Latin-1 の範囲は表で即座に判定し、それ以外は GraphicRanges の表を並べて調べます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/graphic.go"
lines: [36, 43]
function: "IsGraphic"
difficulty: 2
format: 2
tags: [Unicode, 最適化, 標準ライブラリ]
---

## ひとことで

`unicode.IsGraphic('あ')` は `true` を返します。空白や記号を含め、画面に表示される文字かどうかを調べます。制御文字は、ここでは `false` になります。

## コード

::: code-group

```go:line-numbers=36 [日本語訳]
func IsGraphic(r rune) bool {
	// uint32 に変換して、負の値のための判定を省く。
	// 添字を uint8 にして、範囲の検査を省く。
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pg != 0
	}
	return In(r, GraphicRanges...)
}
```

```go:line-numbers=36 [原文]
func IsGraphic(r rune) bool {
	// We convert to uint32 to avoid the extra test for negative,
	// and in the index we convert to uint8 to avoid the range check.
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pg != 0
	}
	return In(r, GraphicRanges...)
}
```

:::

## 前提知識

- **グラフィック文字**: 目に見える文字と、空白などの表示される文字のことです。制御文字は含みません。
- **Latin-1 の表**: 0 から 255 までの文字の性質を、あらかじめ表にしたものです。
- **`In`**: 複数の範囲の表のどれかに、`rune` が含まれるかを調べる関数です。
- **`uint32` と `uint8`**: 型を変えると、負の値の判定と、配列の範囲の検査を省けます。

## 何をしているか

### 1. コメントの意図を読む

```go:line-numbers=37
	// uint32 に変換して、負の値のための判定を省く。
	// 添字を uint8 にして、範囲の検査を省く。
```

コメントが述べるとおり、ここでは 2 つの型変換をしています。`uint32` にすると、負の値を別に扱う必要がありません。添字を `uint8` にすると、配列の範囲の検査が省けます。

### 2. Latin-1 の範囲は表で判定する

```go:line-numbers=39
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pg != 0
	}
```

値が `MaxLatin1` 以下なら、`properties` の表から `pg` のビットを調べます。ビットが立っていれば、表示できる文字です。

### 3. それ以外は範囲の表を並べて調べる

```go:line-numbers=42
	return In(r, GraphicRanges...)
```

Latin-1 の外は、`GraphicRanges` の表を順に見ます。`In` が、どれかに含まれれば `true` を返します。

## ここがすごい

- **よく使う範囲を速く判定する**: 日本語を除く多くの文字は、表を 1 回引くだけで答えが出ます。
- **変換で検査を減らす**: 型を工夫して、余計な分岐をなくしています。
- **表の組み合わせで広く対応する**: Latin-1 の外は、用意された範囲の表に任せるので、対応を増やしやすい作りです。

## まとめ

- 型の変換で、負の値の判定と配列の範囲の検査を省く。
- Latin-1 の範囲は表で、それ以外は範囲の表で判定する。
- 制御文字は、グラフィック文字に含まれない。
