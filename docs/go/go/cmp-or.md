---
title: "最初の非ゼロの値を選ぶ cmp.Or"
description: "cmp.Or は、並べた値のうち、最初にゼロ値でないものを返します。すべてゼロなら、ゼロ値を返します。既定値を用意するときの書き方として使えます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2023 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/cmp/cmp.go"
lines: [69, 77]
function: "Or"
difficulty: 1
format: 2
tags: [型システム, ジェネリクス, イディオム]
---

## ひとことで

`cmp.Or(os.Getenv("NAME"), "guest")` は、環境変数が空でなければその値を、空なら `"guest"` を返します。候補を左から順に試す既定値の書き方です。

## コード

```go:line-numbers=69
func Or[T comparable](vals ...T) T {
	var zero T
	for _, val := range vals {
		if val != zero {
			return val
		}
	}
	return zero
}
```

## 前提知識

- **ゼロ値**: 型ごとに決まった初期値です。`int` は 0、`string` は空文字列、ポインタは `nil` です。
- **可変長引数 `vals ...T`**: 任意の個数の値を、スライスとして受け取ります。
- **`comparable` 制約**: `==` で比べられる型だけを受け付けます。ゼロ値との比較に必要です。
- **ジェネリクス**: 型パラメータ `T` で、どの型にも同じ関数を使えるようにする仕組みです。

## 何をしているか

### 1. ゼロ値を用意する

```go:line-numbers=70
	var zero T
```

`var zero T` で、型 `T` のゼロ値を作ります。ここでは、どの型かを知らなくても、「空」を表す値を比べに使えます。

### 2. 左から順に比べる

```go:line-numbers=71
	for _, val := range vals {
		if val != zero {
			return val
		}
```

`vals` を先頭から見て、`zero` と違う値が見つかったら、すぐに返します。見つかった時点で残りは調べません。

### 3. すべてゼロなら、ゼロ値を返す

```go:line-numbers=76
	return zero
```

どの値もゼロ値だったときは、`zero` を返します。呼び出し側は、結果がゼロ値かどうかで、候補がすべて空だったと判断できます。

## ここがすごい

- **書く人が優先順位を決める**: 並べた順が、そのまま優先順位になります。`if` を重ねる書き方より読みやすくなります。
- **短絡的に止まる**: 最初の値が使えれば、後ろの候補は評価されません。ただし、引数はすべて先に評価される点は注意します。
- **型を選ばない**: ジェネリクスによって、文字列でも数値でも、同じ書き方で既定値を表せます。

## まとめ

- 候補を左から順に見て、最初のゼロ値でないものを返す。
- すべてゼロなら、ゼロ値を返す。
- 既定値の書き方として、読みやすく短くまとめられる。
