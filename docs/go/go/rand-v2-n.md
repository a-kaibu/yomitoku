---
title: "型を選ばずに範囲の乱数を作る rand.N。ジェネリクスで int と uint の両方に対応"
description: "math/rand/v2 の Rand.N。0 以上 n 未満の乱数を、型パラメータ Int で作る。n が 0 以下なら panic を起こす。内部では 64 ビットの乱数生成器を使い、結果を Int 型に変換して返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/rand/v2/rand.go"
lines: [213, 218]
function: "N"
difficulty: 1
tags: [乱数, ジェネリクス, 型システム]
---

## ひとことで

`r.N(n)` は、0 以上 `n` 未満の乱数を返します。`n` の型は、`int` でも `uint32` でも、整数の型なら何でも使えます。返り値も、同じ型になります。

以前の書き方では、型ごとに別の関数が必要でした。ジェネリクスを使うと、一つの関数で、いろいろな整数型に対応できます。

## コード

```go:line-numbers=213
func (r *Rand) N[Int intType](n Int) Int {
	if n <= 0 {
		panic("invalid argument to N")
	}
	return Int(r.uint64n(uint64(n)))
}
```

## 前提知識

- **ジェネリクス**: 型を後から決められる書き方です。`[Int intType]` は、整数の型のどれかを表します。
- **型パラメータ**: 関数の中で使う型の仮の名前です。呼び出すときに、実際の型が決まります。
- **`uint64n`**: 64 ビットの範囲で乱数を作る、内部の関数です。
- **`panic`**: 不正な引数（ここでは 0 以下）が渡されたときに、プログラムを止めます。

## 何をしているか

### 1. 不正な範囲を止める

```go:line-numbers=214
	if n <= 0 {
		panic("invalid argument to N")
	}
```

範囲が 0 以下なら、乱数を作る意味がありません。`panic` で止めて、誤りを知らせます。

### 2. 乱数を作り、元の型に戻す

```go:line-numbers=217
	return Int(r.uint64n(uint64(n)))
```

`n` を `uint64` に変えて、内部の乱数の関数に渡します。返ってきた乱数を、元の型 `Int` に変えて返します。どの整数型を使っても、同じ書き方で済みます。

## ここがすごい

- **型を一つの関数で扱う**: `IntN`、`Int32N` など型ごとの関数を書く代わりに、一つの関数で全部を扱えます。
- **内部は 64 ビットで統一**: 計算は 64 ビットに揃えてから、最後に型を戻します。どの型でも、同じ仕組みで正しく動きます。
- **誤りを先に止める**: 範囲が不正なら、乱数を作る前に止まります。

## まとめ

- `N` は、ジェネリクスで整数の型を選ばずに、範囲の乱数を作ります。
- 範囲が 0 以下なら `panic` で止まります。
- 内部は 64 ビットで計算し、最後に元の型へ戻します。
