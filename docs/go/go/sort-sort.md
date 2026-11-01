---
title: "並べ替えの深さを決めて pdqsort を呼ぶ sort.Sort"
description: "sort.Sort は、Interface を満たすデータを並べ替えます。要素の数から、悪い場合に備えた深さの上限を決め、pdqsort という並べ替えの本体に任せます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/sort/sort.go"
lines: [50, 57]
function: "Sort"
difficulty: 2
format: 2
tags: [ソート, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`sort.Sort(sort.Reverse(sort.IntSlice(nums)))` のように、`Len`、`Less`、`Swap` の 3 つを持つ型を並べ替えられます。`sort.Sort` 自身は、並べ替えの手順を知らず、本体に任せるだけです。

## コード

```go:line-numbers=50
func Sort(data Interface) {
	n := data.Len()
	if n <= 1 {
		return
	}
	limit := bits.Len(uint(n))
	pdqsort(data, 0, n, limit)
}
```

## 前提知識

- **`sort.Interface`**: `Len`、`Less`、`Swap` の 3 つのメソッドを持つインターフェースです。データの中身と、並べ替えの操作を分けています。
- **pdqsort**: クイックソートを基にした並べ替えの方法です。悪い入力でも、速く終わるように工夫されています。
- **深さの上限**: 再帰の深さが大きくなりすぎると、悪い入力で遅くなります。上限を決めて、その場合は別の方法に切り替えます。
- **`bits.Len`**: 数を 2 進数で表すのに必要なビット数です。`n` 件なら、およそ `log2(n)` になります。

## 何をしているか

### 1. 要素が少なければ何もしない

```go:line-numbers=51
	n := data.Len()
	if n <= 1 {
		return
	}
```

要素が 0 個か 1 個なら、並べ替えは不要です。そのまま戻ります。

### 2. 深さの上限を決める

```go:line-numbers=55
	limit := bits.Len(uint(n))
```

`bits.Len(uint(n))` は、要素数の対数におよそ等しい値です。この深さを超えて再帰すると、本体は別の方法に切り替えます。

### 3. pdqsort に任せる

```go:line-numbers=56
	pdqsort(data, 0, n, limit)
```

並べ替えの本体は、`pdqsort` が行います。`sort.Sort` 自身は、範囲と深さを渡すだけです。

## ここがすごい

- **アルゴリズムを隠す**: 呼び出し側は、比べ方と入れ替え方だけを用意すれば済みます。並べ替えの仕組みを知らなくても使えます。
- **悪い入力に強い**: 深さの上限を決めることで、最悪の場合の計算量を抑えています。
- **データを選ばない**: `Interface` を満たせば、スライスでも独自の型でも同じ方法で並べ替えられます。

## まとめ

- 並べ替えは `Len`、`Less`、`Swap` を持つ型に対して行う。
- 要素数から深さの上限を決め、本体の `pdqsort` に任せる。
- 悪い入力でも速く終わるように、深さの管理をしている。
