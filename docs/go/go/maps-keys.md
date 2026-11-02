---
title: "マップのキーを 1 つずつ渡すイテレータ maps.Keys"
description: "マップのキーだけを順に取り出す maps.Keys。キーの配列を先に作らず、yield で 1 つずつ渡す。マップの走査順は毎回ランダムだという仕様も関係している。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2024 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/maps/iter.go"
lines: [25, 33]
function: "Keys"
difficulty: 2
tags: [イテレータ, データ構造, 遅延評価]
---

## ひとことで

`maps.Keys(m)` は、マップ `m` のキーを 1 つずつ順番に渡すイテレータを返します。`for k := range maps.Keys(m) { ... }` と書けば、キーだけを順に処理できます。キーを入れるスライスは作られません。

Go のマップは、要素を取り出す順番がプログラムの実行ごとにばらばらになります。そのため、このイテレータも、順番を決めた結果は保証しません。

## コード

```go:line-numbers=25
func Keys[Map ~map[K]V, K comparable, V any](m Map) iter.Seq[K] {
	return func(yield func(K) bool) {
		for k := range m {
			if !yield(k) {
				return
			}
		}
	}
}
```

## 前提知識

- **マップ（連想配列）**: キーと値の組を保存するデータ構造です。`map[string]int` のように書き、キーから値を素早く探せます。
- **`range` でマップを回す**: `for k, v := range m` の形で、キーと値を順番に取り出せます。順番は決まっていません。
- **イテレータ（`iter.Seq`）**: `yield` 関数で値を 1 つずつ渡す仕組みです。戻り値が `false` になると、呼び出し側が止めたという意味です。
- **型パラメータの `Map ~map[K]V`**: マップの基になる型を受け取る書き方です。独自のマップ型でも使えます。

## 何をしているか

### 1. マップを range で回す

```go:line-numbers=27
			for k := range m {
				if !yield(k) {
					return
				}
			}
```

マップの中身は、Go の `range` でそのまま走査します。キーを 1 つ取り出すたびに `yield(k)` を呼びます。

### 2. 呼び出し側が止めたら終わる

`yield` の戻り値が `false` になると、`return` で関数を抜けます。`break` を使った `for` ループは、この `false` を返すように作られています。残りのキーを回る必要がなくなるので、無駄な走査が省けます。

### 3. キーを複製しない

このイテレータは、キーのスライスを作りません。`k` の値が 1 つずつ `yield` に渡されるだけです。大きなマップでも、キーを全部コピーするメモリは使いません。

## ここがすごい

- **メモリを使わない列挙**: `maps.Keys` の後で `slices.Collect` と組み合わせれば、キーのスライスを作れます。必要になるまで作らないという、遅延評価の考え方です。
- **順序に依存しない設計**: マップは順番が決まっていないので、イテレータも順番を約束しません。`slices.Sorted(maps.Keys(m))` のように、順番が必要な人が並べ替えを選べます。
- **型をそのまま保つ**: `~map[K]V` と書くことで、独自のマップ型を受け取っても、キーの型はそのまま保たれます。

## まとめ

- `maps.Keys` は、マップのキーを `yield` で 1 つずつ渡すイテレータです。
- キーのスライスは作らず、必要な分だけを順に渡します。
- マップの順番は決まっていないので、順番が必要なら並べ替えを行います。
- `yield` が `false` を返したら、すぐに走査を止めます。
