---
title: "正または負の無限大を作る math.Inf"
description: "math.Inf は、正または負の無限大を表す float64 を返します。符号の値によって、無限大のビットパターンを選び、それをそのまま浮動小数点数として読みます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/bits.go"
lines: [20, 28]
function: "Inf"
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 標準ライブラリ]
---

## ひとことで

`math.Inf(1)` は正の無限大、`math.Inf(-1)` は負の無限大を返します。大きすぎる値や、範囲の外の値を表すときに使われます。

## コード

```go:line-numbers=20
func Inf(sign int) float64 {
	var v uint64
	if sign >= 0 {
		v = uvinf
	} else {
		v = uvneginf
	}
	return Float64frombits(v)
}
```

## 前提知識

- **無限大**: 浮動小数点数で、限りなく大きい値を表します。指数部がすべて 1 で、仮数部が 0 のビットの並びです。
- **符号ビット**: 最上位のビットです。正の無限大と負の無限大は、この 1 つのビットだけが違います。
- **`uvinf` と `uvneginf`**: 正と負の無限大のビットパターンを、あらかじめ定数にしたものです。
- **`Float64frombits`**: ビットの並びを、そのまま `float64` として読みます。

## 何をしているか

### 1. 符号で定数を選ぶ

```go:line-numbers=21
	var v uint64
	if sign >= 0 {
		v = uvinf
	} else {
		v = uvneginf
	}
```

`sign` が 0 以上なら正の無限大、そうでなければ負の無限大のビットパターンを選びます。

### 2. ビットを浮動小数点数として読む

```go:line-numbers=27
	return Float64frombits(v)
```

選んだビットを `Float64frombits` で `float64` に変えます。計算はしていないので、無限大の値がそのまま得られます。

## ここがすごい

- **計算なしで作れる**: 割り算などで無限大を作るより、ビットを直接書く方が確実で速いです。
- **符号の違いが 1 ビット**: 正と負の違いが、符号ビットだけであることを、定数の形が示しています。
- **範囲の外を表せる**: 大きすぎる値を、誤りの印として扱えます。

## まとめ

- 符号によって、正か負の無限大のビットパターンを選ぶ。
- そのビットを `float64` として読むと、無限大が得られる。
- 計算せずにビットで作るので、確実で速い。
