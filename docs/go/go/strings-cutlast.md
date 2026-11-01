---
title: "最後の区切りで前後に分ける strings.CutLast"
description: "strings.CutLast は、文字列を最後に現れた区切りの位置で、前と後ろに分けます。区切りが無ければ、元の文字列を前に、後ろを空にして found を false にします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [1320, 1325]
function: "CutLast"
difficulty: 1
format: 2
tags: [文字列処理, パース, 標準ライブラリ]
---

## ひとことで

`strings.CutLast("a/b/c.txt", "/")` は、前の `a/b` と、後ろの `c.txt` と、見つかったという `true` を返します。パスの末尾の要素を、取り出したいときに使えます。

## コード

```go:line-numbers=1320
func CutLast(s, sep string) (before, after string, found bool) {
	if i := LastIndex(s, sep); i >= 0 {
		return s[:i], s[i+len(sep):], true
	}
	return s, "", false
}
```

## 前提知識

- **`LastIndex`**: 区切りが最後に現れる位置を返す関数です。見つからなければ `-1` を返します。
- **`Cut`**: 最初に現れた区切りで分ける関数です。`CutLast` は、その逆向きの版です。
- **名前付きの戻り値**: `before`、`after`、`found` に名前を付けると、何が返るかが読み手に分かります。
- **区切りの長さ**: 後ろの部分は、区切りの長さぶん後ろから始めます。

## 何をしているか

### 1. 最後の位置を探す

```go:line-numbers=1321
	if i := LastIndex(s, sep); i >= 0 {
```

`LastIndex` で、区切りが最後に現れる位置 `i` を探します。`i` が 0 以上なら、見つかったことになります。

### 2. 区切りの前後に分けて返す

```go:line-numbers=1322
		return s[:i], s[i+len(sep):], true
```

`s[:i]` が前の部分です。`s[i+len(sep):]` は、区切りの後ろから始まる後ろの部分です。区切りそのものは、どちらにも含まれません。

### 3. 見つからなかったとき

```go:line-numbers=1324
	return s, "", false
```

区切りが無いときは、元の文字列を `before` に、空の `after` と `false` を返します。分けられなかったことが、戻り値で分かります。

## ここがすごい

- **分けると同時に見つかったかを返す**: `found` で、区切りがあったかどうかを判定できます。空の文字列と、区切りが無いことを区別できます。
- **コピーを作らない**: 前後の部分は、元の文字列を指す切り出しです。
- **末尾から探す**: パスやドメインのように、最後の区切りで分けたい場面に合っています。

## まとめ

- 最後の区切りの位置で、前と後ろに分ける。
- 見つかったかを `found` で返すので、区切りが無い場合も判定できる。
- 切り出しなので、余分なコピーは起きない。
