---
title: "ヒープの親を下へ沈める sort.siftDown_func。並べ替えの心臓部"
description: "sort パッケージの堅牢なソートで使われる siftDown。配列を木とみなし、親より子が大きければ入れ替えながら下へ沈めていく。ヒープソートの中心の操作。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2022 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/sort/zsortfunc.go"
lines: [20, 36]
function: "siftDown_func"
difficulty: 3
tags: [ソート, アルゴリズム, データ構造]
---

## ひとことで

`siftDown_func(data, lo, hi, first)` は、配列の一部を **ヒープ（親が子より大きい木）** の形に直すときに使う関数です。根の値を、子と比べながら、大きいほうと入れ替えて下へ沈めます。

Go の `sort.Sort` は、状況によって「ヒープソート」に切り替えて、最悪でも `O(n log n)` で終わるようにしています。その中で、この関数が木の形を保つ役目を果たしています。

## コード

```go:line-numbers=20
func siftDown_func(data lessSwap, lo, hi, first int) {
	root := lo
	for {
		child := 2*root + 1
		if child >= hi {
			break
		}
		if child+1 < hi && data.Less(first+child, first+child+1) {
			child++
		}
		if !data.Less(first+root, first+child) {
			return
		}
		data.Swap(first+root, first+child)
		root = child
	}
}
```

## 前提知識

- **ヒープ**: 木の形をした配列で、親は子より大きい（または小さい）という約束があるデータ構造です。配列の番号 `i` の子は `2i+1` と `2i+2` にあります。
- **`lessSwap`**: `Less(i, j)` で比較し、`Swap(i, j)` で入れ替える操作をまとめた型です。どんな並べ替え対象でも、この 2 つだけで扱えます。
- **`lo`、`hi`、`first`**: `lo` は木の中での根の番号、`hi` は木の要素数、`first` は配列の先頭からのずれです。ヒープを配列の一部に作るために使われます。
- **沈める（sift down）**: 根の値が小さすぎるとき、子の中で大きいものと入れ替え、その子を新しい根として同じ操作を続けることです。

## 何をしているか

### 1. 左の子を求める

```go:line-numbers=23
			child := 2*root + 1
			if child >= hi {
				break
			}
```

`root` の左の子は `2*root + 1` です。その番号が `hi` 以上なら、子が存在しないので、沈める作業は終わりです。

### 2. 大きいほうの子を選ぶ

```go:line-numbers=27
			if child+1 < hi && data.Less(first+child, first+child+1) {
				child++
			}
```

右の子があれば、左の子と比べます。`Less` が真なら、左より右の子のほうが大きいので、右を選ぶために `child` を 1 つ増やします。

### 3. 根が大きければ止まる

```go:line-numbers=30
			if !data.Less(first+root, first+child) {
				return
			}
```

根が子より小さくなければ、もうヒープの約束は守られています。そこで終わります。

### 4. 入れ替えて下へ進む

```go:line-numbers=33
			data.Swap(first+root, first+child)
			root = child
```

根と大きい子を入れ替えます。次は、入れ替えた後の子の位置を新しい根として、同じ処理を繰り返します。

## ここがすごい

- **1 本の道だけをたどる**: 沈める処理は、根から葉までの 1 本の道をたどるだけです。木の全体を見直さないので、`O(log n)` で終わります。
- **比較と入れ替えを外に任せる**: `lessSwap` の形で受け取るので、同じコードが `[]int` にも、構造体のスライスにも使えます。`sort` パッケージは型を変えるたびに、このような生成されたコードで対応しています。
- **条件を早く抜ける**: 子がなくなったとき、根が十分大きいときに、すぐに抜けます。ほとんどの場合、途中で終わります。

## まとめ

- `siftDown_func` は、根を子と比べながら、ヒープの形に沈めます。
- 子のうち大きいほうを選び、根より大きければ入れ替えます。
- 1 本の道だけをたどるので、計算量は木の高さに比例します。
- ヒープソートの中心で、最悪の場合でも `O(n log n)` を保証する役目を果たします。
