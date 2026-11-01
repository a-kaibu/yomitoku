---
title: "先頭から条件に合う文字を取り除く bytes.TrimLeftFunc"
description: "bytes.TrimLeftFunc は、バイト列の先頭から、条件の関数が true を返す文字を取り除きます。条件に合わない最初の文字の位置を indexFunc で探します。すべて取り除いた場合は nil を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/bytes.go"
lines: [838, 844]
function: "TrimLeftFunc"
difficulty: 1
format: 2
tags: [文字列処理, Unicode, 標準ライブラリ]
---

## ひとことで

`bytes.TrimLeftFunc([]byte("  \tgo"), unicode.IsSpace)` は `go` を返します。先頭の空白類を、条件に合わない文字に当たるまで取り除きます。

## コード

```go:line-numbers=838
func TrimLeftFunc(s []byte, f func(r rune) bool) []byte {
	i := indexFunc(s, f, false)
	if i == -1 {
		return nil
	}
	return s[i:]
}
```

## 前提知識

- **条件の関数 `f`**: 1 文字を受け取り、取り除くかどうかを `bool` で返す関数です。
- **`indexFunc`**: 先頭から見て、条件の結果が指定した真偽になる最初の位置を探す関数です。
- **`nil` の返り値**: すべて取り除いた場合は、空の値として `nil` を返します。
- **文字列版との対応**: `strings.TrimLeftFunc` の、バイト列版です。

## 何をしているか

### 1. 残す文字の先頭を探す

```go:line-numbers=839
	i := indexFunc(s, f, false)
```

`indexFunc(s, f, false)` で、条件に合わない最初の文字の位置を求めます。`false` を指定して、「`f` が偽になる文字」が残す側の先頭になるようにしています。

### 2. 見つからなければ nil

```go:line-numbers=840
	if i == -1 {
		return nil
	}
```

残る文字が無ければ、`nil` を返します。文字列版が空の文字列を返すのと、同じ考え方です。

### 3. 先頭を捨てて残りを返す

```go:line-numbers=843
	return s[i:]
```

見つかった位置から後ろを、`s[i:]` で切り出して返します。元の配列を指すので、コピーは起きません。

## ここがすごい

- **先頭だけを対象にする**: 途中の文字は残るので、本文の空白を壊しません。
- **バイト列のまま扱う**: 文字列に変換せずに済むので、変換のコストがありません。
- **結果の形を決める**: 全部取り除いたときは `nil` を返すと決めているので、呼び出し側は空の扱いを 1 通りに書けます。

## まとめ

- 残す文字の先頭を、`indexFunc` で探す。
- 見つからなければ `nil` を返す。
- 見つかった位置から後ろを、コピーなしで返す。
