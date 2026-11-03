---
title: "比較関数で並んでいるかを末尾から調べる IsSortedFunc"
description: "slices パッケージの IsSortedFunc。比較関数 cmp を使って、スライスが昇順に並んでいるかを調べる。末尾から隣り合う二つを比べ、逆順があれば false を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2023 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/slices/sort.go"
lines: [53, 60]
function: "IsSortedFunc"
difficulty: 2
tags: [ソート, 可読性]
---

## ひとことで

`slices.IsSortedFunc(x, cmp)` は、スライス `x` が、比較関数 `cmp` の順に並んでいるかを調べます。並んでいれば `true` を返します。

## コード

```go:line-numbers=53
func IsSortedFunc[S ~[]E, E any](x S, cmp func(a, b E) int) bool {
	for i := len(x) - 1; i > 0; i-- {
		if cmp(x[i], x[i-1]) < 0 {
			return false
		}
	}
	return true
}
```

## 前提知識

- **比較関数 cmp**: 二つの要素を比べて、前後の関係を整数で返す関数です。負なら前、0 なら同じ、正なら後ろです。
- **隣り合う要素**: 並びの中で、一つ前と一つ後ろにある要素の組です。並んでいるかは、この組を比べれば分かります。
- **逆順**: 後ろの要素が、前の要素より前に来るべき状態です。一か所でもあれば、並んでいないことになります。

## 何をしているか

### 1. 末尾から隣り合う組を比べる

```go:line-numbers=54
	for i := len(x) - 1; i > 0; i-- {
		if cmp(x[i], x[i-1]) < 0 {
			return false
		}
	}
```

末尾の要素から順に、`x[i]` と、その一つ前の `x[i-1]` を比べます。`cmp(x[i], x[i-1])` が負なら、`x[i]` が前に来るべきなので、並んでいません。そのとき `false` を返します。

### 2. 最後まで問題がなければ true

```go:line-numbers=59
	return true
```

全ての隣り合う組で問題がなければ、並んでいると判断して `true` を返します。空のスライスや、要素が一つだけのときは、ループが回らず `true` になります。

## ここがすごい

- **一回の走査で済む**: 隣り合う組を一度ずつ比べるだけなので、並べ替えるより少ない比較で判定できます。
- **比べる方法を選べる**: `cmp` を渡すので、数値や文字列だけでなく、どんな型の並びにも同じ仕組みを使えます。

## まとめ

- `IsSortedFunc` は、比較関数の順に並んでいるかを調べます。
- 隣り合う二つの要素を比べ、逆順が一つでもあれば `false` を返します。
- 空や一つだけの並びは、並んでいるとして扱います。
