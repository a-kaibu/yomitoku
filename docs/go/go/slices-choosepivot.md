---
title: "3 点か 9 点の中央値で基準値を選び、ついでに整列済みかも見抜く"
description: "pdqsort の基準値選び choosePivot。配列から 3 つ（大きい配列では 9 つ）の値を取って中央値を基準にし、その途中の入れ替え回数から「もう並んでいそうか」も推測します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2022 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/zsortordered.go"
lines: [263, 297]
function: "choosePivotOrdered"
difficulty: 3
tags: [ソート, アルゴリズム, 最適化, 標準ライブラリ]
---

## ひとことで

クイックソートでは、基準値（ピボット）として **真ん中に近い値** を選べると速くなります。
`choosePivot` は、配列から 3 か所（50 要素以上なら 9 か所）の値を取り出してその中央値を基準値にします。

さらに、中央値を求める途中で **何回入れ替えが起きたか** を数え、0 回なら「昇順に並んでいそう」、最大回数なら「降順に並んでいそう」というヒントも返します。

## コード

```go:line-numbers=263
func choosePivotOrdered[E cmp.Ordered](data []E, a, b int) (pivot int, hint sortedHint) {
	const (
		shortestNinther = 50
		maxSwaps        = 4 * 3
	)

	l := b - a

	var (
		swaps int
		i     = a + l/4*1
		j     = a + l/4*2
		k     = a + l/4*3
	)

	if l >= 8 {
		if l >= shortestNinther {
			// Tukey ninther method, the idea came from Rust's implementation.
			i = medianAdjacentOrdered(data, i, &swaps)
			j = medianAdjacentOrdered(data, j, &swaps)
			k = medianAdjacentOrdered(data, k, &swaps)
		}
		// Find the median among i, j, k and stores it into j.
		j = medianOrdered(data, i, j, k, &swaps)
	}

	switch swaps {
	case 0:
		return j, increasingHint
	case maxSwaps:
		return j, decreasingHint
	default:
		return j, unknownHint
	}
}
```

## 前提知識

- **中央値**: 値を並べたときに真ん中に来る値です。3 つの値 `5, 1, 3` の中央値は `3` です。
- **ジェネリクス `[E cmp.Ordered]`**: 大小比較ができる型なら何にでも使える、という型パラメータの指定です。
- **`&swaps`**: 変数 `swaps` のアドレス（ポインタ）を渡しています。呼ばれた関数がこのポインタを通して `swaps` の値を増やせます。
- **`const ( ... )`、`var ( ... )`**: 複数の定数・変数をまとめて宣言する書き方です。
- **複数の戻り値**: `(pivot int, hint sortedHint)` は基準値の位置とヒントの 2 つを返します。

## 何をしているか

### 1. 候補の位置を決める（269〜276 行目）

長さ `l` の範囲を 4 等分し、1/4、2/4、3/4 の位置を `i`、`j`、`k` とします。長さ 100 なら 25、50、75 番目です。

### 2. 大きい配列は 9 点で（279〜284 行目）

50 要素以上なら、`i`、`j`、`k` それぞれについて **その位置と両隣の 3 つの中央値**（`medianAdjacent`）を求め、それを新しい候補にします。合計 9 個の値から「中央値の中央値」を取ることになります。これを **Tukey の ninther** と呼びます。

### 3. 3 つの候補の中央値（286 行目）

`median` で `i`、`j`、`k` の位置の値の中央値を求め、その位置を `j` に入れます。

### 4. ヒントを返す（289〜296 行目）

`median` は内部で「並べ替えが必要だったら `swaps` を 1 増やす」ようになっています。

- `swaps == 0`: どの比較でも並べ替え不要 → 昇順に並んでいそう（`increasingHint`）
- `swaps == 12`（`4 * 3`、9 点のとき 4 回の中央値計算 × 最大 3 回）: 毎回逆順 → 降順に並んでいそう（`decreasingHint`）

降順のヒントが出ると、呼び出し側は範囲を反転して昇順にしてから処理を進めます。

## ここがすごい

- **少ないサンプルで良い基準値**: 全体の中央値を求めるのは大変ですが、3 点や 9 点の中央値なら比較数回で済み、極端に偏った基準値を選ぶ確率がぐっと下がります。
- **副産物の活用**: 中央値を求めるための比較結果を捨てずに、「整列済みかどうか」の推測に使っています。追加のコストはほぼゼロです。すでに並んだデータはよくあるので、これを見抜けると大きく速くなります。
- **配列の大きさで方法を変える**: 小さい配列で 9 点を取ると手間のほうが大きいので、50 という境目で切り替えています。コメント（280 行目）にある通り、このアイデアは Rust の実装から来ています。

## まとめ

- クイックソートの基準値は、少数のサンプルの中央値で選ぶと偏りにくい。
- 大きい配列では「中央値の中央値」（ninther）でさらに精度を上げる。
- 計算の途中で得られた情報（入れ替え回数）を、別の判断（整列済みか）に再利用できる。
