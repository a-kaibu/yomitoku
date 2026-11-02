---
title: "輪の次の要素へ進む ring.Next"
description: "container/ring の Next は、輪の上で現在の要素の次を返します。まだ輪になっていない要素では、自分だけの輪を作ってから返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/ring/ring.go"
lines: [25, 30]
function: "Next"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, イディオム]
---

## ひとことで

`r.Next()` は、輪の中で `r` のすぐ次の要素を返します。最後の要素の次は、最初の要素に戻ります。輪を 1 周する繰り返しの、基本になる関数です。

## コード

```go:line-numbers=25
func (r *Ring) Next() *Ring {
	if r.next == nil {
		return r.init()
	}
	return r.next
}
```

## 前提知識

- **`Ring`**: 要素が輪のようにつながったデータ構造です。どの要素にも、次と前の要素があります。
- **`next` と `prev`**: 各要素が持つ、次と前への参照です。
- **未初期化の要素**: `next` が `nil` の要素は、まだ輪に入っていません。
- **`init`**: 自分だけを指す輪として準備するメソッドです。

## 何をしているか

### 1. 輪に入っていなければ準備する

```go:line-numbers=26
	if r.next == nil {
		return r.init()
	}
```

`next` が `nil` なら、この要素はまだ輪ではありません。`init` で、自分だけを指す輪にしてから、その要素を返します。

### 2. 次の要素を返す

```go:line-numbers=29
	return r.next
```

輪になっていれば、`next` の指す要素をそのまま返します。

## ここがすごい

- **空の要素でも使える**: 準備を自動で行うので、呼び出し側は初期化を気にしなくて済みます。
- **端がない**: 末尾という概念がないので、どこからでも同じ書き方で進めます。
- **1 周の繰り返しに使える**: `for p := r.Next(); p != r; p = p.Next()` と書くと、輪を 1 周できます。

## まとめ

- 次の要素は、`next` の指す先である。
- 未初期化の要素は、自分だけの輪にしてから返す。
- 末尾がないので、どこからでも同じ書き方で進める。
