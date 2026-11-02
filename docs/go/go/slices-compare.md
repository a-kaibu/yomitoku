---
title: "2 つのスライスを辞書順に比べる slices.Compare"
description: "2 つのスライスを先頭から要素ごとに比べ、最初に違う要素で大小を決める slices.Compare。長さが違うときは、先に終わったほうが小さいと判定する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/slices/slices.go"
lines: [57, 71]
function: "Compare"
difficulty: 2
tags: [標準ライブラリ, ジェネリクス, アルゴリズム]
---

## ひとことで

`slices.Compare(s1, s2)` は、2 つのスライスを **辞書順（電話帳の並び順）** で比べます。戻り値は、`s1` が小さいなら `-1`、同じなら `0`、大きいなら `+1` です。例えば `[]int{1, 2}` と `[]int{1, 3}` を比べると `-1` になります。

## コード

```go:line-numbers=57
func Compare[S ~[]E, E cmp.Ordered](s1, s2 S) int {
	for i, v1 := range s1 {
		if i >= len(s2) {
			return +1
		}
		v2 := s2[i]
		if c := cmp.Compare(v1, v2); c != 0 {
			return c
		}
	}
	if len(s1) < len(s2) {
		return -1
	}
	return 0
}
```

## 前提知識

- **辞書順**: 先頭の要素から順に比べて、最初に違った要素の大小で決める順番です。`"apple"` が `"banana"` より前なのと同じ考え方です。
- **ジェネリクス（型パラメータ）**: `[S ~[]E, E cmp.Ordered]` のように、型を後から指定できる仕組みです。`cmp.Ordered` は、大小比較ができる型の集まりです。
- **`~[]E`**: 「基になる型が `[]E` のもの」という意味です。`type IDs []int` のような独自の型も受け取れます。
- **`cmp.Compare`**: 2 つの値を比べて、`-1`、`0`、`+1` を返す関数です。

## 何をしているか

### 1. 先頭から要素を比べる

```go:line-numbers=58
	for i, v1 := range s1 {
		if i >= len(s2) {
			return +1
		}
		v2 := s2[i]
```

`s1` の要素を先頭から見ていきます。`i >= len(s2)` なら、`s2` は既に終わっているのに `s1` は続いているということです。このとき `s1` のほうが大きいので、`+1` を返します。

### 2. 最初に違う要素で決める

```go:line-numbers=63
		if c := cmp.Compare(v1, v2); c != 0 {
			return c
		}
```

`cmp.Compare` で 2 つの要素を比べて、違いがあればその結果を即座に返します。同じなら次の要素に進みます。途中で決まるので、後ろの要素は比べません。

### 3. 全部同じなら長さで決める

```go:line-numbers=67
	if len(s1) < len(s2) {
		return -1
	}
	return 0
```

ループを最後まで回ったら、先頭から共通部分はすべて同じです。このとき、`s1` のほうが短ければ、`s1` は途中で終わっているので小さいです。同じ長さなら `0` を返します。

## ここがすごい

- **早く決まるほど速い**: 最初の要素で違いが見つかれば、残りの要素を見る必要がありません。ソートでの比較にも向いています。
- **長さの扱いが自然**: 「先に終わったほうが小さい」は、辞書で `"ab"` が `"abc"` より前に並ぶのと同じ感覚です。特別なルールを足さずに済んでいます。
- **型を選ばない**: ジェネリクスで書かれているので、`[]int` でも `[]string` でも、独自の型でも同じ関数が使えます。

## まとめ

- `Compare` は、2 つのスライスを辞書順に比べて、`-1`、`0`、`+1` を返します。
- 最初に違う要素で大小が決まり、それ以降は見ません。
- 共通部分が同じなら、短いほうが小さいとします。
- ジェネリクスの `~[]E` により、独自のスライス型でも使えます。
