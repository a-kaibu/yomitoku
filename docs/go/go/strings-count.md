---
title: "空の文字列を数えると「文字の間の数 + 1」になる strings.Count"
description: "strings.Count は、文字列の中に部分文字列がいくつ現れるかを数えます。空の文字列だけは特別で、文字と文字の間ごとに 1 回ずつ見つかったものとして数えます。1 バイトの場合は専用の速い関数に任せます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [42, 59]
function: "Count"
difficulty: 2
format: 2
tags: [文字列処理, 標準ライブラリ, 最適化]
---

## ひとことで

`strings.Count(s, substr)` は、`s` の中に `substr` が重ならずに何回現れるかを返します。`Count("cheese", "e")` は `3` です。

空の文字列を数える場合は、少し特別です。`Count("five", "")` は `5` を返します。文字の前、文字と文字の間、文字の後ろのすべてで 1 回ずつ見つかったと考えるからです。

## コード

::: code-group

```go:line-numbers=42 [日本語訳]
func Count(s, substr string) int {
	// 特別なケース
	if len(substr) == 0 {
		return utf8.RuneCountInString(s) + 1
	}
	if len(substr) == 1 {
		return bytealg.CountString(s, substr[0])
	}
	n := 0
	for {
		i := Index(s, substr)
		if i == -1 {
			return n
		}
		n++
		s = s[i+len(substr):]
	}
}
```

```go:line-numbers=42 [原文]
func Count(s, substr string) int {
	// special case
	if len(substr) == 0 {
		return utf8.RuneCountInString(s) + 1
	}
	if len(substr) == 1 {
		return bytealg.CountString(s, substr[0])
	}
	n := 0
	for {
		i := Index(s, substr)
		if i == -1 {
			return n
		}
		n++
		s = s[i+len(substr):]
	}
}
```

:::

## 前提知識

- **重ならない出現**: `"aaa"` の中に `"aa"` は、位置 0 と位置 1 の 2 通りで見つかります。この関数は、見つけた後ろから探すので、重ならない数え方になります。`Count("aaa", "aa")` は `1` です。
- **`Index`**: 文字列の中で部分文字列が最初に現れる位置を返します。見つからないときは `-1` です。
- **`utf8.RuneCountInString`**: 文字列の文字数を数えます。空の部分文字列の場合の答えに使われます。
- **`bytealg.CountString`**: 1 バイトを数える、内部の高速な関数です。

## 何をしているか

### 1. 空の部分文字列を特別扱いする

```go:line-numbers=43
	// special case
	if len(substr) == 0 {
		return utf8.RuneCountInString(s) + 1
	}
```

`s = "five"` なら、文字数は 4 です。文字の前、文字の間、後ろの合計で 5 か所あるので、`4 + 1` を返します。

### 2. 1 バイトなら専用の関数に任せる

```go:line-numbers=47
	if len(substr) == 1 {
		return bytealg.CountString(s, substr[0])
	}
```

1 バイトの探索は、CPU の命令を使う高速な関数で数えます。

### 3. 見つけたら、その後ろから探す

```go:line-numbers=50
	n := 0
	for {
		i := Index(s, substr)
		if i == -1 {
			return n
		}
		n++
		s = s[i+len(substr):]
	}
```

`Count("cheese", "ee")` では、位置 2 で `"ee"` が見つかります。`n = 1` にして、`s` を見つけた部分の後ろ `"se"` にします。次は見つからないので `1` を返します。見つけた部分を飛ばすので、同じ文字を二度数えることがありません。

## ここがすごい

- **空の場合を式で表す**: 「空の文字列が現れる位置」を、文字数に 1 を足した数で表せます。定義を 1 行で表すので、わかりやすく、しかも正しい答えになります。
- **用途に応じた速い道**: 1 バイトの場合は、もっとも多く使われるので、専用の関数に任せています。一般の場合の繰り返しとは分けて書かれています。
- **重ならない数え方**: 見つかった部分を飛ばすと、`"aaa"` と `"aa"` のような重なる場合でも、1 回だけ数えます。この選び方は、ドキュメントで定義された仕様になっています。

## まとめ

- 空の部分文字列は、文字と文字の間の位置の数として定義されている。
- 1 バイトの探索は、専用の高速な関数に任せると速い。
- 見つかった部分の後ろから探すと、重ならない数え方になる。
