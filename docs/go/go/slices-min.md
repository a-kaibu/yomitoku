---
title: "スライスの最小値を求める slices.Min。空のときは panic で知らせる"
description: "slices.Min は、順序のある型のスライスから最小の要素を返す。空のスライスは最小値が定まらないので、パニックで呼び出し側に伝える。比較には組み込みの min を使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2023 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/slices/sort.go"
lines: [65, 74]
function: "Min"
difficulty: 1
tags: [標準ライブラリ, ジェネリクス, アルゴリズム]
---

## ひとことで

`slices.Min(x)` は、スライス `x` の中で最も小さい値を返します。例えば `slices.Min([]int{3, 1, 2})` は `1` です。値の大小が決まる型（整数、浮動小数点数、文字列など）で使えます。

空のスライスには最小値がないので、パニックで止めます。

## コード

```go:line-numbers=65
func Min[S ~[]E, E cmp.Ordered](x S) E {
	if len(x) < 1 {
		panic("slices.Min: empty list")
	}
	m := x[0]
	for i := 1; i < len(x); i++ {
		m = min(m, x[i])
	}
	return m
}
```

## 前提知識

- **ジェネリクス**: `[S ~[]E, E cmp.Ordered]` のように、型を後から決める書き方です。`cmp.Ordered` は、大小を比べられる型の集まりです。
- **組み込みの `min` 関数**: 2 つ以上の値の中から最小のものを返す、Go の組み込み関数です。
- **`panic`**: 続けられない誤りで、プログラムを止めます。ここでは、空のスライスを呼び出したという誤りを知らせます。
- **先頭の値を初期値にする**: 最小値の探索は、最初の要素を仮の答えにして、残りと比べていくのが普通です。

## 何をしているか

### 1. 空なら panic する

```go:line-numbers=66
	if len(x) < 1 {
		panic("slices.Min: empty list")
	}
```

要素が 1 つもなければ、最小値がありません。そこで、関数名入りのメッセージで `panic` します。`0` などの適当な値を返すと、誤った結果が後で気づかれにくくなるからです。

### 2. 先頭を仮の答えにして比べる

```go:line-numbers=69
	m := x[0]
	for i := 1; i < len(x); i++ {
		m = min(m, x[i])
	}
	return m
```

先頭の要素を `m` に入れ、残りを 1 つずつ比べます。`min(m, x[i])` で、小さいほうを `m` に残します。最後に残った `m` が、最小値です。

## ここがすごい

- **型を問わない**: `cmp.Ordered` の制約で、整数や文字列など、大小が決まるどの型でも同じコードが使えます。
- **組み込みの min を使う**: 比べる処理を自分で書かず、言語の組み込み関数に任せています。浮動小数点数の NaN の扱いも、その関数の仕様に従います。
- **誤りを隠さない**: 空を特別な値で返さず、パニックで止めるので、呼び出し側が空かどうかを確かめる習慣が自然に付きます。

## まとめ

- `slices.Min` は、スライスの最小の要素を返します。
- 空のスライスは、パニックで止めます。
- 先頭を仮の答えにして、残りを組み込みの `min` で比べます。
- 大小が決まる型なら、どれでも使えます。
