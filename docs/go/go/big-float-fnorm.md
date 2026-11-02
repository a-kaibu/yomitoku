---
title: "仮数の先頭を 1 に揃える fnorm。先頭の 0 ビットの数だけ左にずらす"
description: "math/big の Float の fnorm。仮数の最上位ワードの先頭にある 0 ビットの数を数え、その分だけ仮数全体を左にずらす。ずらした量を返し、指数の調整に使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/float.go"
lines: [584, 596]
function: "fnorm"
difficulty: 2
tags: [数値計算, ビット演算, 型システム]
---

## ひとことで

`fnorm(m)` は、仮数 `m` を正規化します。正規化とは、一番上のビットが 1 になるように、全体を左にずらすことです。ずらした量を返すので、呼び出し側は、その分だけ指数を調整できます。

例えば、2 進数の `0001` は、左に 3 ビットずらすと `1000` になります。値を 8 倍して、指数を 3 だけ小さくすれば、同じ値を正しく表せます。

## コード

```go:line-numbers=584
func fnorm(m nat) int64 {
	if debugFloat && (len(m) == 0 || m[len(m)-1] == 0) {
		panic("msw of mantissa is 0")
	}
	s := nlz(m[len(m)-1])
	if s > 0 {
		c := lshVU(m, m, s)
		if debugFloat && c != 0 {
			panic("nlz or lshVU incorrect")
		}
	}
	return int64(s)
}
```

## 前提知識

- **正規化**: 仮数の先頭のビットを 1 にそろえる決まりです。同じ値は、必ず同じ形で表されます。
- **`nlz`**: 数の先頭にある 0 ビットの数を数える関数です。`number of leading zeros` の略です。
- **`lshVU`**: 配列全体を、指定したビット数だけ左にずらす関数です。
- **`debugFloat`**: デバッグのときだけ真になる定数です。真のときは、途中の矛盾を確かめます。

## 何をしているか

### 1. 先頭の 0 の数を数える

```go:line-numbers=588
	s := nlz(m[len(m)-1])
	if s > 0 {
		c := lshVU(m, m, s)
```

最上位ワードの先頭にある 0 の数 `s` を求めます。`s` が 0 より大きければ、ずらす必要があります。`lshVU` で、仮数全体を `s` ビット左にずらします。

### 2. ずらした量を返す

```go:line-numbers=595
	return int64(s)
```

ずらした量 `s` を返します。呼び出し側は、この値を使って、指数を `s` だけ小さくします。値は変わらず、表し方だけが正規の形になります。

## ここがすごい

- **値を変えずに形を整える**: 左にずらした分、指数を減らすので、元の値は同じままです。
- **1 ワードだけで判断する**: 先頭の 0 の数は、最上位ワードだけを見れば決まります。配列全体を調べる必要はありません。
- **ずらした量を返す**: 関数の中で指数を直さず、結果だけを返します。どのように指数を扱うかは、呼び出し側に任せています。

## まとめ

- `fnorm` は、仮数の先頭のビットが 1 になるように左にずらします。
- ずらした量を返し、呼び出し側が指数を調整します。
- 値は変わらず、表し方だけが正規の形になります。
