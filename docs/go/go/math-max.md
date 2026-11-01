---
title: "NaN と無限大と −0 を、先に特別扱いしてから大きいほうを返す max"
description: "math.Max は 2 つの浮動小数点数のうち大きいほうを返します。無限大、NaN、+0 と −0 の違いといった、比較だけでは扱えない場合を、先に switch で処理しています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/dim.go"
lines: [47, 64]
function: "max"
difficulty: 2
format: 2
tags: [数値計算, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`math.Max(x, y)` は、`x` と `y` のうち大きいほうを返します。`Max(3, 5)` は `5` です。

浮動小数点数には、無限大や NaN（数ではない値）があるので、ふつうの `>` だけでは正しい答えが出ません。この関数は、それらの場合を先に決めてから、普通の比較をしています。

## コード

::: code-group

```go:line-numbers=47 [日本語訳]
func max(x, y float64) float64 {
	// 特別なケース
	switch {
	case IsInf(x, 1) || IsInf(y, 1):
		return Inf(1)
	case IsNaN(x) || IsNaN(y):
		return NaN()
	case x == 0 && x == y:
		if Signbit(x) {
			return y
		}
		return x
	}
	if x > y {
		return x
	}
	return y
}
```

```go:line-numbers=47 [原文]
func max(x, y float64) float64 {
	// special cases
	switch {
	case IsInf(x, 1) || IsInf(y, 1):
		return Inf(1)
	case IsNaN(x) || IsNaN(y):
		return NaN()
	case x == 0 && x == y:
		if Signbit(x) {
			return y
		}
		return x
	}
	if x > y {
		return x
	}
	return y
}
```

:::

## 前提知識

- **NaN**: 「数ではない値」です。NaN と比べると、`<` も `>` もすべて偽になります。
- **+0 と −0**: 浮動小数点数には、符号の違う 0 が 2 つあります。比べると等しいですが、符号ビットが違います。
- **`Signbit`**: 符号ビットが立っているかを返す関数です。
- **無限大**: `Inf(1)` は正の無限大、`Inf(-1)` は負の無限大です。

## 何をしているか

### 1. 特別な値を先に決める

```go:line-numbers=48
	// special cases
	switch {
	case IsInf(x, 1) || IsInf(y, 1):
		return Inf(1)
	case IsNaN(x) || IsNaN(y):
		return NaN()
```

どちらかが正の無限大なら、結果は正の無限大です。どちらかが NaN なら、結果は NaN です。NaN を比較の結果に任せると、どちらが大きいか決められません。

### 2. 0 の符号を選ぶ

```go:line-numbers=54
	case x == 0 && x == y:
		if Signbit(x) {
			return y
		}
		return x
```

`x` と `y` がともに 0 のとき、`+0` を優先して返します。`x` が `−0` なら `y` を返します。`y` が `+0` ならそちらが選ばれます。

### 3. 普通の比較

```go:line-numbers=60
	if x > y {
		return x
	}
	return y
```

特別な場合でなければ、大きいほうを返すだけです。`Max(3, 5)` は `5` です。

## ここがすごい

- **特別な場合を先に片付ける**: 比較の前に、無限大・NaN・0 を処理するので、最後の `if` は単純で済みます。
- **+0 を優先する理由**: `Max(−0, +0)` と `Max(+0, −0)` が同じ結果になるように決めています。どちらの順番で呼んでも結果が変わらないので、扱いやすくなります。
- **NaN を伝播させる**: NaN が 1 つでも入れば NaN を返します。誤った大きい値が、黙って結果になることを防げます。

## まとめ

- 浮動小数点数の比較は、無限大と NaN を先に決めてから行う。
- 0 の符号は、呼び出し順に依らないように決めておく。
- 特別な値を黙って通さないことで、計算の誤りが見つけやすくなる。
