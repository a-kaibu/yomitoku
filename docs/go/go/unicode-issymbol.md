---
title: "記号かどうかを ASCII の表と範囲一覧で判定する unicode.IsSymbol"
description: "数学記号、通貨記号、絵文字などの「記号」の文字かを判定する unicode.IsSymbol。ラテン文字はビットの表で、それ以外は除外範囲の一覧を使って、記号の範囲だけを調べる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/unicode/graphic.go"
lines: [141, 146]
function: "IsSymbol"
difficulty: 2
tags: [Unicode, 標準ライブラリ]
---

## ひとことで

`unicode.IsSymbol(r)` は、文字 `r` が Unicode でいう「記号（Symbol）」かを判定します。`+`、`<`、`$`、`€`、`©`、絵文字などが記号に入ります。文字（英字や漢字）や数字は、記号ではありません。

例えば `unicode.IsSymbol('+')` は `true` で、`unicode.IsSymbol('a')` は `false` です。

## コード

```go:line-numbers=141
func IsSymbol(r rune) bool {
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pS != 0
	}
	return isExcludingLatin(Symbol, r)
}
```

## 前提知識

- **Unicode の一般カテゴリ**: 各文字は、文字（L）、数字（N）、記号（S）、句読点（P）などのカテゴリを持っています。記号は「S」のカテゴリです。
- **Latin-1 の範囲**: U+0000 から U+00FF までの 256 文字です。`MaxLatin1` はその最大値です。
- **属性のビット**: `properties` の各要素は、その文字がどのカテゴリに入るかを、ビットの組で表しています。`pS` は「記号」を表すビットです。
- **`isExcludingLatin`**: 記号の一覧から、256 より大きい文字だけを調べる内部関数です。範囲の表を使って判定します。

## 何をしているか

### 1. Latin-1 の範囲は表で判定する

```go:line-numbers=142
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pS != 0
	}
```

`r` が 256 以下なら、属性の表 `properties` を引いて、`pS`（記号）のビットがあるかを調べます。`+` や `$` のような、よく使う記号はここで判定が終わります。

### 2. それ以外は記号の一覧で調べる

```go:line-numbers=145
	return isExcludingLatin(Symbol, r)
```

256 より大きい文字は、記号の範囲の一覧 `Symbol` を使って判定します。`isExcludingLatin` は、Latin-1 の範囲を除いて一覧を調べるので、表の判定とぶつかりません。

## ここがすごい

- **よく使う記号を速く判定**: 英語のプログラムで現れる `+` や `=` などは、表を引くだけで判定されます。
- **同じ表を複数の判定で共有**: `properties` は、`IsSymbol` だけでなく、`IsPrint` などでも使われます。1 つの表で複数の性質を判定できます。
- **表と一覧の役割を分ける**: 「記号か」の判定を、Latin-1 は表、それ以外は一覧に分けることで、データの大きさを抑えています。

## まとめ

- `IsSymbol` は、記号のカテゴリに入る文字かを判定します。
- Latin-1 の範囲は、属性の表を 1 回引けば分かります。
- それ以外は、記号の範囲一覧で判定します。
- 数学記号、通貨記号、絵文字などが記号として扱われます。
