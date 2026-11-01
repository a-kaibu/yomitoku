---
title: "表を使い分けて、空白文字かどうかを素早く判定する"
description: "unicode.IsSpace は、ある文字が空白かどうかを返します。よく使う Latin-1 の範囲は小さな switch で素早く判定し、それ以外だけ大きな表を検索します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/graphic.go"
lines: [128, 138]
function: "IsSpace"
difficulty: 2
format: 2
tags: [Unicode, 最適化, 標準ライブラリ]
---

## ひとことで

`unicode.IsSpace(r)` は、文字 `r` が空白かどうかを返します。半角スペースやタブだけでなく、全角スペース（U+3000）などの Unicode の空白も `true` になります。

この関数は、判定する文字の範囲によって、2 つの方法を使い分けています。よく出る文字は速い方法、めったに出ない文字は正確な表で判定します。

## コード

::: code-group

```go:line-numbers=128 [日本語訳]
func IsSpace(r rune) bool {
	// この性質は Z（区切り文字）とは同じではないので、特別に扱う。
	if uint32(r) <= MaxLatin1 {
		switch r {
		case '\t', '\n', '\v', '\f', '\r', ' ', 0x85, 0xA0:
			return true
		}
		return false
	}
	return isExcludingLatin(White_Space, r)
}
```

```go:line-numbers=128 [原文]
func IsSpace(r rune) bool {
	// This property isn't the same as Z; special-case it.
	if uint32(r) <= MaxLatin1 {
		switch r {
		case '\t', '\n', '\v', '\f', '\r', ' ', 0x85, 0xA0:
			return true
		}
		return false
	}
	return isExcludingLatin(White_Space, r)
}
```

:::

## 前提知識

- **ルーン（rune）**: Go で 1 文字を表す型で、中身は 32 ビットの整数です。Unicode の文字番号（コードポイント）をそのまま入れられます。
- **Latin-1**: Unicode の最初の 256 文字（0〜255）のことです。`MaxLatin1` はその最大値 `0xFF` を表します。
- **`switch` の複数の値**: `case 'a', 'b':` のように書くと、どれかに一致すれば実行されます。
- **Unicode の「空白」の性質**: 空白は 1 つの決まったリストではなく、Unicode の文字表（プロパティ）によって定義されています。

## 何をしているか

### 1. Latin-1 の範囲は switch で判定する

```go:line-numbers=130
	if uint32(r) <= MaxLatin1 {
		switch r {
		case '\t', '\n', '\v', '\f', '\r', ' ', 0x85, 0xA0:
			return true
		}
		return false
	}
```

`r` が 255 以下なら、この範囲の中で判定します。`'\t'` や `' '` などの 6 個と、`0x85`（次の行への移動）、`0xA0`（ノーブレークスペース）の 8 個だけが空白です。どれにも当てはまらなければ `false` を返します。

`IsSpace('A')` なら、`'A'` は 65 で、どの `case` にも当てはまらないので `false` です。

### 2. それ以外は表で調べる

```go:line-numbers=137
	return isExcludingLatin(White_Space, r)
```

255 より大きい文字は、`White_Space` という Unicode の表を引いて判定します。全角スペース `'　'` はこちらで `true` になります。

## ここがすごい

- **よく使う場合を速くする**: 文字列の多くは ASCII か Latin-1 の範囲に収まります。そこで、その範囲だけは `switch` の小さな比較で答えを出し、大きな表の検索を避けています。
- **表は必要なときだけ**: コメントにあるとおり、この性質は Unicode の「区切り（Z）」とは同じではありません。だから、一般的な規則で作らず、Unicode の空白の表を直接使っています。
- **結果が正確**: 一見ややこしい構造ですが、どちらの方法でも Unicode の定義どおりの答えを返します。速さのための近道が、正しさを崩していません。

## まとめ

- 判定する範囲が狭い場合は、よく使う範囲を小さな比較で先に答える。
- 規則で決められない性質は、標準の表を直接引くのが確実。
- 速さのための近道は、結果が変わらないことを確かめてから使う。
