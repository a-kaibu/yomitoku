---
title: "前から条件に合う文字の位置を探す bytes.indexFunc"
description: "bytes.indexFunc は、バイト列を先頭から 1 文字ずつ UTF-8 として復号しながら、条件の関数の結果が指定した真偽になる最初の位置を返します。見つからなければ -1 を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/bytes.go"
lines: [900, 910]
function: "indexFunc"
difficulty: 2
format: 2
tags: [文字列処理, Unicode, 探索, 標準ライブラリ]
---

## ひとことで

`bytes.IndexFunc([]byte("abc1"), unicode.IsDigit)` は `3` を返します。バイト列の中で、条件に合う最初の文字が始まる位置です。`bytes.TrimLeftFunc` などの土台になっています。

## コード

```go:line-numbers=900
func indexFunc(s []byte, f func(r rune) bool, truth bool) int {
	start := 0
	for start < len(s) {
		r, wid := utf8.DecodeRune(s[start:])
		if f(r) == truth {
			return start
		}
		start += wid
	}
	return -1
}
```

## 前提知識

- **バイト列と文字**: バイト列は、UTF-8 のバイトの並びです。文字の境界は、バイトの値から決まります。
- **`utf8.DecodeRune`**: 先頭の 1 文字を復号し、その文字と、使ったバイト数を返す関数です。
- **`truth`**: 条件の結果と比べる真偽です。`true` なら一致、`false` なら不一致を探します。
- **`start` の動かし方**: 復号したバイト数だけ進めれば、次の文字の先頭に当たります。

## 何をしているか

### 1. 次の文字を復号する

```go:line-numbers=901
	start := 0
	for start < len(s) {
		r, wid := utf8.DecodeRune(s[start:])
```

`start` は、今見ている文字の先頭です。`DecodeRune` で、その位置から 1 文字を読み、その幅 `wid` を得ます。

### 2. 条件と比べる

```go:line-numbers=904
		if f(r) == truth {
			return start
		}
```

`f(r)` の結果が `truth` と一致したら、その文字の位置 `start` を返します。

### 3. 次の文字へ進む

```go:line-numbers=907
		start += wid
```

一致しなければ、文字の幅だけ `start` を進めて、次の文字を見ます。

### 4. 見つからなければ -1

```go:line-numbers=909
	return -1
```

最後まで一致しなければ、`-1` を返します。

## ここがすごい

- **文字の境界を守る**: 幅だけ進めるので、途中で多バイトの文字を切ることがありません。
- **文字列版と対になる**: `strings.indexFunc` が `range` を使うのに対し、こちらは復号の幅で進めます。バイト列では `range` が使えないため、この書き方になっています。
- **条件を一つの関数で扱う**: `truth` を使い、「一致」と「不一致」の両方を同じ関数で探せます。

## まとめ

- バイト列を、文字の幅ずつ先頭から復号して進める。
- 条件の結果が `truth` に一致した位置を返す。
- 見つからなければ `-1` を返す。
