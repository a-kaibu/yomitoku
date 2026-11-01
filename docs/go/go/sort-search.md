---
title: "「false が続いてから true」の境目を見つける汎用二分探索"
description: "sort.Search は、条件が false から true に切り替わる最初の位置を二分探索で求めます。不変条件をコメントで明示した、教科書のような実装です。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/sort/search.go"
lines: [58, 73]
function: "Search"
difficulty: 2
format: 2
tags: [探索, アルゴリズム, 標準ライブラリ, 関数型]
---

## ひとことで

`sort.Search(n, f)` は、0 から n-1 までの整数のうち、**`f(i)` が初めて `true` になる `i`** を返します。どれも `true` にならなければ `n` を返します。
条件は「ある位置までは全部 `false`、そこから先は全部 `true`」という形になっている必要があります。

たとえば昇順に並んだ `[]int{1, 3, 5, 7}` から 5 以上の最初の位置を探すなら、`sort.Search(4, func(i int) bool { return a[i] >= 5 })` で `2` が返ります。

## コード

::: code-group

```go:line-numbers=58 [日本語訳]
func Search(n int, f func(int) bool) int {
	// f(-1) == false、f(n) == true と定義する。
	// 不変条件: f(i-1) == false、f(j) == true。
	i, j := 0, n
	for i < j {
		h := int(uint(i+j) >> 1) // h を計算するときのオーバーフローを避ける
		// i ≤ h < j
		if !f(h) {
			i = h + 1 // f(i-1) == false を保つ
		} else {
			j = h // f(j) == true を保つ
		}
	}
	// i == j で、f(i-1) == false かつ f(j)（= f(i)）== true なので、答えは i。
	return i
}
```

```go:line-numbers=58 [原文]
func Search(n int, f func(int) bool) int {
	// Define f(-1) == false and f(n) == true.
	// Invariant: f(i-1) == false, f(j) == true.
	i, j := 0, n
	for i < j {
		h := int(uint(i+j) >> 1) // avoid overflow when computing h
		// i ≤ h < j
		if !f(h) {
			i = h + 1 // preserves f(i-1) == false
		} else {
			j = h // preserves f(j) == true
		}
	}
	// i == j, f(i-1) == false, and f(j) (= f(i)) == true  =>  answer is i.
	return i
}
```

:::

## 前提知識

- **二分探索**: 並んだデータの真ん中を見て、答えが左半分にあるか右半分にあるかを決め、範囲を半分にしていく探し方です。100 万件でも 20 回ほどの比較で見つかります。
- **関数を引数に渡す**: `f func(int) bool` は「整数を受け取って真偽値を返す関数」を受け取る引数です。呼び出す側が `func(i int) bool { ... }` のように、その場で関数を書いて渡せます（無名関数、クロージャ）。
- **`i, j := 0, n`**: 2 つの変数を同時に宣言・代入しています。
- **`uint(i+j) >> 1`**: `i+j` を符号なし整数として 2 で割っています（右に 1 ビットずらすのは 2 で割るのと同じ）。

## 何をしているか

### 1. 範囲と約束事

```go:line-numbers=59
	// f(-1) == false、f(n) == true と定義する。
	// 不変条件: f(i-1) == false、f(j) == true。
	i, j := 0, n
```

探す範囲を `[i, j)`（`i` 以上 `j` 未満）とし、最初は `[0, n)` です。
コメントにある **不変条件**（ループの間ずっと成り立つ約束）は「`f(i-1)` は `false`、`f(j)` は `true`」です。範囲の外側について、`f(-1) = false`、`f(n) = true` と「みなす」ことで、最初から約束が成り立つようにしています。

### 2. 真ん中で判定する

```go:line-numbers=62
	for i < j {
		h := int(uint(i+j) >> 1) // h を計算するときのオーバーフローを避ける
		// i ≤ h < j
		if !f(h) {
			i = h + 1 // f(i-1) == false を保つ
		} else {
			j = h // f(j) == true を保つ
		}
	}
```

`a = [1, 3, 5, 7]`、条件 `a[i] >= 5` で追います。

- `i=0, j=4` → `h=2`。`a[2]=5 >= 5` は `true` なので `j=2`
- `i=0, j=2` → `h=1`。`a[1]=3` は `false` なので `i=2`
- `i=2, j=2` でループ終了

`false` なら答えは `h` より右なので `i = h + 1`、`true` なら `h` 自身が答えかもしれないので `j = h` にします。どちらでも約束は保たれます。

### 3. 答え

```go:line-numbers=72
	return i
```

`i == j` になったとき、約束から「`f(i-1)` は `false`、`f(i)` は `true`」なので、`i` こそが境目です。

## ここがすごい

- **オーバーフロー対策**: `uint(i+j) >> 1` は、`i+j` が `int` の最大値を超えても正しい真ん中を求めるための書き方です。符号なしで扱えば 1 ビット分余裕があるからです。ふつうの `(i+j)/2` は、巨大な配列で負の数になるバグが有名です（かつて Java の標準ライブラリでも見つかりました）。
- **不変条件をコメントに書いている**: 「なぜ正しいか」がコメントだけで追えます。二分探索は境界の ±1 を間違えやすいので、こうした書き方はとても参考になります。
- **データ構造を知らない汎用性**: 配列を受け取るのではなく「位置を受け取って判定する関数」を受け取るので、スライスでも、計算で決まる値でも、ファイル上のデータでも探せます。「平方根の整数部分を求める」といった探索にも使えます。

## まとめ

- 二分探索は「false と true の境目を探す」と考えると、境界条件を間違えにくい。
- ループの不変条件を決め、それを保つように範囲を更新すると、正しさを説明できる。
- 真ん中を求めるときは `(i+j)/2` のオーバーフローに注意する。
- 判定を関数として受け取ると、探索をどんなデータにも使える。
