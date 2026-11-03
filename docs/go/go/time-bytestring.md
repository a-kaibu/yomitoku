---
title: "NUL で終わる時間帯の名前を取り出す byteString"
description: "time パッケージの byteString。バイト列の中で最初の NUL バイトより前の部分を文字列として返す。NUL がなければ、バイト列の全体を文字列にする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/zoneinfo_read.go"
lines: [105, 110]
function: "byteString"
difficulty: 2
tags: [文字列処理, 防御的プログラミング]
---

## ひとことで

`byteString(p)` は、バイト列 `p` を文字列に変えます。ただし、最初の NUL（0 のバイト）より後ろは含めません。

## コード

```go:line-numbers=105
func byteString(p []byte) string {
	if i := bytealg.IndexByte(p, 0); i != -1 {
		p = p[:i]
	}
	return string(p)
}
```

## 前提知識

- **NUL バイト**: 値が 0 のバイトです。C 言語などでは、文字列の終わりを表すために使われます。
- **時間帯データ**: タイムゾーンの情報を、ファイルの形式で保存したものです。名前の部分は、NUL で終わる形で入っています。
- **bytealg.IndexByte**: バイト列の中で、指定したバイトが最初に現れる位置を探す、速い内部の関数です。

## 何をしているか

### 1. 最初の NUL の位置を探す

```go:line-numbers=106
	if i := bytealg.IndexByte(p, 0); i != -1 {
		p = p[:i]
	}
```

`IndexByte` で、値 0 の最初の位置 `i` を探します。見つかったら、その手前までを `p` として残します。見つからなければ `-1` が返るので、`p` はそのままです。

### 2. 残りを文字列にして返す

```go:line-numbers=109
	return string(p)
```

切り詰めた `p` を文字列に変えて返します。NUL がなければ、全体を文字列にします。

## ここがすごい

- **NUL が無くても壊れない**: 見つからない場合も、そのまま全体を使うので、不正なデータでもパニックしません。
- **速い探索に任せる**: 最初の NUL を探す処理は、内部の高速な関数に任せています。

## まとめ

- `byteString` は、最初の NUL までを文字列にします。
- NUL がなければ、全体を文字列にします。
- 探索は、内部の速い関数に任せます。
