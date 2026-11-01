---
title: "仮数と指数に分ける math.frexp"
description: "math.frexp は、小数を 0.5 以上 1 未満の仮数と、2 の累乗の指数に分けます。浮動小数点数のビットの指数部分を書き換えて、仮数だけを取り出します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/frexp.go"
lines: [24, 39]
function: "frexp"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 標準ライブラリ]
---

## ひとことで

`math.Frexp(8)` は、`0.5` と `4` を返します。`0.5 × 2^4 = 8` になるように、数を仮数と指数に分けます。浮動小数点数の中身を直接いじる、ビット操作の例です。

## コード

::: code-group

```go:line-numbers=24 [日本語訳]
func frexp(f float64) (frac float64, exp int) {
	// 特殊な値を先に処理する。
	switch {
	case f == 0:
		return f, 0 // -0 もそのまま正しく返す。
	case IsInf(f, 0) || IsNaN(f):
		return f, 0
	}
	f, exp = normalize(f)
	x := Float64bits(f)
	exp += int((x>>shift)&mask) - bias + 1
	x &^= mask << shift
	x |= (-1 + bias) << shift
	frac = Float64frombits(x)
	return
}
```

```go:line-numbers=24 [原文]
func frexp(f float64) (frac float64, exp int) {
	// special cases
	switch {
	case f == 0:
		return f, 0 // correctly return -0
	case IsInf(f, 0) || IsNaN(f):
		return f, 0
	}
	f, exp = normalize(f)
	x := Float64bits(f)
	exp += int((x>>shift)&mask) - bias + 1
	x &^= mask << shift
	x |= (-1 + bias) << shift
	frac = Float64frombits(x)
	return
}
```

:::

## 前提知識

- **浮動小数点数の形**: 64 ビットの `float64` は、符号、指数部、仮数部に分かれています。指数部は、2 の何乗かを表します。
- **`Float64bits`**: 浮動小数点数の bit の並びを、そのまま `uint64` として見ます。
- **ビットマスク**: `&` と `|` で、特定の範囲のビットだけを取り出したり、書き換えたりします。
- **`normalize`**: 0 に近い非正規化数を、通常の形に直します。

## 何をしているか

### 1. 特別な値を先に返す

```go:line-numbers=26
	switch {
	case f == 0:
		return f, 0 // -0 もそのまま正しく返す。
	case IsInf(f, 0) || IsNaN(f):
		return f, 0
	}
```

0、無限大、NaN は、指数に分ける意味がありません。0 は `frac` が 0 で、指数も 0 とします。`-0` は、符号を保ったまま返します。

### 2. 指数を取り出す

```go:line-numbers=32
	f, exp = normalize(f)
	x := Float64bits(f)
	exp += int((x>>shift)&mask) - bias + 1
```

`normalize` で、数を通常の形にそろえます。その指数部のビットを取り出し、バイアスを引いて、`exp` に加えます。`+1` は、仮数を 0.5 以上 1 未満に収めるための補正です。

### 3. 指数部を書き換えて仮数にする

```go:line-numbers=35
	x &^= mask << shift
	x |= (-1 + bias) << shift
	frac = Float64frombits(x)
```

指数部のビットを一度消し、代わりに「バイアス − 1」を入れます。すると、値は 0.5 以上 1 未満の数になります。仮数部のビットはそのままなので、有効な桁は変わりません。最後に `Float64frombits` で、数に戻します。

## ここがすごい

- **数を作り直さない**: 割り算や `Log` を使わずに、ビットの書き換えだけで仮数を作ります。速く、誤差も入りにくくなります。
- **指数を別に返す**: 仮数と指数を組にして返すので、呼び出し側は元の数を正確に組み立て直せます。
- **特別な値を分けて考える**: 0 や無限大は、ビットの規則が通用しないので、先に分けて扱っています。

## まとめ

- 0、無限大、NaN は先に処理して返す。
- 指数部のビットから指数を取り出し、指数部を書き換えて仮数を作る。
- 仮数と指数を返すので、元の数を正確に組み立て直せる。
