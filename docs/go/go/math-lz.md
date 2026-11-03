---
title: "128 ビットの先頭の 0 の数を数える lz。上位が 0 なら下位も数える"
description: "math の lz。u1 と u2 をつないだ 128 ビットの値について、先頭から続く 0 の数を返す。u1 がすべて 0 のときは、u2 の先頭の 0 も数える。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2019 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/fma.go"
lines: [65, 71]
function: "lz"
difficulty: 2
tags: [ビット演算, 数値計算]
---

## ひとことで

`lz(u1, u2)` は、`u1` を上位、`u2` を下位とした 128 ビットの値について、先頭から続く 0 の数を返します。

## コード

```go:line-numbers=65
func lz(u1, u2 uint64) (l int32) {
	l = int32(bits.LeadingZeros64(u1))
	if l == 64 {
		l += int32(bits.LeadingZeros64(u2))
	}
	return l
}
```

## 前提知識

- **先頭の 0 の数（leading zeros）**: 数の最上位から、連続して並ぶ 0 の数です。数の大きさを、ビット単位で表せます。
- **128 ビットの値**: 64 ビットの二つを並べて、一つの大きな値として扱ったものです。ここでは、`u1` が上位、`u2` が下位です。
- **`bits.LeadingZeros64`**: 64 ビットの値について、先頭の 0 の数を返す関数です。

## 何をしているか

### 1. 上位の先頭の 0 を数える

```go:line-numbers=66
	l = int32(bits.LeadingZeros64(u1))
```

まず、上位の `u1` について、先頭の 0 の数を数えます。結果は `int32` に直して、`l` に入れます。

### 2. 上位がすべて 0 なら下位も数える

```go:line-numbers=67
	if l == 64 {
		l += int32(bits.LeadingZeros64(u2))
	}
```

`u1` がすべて 0 のとき、`LeadingZeros64` は 64 を返します。そのときは、下位の `u2` の先頭の 0 も加えます。上位が 0 のぶんに、下位の 0 が続いている形になるからです。

### 3. 結果を返す

```go:line-numbers=70
	return l
```

数えた結果を返します。

## ここがすごい

- **64 ビットの関数を組み合わせる**: 128 ビットの数えかたを、64 ビットの関数を二回使うだけで表せます。
- **0 の場合を特別扱いしない**: `u1` が 0 のときだけ、下位の値を足せば、全体の結果が正しくなります。

## まとめ

- `lz` は、128 ビットの先頭の 0 の数を返します。
- 上位が 0 なら、下位の先頭の 0 も加えます。
- 64 ビットの関数を、二回使って組み立てます。
