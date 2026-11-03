---
title: "比較関数で最小の要素を探す MinFunc。空なら panic する"
description: "slices パッケージの MinFunc。比較関数 cmp を使って、スライス x の中で最小の要素を返す。先頭から一つずつ比べ、より小さいものが見つかれば入れ替える。空のスライスでは panic する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2023 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/slices/sort.go"
lines: [79, 90]
function: "MinFunc"
difficulty: 2
tags: [ソート, 可読性]
---

## ひとことで

`slices.MinFunc(x, cmp)` は、スライス `x` の中で、比較関数 `cmp` の基準で最も小さい要素を返します。空のスライスを渡すと、panic します。

## コード

```go:line-numbers=79
func MinFunc[S ~[]E, E any](x S, cmp func(a, b E) int) E {
	if len(x) < 1 {
		panic("slices.MinFunc: empty list")
	}
	m := x[0]
	for i := 1; i < len(x); i++ {
		if cmp(x[i], m) < 0 {
			m = x[i]
		}
	}
	return m
}
```

## 前提知識

- **比較関数 cmp**: 二つの要素を比べ、前後の関係を整数で返す関数です。負なら前、正なら後ろ、0 なら同じです。
- **panic**: 続けられない状態になったときに、プログラムを止める仕組みです。
- **ジェネリクス**: 型を後から決められる書き方です。`S` と `E` で、どんな型のスライスにも使えるようにしています。

## 何をしているか

### 1. 空なら panic する

```go:line-numbers=80
	if len(x) < 1 {
		panic("slices.MinFunc: empty list")
	}
```

要素が一つもないと、最小の要素は存在しません。その場合は、理由を書いたメッセージで panic します。

### 2. 先頭を仮の最小とする

```go:line-numbers=83
	m := x[0]
```

先頭の要素を、最初の最小候補 `m` として置きます。

### 3. より小さいものがあれば入れ替える

```go:line-numbers=84
	for i := 1; i < len(x); i++ {
		if cmp(x[i], m) < 0 {
			m = x[i]
		}
	}
	return m
```

二番目以降の要素を、順に `m` と比べます。`cmp` が負なら、その要素のほうが小さいので、`m` を入れ替えます。最後に `m` を返します。

## ここがすごい

- **一回の走査で最小が決まる**: 並べ替えをせず、一度だけ回すので、計算量は要素数に比例します。
- **同じ値は先のものを残す**: 比べるのは「より小さいか」だけなので、同じ値があれば、先に見つかったほうが残ります。

## まとめ

- `MinFunc` は、比較関数の基準で最小の要素を返します。
- 空のスライスでは panic します。
- 一回の走査で、最小を見つけます。
