---
title: "句読点や記号かを判定する unicode.IsPunct"
description: "unicode.IsPunct は、rune が句読点かを返します。Latin-1 の範囲は性質の表で判定し、それ以外は Unicode の句読点の範囲の表を調べます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/graphic.go"
lines: [113, 118]
function: "IsPunct"
difficulty: 1
format: 2
tags: [Unicode, 最適化, 標準ライブラリ]
---

## ひとことで

`unicode.IsPunct('!')` は `true` を返します。`unicode.IsPunct('a')` は `false` です。文章から記号を取り除く処理などで使われます。

## コード

```go:line-numbers=113
func IsPunct(r rune) bool {
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pP != 0
	}
	return Is(Punct, r)
}
```

## 前提知識

- **句読点（Punct）**: 文章の区切りに使う記号の分類です。`!`、`,`、`.` などが含まれます。
- **`properties` の表**: Latin-1 の各文字の性質を、ビットで記録した配列です。
- **`pP` ビット**: 句読点の分類を表すビットです。
- **`Is`**: 範囲の表に、`rune` が含まれるかを調べる関数です。

## 何をしているか

### 1. Latin-1 の範囲は表を引く

```go:line-numbers=114
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pP != 0
```

値が `MaxLatin1` 以下なら、`properties` の表から句読点のビット `pP` を調べます。立っていれば、句読点です。

### 2. それ以外は範囲の表で調べる

```go:line-numbers=117
	return Is(Punct, r)
```

Latin-1 の外は、句読点の範囲の表 `Punct` を `Is` で調べます。

## ここがすごい

- **よく使う記号を速く判定する**: 英語の記号は Latin-1 にあるので、表を 1 回引くだけで答えが出ます。
- **分類を表で持つ**: 1 つのバイトに分類を詰めるので、表が小さく済みます。
- **広い文字に対応する**: Latin-1 の外も、Unicode の範囲の表で扱えます。

## まとめ

- Latin-1 の範囲は、性質の表で句読点を判定する。
- それ以外は、句読点の範囲の表を調べる。
- よく使う記号は、表の参照だけで速く判定できる。
