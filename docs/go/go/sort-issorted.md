---
title: "隣り合う 2 つだけ比べれば、並んでいるかが分かる"
description: "sort.IsSorted は、データが昇順に並んでいるかを調べます。全体を比べなくても、隣同士の比較だけで判定できることを利用しています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/sort/sort.go"
lines: [110, 118]
function: "IsSorted"
difficulty: 2
format: 2
tags: [ソート, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`sort.IsSorted(data)` は、`data` が小さい順に並んでいるかを返します。`Interface` を満たす型（`Len`、`Less`、`Swap` を持つもの）なら、どんな並びでも調べられます。

全部の組を比べると、要素数の 2 乗に近い回数が必要になります。この関数は、**隣同士を比べるだけ** で答えを出します。

## コード

```go:line-numbers=110
func IsSorted(data Interface) bool {
	n := data.Len()
	for i := n - 1; i > 0; i-- {
		if data.Less(i, i-1) {
			return false
		}
	}
	return true
}
```

## 前提知識

- **`Interface`**: `sort` パッケージが定義する、`Len() int`、`Less(i, j int) bool`、`Swap(i, j int)` の 3 つのメソッドを持つ型です。並べ替えの対象が何であっても、このメソッドがあれば使えます。
- **昇順**: 小さいものから順に並んでいることです。`Less(i, j)` が `true` なら、`i` 番目は `j` 番目より前に来るべき、という意味です。
- **推移律**: `a < b` かつ `b < c` なら `a < c` が成り立つ性質です。大小関係の基本となる約束です。

## 何をしているか

`[1, 2, 2, 5]` で追います。

### 1. 後ろから隣同士を比べる

```go:line-numbers=112
	for i := n - 1; i > 0; i-- {
		if data.Less(i, i-1) {
			return false
		}
	}
```

`i = 3` なら、`Less(3, 2)` は `5 < 2` で偽なので、次へ進みます。`i = 2` は `Less(2, 1)`（`2 < 2`）で偽、`i = 1` は `Less(1, 0)`（`2 < 1`）で偽です。どれも並べ替えに反しないので、すべて通れば `true` を返します。

### 2. 1 つでも逆転していれば false

たとえば `[1, 3, 2]` では、`i = 2` で `Less(2, 1)`（`2 < 3`）が `true` になるので、すぐに `false` を返します。

## ここがすごい

- **隣だけでよい理由**: 隣同士がすべて正しい順序なら、推移律によって全体も正しく並んでいます。例えば `a ≤ b` と `b ≤ c` が成り立てば、`a ≤ c` も成り立ちます。だから、遠く離れた組を比べる必要はありません。
- **比較回数が n - 1 回**: 全組を比べると、約 n²/2 回の比較が必要です。隣だけなら、どんなに大きくても n - 1 回で終わります。
- **逆転が見つかったら即終了**: 途中で 1 つ逆転が見つかれば、そこで `false` を返します。並んでいない場合はとても速く終わります。

## まとめ

- 大小関係が推移律を満たすなら、隣同士の比較だけで全体の順序が分かる。
- 比較の回数を、全組の数から n - 1 回に減らせる。
- 逆転が見つかった時点で終わると、並んでいないデータは速く判定できる。
