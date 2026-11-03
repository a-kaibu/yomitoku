---
title: "区切り文字の前後に分ける bytes.Cut。見つからなければ全体を前に返す"
description: "bytes パッケージの Cut。バイト列 s の中で最初に現れる sep の前後で、二つに分ける。見つかったかどうかも返す。見つからなければ、s を前の部分として返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bytes/bytes.go"
lines: [1411, 1416]
function: "Cut"
difficulty: 2
tags: [文字列処理, 可読性]
---

## ひとことで

`bytes.Cut(s, sep)` は、バイト列 `s` を、最初に現れる区切り `sep` の前後で二つに分けます。見つかったかどうかも返します。

## コード

```go:line-numbers=1411
func Cut(s, sep []byte) (before, after []byte, found bool) {
	if i := Index(s, sep); i >= 0 {
		return s[:i], s[i+len(sep):], true
	}
	return s, nil, false
}
```

## 前提知識

- **バイト列（[]byte）**: 文字列と同じように、バイトの並びを表す型です。
- **区切り（sep）**: 分ける目印になる、バイト列です。
- **複数の戻り値**: Go では、関数が複数の値を同時に返せます。ここでは、前、後、見つかったか、の三つです。

## 何をしているか

### 1. 区切りの位置を探す

```go:line-numbers=1412
	if i := Index(s, sep); i >= 0 {
		return s[:i], s[i+len(sep):], true
	}
```

`Index` で、`sep` が最初に現れる位置 `i` を探します。見つかったら、`s[:i]` を前の部分とし、`s[i+len(sep):]` を後ろの部分とします。区切りそのものは、どちらにも含まれません。

### 2. 見つからなければ全体を前に返す

```go:line-numbers=1415
	return s, nil, false
```

区切りが見つからなければ、元の `s` を前の部分として返します。後ろは `nil` で、`found` は `false` です。

## ここがすごい

- **一つの関数で結果が分かる**: 分けた結果と、見つかったかを同時に返すので、呼び出し側は確認を一度で済ませられます。
- **元の配列を分けるだけ**: 前後の部分は、元の `s` の一部を指すだけで、新しいメモリを作りません。

## まとめ

- `bytes.Cut` は、最初の区切りの前後で二つに分けます。
- 見つからなければ、元の `s` を前として返します。
- 分けた部分は、元の配列の一部を指します。
