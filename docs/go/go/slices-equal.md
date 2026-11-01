---
title: "長さを先に比べてから、要素を順に比べる Equal"
description: "slices.Equal は、2 つのスライスの長さと中身が同じかを調べます。長さが違えば、中身を見る前に false を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/slices.go"
lines: [20, 30]
function: "Equal"
difficulty: 1
format: 2
tags: [アルゴリズム, 標準ライブラリ, ジェネリクス, 可読性]
---

## ひとことで

`slices.Equal(s1, s2)` は、2 つのスライスが同じ要素を、同じ順番で持っているかを返します。`[1, 2]` と `[1, 2]` は等しく、`[1, 2]` と `[1, 2, 3]` は等しくありません。

型のパラメータ `E` は `comparable` なので、`==` で比べられる型なら何でも使えます。

## コード

```go:line-numbers=20
func Equal[S ~[]E, E comparable](s1, s2 S) bool {
	if len(s1) != len(s2) {
		return false
	}
	for i := range s1 {
		if s1[i] != s2[i] {
			return false
		}
	}
	return true
}
```

## 前提知識

- **`comparable`**: `==` と `!=` で比べられる型を表す制約です。
- **`range s1`**: スライスの位置を先頭から順に取り出します。ここでは位置だけを使います。
- **早期 return**: 結果がわかった時点で関数を抜けることです。以降の処理を省けます。

## 何をしているか

### 1. 長さが違えば終わり

```go:line-numbers=21
	if len(s1) != len(s2) {
		return false
	}
```

`[1, 2]` と `[1, 2, 3]` は、長さが違うので、中身を見る前に `false` を返します。長さは定数時間で分かるので、これは安い判定です。

### 2. 同じ位置の要素を比べる

```go:line-numbers=24
	for i := range s1 {
		if s1[i] != s2[i] {
			return false
		}
	}
```

長さが同じなので、`s2[i]` は必ず範囲内にあります。違う要素が 1 つでもあれば、そこで `false` を返します。

### 3. すべて同じなら true

```go:line-numbers=29
	return true
```

最後まで違う要素がなければ、スライスは等しいです。

## ここがすごい

- **早く答えを出す**: 長さの比較は中身を読まずに終わります。違いが早く見つかれば、残りは読みません。
- **境界の安全性を長さで保証**: 長さが同じだと確かめてから `s2[i]` を読むので、範囲外を読むことがありません。
- **ジェネリクスで型を問わない**: 同じ関数で `int`、`string`、構造体（比較可能なもの）のスライスを比べられます。

## まとめ

- 2 つのスライスを比べるときは、まず長さを比べる。
- 長さが同じなら、要素を順に比べて、違いが見つかった時点で終わる。
- 型のパラメータで制約を付けると、比べられる型を型の上で守れる。
