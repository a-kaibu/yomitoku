---
title: "2 語の加算 bits.Add。環境に合わせて関数を選ぶ"
description: "math/bits の Add。桁上がりを含む 2 つの値と、繰り上がりを足し、和と桁上がりを返す。UintSize に合わせて 32 ビットか 64 ビットの加算に任せる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2017 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/bits/bits.go"
lines: [360, 367]
function: "Add"
difficulty: 2
tags: [ビット演算, 移植性]
---

## ひとことで

`bits.Add(x, y, carry)` は、`x` と `y` を足して、前の桁からの繰り上がり `carry` も加えます。和と、次の桁への繰り上がりを返します。

## コード

```go:line-numbers=360
func Add(x, y, carry uint) (sum, carryOut uint) {
	if UintSize == 32 {
		s32, c32 := Add32(uint32(x), uint32(y), uint32(carry))
		return uint(s32), uint(c32)
	}
	s64, c64 := Add64(uint64(x), uint64(y), uint64(carry))
	return uint(s64), uint(c64)
}
```

## 前提知識

- **桁上がり（carry）**: 下の桁の和が、桁を越えたときに上の桁へ送る 1 のことです。
- **語（word）**: CPU が一度に扱うビット数の単位です。`uint` の大きさは、環境によって変わります。
- **複数の戻り値**: Go では、関数が和と桁上がりのように、二つの値をまとめて返せます。

## 何をしているか

### 1. 32 ビット環境ならそちらに任せる

```go:line-numbers=361
	if UintSize == 32 {
		s32, c32 := Add32(uint32(x), uint32(y), uint32(carry))
		return uint(s32), uint(c32)
	}
```

`UintSize` が 32 なら、`Add32` に任せます。値を `uint32` に直して計算するので、環境に合った結果が出ます。

### 2. 64 ビット環境の場合

```go:line-numbers=365
	s64, c64 := Add64(uint64(x), uint64(y), uint64(carry))
	return uint(s64), uint(c64)
```

それ以外は `Add64` に任せます。和と桁上がりを `uint` に直して返します。

## ここがすごい

- **同じ書き方で環境を切り替える**: `uint` の大きさに応じて、同じ形の処理を別の関数に回すので、どちらの環境でも同じ意味になります。
- **桁上がりも一緒に返す**: 和だけでなく桁上がりも返すので、多倍長の計算を繰り返す側で、続きの桁に渡せます。

## まとめ

- `bits.Add` は、繰り上がりを含む加算をし、和と桁上がりを返します。
- `UintSize` で 32 ビットか 64 ビットかを選びます。
- 計算の本体は、`Add32` と `Add64` に任せます。
