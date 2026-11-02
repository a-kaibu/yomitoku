---
title: "整数の指定したビットを 0 か 1 にする Int.SetBit。負の数は補数で考える"
description: "math/big の Int.SetBit。整数 x の i 番目のビットを b（0 か 1）にした値を z に設定する。負の数は、絶対値から 1 を引いて扱い、結果をもう一度 1 足して戻す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/int.go"
lines: [1292, 1306]
function: "SetBit"
difficulty: 3
tags: [ビット演算, 数値計算, 防御的プログラミング]
---

## ひとことで

`z.SetBit(x, i, b)` は、整数 `x` の `i` 番目のビット（下から数えて `i` 番目）を、`b` が 0 なら 0 に、1 なら 1 にした値を `z` に設定します。

負の数のビットは、普通の 2 進数とは違う見方が必要です。この関数は、負の数に対して「絶対値から 1 を引いて考える」という方法で、正しい結果を作ります。

## コード

```go:line-numbers=1292
func (z *Int) SetBit(x *Int, i int, b uint) *Int {
	if i < 0 {
		panic("negative bit index")
	}
	if x.neg {
		t := z.abs.sub(x.abs, natOne)
		t = t.setBit(t, uint(i), b^1)
		z.abs = t.add(t, natOne)
		z.neg = len(z.abs) > 0
		return z
	}
	z.abs = z.abs.setBit(x.abs, uint(i), b)
	z.neg = false
	return z
}
```

## 前提知識

- **ビット位置**: 下から数えた位置です。`i = 0` が最も下のビット、`i = 1` がその 1 つ上です。
- **負の数の 2 進数**: コンピュータの 2 進数では、負の数は補数と呼ばれる形で表されます。`math/big` の `Int` は、この形を使わず、符号と絶対値で持ちます。そのため、ビットの扱いには変換が必要です。
- **`i < 0` の禁止**: ビットの位置がマイナスなら、意味がありません。そのため、`panic` で止めます。
- **`natOne`**: 値が 1 の `nat` です。引き算や足し算で使います。

## 何をしているか

### 1. 位置が負なら止める

```go:line-numbers=1293
	if i < 0 {
		panic("negative bit index")
	}
```

ビットの位置は 0 以上でなければなりません。負の位置を指定すると、意味が定まらないので、ここで止めます。

### 2. 正の数はそのまま設定する

```go:line-numbers=1303
	z.abs = z.abs.setBit(x.abs, uint(i), b)
	z.neg = false
	return z
```

`x` が正のときは、絶対値のビットを直接書き換えます。結果は正の数なので、`neg` は `false` に設定します。

### 3. 負の数は 1 を引いてから扱う

```go:line-numbers=1297
		t := z.abs.sub(x.abs, natOne)
		t = t.setBit(t, uint(i), b^1)
		z.abs = t.add(t, natOne)
		z.neg = len(z.abs) > 0
```

負の数 `-a` のビットは、`a - 1` のビットを反転させたものと対応します。そこで、まず絶対値から 1 を引きます。次に、位置 `i` のビットを `b^1` にします。`b^1` は、`b` を反転した値です。最後に 1 を足して、負の数に戻します。

`z.neg` は、結果が 0 でなければ負のままです。`len(z.abs) > 0` の判定で、0 になったときは符号を消します。

## ここがすごい

- **符号と絶対値の仕組みを活かす**: 補数の形に変換しなくても、1 を引く、1 を足すという単純な操作で、負の数のビットを扱えます。
- **0 の扱いを揃える**: 結果が 0 になるときは、`neg` を `false` にして、0 の表し方を 1 通りに保ちます。
- **元の値を書き換えない**: `x` を読むだけで、結果は `z` に入ります。同じ変数を指定しても、正しく動くように作られています。

## まとめ

- `SetBit` は、整数の指定したビットを 0 か 1 に設定します。
- 正の数は、絶対値のビットを直接書き換えます。
- 負の数は、1 を引いてから書き換え、最後に 1 を足して戻します。
