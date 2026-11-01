---
title: "末尾の 1 文字を後ろから復号する utf8.DecodeLastRuneInString"
description: "utf8.DecodeLastRuneInString は、文字列の末尾にある 1 文字を、後ろから復号して返します。続きのバイトの並びをたどって文字の先頭を探し、長いだけの不正な列でも時間がかからないよう上限を設けています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/utf8/utf8.go"
lines: [316, 343]
function: "DecodeLastRuneInString"
difficulty: 3
format: 2
tags: [Unicode, 文字列処理, パース, 防御的プログラミング]
---

## ひとことで

`utf8.DecodeLastRuneInString("あい")` は `い` と `3` を返します。末尾の文字を、先頭から読み直さずに取り出せます。

## コード

::: code-group

```go:line-numbers=316 [日本語訳]
func DecodeLastRuneInString(s string) (r rune, size int) {
	end := len(s)
	if end == 0 {
		return RuneError, 0
	}
	start := end - 1
	r = rune(s[start])
	if r < RuneSelf {
		return r, 1
	}
	// 後ろ向きにたどるとき、O(n^2) の計算量になるのを防ぐ。
	// 不正な UTF-8 が長く続く文字列を後ろへたどる場合の、
	// 保護のための処理。
	lim := max(end-UTFMax, 0)
	for start--; start >= lim; start-- {
		if RuneStart(s[start]) {
			break
		}
	}
	if start < 0 {
		start = 0
	}
	r, size = DecodeRuneInString(s[start:end])
	if start+size != end {
		return RuneError, 1
	}
	return r, size
}
```

```go:line-numbers=316 [原文]
func DecodeLastRuneInString(s string) (r rune, size int) {
	end := len(s)
	if end == 0 {
		return RuneError, 0
	}
	start := end - 1
	r = rune(s[start])
	if r < RuneSelf {
		return r, 1
	}
	// guard against O(n^2) behavior when traversing
	// backwards through strings with long sequences of
	// invalid UTF-8.
	lim := max(end-UTFMax, 0)
	for start--; start >= lim; start-- {
		if RuneStart(s[start]) {
			break
		}
	}
	if start < 0 {
		start = 0
	}
	r, size = DecodeRuneInString(s[start:end])
	if start+size != end {
		return RuneError, 1
	}
	return r, size
}
```

:::

## 前提知識

- **UTF-8 の続きのバイト**: 2 バイト目以降は `10xxxxxx` の形です。`RuneStart` は、その判定に使います。
- **文字の先頭を探す**: 末尾から見て、続きでないバイトが文字の先頭です。最大で 4 バイト戻れば、必ず見つかります。
- **`RuneError`**: 不正な UTF-8 を表す代わりの文字（U+FFFD）です。
- **`UTFMax`**: 1 文字の最大のバイト数で、4 です。

## 何をしているか

### 1. 空と ASCII を先に処理する

```go:line-numbers=317
	end := len(s)
	if end == 0 {
		return RuneError, 0
	}
	start := end - 1
	r = rune(s[start])
	if r < RuneSelf {
		return r, 1
	}
```

空の文字列なら、`RuneError` と幅 0 を返します。末尾のバイトが ASCII（0x80 未満）なら、それだけで 1 文字なので、すぐに返します。

### 2. 文字の先頭まで戻る

```go:line-numbers=326
	// 後ろ向きにたどるとき、O(n^2) の計算量になるのを防ぐ。
	// 不正な UTF-8 が長く続く文字列を後ろへたどる場合の、
	// 保護のための処理。
	lim := max(end-UTFMax, 0)
	for start--; start >= lim; start-- {
		if RuneStart(s[start]) {
			break
		}
	}
```

コメントにあるとおり、戻る範囲は最大 `UTFMax`（4 バイト）に制限されています。不正なバイトが長く続くときに、何度も戻って計算が重くなるのを防ぐためです。範囲の中で `RuneStart` が真になる、つまり続きでないバイトを見つけたら、そこが文字の先頭です。

### 3. 先頭から復号して確かめる

```go:line-numbers=335
	if start < 0 {
		start = 0
	}
	r, size = DecodeRuneInString(s[start:end])
```

見つけた先頭から末尾までを `DecodeRuneInString` で復号し、ちょうど末尾で終わるかを確かめます。

### 4. 合わなければ不正として返す

```go:line-numbers=339
	if start+size != end {
		return RuneError, 1
	}
	return r, size
```

先頭と末尾がきれいに合わないときは、`RuneError` と幅 1 を返します。正しく合えば、その文字と幅を返します。

## ここがすごい

- **後ろからの計算を上限で抑える**: 最大 4 バイトしか戻らないので、不正な入力でも計算量が一定になります。
- **二重に確かめる**: 先頭を見つけたあとも、復号して長さが合うかを確かめるので、誤った文字を返しません。
- **ASCII の近道**: 多くの文字列は ASCII なので、末尾を 1 バイト見るだけで済みます。

## まとめ

- 空と ASCII は、すぐに結果を返す。
- 文字の先頭は、最大 4 バイトの範囲で探す。
- 先頭から復号して末尾と合うかを確かめ、合わなければ不正とする。
