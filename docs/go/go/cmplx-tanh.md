---
title: "複素数の双曲線正接 cmplx.Tanh。実部と虚部を分けて計算する"
description: "複素数の双曲線正接 cmplx.Tanh。実部と虚部の三角関数と双曲線関数を組み合わせた式で、分母が 0 になる場合を先に処理しながら、無限大や NaN の入力を正しく扱う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/cmplx/tan.go"
lines: [96, 112]
function: "Tanh"
difficulty: 3
tags: [数値計算, 型システム, 防御的プログラミング]
---

## ひとことで

`cmplx.Tanh(x)` は、複素数 `x` の双曲線正接（`tanh`）を返します。複素数は、実部と虚部の 2 つの実数からなる値です。実数の `tanh` と同じ形の結果を、複素数の上で求めます。

この関数は、実部と虚部を別々に取り出し、三角関数と双曲線関数の組み合わせで答えを作ります。無限大や NaN の入力にも、結果が意味を持つように処理しています。

## コード

```go:line-numbers=96
func Tanh(x complex128) complex128 {
	switch re, im := real(x), imag(x); {
	case math.IsInf(re, 0):
		switch {
		case math.IsInf(im, 0) || math.IsNaN(im):
			return complex(math.Copysign(1, re), math.Copysign(0, im))
		}
		return complex(math.Copysign(1, re), math.Copysign(0, math.Sin(2*im)))
	case im == 0 && math.IsNaN(re):
		return x
	}
	d := math.Cosh(2*real(x)) + math.Cos(2*imag(x))
	if d == 0 {
		return Inf()
	}
	return complex(math.Sinh(2*real(x))/d, math.Sin(2*imag(x))/d)
}
```

## 前提知識

- **複素数**: `a + bi` の形の数で、`a` が実部、`b` が虚部です。Go では `complex128` 型で表します。
- **双曲線関数**: `sinh`、`cosh` などの、指数関数から作られる関数です。`tanh` は `sinh / cosh` にあたります。
- **`math.Copysign`**: 大きさを第 1 引数、符号を第 2 引数から取った値を作る関数です。無限大や 0 の符号を正しく保つのに使います。
- **無限大と NaN**: 計算の結果が大きすぎる、または意味がないときに現れる特別な値です。

## 何をしているか

### 1. 分母を作る

```go:line-numbers=107
	d := math.Cosh(2*real(x)) + math.Cos(2*imag(x))
	if d == 0 {
		return Inf()
	}
```

結果の分母は、`cosh(2a) + cos(2b)` です。これが 0 になると、結果が定まらないので、無限大を返します。

### 2. 実部と虚部の式で答えを作る

```go:line-numbers=111
	return complex(math.Sinh(2*real(x))/d, math.Sin(2*imag(x))/d)
```

実部は `sinh(2a)/d`、虚部は `sin(2b)/d` です。2 つの値を `complex` で組み合わせて、複素数の結果にします。

## ここがすごい

- **2 倍の角で式を揃える**: `2a` や `2b` を使うことで、分母が 2 つの項の和になります。式が短くなり、共通の `d` で両方を割れます。
- **分母だけを確かめる**: 分子の計算より前に分母の 0 を見つけるので、0 による割り算を避けられます。
- **無限大や NaN は別の分岐で処理**: 上の部分で、入力が無限大や NaN のときは、符号を保った結果を先に返します。この関数の後半は、有限の値だけを扱います。

## まとめ

- `Tanh` は、複素数の双曲線正接を、実部と虚部の式で求めます。
- 分母 `cosh(2a) + cos(2b)` が 0 のときは、無限大を返します。
- 分子は、実部が `sinh`、虚部が `sin` になります。
- 無限大や NaN の入力は、先頭の分岐で符号を保って処理します。
