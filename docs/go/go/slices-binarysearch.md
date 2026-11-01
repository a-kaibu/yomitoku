---
title: "「目標以上の最初の位置」を探す二分探索。等しいかも一度に判定する"
description: "slices.BinarySearch は、整列されたスライスから目標の値を探します。見つかった位置と、本当に一致したかの 2 つを返します。不変条件をコメントで示した、正しさを追いやすい実装です。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2023 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/sort.go"
lines: [126, 143]
function: "BinarySearch"
difficulty: 3
format: 2
tags: [探索, アルゴリズム, ジェネリクス, 標準ライブラリ]
---

## ひとことで

`slices.BinarySearch(x, target)` は、昇順に並んだスライス `x` の中で、`target` 以上の値が最初に現れる位置を返します。そして、その位置の値が `target` と等しいかも、2 つ目の戻り値で教えてくれます。

`x = [1, 3, 5, 7]` で `target = 5` なら、位置 `2` と `true` を返します。

## コード

::: code-group

```go:line-numbers=126 [日本語訳]
func BinarySearch[S ~[]E, E cmp.Ordered](x S, target E) (int, bool) {
	// インライン化したほうが、無名関数で BinarySearchFunc を呼ぶより速い。
	n := len(x)
	// x[-1] < target、x[n] >= target と定義する。
	// 不変条件: x[i-1] < target、x[j] >= target。
	i, j := 0, n
	for i < j {
		h := int(uint(i+j) >> 1) // h を計算するときに溢れないようにする。
		// i ≤ h < j
		if cmp.Less(x[h], target) {
			i = h + 1 // x[i-1] < target を保つ
		} else {
			j = h // x[j] >= target を保つ
		}
	}
	// i == j、x[i-1] < target、x[j]（= x[i]）>= target なので、答えは i。
	return i, i < n && (x[i] == target || (isNaN(x[i]) && isNaN(target)))
}
```

```go:line-numbers=126 [原文]
func BinarySearch[S ~[]E, E cmp.Ordered](x S, target E) (int, bool) {
	// Inlining is faster than calling BinarySearchFunc with a lambda.
	n := len(x)
	// Define x[-1] < target and x[n] >= target.
	// Invariant: x[i-1] < target, x[j] >= target.
	i, j := 0, n
	for i < j {
		h := int(uint(i+j) >> 1) // avoid overflow when computing h
		// i ≤ h < j
		if cmp.Less(x[h], target) {
			i = h + 1 // preserves x[i-1] < target
		} else {
			j = h // preserves x[j] >= target
		}
	}
	// i == j, x[i-1] < target, and x[j] (= x[i]) >= target  =>  answer is i.
	return i, i < n && (x[i] == target || (isNaN(x[i]) && isNaN(target)))
}
```

:::

## 前提知識

- **二分探索**: 並んだデータの真ん中を見て、探す値が左右どちらにあるかを決めて、範囲を半分にしていく方法です。
- **`cmp.Ordered`**: 大小を比べられる型（整数、浮動小数点数、文字列など）を表す制約です。
- **不変条件**: ループのあいだずっと成り立つ約束です。ここでは `x[i-1] < target` と `x[j] >= target` が、範囲の両端で保たれます。
- **NaN**: 浮動小数点数の「数ではない値」です。普通の比較では `NaN == NaN` は偽になるので、特別に扱います。

## 何をしているか

`x = [1, 3, 5, 7]`、`target = 5` で追います。

### 1. 範囲を半分にする

```go:line-numbers=132
	for i < j {
		h := int(uint(i+j) >> 1) // h を計算するときに溢れないようにする。
		// i ≤ h < j
		if cmp.Less(x[h], target) {
			i = h + 1 // x[i-1] < target を保つ
		} else {
			j = h // x[j] >= target を保つ
		}
	}
```

最初は `i = 0`、`j = 4` です。`h = 2` で `x[2] = 5` を見ます。`5 < 5` は偽なので、`j = 2` にします。次は `h = 1` で `x[1] = 3` を見ます。`3 < 5` は真なので、`i = 2` にします。`i == j` になってループが終わります。

### 2. 答えと一致の判定

```go:line-numbers=142
	return i, i < n && (x[i] == target || (isNaN(x[i]) && isNaN(target)))
```

`i = 2` の位置の値は `5` で、`target` と等しいので、`true` を返します。`i < n` を先に調べるのは、`i` が範囲の外のとき `x[i]` を読まないためです。

## ここがすごい

- **不変条件で正しさを示せる**: 各行のコメントには、ループの中で保たれる約束が書かれています。範囲をどう動かしても約束が崩れないので、ループが終わったときの `i` が答えだと言えます。
- **インライン化を優先**: コメントのとおり、無名関数で `BinarySearchFunc` を呼ぶより、ここに直接書いたほうが速いです。小さな関数を速くするための、実用的な判断です。
- **NaN を含むデータにも対応**: `x[i] == target` だけでは、NaN が一致と判定されません。両方が NaN のときを特別に扱うことで、整列の性質を保ったまま一致を判定できます。

## まとめ

- 二分探索では、ループの約束（不変条件）をコメントで書くと、正しさを追いやすい。
- 「等しいか」は、見つけた位置を使って最後に 1 回だけ確かめる。
- 小さな関数は、呼び出しを省いて直接書くと速くなることがある。
