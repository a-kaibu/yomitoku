---
title: "改行を除いて、符号化された文字列を詰めて写す stripNewlines"
description: "encoding/base32 の stripNewlines。入力の中の改行と復帰の文字を飛ばし、それ以外の文字だけを dst の先頭から詰めて写す。写したバイト数を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/base32/base32.go"
lines: [552, 562]
function: "stripNewlines"
difficulty: 1
tags: [文字列処理, 入出力]
---

## ひとことで

`stripNewlines(dst, src)` は、`src` から改行と復帰の文字を取り除き、残りを `dst` の先頭から詰めて写します。写した長さを返します。

## コード

```go:line-numbers=552
func stripNewlines(dst, src []byte) int {
	offset := 0
	for _, b := range src {
		if b == '\r' || b == '\n' {
			continue
		}
		dst[offset] = b
		offset++
	}
	return offset
}
```

## 前提知識

- **改行と復帰**: `'\n'` と `'\r'` です。Windows の改行は、この二つの組で表されます。
- **base32**: 文字列を、32 種類の文字で表すための符号化です。長い文字列は、途中で改行を入れて読みやすくされることがあります。
- **dst と src**: `src` は入力、`dst` は書き込み先です。`dst` は、`src` と同じか、それより長い領域として用意されます。

## 何をしているか

### 1. 改行以外の文字を順に写す

```go:line-numbers=553
	offset := 0
	for _, b := range src {
		if b == '\r' || b == '\n' {
			continue
		}
		dst[offset] = b
		offset++
	}
```

`src` の文字を先頭から順に見ます。改行と復帰なら、何もせず飛ばします。それ以外は、`dst` の `offset` の位置に写して、`offset` を一つ進めます。

`offset` が、書いた長さを表します。書く位置が詰まって並ぶので、改行の跡は残りません。

### 2. 写した長さを返す

```go:line-numbers=561
	return offset
```

書き込んだ長さを返します。呼び出し側は、`dst` の先頭からその長さの分だけを使います。

## ここがすごい

- **同じ領域で詰める**: 別の配列を作らず、`dst` に先頭から詰めて書くので、メモリの確保が少なくて済みます。
- **飛ばすだけの簡単な規則**: 改行の判定は二つの文字だけなので、読みやすく、確かめやすいです。

## まとめ

- `stripNewlines` は、改行と復帰を飛ばして、残りを詰めて写します。
- 写した長さを返すので、呼び出し側は必要な分だけ使えます。
- 新しい配列は作らず、`dst` に直接書きます。
