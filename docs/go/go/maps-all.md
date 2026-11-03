---
title: "マップの全要素を順に渡す maps.All。途中で止めれば反復も止まる"
description: "maps パッケージの All。マップの全ての鍵と値を、range-over-func の形で順に渡すイテレータを返す。yield が false を返すと、すぐに反復を止める。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2024 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/maps/iter.go"
lines: [12, 20]
function: "All"
difficulty: 2
tags: [イテレータ, データ構造]
---

## ひとことで

`maps.All(m)` は、マップ `m` の鍵と値の組を、一つずつ順に渡す関数を返します。`for k, v := range maps.All(m)` の形で、全要素を回せます。

## コード

```go:line-numbers=12
func All[Map ~map[K]V, K comparable, V any](m Map) iter.Seq2[K, V] {
	return func(yield func(K, V) bool) {
		for k, v := range m {
			if !yield(k, v) {
				return
			}
		}
	}
}
```

## 前提知識

- **イテレータ（iter.Seq2）**: 値を一つずつ渡していく関数の型です。`Seq2` は、鍵と値の二つを一組で渡します。
- **yield**: イテレータが一つ渡すたびに呼ぶ関数です。戻り値が `false` なら、呼び出し側が反復を止めたという意味です。
- **マップ**: 鍵から値を引く、順序の決まっていないデータ構造です。

## 何をしているか

### 1. 関数を返す

```go:line-numbers=13
	return func(yield func(K, V) bool) {
```

`All` は、すぐにはマップを回しません。`yield` を受け取る関数を返すだけです。実際に回すのは、呼び出し側が `range` を使ったときです。

### 2. マップを回して yield に渡す

```go:line-numbers=14
		for k, v := range m {
			if !yield(k, v) {
				return
			}
		}
```

マップの各要素について、鍵 `k` と値 `v` を `yield` に渡します。`yield` が `false` を返したら、`return` して反復を止めます。`break` で抜けた後に、マップを余分に回らないためです。

## ここがすごい

- **呼び出し側が止められる**: 途中で `break` すれば、残りの要素を渡さずに済みます。
- **マップの順序は決まっていない**: Go のマップは、回す順序を保証しません。この関数も、その性質をそのまま引き継ぎます。

## まとめ

- `maps.All` は、マップの鍵と値を順に渡すイテレータを返します。
- 呼び出し側が止めたら、すぐに反復を止めます。
- 回す順序は、マップの性質に従い、決まっていません。
