---
title: "末尾の接尾辞を取り除く bytes.CutSuffix。一致しなければ元のまま返す"
description: "bytes パッケージの CutSuffix。バイト列 s が suffix で終わるかを調べる。終わるなら、接尾辞を除いた前の部分と true を返す。終わらなければ、元の s と false を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bytes/bytes.go"
lines: [1447, 1452]
function: "CutSuffix"
difficulty: 2
tags: [文字列処理, 防御的プログラミング]
---

## ひとことで

`bytes.CutSuffix(s, suffix)` は、バイト列 `s` が `suffix` で終わるかを調べます。終わるなら、末尾を除いた前の部分を返します。終わらなければ、元の `s` を返します。

## コード

```go:line-numbers=1447
func CutSuffix(s, suffix []byte) (before []byte, found bool) {
	if !HasSuffix(s, suffix) {
		return s, false
	}
	return s[:len(s)-len(suffix)], true
}
```

## 前提知識

- **接尾辞（suffix）**: バイト列の末尾に付いている部分です。
- **HasSuffix**: バイト列が、指定した接尾辞で終わるかを調べる関数です。
- **スライスの切り出し**: `s[:n]` で、先頭から n バイトまでの部分を指します。

## 何をしているか

### 1. 末尾が一致しなければ戻る

```go:line-numbers=1448
	if !HasSuffix(s, suffix) {
		return s, false
	}
```

`HasSuffix` で末尾が一致しないと分かったら、元の `s` と `false` を返します。何も切り取りません。

### 2. 接尾辞を除いた前の部分を返す

```go:line-numbers=1451
	return s[:len(s)-len(suffix)], true
```

一致したら、末尾の `suffix` の長さの分だけを除いた、前の部分を返します。`true` も一緒に返します。

## ここがすごい

- **確かめてから切る**: 先に `HasSuffix` で確かめるので、接尾辞が無いときに、負の位置を指すことはありません。
- **呼び出し側が結果を使い分けられる**: `found` で一致したかを判断できるので、同じ関数で切り取りと判定の両方を行えます。

## まとめ

- `bytes.CutSuffix` は、末尾の接尾辞を取り除きます。
- 一致しなければ、元の `s` と `false` を返します。
- 切り取りは、元の配列の一部を指すだけです。
