---
title: "大きな整数に別の数の倍を足す math/big の addMulVVWW_g"
description: "math/big の掛け算の部品 addMulVVWW_g。配列 y の各語に m を掛けて x の対応する語に足し、さらに桁上がり a を加える。1 語の計算を 2 語の結果に分けて扱う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/arith.go"
lines: [255, 268]
function: "addMulVVWW_g"
difficulty: 3
tags: [数値計算, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`addMulVVWW_g(z, x, y, m, a)` は、`z = x + y × m + a` を、語の配列の単位で計算します。`y` の各語に `m` を掛け、それを `x` の対応する語に足し、最後の桁上がりを `a` から始めて加えます。戻り値は、最後に残る桁上がりです。

`math/big` の掛け算は、この処理を `y` の語の数だけ繰り返すことで、大きな積を作ります。

## コード

```go:line-numbers=255
func addMulVVWW_g(z, x, y []Word, m, a Word) (c Word) {
	if len(x) != len(z) || len(y) != len(z) {
		panic("addMulVVWW len")
	}

	c = a
	for i := range z {
		z1, z0 := mulAddWWW_g(y[i], m, x[i])
		lo, cc := bits.Add(uint(z0), uint(c), 0)
		c, z[i] = Word(cc), Word(lo)
		c += z1
	}
	return
}
```

## 前提知識

- **2 語の積**: 2 つの語を掛けると、上の語と下の語の 2 つに分かれます。`mulAddWWW_g` は、この 2 語を計算します。
- **桁上がり `c`**: 1 語の計算の上の部分で、次の語へ送られる値です。
- **`bits.Add`**: 2 つの語を足して、結果と桁上がりを返す関数です。
- **`z`、`x`、`y`、`m`、`a`**: `z` が結果、`x` と `y` が配列、`m` が掛ける値、`a` が最初の桁上がりです。

## 何をしているか

### 1. 最初の桁上がりを設定する

```go:line-numbers=260
	c = a
	for i := range z {
```

最初の桁上がりを `a` にします。`a` は前の段階から来た値で、一番下の位に足されます。

### 2. y の語に m を掛けて、2 語に分ける

```go:line-numbers=262
		z1, z0 := mulAddWWW_g(y[i], m, x[i])
```

`y[i]*m + x[i]` を計算して、上の語 `z1` と下の語 `z0` を求めます。`x[i]` を足しておくことで、足し算と掛け算を 1 回の関数で済ませています。

### 3. 下の語に桁上がりを足す

```go:line-numbers=263
		lo, cc := bits.Add(uint(z0), uint(c), 0)
		c, z[i] = Word(cc), Word(lo)
		c += z1
```

下の語 `z0` に、前の桁上がり `c` を足します。その結果の桁上がり `cc` と、上の語 `z1` を合わせたものが、次の桁上がりになります。結果の下の語は `z[i]` に入ります。

## ここがすごい

- **掛け算と足し算を 1 回にまとめる**: 掛け算の結果に `x[i]` を足す形にしておくと、中間の配列を作らずに済みます。
- **桁上がりの 2 つの出どころを両方足す**: `cc` と `z1` の両方を次の桁上がりに入れることで、どちらの繰り上がりも取りこぼしません。
- **同じ部品の組み合わせ**: `mulAddWWW_g` と `bits.Add` のような小さな関数を組み合わせて、大きな計算を作っています。

## まとめ

- `addMulVVWW_g` は、`x + y×m + a` を語の配列の単位で計算します。
- 各語で、掛け算と足し算を 2 語の結果にまとめます。
- 下の語には、前の桁上がりを足してから結果を入れます。
- 最後に残った桁上がりを返します。
