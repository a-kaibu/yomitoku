---
title: "仮数と指数から数を組み立てる math.ldexp"
description: "math.ldexp は、仮数と 2 の累乗の指数から、浮動小数点数を組み立てます。指数部のビットを書き換えて、範囲の外のときは 0 や無限大に、極端に小さいときは非正規化数として扱います。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/ldexp.go"
lines: [22, 51]
function: "ldexp"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 標準ライブラリ]
---

## ひとことで

`math.Ldexp(0.5, 4)` は `8` を返します。`frexp` の逆の操作で、`frac × 2^exp` を求めます。浮動小数点数の指数部を、直接書き換えて計算します。

## コード

::: code-group

```go:line-numbers=22 [日本語訳]
func ldexp(frac float64, exp int) float64 {
	// 特殊な値を先に処理する。
	switch {
	case frac == 0:
		return frac // -0 もそのまま正しく返す。
	case IsInf(frac, 0) || IsNaN(frac):
		return frac
	}
	frac, e := normalize(frac)
	exp += e
	x := Float64bits(frac)
	exp += int(x>>shift)&mask - bias
	if exp < -1075 {
		return Copysign(0, frac) // アンダーフロー（0 に丸める）。
	}
	if exp > 1023 { // オーバーフロー（無限大）。
		if frac < 0 {
			return Inf(-1)
		}
		return Inf(1)
	}
	var m float64 = 1
	if exp < -1022 { // 非正規化数の扱い。
		exp += 53
		m = 1.0 / (1 << 53) // 2**-53
	}
	x &^= mask << shift
	x |= uint64(exp+bias) << shift
	return m * Float64frombits(x)
}
```

```go:line-numbers=22 [原文]
func ldexp(frac float64, exp int) float64 {
	// special cases
	switch {
	case frac == 0:
		return frac // correctly return -0
	case IsInf(frac, 0) || IsNaN(frac):
		return frac
	}
	frac, e := normalize(frac)
	exp += e
	x := Float64bits(frac)
	exp += int(x>>shift)&mask - bias
	if exp < -1075 {
		return Copysign(0, frac) // underflow
	}
	if exp > 1023 { // overflow
		if frac < 0 {
			return Inf(-1)
		}
		return Inf(1)
	}
	var m float64 = 1
	if exp < -1022 { // denormal
		exp += 53
		m = 1.0 / (1 << 53) // 2**-53
	}
	x &^= mask << shift
	x |= uint64(exp+bias) << shift
	return m * Float64frombits(x)
}
```

:::

## 前提知識

- **`frexp` との関係**: `frexp` は数を仮数と指数に分けます。`ldexp` は、その逆に、仮数と指数から数を組み立てます。
- **非正規化数**: 指数が最小の範囲を外れた、とても小さい数の表し方です。通常より精度が落ちます。
- **無限大**: 指数が最大を超えたときの値です。
- **`Copysign`**: 大きさを 0 にして、符号だけを元の値と同じにする関数です。

## 何をしているか

### 1. 特別な値を先に返す

```go:line-numbers=23
	// 特殊な値を先に処理する。
	switch {
	case frac == 0:
		return frac // -0 もそのまま正しく返す。
	case IsInf(frac, 0) || IsNaN(frac):
		return frac
	}
```

0、無限大、NaN は、指数を足しても意味が変わりません。そのまま返します。0 のときは符号も保ちます。

### 2. 指数を正規化して合わせる

```go:line-numbers=30
	frac, e := normalize(frac)
	exp += e
	x := Float64bits(frac)
	exp += int(x>>shift)&mask - bias
```

`normalize` で仮数を通常の形にそろえ、その分の指数 `e` を加えます。次に、仮数のビットから持っていた指数を取り出して、全体の指数に足します。

### 3. 範囲の外を処理する

```go:line-numbers=34
	if exp < -1075 {
		return Copysign(0, frac) // アンダーフロー（0 に丸める）。
	}
	if exp > 1023 { // オーバーフロー（無限大）。
		if frac < 0 {
			return Inf(-1)
		}
		return Inf(1)
	}
```

指数が非常に小さければ、0 に丸めます。大きすぎれば、無限大を返します。どちらでもないときは、次の処理へ進みます。

### 4. 非正規化数を扱う

```go:line-numbers=43
	var m float64 = 1
	if exp < -1022 { // 非正規化数の扱い。
		exp += 53
		m = 1.0 / (1 << 53) // 2**-53
	}
```

指数が通常の範囲より小さいときは、`m` に `2^-53` を用意し、指数を 53 だけ増やしておきます。最後に `m` を掛けて、精度を保ったまま小さい数を表します。

### 5. 指数部を書き換えて組み立てる

```go:line-numbers=48
	x &^= mask << shift
	x |= uint64(exp+bias) << shift
	return m * Float64frombits(x)
```

指数部のビットを消し、新しい指数を書き込みます。そのあと、`m` を掛けて、組み立てた値を返します。

## ここがすごい

- **指数の範囲を外しても正しく扱う**: 小さすぎる数は 0、大きすぎる数は無限大にして、誤った値を返しません。
- **精度を保つ工夫**: 非正規化数を、掛け算で表すことで、ビットの書き換えだけでは表せない範囲を扱います。
- **ビットで直接組み立てる**: 指数部のビットを書き換えるだけなので、対数や累乗を使わずに速く計算できます。

## まとめ

- 0、無限大、NaN は先に返す。
- 指数の範囲を外れたら、0 か無限大にする。
- 非正規化数は、`2^-53` を掛けて精度を保ちながら組み立てる。
