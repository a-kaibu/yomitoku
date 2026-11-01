---
title: "大文字かを判定する unicode.IsUpper"
description: "unicode.IsUpper は、rune が大文字かを返します。Latin-1 の範囲は性質の表で判定し、それより大きな値は Unicode の大文字の範囲の表を調べます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/letter.go"
lines: [184, 190]
function: "IsUpper"
difficulty: 2
format: 2
tags: [Unicode, 最適化, 標準ライブラリ]
---

## ひとことで

`unicode.IsUpper('A')` は `true` を返します。`unicode.IsUpper('a')` は `false` です。大文字と小文字を区別して、文字の種類を判定するときに使います。

## コード

::: code-group

```go:line-numbers=184 [日本語訳]
func IsUpper(r rune) bool {
	// IsGraphic のコメントを参照。
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pLmask == pLu
	}
	return isExcludingLatin(Upper, r)
}
```

```go:line-numbers=184 [原文]
func IsUpper(r rune) bool {
	// See comment in IsGraphic.
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pLmask == pLu
	}
	return isExcludingLatin(Upper, r)
}
```

:::

## 前提知識

- **大文字（Lu）**: 文字の種類の 1 つで、英字の大文字などが含まれます。Unicode では、文字ごとに分類が決まっています。
- **`properties` の表**: Latin-1 の各文字の性質を、ビットで記録した配列です。
- **`pLmask` と `pLu`**: 文字の分類を表すビットの組です。`pLmask` で分類を取り出し、`pLu` と比べます。
- **`isExcludingLatin`**: Latin-1 以外の文字を、範囲の表で調べる内部の関数です。

## 何をしているか

### 1. コメントの参照先を確認する

```go:line-numbers=185
	// IsGraphic のコメントを参照。
```

コメントは、ここでの型の扱いが `IsGraphic` と同じ考え方だと述べています。

### 2. Latin-1 の範囲は表で判定する

```go:line-numbers=186
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pLmask == pLu
	}
```

値が `MaxLatin1` 以下なら、`properties` の表から分類を取り出し、大文字（`pLu`）と一致するかを判定します。

### 3. それ以外は範囲の表で判定する

```go:line-numbers=189
	return isExcludingLatin(Upper, r)
```

Latin-1 の外は、大文字の範囲の表 `Upper` に含まれるかを `isExcludingLatin` で調べます。

## ここがすごい

- **表で即座に答える**: よく使われる英字や記号は、表を 1 回引くだけで判定できます。
- **分類をビットで持つ**: 1 つのバイトに分類を詰めるので、表が小さく済みます。
- **Latin-1 とそれ以外を分ける**: 範囲ごとに方法を変えて、速さと広い対応を両立しています。

## まとめ

- Latin-1 の範囲は、性質の表で分類を調べる。
- それ以外は、大文字の範囲の表を調べる。
- 大文字の判定が、表の参照で速く済む。
