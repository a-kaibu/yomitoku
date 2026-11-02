---
title: "タイトルケースの文字かを判定する unicode.IsTitle"
description: "unicode.IsTitle は、rune がタイトルケースの文字かを返します。ラテン文字の範囲は、タイトルケースを持たないので即座に false を返し、それ以外は Unicode の範囲の表を調べます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/letter.go"
lines: [202, 207]
function: "IsTitle"
difficulty: 1
format: 2
tags: [Unicode, 標準ライブラリ, 最適化]
---

## ひとことで

`unicode.IsTitle('ǅ')` は `true` を返します。タイトルケースは、単語の先頭に使う大文字の一種です。英字の大文字と違い、一部の文字だけが持つ特別な形です。

## コード

```go:line-numbers=202
func IsTitle(r rune) bool {
	if r <= MaxLatin1 {
		return false
	}
	return isExcludingLatin(Title, r)
}
```

## 前提知識

- **タイトルケース**: 単語の先頭に使う形です。`Lu`（大文字）とは別の分類として Unicode に定義されています。
- **Latin-1 の範囲**: 0 から 255 までの文字です。英字の大文字と小文字はここにありますが、タイトルケースの文字はありません。
- **`isExcludingLatin`**: Latin-1 の外の文字を、範囲の表で調べる内部の関数です。
- **`MaxLatin1`**: Latin-1 の最大値です。

## 何をしているか

### 1. Latin-1 の範囲は false とする

```go:line-numbers=203
	if r <= MaxLatin1 {
		return false
	}
```

値が `MaxLatin1` 以下なら、タイトルケースの文字はないので、`false` を返します。範囲の確認だけで答えが出ます。

### 2. それ以外は範囲の表で調べる

```go:line-numbers=206
	return isExcludingLatin(Title, r)
```

Latin-1 の外は、タイトルケースの範囲の表 `Title` に含まれるかを `isExcludingLatin` で調べます。

## ここがすごい

- **よくある文字を即座に判定する**: 英字や記号は、範囲の比較だけで `false` と分かります。
- **分類を表で持つ**: タイトルケースの文字は少ないので、範囲の表で管理するのが合っています。
- **大文字と分けて扱う**: `IsUpper` と分かれているので、単語の先頭の形だけを判定できます。

## まとめ

- Latin-1 の範囲は、タイトルケースを持たないので `false` を返す。
- それ以外は、タイトルケースの範囲の表で調べる。
- 大文字とは別の分類として判定する。
