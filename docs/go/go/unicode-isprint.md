---
title: "表示できる文字かを ASCII は表、それ以外は範囲表で調べる unicode.IsPrint"
description: "画面に表示できる文字かを判定する unicode.IsPrint。ラテン文字の範囲は 1 バイトの属性表で素早く引き、それ以外は範囲の表を二分探索して判定する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/unicode/graphic.go"
lines: [50, 55]
function: "IsPrint"
difficulty: 2
tags: [Unicode, 文字列処理, 標準ライブラリ]
---

## ひとことで

`unicode.IsPrint(r)` は、文字 `r` が「表示できる文字」かを判定します。文字（英数字、記号、日本語など）と、スペースは表示できる文字です。改行や制御文字は表示できない文字です。

`strconv.Quote` のような関数は、表示できない文字を `\n` や `\x00` のように書き換えるかどうかを、この判定で決めています。

## コード

```go:line-numbers=50
func IsPrint(r rune) bool {
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pp != 0
	}
	return In(r, PrintRanges...)
}
```

## 前提知識

- **制御文字**: 改行、タブ、ベル（`\a`）など、画面に文字として出ない文字です。
- **Latin-1（ラテン 1）**: Unicode の最初の 256 文字で、U+0000 から U+00FF までです。`MaxLatin1` はその最大値（U+00FF）を表します。
- **`properties` 表**: 256 要素の配列で、それぞれの値がビットの組み合わせで、文字の性質（文字、記号、表示できるなど）を持っています。
- **ビット演算 `&`**: 2 つの値のビットを揃えて、両方が 1 のところだけを残す演算です。`properties[x] & pp != 0` は、`pp` のビットが立っているかを調べます。
- **範囲表**: 文字の範囲（開始と終了の組）の並びです。`In(r, ranges...)` は、その中に `r` があるかを調べます。

## 何をしているか

### 1. 256 までの文字は表で引く

```go:line-numbers=51
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pp != 0
	}
```

よく使う文字は、U+00FF までです。これらは `properties` の表を 1 回引くだけで判定できます。`pp` は「表示できる」を表すビットで、それが立っていれば `true` です。

### 2. それ以外は範囲で調べる

```go:line-numbers=54
	return In(r, PrintRanges...)
```

日本語や絵文字などは、表に入りきりません。そこで、表示できる文字の範囲をまとめた `PrintRanges` を使い、`In` で範囲のどれかに入るかを調べます。

## ここがすごい

- **よく使う文字を最速で判定**: 英語の文章や記号は、ほぼ必ず 256 の範囲に入ります。配列の 1 回の参照だけで答えが出ます。
- **1 バイトのビットに詰め込む**: 性質の種類を 1 つのバイトに、ビットとして並べています。メモリを節約しながら、判定を素早く行えます。
- **範囲表は必要なときだけ**: 大きい範囲の文字だけが範囲表に進むので、多くの場合はその処理を避けられます。

## まとめ

- `IsPrint` は、画面に表示できる文字かを判定します。
- U+00FF までの文字は、ビットを詰めた表で 1 回の参照で答えます。
- それより大きい文字は、表示できる範囲の一覧で調べます。
- 文字列を安全に表示する関数が、この判定を使って表示できない文字を書き換えます。
