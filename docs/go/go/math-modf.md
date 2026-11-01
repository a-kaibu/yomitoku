---
title: "整数部分と小数部分を、切り捨てと引き算だけで分ける Modf"
description: "math.Modf は、浮動小数点数を整数部分と小数部分に分けます。整数部分は Trunc で切り捨て、小数部分は元の値との差を取ってから、元の符号をそろえます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/modf.go"
lines: [14, 18]
function: "Modf"
difficulty: 1
format: 2
tags: [数値計算, 標準ライブラリ]
---

## ひとことで

`math.Modf(3.25)` は、整数部分 `3` と小数部分 `0.25` を返します。どちらも元の値と同じ符号になります。`Modf(-3.25)` は `-3` と `-0.25` です。

関数の中身は 3 行しかありません。整数部分を先に求め、その差を小数部分として使います。

## コード

```go:line-numbers=14
func Modf(f float64) (integer float64, fractional float64) {
	integer = Trunc(f)
	fractional = Copysign(f-integer, f)
	return
}
```

## 前提知識

- **切り捨て（Trunc）**: 0 に向かって小数点以下を捨てる操作です。`Trunc(-3.25)` は `-3` です。
- **符号のコピー（Copysign）**: 1 つ目の値の大きさと、2 つ目の値の符号を組み合わせる関数です。
- **浮動小数点数の差**: 元の値から整数部分を引くと、残りは小数部分になります。ただし、符号は負の数では負のままになります。
- **名前付き戻り値**: `(integer float64, fractional float64)` の 2 つを返します。`return` だけで返せます。

## 何をしているか

`f = -3.25` で追います。

### 1. 整数部分を切り捨てで求める

```go:line-numbers=15
	integer = Trunc(f)
```

`Trunc(-3.25)` は `-3` です。0 に向かって切り捨てるので、負の数でも `-3` になります。

### 2. 小数部分を差で求め、符号をそろえる

```go:line-numbers=16
	fractional = Copysign(f-integer, f)
```

`f - integer = -3.25 - (-3) = -0.25` です。すでに符号は負ですが、`Copysign(-0.25, f)` は、`f` の符号（負）をそろえるだけです。正の値の場合も、同じ式で正しく符号がそろいます。

## ここがすごい

- **差を使うと、小数部分が正確**: 小数部分は、元の値から整数部分を引けば求まります。切り捨てた残りなので、情報が失われません。
- **符号を明示的にそろえる**: 差の計算で、符号が意図と違うことがあっても、`Copysign` で元の符号に揃えられます。`-0` のような特別な値も、符号が保たれます。
- **2 つの関数の組み合わせ**: `Trunc` と `Copysign` を組み合わせるだけで、全体が 3 行に収まっています。部品の働きが分かれば、読み解きやすい関数です。

## まとめ

- 整数部分は切り捨てで求め、小数部分は元の値との差で求める。
- 差の符号は、元の値の符号に揃えると、負の数でも意図どおりになる。
- 小さな関数を組み合わせると、短く正確な関数を作れる。
