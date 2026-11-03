---
title: "2 語の値を 1 語で割る bits.Div。UintSize で関数を選ぶ"
description: "math/bits の Div。上位 hi と下位 lo をつないだ 2 語の値を y で割り、商と余りを返す。UintSize で 32 ビットか 64 ビットかを選び、対応する関数に任せる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2017 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/bits/bits.go"
lines: [492, 499]
function: "Div"
difficulty: 2
tags: [ビット演算, 数値計算, 移植性]
---

## ひとことで

`bits.Div(hi, lo, y)` は、上位の `hi` と下位の `lo` をつないだ 2 語分の値を、`y` で割ります。商と余りを返します。

## コード

```go:line-numbers=492
func Div(hi, lo, y uint) (quo, rem uint) {
	if UintSize == 32 {
		q, r := Div32(uint32(hi), uint32(lo), uint32(y))
		return uint(q), uint(r)
	}
	q, r := Div64(uint64(hi), uint64(lo), uint64(y))
	return uint(q), uint(r)
}
```

## 前提知識

- **語（word）**: CPU が一度に扱うビット数の単位です。`uint` の大きさは、環境によって 32 ビットか 64 ビットに決まります。
- **2 語の値**: 上位と下位の 2 語を並べると、1 語より大きい値を表せます。
- **商と余り**: 割り算の結果です。`quo` が商、`rem` が余りです。

## 何をしているか

### 1. 32 ビット環境ならそちらに任せる

```go:line-numbers=493
	if UintSize == 32 {
		q, r := Div32(uint32(hi), uint32(lo), uint32(y))
		return uint(q), uint(r)
	}
```

`UintSize` が 32 なら、`Div32` に任せます。値を `uint32` に直してから割るので、その環境に合った計算になります。

### 2. 64 ビット環境の場合

```go:line-numbers=497
	q, r := Div64(uint64(hi), uint64(lo), uint64(y))
	return uint(q), uint(r)
```

それ以外は `Div64` に任せます。結果は `uint` に直して返します。

## ここがすごい

- **環境の大きさに合わせる**: `uint` の大きさを見て、適切な関数を選ぶので、呼び出し側は環境を気にしなくて済みます。
- **計算は一か所に任せる**: 割り算の本体は `Div32` と `Div64` にあり、この関数は選ぶだけです。
- **商が大きすぎる場合の判断も下位に任せる**: 0 で割るときや、商が 1 語に収まらないとき（`y` が上位 `hi` 以下のとき）は、`Div32` と `Div64` がパニックを起こします。この関数は、その判断を下位の関数に任せ、同じ規則で動きます。

## まとめ

- `bits.Div` は、2 語の値を 1 語で割り、商と余りを返します。
- `UintSize` で 32 ビットか 64 ビットかを選びます。
- 割り算の本体は、大きさに合った専用の関数に任せます。
