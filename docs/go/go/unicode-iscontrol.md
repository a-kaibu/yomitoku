---
title: "制御文字かを判定する unicode.IsControl"
description: "unicode.IsControl は、rune が制御文字かを返します。Latin-1 の範囲だけは表を引いて判定し、それより大きい値は必ず制御文字ではないとみなします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/graphic.go"
lines: [81, 87]
function: "IsControl"
difficulty: 1
format: 2
tags: [Unicode, 最適化, 標準ライブラリ]
---

## ひとことで

`unicode.IsControl('\n')` は `true` を返します。改行やタブなど、画面に文字として表示されない記号を見つけるための関数です。

## コード

::: code-group

```go:line-numbers=81 [日本語訳]
func IsControl(r rune) bool {
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pC != 0
	}
	// 制御文字は、すべて MaxLatin1 より小さい。
	return false
}
```

```go:line-numbers=81 [原文]
func IsControl(r rune) bool {
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pC != 0
	}
	// All control characters are < MaxLatin1.
	return false
}
```

:::

## 前提知識

- **制御文字**: 改行、タブ、削除（DEL）など、文字の表示ではなく動作を表す文字です。
- **Latin-1**: 0 から 255 までの文字の範囲です。`MaxLatin1` は、その最大値です。
- **`properties` の表**: 各バイトの性質をビットで記録した配列です。どの性質を持つかを、ビットの論理積で調べます。
- **`uint32` への変換**: 負の値を、大きな正の数として扱うための変換です。

## 何をしているか

### 1. Latin-1 の範囲は表を引く

```go:line-numbers=82
	if uint32(r) <= MaxLatin1 {
		return properties[uint8(r)]&pC != 0
```

値が `MaxLatin1` 以下なら、`properties` の表から、制御文字のビット `pC` を調べます。ビットが立っていれば、制御文字です。

### 2. それより大きい値は制御文字ではない

```go:line-numbers=85
	// 制御文字は、すべて MaxLatin1 より小さい。
	return false
```

コメントにあるとおり、制御文字は、すべて `MaxLatin1` より小さい範囲にあります。そのため、それより大きい値は、確かめるまでもなく `false` です。

## ここがすごい

- **表で即座に判定する**: 最もよく使われる範囲は、配列の 1 回の参照で答えが出ます。
- **範囲の外を即座に切る**: 大きな値は調べずに `false` を返すので、表の範囲を超えるアクセスが起きません。
- **ビットで性質を持つ**: 1 つのバイトに、複数の性質を詰め込めます。判定の仕組みが、他の関数と共通しています。

## まとめ

- Latin-1 の範囲は、性質の表を引いて判定する。
- それより大きい値は、制御文字ではないので `false` を返す。
- 表とビットで、判定を速くしている。
