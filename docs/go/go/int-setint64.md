---
title: "64 ビット整数から Int を作る SetInt64。負の数は符号を分けて絶対値だけを保存する"
description: "math/big の Int に、int64 の値を設定する SetInt64。負の数なら、いったん符号を記録して絶対値にし、絶対値だけを配列に保存する。符号は neg フラグで別に持つ。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/int.go"
lines: [59, 68]
function: "SetInt64"
difficulty: 2
tags: [数値計算, 型システム, 防御的プログラミング]
---

## ひとことで

`z.SetInt64(x)` は、普通の 64 ビット整数 `x` の値を、`math/big` の整数 `z` に設定します。`x` が負の数でも、正しく扱われます。

`math/big` の整数は、符号と絶対値を別々に持ちます。そこで、この関数はまず負の数の符号を覚えて、絶対値だけを配列に入れます。

## コード

```go:line-numbers=59
func (z *Int) SetInt64(x int64) *Int {
	neg := false
	if x < 0 {
		neg = true
		x = -x
	}
	z.abs = z.abs.setUint64(uint64(x))
	z.neg = neg
	return z
}
```

## 前提知識

- **`int64`**: 64 ビットの符号付き整数です。負の数も表せますが、範囲に限りがあります。
- **絶対値**: 符号を取り除いた、0 からの距離です。`-5` の絶対値は `5` です。
- **`neg` フラグ**: 負の数かどうかを表す、真偽の値です。`Int` は、絶対値（`abs`）と `neg` の組で、数を表します。
- **`setUint64`**: 符号のない 64 ビットの値を、ワードの配列に入れる関数です。ここでは、絶対値を入れるために使われます。

## 何をしているか

### 1. 負の数なら符号を覚えて、絶対値にする

```go:line-numbers=61
	if x < 0 {
		neg = true
		x = -x
	}
```

`x` が負の数なら、`neg` を `true` にします。そのあと、`x` の符号を反転させて、正の数にします。これで、`x` は絶対値になります。

### 2. 絶対値を配列に入れる

```go:line-numbers=65
	z.abs = z.abs.setUint64(uint64(x))
```

`x` を符号のない `uint64` にしてから、`setUint64` で配列に入れます。この時点で、`z.abs` は絶対値を表します。

### 3. 符号を設定する

```go:line-numbers=66
	z.neg = neg
	return z
```

最後に、記録しておいた符号を `z.neg` に設定して、`z` を返します。

## ここがすごい

- **符号を別に持つ**: 絶対値と符号を分けて持つので、大きさの計算と符号の計算を、それぞれ単純に保てます。
- **最小値も正しく扱う**: `int64` の最小値を符号反転すると、そのままでは範囲を超えます。しかし、符号を先に覚えてから `uint64` に変換するので、この値も正しく表せます。
- **配列を作り直す**: `setUint64` は、既存の配列を使って値を入れます。毎回新しい `Int` を作る必要はありません。

## まとめ

- `SetInt64` は、`int64` の値を `Int` に設定します。
- 負の数は、符号を `neg` に覚えて、絶対値だけを配列に入れます。
- 符号と絶対値を分けて持つ設計で、大きな数も同じ仕組みで扱えます。
