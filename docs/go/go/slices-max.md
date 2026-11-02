---
title: "並びの最大値を返す slices.Max。空の並びは panic で止める"
description: "slices パッケージの Max。順序を持つ型の並びから、最大の値を返す。先頭の値を仮の最大値にして、残りを 1 つずつ比べる。空の並びのときは panic を起こす。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2023 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/slices/sort.go"
lines: [95, 104]
function: "Max"
difficulty: 1
tags: [型システム, ジェネリクス, 防御的プログラミング]
---

## ひとことで

`slices.Max(x)` は、並びの中で最も大きい値を返します。例えば `[3, 9, 4]` なら `9` を返します。

この関数は、ジェネリクスで書かれているので、整数でも、文字列でも、順序を比べられる型なら同じ関数で使えます。

## コード

```go:line-numbers=95
func Max[S ~[]E, E cmp.Ordered](x S) E {
	if len(x) < 1 {
		panic("slices.Max: empty list")
	}
	m := x[0]
	for i := 1; i < len(x); i++ {
		m = max(m, x[i])
	}
	return m
}
```

## 前提知識

- **ジェネリクス**: 型を後から決められる書き方です。`E cmp.Ordered` は、比べられる順序を持つ型であることを表します。
- **`cmp.Ordered`**: `<` と `>` で比べられる型の集まりです。整数、浮動小数点数、文字列などが含まれます。
- **`max` 組み込み関数**: 2 つの値のうち、大きい方を返す組み込みの関数です。
- **panic**: 不正な状態のときに、プログラムを止める仕組みです。

## 何をしているか

### 1. 空の並びを止める

```go:line-numbers=96
	if len(x) < 1 {
		panic("slices.Max: empty list")
	}
```

並びの中に値がなければ、最大値は存在しません。`panic` で止めて、呼び出し側の誤りを知らせます。

### 2. 先頭を仮の最大値にする

```go:line-numbers=99
	m := x[0]
```

先頭の要素を、いったん最大値 `m` として採用します。この時点で、`m` は 1 つだけの並びの中の最大値です。

### 3. 残りと比べて更新する

```go:line-numbers=100
	for i := 1; i < len(x); i++ {
		m = max(m, x[i])
	}
	return m
```

2 番目の要素から末尾まで、1 つずつ `m` と比べます。大きい方を新しい `m` にして、最後に残った `m` を返します。

## ここがすごい

- **1 回の走査で終わる**: 並びを先頭から一度だけ見ます。ソートをしなくても、最大値は速く決まります。
- **型を選ばない**: ジェネリクスのおかげで、型ごとに同じ関数を書く必要がありません。型の安全も、コンパイル時に確かめられます。
- **空の場合を明示**: 答えがない場合を `panic` で早く知らせるので、原因を見つけやすい設計です。

## まとめ

- `Max` は、順序を持つ型の並びから、最大値を 1 回の走査で返します。
- 先頭を仮の最大値にして、残りと比べて更新します。
- 空の並びは `panic` で止まります。
