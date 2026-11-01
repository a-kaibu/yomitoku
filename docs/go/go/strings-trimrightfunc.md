---
title: "末尾から条件に合う文字を取り除く strings.TrimRightFunc"
description: "strings.TrimRightFunc は、文字列の末尾から、条件の関数が true を返す文字を取り除きます。見つかった位置を lastIndexFunc で求め、その文字の終わりまでを残します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [878, 887]
function: "TrimRightFunc"
difficulty: 2
format: 2
tags: [文字列処理, Unicode, 標準ライブラリ]
---

## ひとことで

`strings.TrimRightFunc("abc123", unicode.IsDigit)` は `abc` を返します。末尾の数字だけを、条件に合う限り取り除きます。空白だけを除く `TrimSpace` は、同じ考え方の専用の版を使います。

## コード

```go:line-numbers=878
func TrimRightFunc(s string, f func(rune) bool) string {
	i := lastIndexFunc(s, f, false)
	if i >= 0 {
		_, wid := utf8.DecodeRuneInString(s[i:])
		i += wid
	} else {
		i++
	}
	return s[0:i]
}
```

## 前提知識

- **条件の関数 `f`**: 1 文字を受け取り、取り除くかどうかを `bool` で返す関数です。
- **`lastIndexFunc`**: 末尾から見て、条件に合わない最初の文字の位置を探す関数です。
- **UTF-8 の文字の幅**: 多バイトの文字は、バイト数が 1 文字ごとに違います。位置を戻すときは、文字の幅を知る必要があります。
- **`s[0:i]`**: 先頭から `i` バイトまでの部分文字列です。コピーは起きません。

## 何をしているか

### 1. 残すべき末尾を探す

```go:line-numbers=879
	i := lastIndexFunc(s, f, false)
```

`lastIndexFunc(s, f, false)` は、条件に合わない文字、つまり残すべき文字のうち、末尾に最も近いものを探します。`truth` が `false` なので、`f` が `false` を返す文字を探しています。

### 2. 文字の終わりまで位置を進める

```go:line-numbers=880
	if i >= 0 {
		_, wid := utf8.DecodeRuneInString(s[i:])
		i += wid
```

見つかれば、その位置の文字の幅を調べて、文字の終わりまで `i` を進めます。こうすると、多バイトの文字を途中で切らずに残せます。

### 3. 見つからなければ全部取り除く

```go:line-numbers=883
	} else {
		i++
	}
	return s[0:i]
```

残すべき文字が 1 つも無ければ、`i` を 1 つ進めてから、`s[0:i]` を返します。`lastIndexFunc` が `-1` を返したときは、`i` が 0 になり、空の文字列になります。ここでの `i++` は、この結果になるように整えた処理です。

## ここがすごい

- **終わりの位置を正しく求める**: 文字の幅まで考えるので、末尾の多バイト文字が壊れません。
- **条件を自由に選べる**: 数字、記号、空白など、どんな条件でも同じ仕組みで取り除けます。
- **コピーを作らない**: 結果は元の文字列の先頭部分を指すので、余分な領域を使いません。

## まとめ

- 末尾から、条件に合わない文字の位置を探す。
- 文字の幅を使って、文字の終わりまで残す。
- 残るものがなければ、空の文字列を返す。
