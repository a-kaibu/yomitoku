---
title: "2 乗すると溢れる大きな数でも、直角三角形の斜辺を求める"
description: "math.Hypot は、直角三角形の斜辺の長さ sqrt(p² + q²) を求めます。2 乗を先にすると大きな値で溢れるので、大きいほうで割ってから計算する、という順番の工夫がされています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/hypot.go"
lines: [27, 44]
function: "hypot"
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`math.Hypot(p, q)` は、直角三角形の 2 つの辺 `p`、`q` から斜辺の長さ `sqrt(p*p + q*q)` を返します。`Hypot(3, 4)` は `5` です。

素直に `math.Sqrt(p*p + q*q)` と書くと、`p` や `q` が 10^200 のような大きな値のとき、2 乗が `float64` の範囲を超えて無限大になってしまいます。この関数は、その問題を避けるように式を組み立てています。

## コード

::: code-group

```go:line-numbers=27 [日本語訳]
func hypot(p, q float64) float64 {
	p, q = Abs(p), Abs(q)
	// 特別なケース
	switch {
	case IsInf(p, 1) || IsInf(q, 1):
		return Inf(1)
	case IsNaN(p) || IsNaN(q):
		return NaN()
	}
	if p < q {
		p, q = q, p
	}
	if p == 0 {
		return 0
	}
	q = q / p
	return p * Sqrt(1+q*q)
}
```

```go:line-numbers=27 [原文]
func hypot(p, q float64) float64 {
	p, q = Abs(p), Abs(q)
	// special cases
	switch {
	case IsInf(p, 1) || IsInf(q, 1):
		return Inf(1)
	case IsNaN(p) || IsNaN(q):
		return NaN()
	}
	if p < q {
		p, q = q, p
	}
	if p == 0 {
		return 0
	}
	q = q / p
	return p * Sqrt(1+q*q)
}
```

:::

## 前提知識

- **`float64` の範囲**: 浮動小数点数は、非常に大きな値も表せますが、上限があります。上限を超えると無限大（`Inf`）になります。
- **直角三角形の斜辺**: 直角をはさむ 2 辺が `p`、`q` のとき、斜辺は `√(p² + q²)` です。
- **`Sqrt`**: 平方根を求める関数です。
- **無限大と NaN**: `IsInf` は無限大かを、`IsNaN` は「数ではない値」かを調べます。どちらも特別な値として扱う必要があります。

## 何をしているか

### 1. 符号を取り除き、特別な値を先に処理する

```go:line-numbers=28
	p, q = Abs(p), Abs(q)
```

長さは正の値として扱うので、絶対値を取ります。

```go:line-numbers=29
	// special cases
```

無限大や NaN の入力は、ここで先に答えを返します。

### 2. 大きいほうを p にそろえる

```go:line-numbers=36
	if p < q {
		p, q = q, p
	}
```

`p` を大きいほうにそろえます。例えば `p = 3`、`q = 4` なら、入れ替えて `p = 4`、`q = 3` になります。

### 3. 比率に直して計算する

```go:line-numbers=42
	q = q / p
	return p * Sqrt(1+q*q)
```

`q = 3/4 = 0.75` にしてから、`4 * √(1 + 0.75²) = 4 * √1.5625 = 4 * 1.25 = 5` と計算します。`q/p` は必ず 1 以下なので、`q*q` が溢れることはありません。

## ここがすごい

- **比率にすると溢れない**: 大きな `p` と `q` を直接 2 乗すると溢れますが、`q/p` は 0 から 1 の間に収まります。その比率を 2 乗しても、安全な範囲のままです。
- **小さい値の精度も保つ**: 大きいほうに揃えてから計算するので、小さな値を足し込んで情報を失うことが少なくなります。
- **特別な値を先に処理**: 無限大や NaN を、普通の計算に入れる前に返しています。計算の途中で NaN が広がるのを防ぐ、安全な書き方です。

## まとめ

- 2 乗してから平方根を取る式は、大きな値で溢れることがある。
- 大きいほうで割って比率にすると、溢れずに同じ答えを求められる。
- 特別な値は、計算の前に先に処理すると安全。
