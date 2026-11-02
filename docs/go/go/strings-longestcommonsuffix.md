---
title: "2 つの文字列の末尾が何バイト同じかを数える longestCommonSuffix"
description: "strings の longestCommonSuffix。2 つの文字列を末尾から比べ、同じ部分が何バイト続くかを返す。途中で違うバイトが見つかれば、すぐに止まる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2012 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/search.go"
lines: [91, 98]
function: "longestCommonSuffix"
difficulty: 1
tags: [文字列処理, 探索, アルゴリズム]
---

## ひとことで

`longestCommonSuffix(a, b)` は、2 つの文字列の末尾が、何バイト同じかを返します。例えば `"testing"` と `"ring"` なら、末尾の `"ing"` が同じなので、3 を返します。

文字列の探索を行うときに、「末尾が同じ部分」を素早く知る必要があります。この関数は、その長さを求める、小さな専用の処理です。

## コード

```go:line-numbers=91
func longestCommonSuffix(a, b string) (i int) {
	for ; i < len(a) && i < len(b); i++ {
		if a[len(a)-1-i] != b[len(b)-1-i] {
			break
		}
	}
	return
}
```

## 前提知識

- **接尾辞（suffix）**: 文字列の末尾の部分です。`"ing"` は `"testing"` の接尾辞です。
- **バイト単位**: 比べるのは 1 バイトずつです。ここでは、文字の境界は気にせず、バイトの一致だけを見ます。
- **末尾からの位置**: 末尾から `i` 番目のバイトは、`a[len(a)-1-i]` で取り出せます。`i = 0` が最後のバイトです。
- **ループの途中で抜ける**: 違うバイトが見つかった時点で、残りを見る必要はありません。

## 何をしているか

### 1. 末尾から、同じバイトを数える

```go:line-numbers=92
	for ; i < len(a) && i < len(b); i++ {
		if a[len(a)-1-i] != b[len(b)-1-i] {
			break
		}
	}
```

`i` は、末尾から数えた位置です。最初は 0 で、末尾の 1 バイトから比べます。どちらかの文字列の先頭に届いたら、ループは終わります。

`a` と `b` の末尾のバイトが違えば、`break` で止まります。それまでに同じだったバイトの数が、`i` に残ります。

### 2. 数えた長さを返す

```go:line-numbers=97
	return
```

名前付きの戻り値 `i` は、同じだったバイトの数です。`return` だけで、その値が呼び出し元に渡されます。

## ここがすごい

- **止まるのが早い**: 違うバイトが見つかれば、残りは見ません。長い文字列でも、先頭側の差が大きければ、すぐに答えが出ます。
- **比べる範囲を自動で決める**: `i < len(a) && i < len(b)` の条件で、短い方の長さを超えないように止まります。範囲の外を読むことはありません。
- **名前付きの戻り値**: 結果を `i` に入れながら数えるので、別の変数を用意する必要がありません。短く、読みやすい形です。

## まとめ

- `longestCommonSuffix` は、2 つの文字列の末尾が何バイト同じかを返します。
- 末尾から 1 バイトずつ比べ、違うバイトが見つかれば止まります。
- 短い方の長さを超えないように、範囲を自動で制限します。
