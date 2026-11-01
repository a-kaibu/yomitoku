---
title: "配列を一様に並べ替える Fisher-Yates シャッフル"
description: "math/rand/v2 の Shuffle は、Fisher-Yates 法で配列を並べ替えます。後ろから順に、残りの中から 1 つを選んで入れ替えるだけで、すべての並び順が同じ確率になります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/rand/v2/rand.go"
lines: [246, 261]
function: "(*Rand).Shuffle"
difficulty: 2
format: 2
tags: [乱数, アルゴリズム, イディオム, 標準ライブラリ]
---

## ひとことで

`Shuffle(n, swap)` は、`n` 個の要素の並びを、**すべての順列が同じ確率になるように** 並べ替えます。`swap(i, j)` は、呼び出し側が渡す「要素 `i` と `j` を入れ替える関数」です。
トランプを切る、くじの順番を決める、といった用途で使われます。

## コード

::: code-group

```go:line-numbers=246 [日本語訳]
func (r *Rand) Shuffle(n int, swap func(i, j int)) {
	if n < 0 {
		panic("invalid argument to Shuffle")
	}

	// Fisher-Yates シャッフル: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
	// Shuffle は、n が 32 ビットに収まらない値で呼ばれるべきではない。
	// 時間がとてもかかるだけでなく、2³¹! 通りの順列があるので、
	// どんな PRNG も、そのような多くの順列を生成できるだけの内部状態を持てない。
	// 可能な順列のごくわずかな割合さえ生成できない。
	// それでも API は int の n を受け取るので、できる範囲で扱う。
	for i := n - 1; i > 0; i-- {
		j := int(r.uint64n(uint64(i + 1)))
		swap(i, j)
	}
}
```

```go:line-numbers=246 [原文]
func (r *Rand) Shuffle(n int, swap func(i, j int)) {
	if n < 0 {
		panic("invalid argument to Shuffle")
	}

	// Fisher-Yates shuffle: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
	// Shuffle really ought not be called with n that doesn't fit in 32 bits.
	// Not only will it take a very long time, but with 2³¹! possible permutations,
	// there's no way that any PRNG can have a big enough internal state to
	// generate even a minuscule percentage of the possible permutations.
	// Nevertheless, the right API signature accepts an int n, so handle it as best we can.
	for i := n - 1; i > 0; i-- {
		j := int(r.uint64n(uint64(i + 1)))
		swap(i, j)
	}
}
```

:::

## 前提知識

- **順列**: 要素を並べ替えた結果のことです。`n` 個なら `n!` 通りあります。
- **Fisher-Yates 法**: 後ろから順に、残りの範囲から 1 つをランダムに選んで、その位置と入れ替える方法です。どの順列も、同じ確率で生まれることが証明できます。
- **`swap` を関数で受け取る**: 並べ替えの対象が何であっても（配列でも、スライスでも、別の構造でも）、呼び出し側が入れ替え方法を決められます。
- **`uint64n`**: 0 から `n-1` の一様な乱数を作る内部の関数です。ここでは、その結果を `int` に変換しています。

## 何をしているか

`n = 4` の場合で考えます。最初の並びを `[a, b, c, d]` とします。

### 1. 負の値を防ぐ

```go:line-numbers=247
	if n < 0 {
		panic("invalid argument to Shuffle")
	}
```

負の数の並びは存在しないので、すぐに `panic` します。

### 2. 後ろから 1 つずつ決める

```go:line-numbers=257
	for i := n - 1; i > 0; i-- {
		j := int(r.uint64n(uint64(i + 1)))
		swap(i, j)
	}
```

`i = 3` のとき、`0` から `3` の中から 1 つを `j` として選び、`swap(3, j)` で入れ替えます。`i` を 1 つずつ減らし、`i = 1` まで同じことを繰り返します。`i = 0` は残り 1 つしかないので、何もしません。

### 3. 選ぶ範囲が毎回狭まる

最初は 4 通り、次は 3 通り、と毎回選べる範囲が 1 つずつ減ります。だから、どの位置にどの要素が来る確率も、同じになります。

## ここがすごい

- **すべての順列が等しい確率**: 単純に「ランダムな位置と毎回入れ替える」と、偏った並びが出てしまいます。Fisher-Yates 法は、残りから選ぶという一回の決まりで、偏りが出ないことが保証されています。
- **`n` 回ではなく `n-1` 回**: 最後の 1 つは、選ぶ余地がないので入れ替える必要がありません。ループの条件を `i > 0` にして、その無駄を省いています。
- **乱数の偏りまで考えた部品**: ループの中で呼ばれる `uint64n` は、単純な剰余（`%`）を使わず、偏りが出ないように作られています。並べ替えの公平さは、乱数の公平さに支えられています。
- **`swap` を受け取る設計**: 並べ替えのアルゴリズムと、データの持ち方を切り離しています。同じ関数で、どんなデータも並べ替えられます。

## まとめ

- Fisher-Yates 法は、後ろから順に残りの中から 1 つを選んで入れ替える。
- この方法なら、すべての並び順が同じ確率になる。
- 乱数の偏りがないことも、公平な並べ替えには欠かせない。
