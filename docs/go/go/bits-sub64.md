---
title: "借りを 1 つずつ、ビットだけで求める 64 ビットの引き算"
description: "math/bits の Sub64 は、x − y − 借り を計算し、差と、上の桁からの借り（0 か 1）を返します。最上位ビットの組み合わせだけで借りを判定し、if を使いません。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2017 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/bits/bits.go"
lines: [431, 436]
function: "Sub64"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`bits.Sub64(x, y, borrow)` は、64 ビットの引き算 `x - y - borrow` の結果と、さらに上の桁へ借りが出たかを返します。`borrow` は、下の桁からの借りで、0 か 1 です。

64 ビットより大きな数を引き算するとき、下の桁から順に借りを渡していくために使われます。

## コード

::: code-group

```go:line-numbers=431 [日本語訳]
func Sub64(x, y, borrow uint64) (diff, borrowOut uint64) {
	diff = x - y - borrow
	// ビットの計算は Sub32 を参照。
	borrowOut = ((^x & y) | (^(x ^ y) & diff)) >> 63
	return
}
```

```go:line-numbers=431 [原文]
func Sub64(x, y, borrow uint64) (diff, borrowOut uint64) {
	diff = x - y - borrow
	// See Sub32 for the bit logic.
	borrowOut = ((^x & y) | (^(x ^ y) & diff)) >> 63
	return
}
```

:::

## 前提知識

- **借り（borrow）**: 筆算で、下の桁が足りないときに上の桁から 1 を借りる仕組みです。`10 - 1` の計算で、一の位が足りないときに十の位から借りるのと同じです。
- **符号なしの引き算のあふれ**: `uint64` の引き算で `x < y` になると、結果は 2 の 64 乗から引いた値になります（折り返し）。
- **`^x`**: ビットをすべて反転します。
- **`^(x ^ y)`**: `x` と `y` が同じ桁なら 1、違えば 0 になるビットです。

## 何をしているか

`x = 0`、`y = 1`、`borrow = 0` で追います。0 から 1 を引くと、上の桁から借りが出るはずです。

### 1. 差を計算する

```go:line-numbers=432
	diff = x - y - borrow
```

`0 - 1` は折り返して、すべてのビットが 1 の値になります。この段階では、借りが出たかはまだ分かりません。

### 2. 最上位ビットで借りを判定する

```go:line-numbers=434
	borrowOut = ((^x & y) | (^(x ^ y) & diff)) >> 63
```

最上位ビット（63 番目）だけを見ます。`x` の最上位が 0、`y` の最上位が 1 なら、借りは必ず出ます。`x` と `y` が同じで、差の最上位が 1 のときも借りが出ています。この 2 つの場合を OR でまとめ、`>> 63` で最上位ビットを下に降ろすと、借りの 0 か 1 が得られます。

`x = 0`、`y = 1` では、借りが出るので `borrowOut = 1` になります。

## ここがすごい

- **分岐のない判定**: `if x < y` と書けば、借りの有無は分かります。しかし、借り（`borrow`）を含めた計算は条件が複雑になります。ビット演算の 1 行で、その場合も含めて正しく判定できます。
- **加算の対になる関数**: コメントが示すとおり、`Sub32` と同じ論理で書かれています。`Add64` が繰り上がりを、`Sub64` が借りを扱い、2 つを組み合わせると多倍長の計算ができます。
- **64 ビットずつ連鎖できる**: 下の桁の `borrowOut` を次の桁の `borrow` に渡せば、128 ビットや 256 ビットの引き算が作れます。

## まとめ

- 借りは、最上位ビットの組み合わせだけで判定できる。
- 分岐なしで借りを判定すると、借りを含めた式でも正しく動く。
- 繰り上がりと借りの関数を組み合わせれば、大きな整数の計算ができる。
