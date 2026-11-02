---
title: "0 以上 n 未満の乱数を返す Rand.Intn。小さい範囲と大きい範囲で処理を分ける"
description: "math/rand の Rand.Intn。n が 0 以下なら止める。n が 32 ビットの範囲に収まるときは、速い int31n を使い、それより大きいときは int63 系の関数を使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/rand/rand.go"
lines: [178, 186]
function: "Intn"
difficulty: 1
tags: [乱数, 数値計算, 防御的プログラミング]
---

## ひとことで

`r.Intn(n)` は、0 以上 `n` 未満の整数の乱数を返します。例えば `r.Intn(6)` は 0 から 5 までの値を返します。サイコロの目を作るときによく使われる関数です。

この関数は、乱数の作り方を自分で決めるのではなく、`n` の大きさに応じて、適切な関数に任せます。小さな範囲は速い方法を、大きな範囲は広い型の方法を使います。

## コード

```go:line-numbers=178
func (r *Rand) Intn(n int) int {
	if n <= 0 {
		panic("invalid argument to Intn")
	}
	if n <= 1<<31-1 {
		return int(r.Int31n(int32(n)))
	}
	return int(r.Int63n(int64(n)))
}
```

## 前提知識

- **乱数の範囲**: `Intn(n)` の `n` は、取りうる値の個数です。`n` が 6 なら、0 から 5 の 6 通りです。
- **`int32` と `int63`**: 32 ビットの整数と、63 ビットの整数です。`int` の範囲が大きい場合は、より広い型で乱数を作る必要があります。
- **`int31n`**: 32 ビットの範囲の乱数を、速く作る専用の関数です。前の記事で見た、掛け算を使う方法です。
- **panic**: 不正な引数のときに、プログラムを止める仕組みです。

## 何をしているか

### 1. 0 以下の値を止める

```go:line-numbers=179
	if n <= 0 {
		panic("invalid argument to Intn")
	}
```

範囲の個数が 0 以下では、乱数を作る意味がありません。そのため、`panic` で止めて、誤った使い方を知らせます。

### 2. 小さい範囲は速い方法を使う

```go:line-numbers=182
	if n <= 1<<31-1 {
		return int(r.Int31n(int32(n)))
	}
```

`n` が 32 ビットの範囲に収まるなら、`Int31n` を使います。32 ビットの乱数を作る方が速いので、多くの場合はこちらが選ばれます。

### 3. 大きい範囲は 63 ビットの方法を使う

```go:line-numbers=185
	return int(r.Int63n(int64(n)))
```

`n` が 32 ビットを超えるときは、63 ビットの乱数を作る `Int63n` を使います。範囲が広い場合でも、正しく同じ確率で値を返します。

## ここがすごい

- **場合分けで速さを守る**: 大半の場合は、速い 32 ビットの方法で済みます。広い範囲のときだけ、遅くても正しい方法を選びます。
- **呼び出し側は一つだけ覚えればよい**: `Intn` という名前だけで、範囲の大きさに関係なく、同じ使い方ができます。
- **不正な値は早く止まる**: 範囲が 0 以下なら、乱数を作る前に `panic` が起きます。間違いを見つけやすくなっています。

## まとめ

- `Intn` は、0 以上 `n` 未満の整数の乱数を返します。
- `n` が 0 以下なら、`panic` で止まります。
- 32 ビットに収まる範囲は `Int31n`、それより広い範囲は `Int63n` で処理します。
