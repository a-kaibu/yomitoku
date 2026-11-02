---
title: "大きな整数に 1 語を掛けて足す math/big の mulAddVWW_g"
description: "math/big の内部で、多倍長整数の配列に 1 語の値を掛けて、さらに 1 語を足す mulAddVWW_g。各語の結果を、前の語からの桁上がりと一緒に計算して、すべての語を更新する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/arith.go"
lines: [244, 253]
function: "mulAddVWW_g"
difficulty: 3
tags: [数値計算, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`mulAddVWW_g(z, x, y, r)` は、多倍長整数 `x` に 1 語の値 `y` を掛けて、さらに `r` を足した結果を `z` に入れます。戻り値は、最後に残った桁上がりです。

大きな整数の掛け算は、この処理を何回も使って組み立てられます。例えば、1 桁ずつ掛けて足していく筆算を、語の単位で行うものだと考えられます。

## コード

```go:line-numbers=244
func mulAddVWW_g(z, x []Word, y, r Word) (c Word) {
	if len(x) != len(z) {
		panic("mulAddVWW len")
	}
	c = r
	for i := range z {
		c, z[i] = mulAddWWW_g(x[i], y, c)
	}
	return
}
```

## 前提知識

- **語（Word）と多倍長整数**: 大きな整数を、語の配列で表す方法です。配列の先頭が最下位の語です。
- **2 語の積**: 2 つの語を掛けると、結果は 2 語分の大きさになります。上の語と下の語に分けて扱います。
- **`mulAddWWW_g`**: `x*y + c` を計算して、上の語と下の語を返す関数です。この関数が 1 つの語の計算を担当します。
- **桁上がり `c`**: 1 つの語の計算の結果、上の語が次の語へ送る値です。

## 何をしているか

### 1. 桁上がりを初期値にする

```go:line-numbers=248
	c = r
	for i := range z {
		c, z[i] = mulAddWWW_g(x[i], y, c)
```

最初の桁上がり `c` を、足す値 `r` にします。そこから、語を下の位から順に処理します。

### 2. 1 語ずつ掛けて、桁上がりを送る

```go:line-numbers=250
		c, z[i] = mulAddWWW_g(x[i], y, c)
```

`mulAddWWW_g` が、`x[i]*y + c` の結果を計算します。下の語は `z[i]` に入り、上の語が新しい `c` になります。`c` は次の語の計算へ送られます。

### 3. 最後の桁上がりを返す

```go:line-numbers=252
	return
```

すべての語を処理し終わったら、最後の `c` が結果の上の部分です。名前付きの戻り値 `c` を、そのまま返します。

## ここがすごい

- **桁上がりを 1 本の流れで送る**: 語ごとの計算を、前の語の桁上がりに依存する形でつないでいます。1 本のループで、掛け算と足し算が同時に済みます。
- **結果を同じ配列に上書き**: `z` は新しい配列に作ることもできますが、`z[i]` に直接書けば、追加のメモリ確保が要りません。
- **長さの検査**: 配列の長さが違えば、パニックします。範囲外の読み書きで壊れた結果を返さないように、先に確かめています。

## まとめ

- `mulAddVWW_g` は、多倍長整数に 1 語を掛けて、1 語を足します。
- 語ごとの計算を、桁上がりを次へ送りながら、下の位から順に行います。
- 最後に残った桁上がりを、戻り値として返します。
- 大きな整数の掛け算の、基本の部品になっています。
