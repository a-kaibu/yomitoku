---
title: "条件に合うキーを削除する maps.DeleteFunc"
description: "maps.DeleteFunc は、判定の関数が true を返したキーとその値を、マップから削除します。range で回しながら削除しても、Go では安全に動きます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/maps/maps.go"
lines: [69, 75]
function: "DeleteFunc"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, イテレータ]
---

## ひとことで

`maps.DeleteFunc(m, func(k string, v int) bool { return v < 0 })` は、値が負のエントリをすべて消します。削除する条件を関数で渡せるので、ループを毎回書かずに済みます。

## コード

```go:line-numbers=69
func DeleteFunc[M ~map[K]V, K comparable, V any](m M, del func(K, V) bool) {
	for k, v := range m {
		if del(k, v) {
			delete(m, k)
		}
	}
}
```

## 前提知識

- **マップの `range`**: マップのキーと値を、順に取り出すループです。取り出す順は決まっていません。
- **`delete`**: マップから、指定したキーを削除する組み込み関数です。
- **削除しながらの `range`**: Go では、`range` の途中で現在のキーを削除しても、動作が保証されています。
- **関数を値として渡す**: 削除の条件を、呼び出し側が自由に決められます。

## 何をしているか

### 1. マップの全エントリを順に見る

```go:line-numbers=70
	for k, v := range m {
```

`range m` で、キーと値の組を 1 つずつ取り出します。順番は決まっていないので、削除の順番に依存しない書き方をしています。

### 2. 条件に合うものを削除する

```go:line-numbers=71
		if del(k, v) {
			delete(m, k)
		}
```

`del(k, v)` が `true` を返したら、`delete(m, k)` でそのキーを消します。判定は、キーと値の両方を見て決められます。

## ここがすごい

- **条件を呼び出し側が決める**: 削除の基準は、関数として渡されます。マップの型が何であっても、同じ関数で扱えます。
- **1 回のループで済む**: 別のリストに集めてから消す必要がなく、メモリを余分に使いません。
- **range と削除の組み合わせ**: 削除したエントリは、もう現れないという約束があるので、途中で壊れることがありません。

## まとめ

- `range` で全エントリを見て、条件に合うものを `delete` する。
- 条件は関数で渡すので、呼び出し側が基準を決められる。
- 別に集めず、1 回のループで消せる。
