---
title: "3 つの値の中央値を求める sort の median。比べる組を 3 回だけ使う"
description: "sort パッケージの median。3 つの位置の要素のうち、真ん中の大きさのものを位置で返す。2 つずつ順序を整える操作を 3 回行うだけで、中央値が決まる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2022 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/sort/zsortinterface.go"
lines: [307, 312]
function: "median"
difficulty: 2
tags: [ソート, アルゴリズム, 最適化]
---

## ひとことで

`median(data, a, b, c, swaps)` は、位置 `a`、`b`、`c` の 3 つの要素を見て、その中で真ん中の大きさの要素の位置を返します。例えば値が 9、2、5 なら、真ん中は 5 です。

クイックソートでは、ピボット（基準の値）を選ぶときに、この関数が使われます。極端に大きい値や小さい値を選ぶと、ソートが遅くなるので、真ん中に近い値を選ぶ工夫が必要です。

## コード

```go:line-numbers=307
func median(data Interface, a, b, c int, swaps *int) int {
	a, b = order2(data, a, b, swaps)
	b, c = order2(data, b, c, swaps)
	a, b = order2(data, a, b, swaps)
	return b
}
```

## 前提知識

- **中央値（median）**: 3 つの値を大きさの順に並べたときの、真ん中の値です。
- **`order2`**: 2 つの位置の要素を比べて、小さい方を前、大きい方を後ろに並べ直す関数です。位置を入れ替えたかどうかを `swaps` で数えます。
- **ピボット**: クイックソートで、データを大小に分けるときに基準にする値です。
- **`swaps`**: 入れ替えの回数を数えるための、ポインタの値です。ソートが整っているかを判断するのに使われます。

## 何をしているか

### 1. 最初の 2 つを整える

```go:line-numbers=308
	a, b = order2(data, a, b, swaps)
```

位置 `a` と `b` の要素を比べて、小さい方が `a` に来るように整えます。これで、`a` は `b` 以下になります。

### 2. 次の 2 つを整える

```go:line-numbers=309
	b, c = order2(data, b, c, swaps)
```

今度は `b` と `c` を比べて、小さい方が `b` に来るように整えます。3 つのうち、最も大きい値は `c` に来ます。

### 3. もう一度整えて、真ん中を返す

```go:line-numbers=310
	a, b = order2(data, a, b, swaps)
	return b
```

最後に `a` と `b` を比べ直します。この 3 回の操作で、`b` の位置にある要素が、3 つの中央値になります。その位置 `b` を返します。

## ここがすごい

- **比べる回数が固定**: 3 回の比べる操作だけで、必ず中央値が決まります。データの並びに関係なく、手数が一定です。
- **ソートの一部だけで足りる**: 3 つの要素を整えるだけなので、全体をソートせずに、良い基準を素早く選べます。
- **入れ替えを数える**: `swaps` を使うことで、並びが既に整っていたかを後で判断できます。その情報は、ソートの高速化に役立ちます。

## まとめ

- `median` は、3 つの位置から真ん中の値の位置を返します。
- 2 つずつ比べて整える操作を、3 回行うだけで決まります。
- クイックソートで、良い基準（ピボット）を選ぶために使われます。
