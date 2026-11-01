---
title: "値が最初に現れる位置を探す slices.Index"
description: "slices.Index は、スライスの中で指定した値が最初に現れる位置を返します。見つからなければ -1 を返します。比べるには、要素の型が comparable である必要があります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/slices.go"
lines: [96, 103]
function: "Index"
difficulty: 1
format: 2
tags: [探索, ジェネリクス, 標準ライブラリ]
---

## ひとことで

`slices.Index([]string{"a", "b", "c"}, "b")` は `1` を返します。値の位置を、前から順に探す関数です。見つからなければ `-1` を返します。

## コード

```go:line-numbers=96
func Index[S ~[]E, E comparable](s S, v E) int {
	for i := range s {
		if v == s[i] {
			return i
		}
	}
	return -1
}
```

## 前提知識

- **`comparable`**: `==` で比べられる型の制約です。`int` や `string` は使えますが、スライスやマップは使えません。
- **`range` と添字**: `for i := range s` は、添字を先頭から順に返します。
- **`-1` の意味**: 添字は 0 以上なので、`-1` は「見つからない」を表す慣用的な値です。
- **線形探索**: 先頭から 1 つずつ比べる、最も単純な探し方です。

## 何をしているか

### 1. 先頭から順に比べる

```go:line-numbers=97
	for i := range s {
		if v == s[i] {
			return i
```

添字 `i` を先頭から回し、`s[i]` が `v` と等しいかを比べます。等しければ、その添字を返します。最初に見つかった位置で止まるので、同じ値が後ろにあっても気にしません。

### 2. 見つからなければ -1 を返す

```go:line-numbers=102
	return -1
```

すべてを比べても一致しなかったら、`-1` を返します。呼び出し側は、戻り値が 0 以上かどうかで、見つかったかを判定できます。

## ここがすごい

- **書き方が 1 通りに決まる**: 添字と比べるだけなので、型が変わっても読み方が変わりません。
- **最初の一致で止まる**: 必要以上に走査しないので、先頭の方にあるときは速く終わります。
- **`-1` で失敗を表す**: 例外や `error` を使わずに、見つからない場合を表せます。小さな探索なら、この方が扱いやすくなります。

## まとめ

- 添字を先頭から回し、等しい値が最初に現れた位置を返す。
- 見つからなければ `-1` を返し、呼び出し側が判定する。
- 比べるために `comparable` の制約が必要になる。
