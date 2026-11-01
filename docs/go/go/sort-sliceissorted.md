---
title: "後ろから隣同士を比べて並んでいるか調べる sort.SliceIsSorted"
description: "sort.SliceIsSorted は、任意のスライスが less の順に並んでいるかを返します。後ろから隣同士を比べ、1 組でも逆転していれば、その時点で false を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2017 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/sort/slice.go"
lines: [52, 61]
function: "SliceIsSorted"
difficulty: 1
format: 2
tags: [ソート, 標準ライブラリ, イディオム]
---

## ひとことで

`sort.SliceIsSorted(people, func(i, j int) bool { return people[i].Age < people[j].Age })` は、年齢の順に並んでいれば `true` を返します。スライスの型が何であっても、比べ方を関数で渡せます。

## コード

```go:line-numbers=52
func SliceIsSorted(x any, less func(i, j int) bool) bool {
	rv := reflectlite.ValueOf(x)
	n := rv.Len()
	for i := n - 1; i > 0; i-- {
		if less(i, i-1) {
			return false
		}
	}
	return true
}
```

## 前提知識

- **`less(i, j)`**: 要素 `i` が `j` より前に来るべきなら `true` を返す関数です。順序の決まりは、この関数で表します。
- **`any` と `reflectlite`**: どの型のスライスでも受け取れるように、内部では反射（リフレクション）で長さだけを調べます。
- **隣り合う 2 つの比較**: 並んでいるかどうかは、隣同士が正しい順かを確かめれば分かります。
- **早期の `return`**: 逆転を 1 つ見つけた時点で、残りを調べる必要はありません。

## 何をしているか

### 1. 長さを調べる

```go:line-numbers=53
	rv := reflectlite.ValueOf(x)
	n := rv.Len()
```

`reflectlite.ValueOf(x)` でスライスを反射の値として包み、`Len` で長さを取ります。要素の型を知らなくても、個数だけは分かります。

### 2. 後ろから隣同士を比べる

```go:line-numbers=55
	for i := n - 1; i > 0; i-- {
		if less(i, i-1) {
			return false
		}
```

`i` は `n-1` から 1 まで減っていきます。`less(i, i-1)` が `true` なら、`i-1` の要素の方が後ろに来るべきなので、並んでいません。その場で `false` を返します。

### 3. 最後まで問題がなければ並んでいる

```go:line-numbers=60
	return true
```

逆転が 1 つも見つからなければ、隣同士はすべて正しい順です。`true` を返します。

## ここがすごい

- **型を知らなくても使える**: 比べ方を `less` として渡すので、構造体のスライスでも、文字列のスライスでも同じ関数で調べられます。
- **1 組の逆転で止まる**: 並んでいないことが分かった時点で終わるので、長いスライスでも無駄がありません。
- **隣同士だけを比べる**: 並んでいるかの確認は、隣の比較だけで完了します。全組を比べる必要がありません。

## まとめ

- 比べ方は `less` で渡し、型は反射で扱う。
- 後ろから隣同士を比べ、逆転が 1 組でもあれば `false` を返す。
- 逆転がなければ `true` を返す。
