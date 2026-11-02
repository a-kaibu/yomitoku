---
title: "基数の文字の埋め草を変える Encoding.WithPadding。危ない文字は panic で拒否する"
description: "encoding/base64 の Encoding.WithPadding。Base64 の埋め草の文字を別の文字に変えた、新しい Encoding を返す。改行や復帰、範囲外の値、アルファベットに含まれる文字は、panic で拒否する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/base64/base64.go"
lines: [97, 106]
function: "WithPadding"
difficulty: 2
tags: [文字列処理, 防御的プログラミング, API設計]
---

## ひとことで

`enc.WithPadding(padding)` は、Base64 の埋め草の文字を変えた、新しい `Encoding` を返します。埋め草とは、長さを 4 の倍数に揃えるために末尾に付ける文字 `=` のことです。

埋め草に、アルファベットの文字や改行などを使うと、読み取りが壊れます。そのため、使ってはいけない文字は、最初に `panic` で拒否します。

## コード

```go:line-numbers=97
func (enc Encoding) WithPadding(padding rune) *Encoding {
	switch {
	case padding < NoPadding || padding == '\r' || padding == '\n' || padding > 0xff:
		panic("invalid padding")
	case padding != NoPadding && enc.decodeMap[byte(padding)] != invalidIndex:
		panic("padding contained in alphabet")
	}
	enc.padChar = padding
	return &enc
}
```

## 前提知識

- **Base64**: バイナリのデータを、英数字などの 64 種類の文字で表す方法です。
- **埋め草（padding）**: データの長さを 4 文字の倍数に揃えるための印です。通常は `=` を使います。
- **`NoPadding`**: 埋め草を使わないことを表す値です。
- **`decodeMap`**: 文字から、その文字が表す値を引ける表です。アルファベットの文字なら、値が見つかります。
- **値の受け取り**: `enc Encoding` のように値で受け取るので、元の `Encoding` は変わらず、新しい値が返されます。

## 何をしているか

### 1. 使えない埋め草を拒否する

```go:line-numbers=99
	case padding < NoPadding || padding == '\r' || padding == '\n' || padding > 0xff:
		panic("invalid padding")
	case padding != NoPadding && enc.decodeMap[byte(padding)] != invalidIndex:
		panic("padding contained in alphabet")
```

範囲外の値、改行や復帰、一バイトを超える値は、埋め草として使えません。また、アルファベットに含まれる文字も、データと区別できなくなるので拒否します。どちらの場合も `panic` で止めます。

### 2. 埋め草を変えて返す

```go:line-numbers=104
	enc.padChar = padding
	return &enc
```

条件を満たす埋め草を、コピーした `enc` に設定します。元の `Encoding` は変えず、新しい値のポインタを返します。

## ここがすごい

- **誤りを早く止める**: 使えない埋め草を、書き出しや読み取りの途中ではなく、設定の時点で見つけます。
- **元を変えない**: 値で受け取ってコピーを変えるので、元の `Encoding` を使う別の処理に影響しません。
- **アルファベットとの衝突を防ぐ**: 埋め草がデータの文字と同じだと、どこまでがデータか分からなくなります。その矛盾を、設定の時点で防いでいます。

## まとめ

- `WithPadding` は、埋め草の文字を変えた新しい `Encoding` を返します。
- 改行や範囲外の値、アルファベットに含まれる文字は、`panic` で拒否します。
- 元の `Encoding` は変わらず、コピーを変えて返します。
