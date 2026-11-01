---
title: "2 つのマップが同じ中身かを比べる maps.Equal"
description: "maps.Equal は、2 つのマップの要素数が同じで、すべてのキーに対応する値が等しいかを返します。値の比較には、等号演算子を使います。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/maps/maps.go"
lines: [17, 27]
function: "Equal"
difficulty: 2
format: 2
tags: [データ構造, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`maps.Equal(a, b)` は、`a` と `b` が同じキーと同じ値の組を持つなら `true` を返します。順番はマップには無いので、比べるのは中身の組だけです。

## コード

```go:line-numbers=17
func Equal[M1, M2 ~map[K]V, K, V comparable](m1 M1, m2 M2) bool {
	if len(m1) != len(m2) {
		return false
	}
	for k, v1 := range m1 {
		if v2, ok := m2[k]; !ok || v1 != v2 {
			return false
		}
	}
	return true
}
```

## 前提知識

- **マップの要素数**: `len(m)` で、キーと値の組の個数が分かります。
- **`comma ok` の書き方**: `v, ok := m[k]` で、キーが存在するかと、その値を同時に得られます。
- **`comparable` 制約**: キーと値が `==` で比べられる型だけを受け付けます。
- **`nil` のマップ**: 要素数は 0 です。読むことはできるので、比べ方も同じです。

## 何をしているか

### 1. 要素数を比べる

```go:line-numbers=18
	if len(m1) != len(m2) {
		return false
	}
```

要素数が違えば、中身も違います。すぐに `false` を返して、中身の比較を省きます。

### 2. 各キーの値を比べる

```go:line-numbers=21
	for k, v1 := range m1 {
		if v2, ok := m2[k]; !ok || v1 != v2 {
			return false
		}
	}
```

`m1` の各キーについて、`m2` にそのキーがあり、値が等しいかを確かめます。キーが無いか、値が違えば、`false` を返します。

### 3. すべて一致すれば true

```go:line-numbers=26
	return true
```

`m1` のすべてのキーが `m2` に同じ値で存在するなら、要素数も同じなので、中身は一致しています。`true` を返します。

## ここがすごい

- **早く判定を終える**: 要素数の比較で、多くの不一致を一瞬で見分けます。
- **順番を気にしない**: マップは順番を持たないので、キーを使って比べるのが正しい方法です。
- **値の型で制約**: `comparable` があるので、比べられない型で誤って使うことを防げます。

## まとめ

- 要素数が違えば、すぐに `false` を返す。
- 各キーについて、もう一方に同じ値があるかを確かめる。
- すべて一致すれば、中身が等しいと判断する。
