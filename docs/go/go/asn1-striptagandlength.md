---
title: "ASN.1 の先頭のタグと長さを読み飛ばす stripTagAndLength"
description: "encoding/asn1 の stripTagAndLength。バイト列の先頭にあるタグと長さを読み取り、その後ろの中身だけを返す。読めなければ、元のバイト列をそのまま返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/asn1/marshal.go"
lines: [450, 456]
function: "stripTagAndLength"
difficulty: 2
tags: [入出力, パース]
---

## ひとことで

`stripTagAndLength(in)` は、ASN.1 のバイト列の先頭にある、タグと長さの部分を取り除きます。残った中身のバイト列を返します。読めなければ、元の `in` を返します。

## コード

```go:line-numbers=450
func stripTagAndLength(in []byte) []byte {
	_, offset, err := parseTagAndLength(in, 0)
	if err != nil {
		return in
	}
	return in[offset:]
}
```

## 前提知識

- **タグ**: ASN.1 のデータの種類を示す、先頭のバイトです。
- **長さ**: 中身が何バイトかを示す部分です。タグの後に続きます。
- **オフセット**: バイト列の中で、どこまで読んだかを示す位置です。

## 何をしているか

### 1. タグと長さを読む

```go:line-numbers=451
	_, offset, err := parseTagAndLength(in, 0)
	if err != nil {
		return in
	}
```

`parseTagAndLength` で、タグと長さを読み、その終わりの位置 `offset` を求めます。読めなかったときは、エラーを受け取り、元の `in` をそのまま返します。

### 2. 中身だけを返す

```go:line-numbers=455
	return in[offset:]
```

読めたときは、`offset` より後ろの部分、つまり中身だけを返します。新しいバイト列は作らず、元の配列の一部を指します。

## ここがすごい

- **失敗しても値を返す**: 読めなくても、元のデータを返すので、呼び出し側は分岐を少なくできます。
- **読み取りは一か所に任せる**: タグと長さの読み方は `parseTagAndLength` に任せ、この関数は中身を切り出すだけです。

## まとめ

- `stripTagAndLength` は、タグと長さを読み飛ばして中身を返します。
- 読めなければ、元のバイト列をそのまま返します。
- 切り出しは、元の配列の一部を指すだけです。
