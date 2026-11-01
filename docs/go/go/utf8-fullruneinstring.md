---
title: "文字の途中で切れていても「読み足せばよい」と言える FullRuneInString"
description: "utf8.FullRuneInString は、文字列の先頭が 1 文字ぶんの UTF-8 として完結しているかを調べます。途中で切れたバイト列を受け取ったとき、続きを待つべきか、もう不正なので読み直すべきかを判定できます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/utf8/utf8.go"
lines: [130, 147]
function: "FullRuneInString"
difficulty: 3
format: 2
tags: [Unicode, 入出力, パース, 防御的プログラミング]
---

## ひとことで

`utf8.FullRuneInString(s)` は、文字列 `s` の先頭が、1 文字ぶんの UTF-8 として **完結しているか** を返します。`"あ"` の 3 バイトすべてがそろっていれば `true` です。`"\xe3\x81"` のように途中で切れていれば、続きが来るのを待つ必要があるので `false` です。

ネットワークやファイルから少しずつ読むときに、「この読み取りの分だけでは 1 文字が完成しないから、もう少し読もう」という判断に使われます。

## コード

::: code-group

```go:line-numbers=130 [日本語訳]
func FullRuneInString(s string) bool {
	n := len(s)
	if n == 0 {
		return false
	}
	x := first[s[0]]
	if n >= int(x&7) {
		return true // ASCII、不正、または正しいバイト列。
	}
	// 短すぎるか、不正である。
	accept := acceptRanges[x>>4]
	if n > 1 && (s[1] < accept.lo || accept.hi < s[1]) {
		return true
	} else if n > 2 && (s[2] < locb || hicb < s[2]) {
		return true
	}
	return false
}
```

```go:line-numbers=130 [原文]
func FullRuneInString(s string) bool {
	n := len(s)
	if n == 0 {
		return false
	}
	x := first[s[0]]
	if n >= int(x&7) {
		return true // ASCII, invalid, or valid.
	}
	// Must be short or invalid.
	accept := acceptRanges[x>>4]
	if n > 1 && (s[1] < accept.lo || accept.hi < s[1]) {
		return true
	} else if n > 2 && (s[2] < locb || hicb < s[2]) {
		return true
	}
	return false
}
```

:::

## 前提知識

- **UTF-8 の先頭バイト**: 先頭のバイトは、文字の長さを示しています。`0xxxxxxx` は 1 バイト、`110xxxxx` は 2 バイト、`1110xxxx` は 3 バイト、`11110xxx` は 4 バイトです。
- **`first` 表**: 先頭バイトから、文字の長さと、次のバイトに許される範囲を引ける表です。
- **`acceptRanges`**: 2 バイト目に許される値の範囲を、先頭バイトの種類ごとに並べた表です。
- **不正なバイト**: UTF-8 として意味をなさないバイトです。この関数では「完結している」の仲間として扱われます。読み直しても正しくならないからです。

## 何をしているか

`s = "\xe3\x81"`（「あ」の先頭 2 バイトだけ）で追います。

### 1. 1 バイトも無ければ false

```go:line-numbers=132
	if n == 0 {
		return false
	}
```

空の文字列は、まだ何も読めていないので、`false` です。

### 2. 長さが足りていれば true

```go:line-numbers=135
	x := first[s[0]]
	if n >= int(x&7) {
		return true // ASCII, invalid, or valid.
	}
```

先頭の `0xe3` から、3 バイトの文字だと分かります。`n = 2` なので、まだ長さが足りません。ASCII や不正なバイトなら、長さは 1 なので、ここで `true` になります。

### 3. 途中で不正だと分かれば true

```go:line-numbers=140
	accept := acceptRanges[x>>4]
	if n > 1 && (s[1] < accept.lo || accept.hi < s[1]) {
		return true
	} else if n > 2 && (s[2] < locb || hicb < s[2]) {
		return true
	}
	return false
```

2 バイト目の `0x81` は、許される範囲に入っているので、この `if` は偽です。3 バイト目はまだないので、最後まで届いていません。`false` を返します。続きが来れば、次の読み取りで `true` になります。

もし 2 バイト目が `0x41`（ASCII の `A`）だったら、範囲の外なので、この時点で `true` を返します。読み足しても、その文字は正しくならないからです。

## ここがすごい

- **「完結」の意味を広げている**: 不正なバイトは、読み足しても直りません。だから、それも「完結した」と見なして `true` にしています。読み続けて無限に待つ事故を防げます。
- **途中のバイトだけで判定できる**: 3 バイトすべてを待たなくても、2 バイト目が範囲外なら、その時点で不正と分かります。早く判断できます。
- **表を引くだけ**: 先頭バイトの表と、許容範囲の表を引くだけで、長さも範囲も分かります。複雑な場合分けを書かずに済んでいます。

## まとめ

- 文字の途中で切れたバイト列は、続きを待つべきかを判定できる。
- 不正なバイトは、読み足しても直らないので「完結」として扱うと、待ちすぎを防げる。
- 先頭バイトの表と、範囲の表を組み合わせると、短く正しい判定になる。
