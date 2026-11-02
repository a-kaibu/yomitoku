---
title: "XML の文字として許される値かを調べる isInCharacterRange。制御文字を除く"
description: "encoding/xml の isInCharacterRange。Unicode の値が XML の文字として許される範囲にあるかを返す。タブ、改行、復帰と、0x20 以上の一定の範囲だけを許し、それ以外の制御文字は拒否する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/xml/xml.go"
lines: [1164, 1171]
function: "isInCharacterRange"
difficulty: 1
tags: [Unicode, 文字列処理, 防御的プログラミング]
---

## ひとことで

`isInCharacterRange(r)` は、Unicode の値 `r` が XML の文字として使えるかを返します。タブ、改行、復帰は許されます。それ以外の制御文字は許されません。

XML は、表示できない制御文字を文書の中に含められません。文字の値を書き出す前に、この関数で確かめます。

## コード

```go:line-numbers=1164
func isInCharacterRange(r rune) (inrange bool) {
	return r == 0x09 ||
		r == 0x0A ||
		r == 0x0D ||
		r >= 0x20 && r <= 0xD7FF ||
		r >= 0xE000 && r <= 0xFFFD ||
		r >= 0x10000 && r <= 0x10FFFF
}
```

## 前提知識

- **`rune`**: Unicode の 1 文字を表す値です。整数として比べられます。
- **制御文字**: 画面の表示を変えたり、動作を指示したりする値です。`0x00` から `0x1F` の多くが該当します。
- **16 進数の表記**: `0x20` のように、0x から始めて書く数の表し方です。文字コードの範囲を示すときによく使われます。
- **代理ペアの範囲**: `0xD800` から `0xDFFF` は、UTF-16 の中間に使われる値で、単独の文字としては使えません。この関数は、その範囲を除いています。

## 何をしているか

### 1. タブ、改行、復帰を許す

```go:line-numbers=1165
	return r == 0x09 ||
		r == 0x0A ||
		r == 0x0D ||
```

タブ `0x09`、改行 `0x0A`、復帰 `0x0D` は、XML の文中で普通に使えるので、三つの値をそのまま許します。

### 2. 通常の文字の範囲を許す

```go:line-numbers=1168
	r >= 0x20 && r <= 0xD7FF ||
		r >= 0xE000 && r <= 0xFFFD ||
		r >= 0x10000 && r <= 0x10FFFF
```

`0x20` 以上で、代理ペアの範囲を避けた大半の文字は許されます。さらに、`0x10000` 以上の補助文字も、上限まで許します。

## ここがすごい

- **範囲の隙間を正確に表す**: 代理ペアの `0xD800` から `0xDFFF` を、二つの範囲の間に挟んで除いています。誤りを一つの式で表せます。
- **仕様の表を直接写す**: XML の規格の範囲が、そのまま数字の並びになっています。規格を読んだ人が、照らし合わせやすい形です。
- **判定は値だけで決まる**: 文字の意味を調べなくても、数字の範囲で判定できるので、とても速く動きます。

## まとめ

- `isInCharacterRange` は、Unicode の値が XML の文字として使えるかを返します。
- タブ、改行、復帰と、規格で定められた範囲だけが許されます。
- 代理ペアの範囲は、単独の文字として除きます。
