---
title: "複素数の余接 cmplx.Cot。分母が小さいときは級数に切り替える"
description: "複素数の余接 cmplx.Cot。分母が 0 に近いときは、そのままの式では精度が落ちるので、級数の計算に切り替える。分母が 0 のときは無限大を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/cmplx/tan.go"
lines: [288, 297]
function: "Cot"
difficulty: 3
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`cmplx.Cot(x)` は、複素数の余接（`cot`、`1 / tan` にあたる値）を返します。通常の式で計算しますが、分母がほぼ 0 になると、有効な桁が失われてしまいます。そこでこの関数は、そのような近い場所だけ、別の方法（級数）を使います。

## コード

```go:line-numbers=288
func Cot(x complex128) complex128 {
	d := math.Cosh(2*imag(x)) - math.Cos(2*real(x))
	if math.Abs(d) < 0.25 {
		d = tanSeries(x)
	}
	if d == 0 {
		return Inf()
	}
	return complex(math.Sin(2*real(x))/d, -math.Sinh(2*imag(x))/d)
}
```

## 前提知識

- **余接（cot）**: `cos / sin` の値です。`tan` の逆数にあたります。
- **桁落ち**: 2 つのほぼ同じ値を引くと、有効な桁が減る現象です。分母の計算で起きやすく、結果の精度が落ちます。
- **級数**: 値をたくさんの項の和として表す展開です。0 に近い場所では、少ない項で正しい値に近づけます。
- **`tanSeries`**: この関数の中で使われる、級数を計算する関数です。この記事では内部の計算は省きます。

## 何をしているか

### 1. 分母を作る

```go:line-numbers=289
	d := math.Cosh(2*imag(x)) - math.Cos(2*real(x))
	if math.Abs(d) < 0.25 {
		d = tanSeries(x)
	}
```

分母 `d` は、`cosh(2b) - cos(2a)` です。`d` の絶対値が 0.25 より小さいと、2 つの値がほぼ同じになっていて、桁落ちが起きやすくなります。そのときは、`tanSeries` で `d` を求め直します。

### 2. 分母が 0 なら無限大

```go:line-numbers=293
	if d == 0 {
		return Inf()
	}
```

分母が完全に 0 なら、余接は定義できません。無限大を返します。

### 3. 実部と虚部の式で答えを作る

```go:line-numbers=296
	return complex(math.Sin(2*real(x))/d, -math.Sinh(2*imag(x))/d)
```

実部は `sin(2a)/d`、虚部は `-sinh(2b)/d` です。虚部の符号がマイナスなのが、余接の式の特徴です。

## ここがすごい

- **桁落ちの場所だけ切り替える**: 普段は短い式で計算し、精度が落ちる一部だけ級数に任せます。速さと精度を両立させています。
- **分母の 0 を 2 段階で扱う**: 0 に近い場合は級数で補正し、完全な 0 は無限大にします。値の状態を、丁寧に分けています。
- **数学の式をそのまま書く**: 分母と分子の式は、教科書の余接の式と同じ形です。読み手が式と照らし合わせやすい形です。

## まとめ

- `Cot` は、複素数の余接を、分母と分子の式で求めます。
- 分母が 0.25 より小さい絶対値なら、級数で求め直して桁落ちを防ぎます。
- 分母が 0 のときは、無限大を返します。
- 虚部の式の符号が、余接の特徴です。
