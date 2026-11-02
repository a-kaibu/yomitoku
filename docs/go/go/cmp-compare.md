---
title: "3 通りの結果で比べる cmp.Compare"
description: "cmp.Compare は、2 つの値の大小を -1、0、+1 で返します。NaN は最小として扱い、両方が NaN なら 0 とみなします。並べ替えの比べ関数として使えます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2023 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/cmp/cmp.go"
lines: [40, 59]
function: "Compare"
difficulty: 2
format: 2
tags: [型システム, ジェネリクス, ソート, 防御的プログラミング]
---

## ひとことで

`cmp.Compare(3, 5)` は `-1` を返します。前の値が小さいときは負、等しいときは 0、大きいときは正の値を返す、という古くからの約束に従っています。

## コード

```go:line-numbers=40
func Compare[T Ordered](x, y T) int {
	xNaN := isNaN(x)
	yNaN := isNaN(y)
	if xNaN {
		if yNaN {
			return 0
		}
		return -1
	}
	if yNaN {
		return +1
	}
	if x < y {
		return -1
	}
	if x > y {
		return +1
	}
	return 0
}
```

## 前提知識

- **比較関数の約束**: 戻り値が負なら前が小さい、0 なら等しい、正なら前が大きい、という決まりです。`slices.SortFunc` などに渡せます。
- **NaN**: 浮動小数点数で、ほかのどの値とも大小が決まらない値です。ここでは最小とみなします。
- **`Less` との違い**: `Less` は真偽だけを返します。`Compare` は 3 通りの結果を返すので、等しいかどうかも分かります。
- **ジェネリクス**: `T Ordered` の制約で、比べられる型に同じ関数を使えます。

## 何をしているか

### 1. NaN の扱いを先に決める

```go:line-numbers=41
	xNaN := isNaN(x)
	yNaN := isNaN(y)
	if xNaN {
		if yNaN {
			return 0
		}
		return -1
	}
	if yNaN {
		return +1
	}
```

2 つの値のどちらが NaN かを先に調べます。両方が NaN なら 0、`x` だけが NaN なら -1 です。`y` だけが NaN なら +1 を返します。

### 2. 大小を比べる

```go:line-numbers=52
	if x < y {
		return -1
	}
	if x > y {
		return +1
	}
	return 0
```

どちらも NaN でなければ、`x < y` なら -1、`x > y` なら +1、そうでなければ 0 を返します。

## ここがすごい

- **1 回の呼び出しで 3 通り分かる**: 大小と等しさを、戻り値だけで表せます。
- **NaN でも全順序を保つ**: NaN を最小とし、NaN どうしは等しいとするので、並べ替えが矛盾しません。
- **比べ関数の形に合う**: 戻り値の約束が、標準ライブラリの並べ替えの仕組みと一致しています。

## まとめ

- 戻り値は、前が小さければ -1、等しければ 0、大きければ +1 になる。
- NaN は最小とし、両方が NaN なら 0 とする。
- `slices.SortFunc` のような関数に、そのまま渡せる。
