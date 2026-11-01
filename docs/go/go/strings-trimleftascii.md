---
title: "ASCII の集合に含まれる先頭の文字を取り除く strings.trimLeftASCII"
description: "strings.trimLeftASCII は、文字列の先頭から、ASCII の集合に含まれる文字を取り除きます。集合に含まれない文字が現れた時点で止まります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [1017, 1025]
function: "trimLeftASCII"
difficulty: 1
format: 2
tags: [文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`strings.Trim("  hi", " ")` の内部で、先頭の空白を取り除く部分です。文字の集合を 1 回のビット参照で判定し、1 文字ずつ先頭を進めます。

## コード

```go:line-numbers=1017
func trimLeftASCII(s string, as *asciiSet) string {
	for len(s) > 0 {
		if !as.contains(s[0]) {
			break
		}
		s = s[1:]
	}
	return s
}
```

## 前提知識

- **`asciiSet`**: ASCII の文字の有無を、ビットで覚えておく型です。`contains` で、ある文字が含まれるかを調べます。
- **文字列のスライス `s[1:]`**: 先頭の 1 バイトを除いた、同じ配列を指す文字列を作ります。コピーは起きません。
- **先頭からの除去**: 取り除く文字が続く限り、先頭を 1 つずつ進めます。
- **`break`**: 繰り返しを途中で止めます。

## 何をしているか

### 1. 先頭が集合に含まれるか調べる

```go:line-numbers=1018
	for len(s) > 0 {
		if !as.contains(s[0]) {
			break
		}
```

まだ文字が残っている間、先頭の 1 バイトが集合に含まれるかを調べます。含まれなければ、取り除く対象ではないので、`break` で繰り返しを止めます。

### 2. 先頭を 1 つ進める

```go:line-numbers=1022
		s = s[1:]
```

含まれていれば、`s[1:]` で先頭の 1 バイトを外します。文字列の中身はコピーされず、先頭の位置だけが変わります。

### 3. 残りを返す

```go:line-numbers=1024
	return s
```

取り除き終えた文字列を返します。元の文字列がすべて集合に含まれていれば、空の文字列になります。

## ここがすごい

- **判定が 1 回のビット参照**: 集合を使うので、取り除く文字の並びを毎回探す必要がありません。
- **コピーを作らない**: 先頭を進めるだけなので、文字列の中身は元の配列を指したままです。
- **止まる場所が明確**: 集合にない文字に当たった時点で止まるので、後ろの文字は調べません。

## まとめ

- 先頭が集合に含まれる限り、先頭を 1 バイトずつ進める。
- 含まれない文字に当たったら止める。
- 取り除いた残りを、コピーなしで返す。
