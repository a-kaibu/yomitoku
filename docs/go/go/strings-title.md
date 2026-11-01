---
title: "単語の先頭を大文字にする strings.Title"
description: "strings.Title は、区切りの後ろにある文字を大文字にします。状態を覚えるクロージャと Map を組み合わせて、1 文字ずつ見ながら変換します。今は非推奨です。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [849, 864]
function: "Title"
difficulty: 2
format: 2
tags: [文字列処理, Unicode, クロージャ, 標準ライブラリ]
---

## ひとことで

`strings.Title("hello world")` は、`Hello World` を返します。単語の先頭になる文字を大文字に変えます。ただし、Go 1.18 から非推奨になっているので、新しいコードでは `golang.org/x/text/cases` などを使うよう案内されています。

## コード

::: code-group

```go:line-numbers=849 [日本語訳]
func Title(s string) string {
	// 状態を覚えておくために、ここではクロージャを使う。
	// 行儀は良くないが効果はある。Map が先頭から順に走査し、
	// 文字ごとにクロージャを 1 回ずつ呼ぶことに頼っている。
	prev := ' '
	return Map(
		func(r rune) rune {
			if isSeparator(prev) {
				prev = r
				return unicode.ToTitle(r)
			}
			prev = r
			return r
		},
		s)
}
```

```go:line-numbers=849 [原文]
func Title(s string) string {
	// Use a closure here to remember state.
	// Hackish but effective. Depends on Map scanning in order and calling
	// the closure once per rune.
	prev := ' '
	return Map(
		func(r rune) rune {
			if isSeparator(prev) {
				prev = r
				return unicode.ToTitle(r)
			}
			prev = r
			return r
		},
		s)
}
```

:::

## 前提知識

- **区切り文字（セパレータ）**: 空白や記号など、単語の境目になる文字です。`isSeparator` で判定します。
- **`Map`**: 文字列の各文字を、関数で変換した結果を組み立てます。文字の並びは先頭から順に処理されます。
- **クロージャ**: 外側の変数（ここでは `prev`）を覚えたまま使える関数です。
- **`unicode.ToTitle`**: 文字を、単語の先頭用の大文字（タイトルケース）に変えます。

## 何をしているか

### 1. 直前の文字を覚える場所を作る

```go:line-numbers=853
	prev := ' '
```

`prev` は、1 つ前に見た文字を入れておく変数です。最初は空白にしておき、文字列の先頭を単語の始まりとして扱います。

### 2. 区切りの直後の文字を大文字にする

```go:line-numbers=855
		func(r rune) rune {
			if isSeparator(prev) {
				prev = r
				return unicode.ToTitle(r)
			}
```

直前の文字が区切りなら、今の文字は単語の先頭です。`prev` を今の文字で更新し、`unicode.ToTitle` の結果を返します。

### 3. それ以外はそのまま返す

```go:line-numbers=860
			prev = r
			return r
		},
```

単語の途中なら、文字を変えずに返します。どの場合も `prev` を今の文字に更新して、次の判定に備えます。

## ここがすごい

- **1 つの関数で状態を持つ**: 「前の文字」を覚えるために、関数の外に配列や添字を用意していません。クロージャが、その状態を閉じ込めています。
- **非推奨になった理由**: 単語の境目の判定が、Unicode の記号を正しく扱えません。そのため、非推奨とされています。
- **仕組みが Map の順序に依存する**: 文字を先頭から順に、1 回ずつ呼ぶという前提で動きます。ここが、コードのコメントで「行儀は良くない」と書かれている理由です。

## まとめ

- 直前の文字をクロージャで覚え、区切りの直後の文字を大文字にする。
- `Map` は文字を順に 1 回ずつ変換するので、この状態管理が成り立つ。
- 単語の境目の判定に限界があるため、今は非推奨になっている。
