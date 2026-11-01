---
title: "わざと少しだけ散らかして、クイックソートの最悪ケースを避ける"
description: "pdqsort の部品 breakPatterns。悪い分割が続いたとき、配列の中央付近の 3 要素を疑似乱数の位置と入れ替え、意地悪な並びのパターンを崩します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2022 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/zsortordered.go"
lines: [242, 256]
function: "breakPatternsOrdered"
difficulty: 3
format: 2
tags: [ソート, アルゴリズム, 乱数, 標準ライブラリ]
---

## ひとことで

Go の `slices.Sort` は **pdqsort**（パターンを打ち破るクイックソート）というアルゴリズムで並べ替えます。
クイックソートは、基準値（ピボット）の選び方が運悪く偏り続けると、とても遅くなります（最悪 n² の時間）。

`breakPatterns` は、分割の偏りが検出されたときに呼ばれ、**配列の真ん中あたりの 3 つの要素を、疑似乱数で選んだ位置の要素と入れ替えて** 並びのパターンを崩します。

## コード

```go:line-numbers=242
func breakPatternsOrdered[E cmp.Ordered](data []E, a, b int) {
	length := b - a
	if length >= 8 {
		random := xorshift(length)
		modulus := nextPowerOfTwo(length)

		for idx := a + (length/4)*2 - 1; idx <= a+(length/4)*2+1; idx++ {
			other := int(uint(random.Next()) & (modulus - 1))
			if other >= length {
				other -= length
			}
			data[idx], data[a+other] = data[a+other], data[idx]
		}
	}
}
```

`xorshift` は簡単な疑似乱数生成器、`nextPowerOfTwo(n)` は n より大きい最小の 2 の累乗を返す関数です（どちらも `slices/sort.go`）。

## 前提知識

- **クイックソート**: 基準値を 1 つ選び、それより小さい要素を左、大きい要素を右に分け、左右をそれぞれ同じ方法で並べる、という再帰的なソートです。平均は速いですが、基準値がいつも端の値になると遅くなります。
- **ジェネリクス `[E cmp.Ordered]`**: `E` は型のパラメータで、「大小比較できる型ならなんでもよい」という意味です。整数でも文字列でも、同じコードで並べ替えられます。
- **疑似乱数**: 計算で作る「乱数っぽい」数の列です。同じ種（最初の値）からは毎回同じ列が出ます。
- **`& (modulus - 1)`**: `modulus` が 2 の累乗なら、「`modulus` で割った余り」と同じです。
- **`a, b = b, a`**: 2 つの値を入れ替える Go の書き方です。

## 何をしているか

長さ 20 の範囲（`a = 0`, `b = 20`）で考えます。

### 1. 短い配列は何もしない

```go:line-numbers=244
	if length >= 8 {
```

8 要素未満なら放っておきます。短い範囲はどうせ挿入ソートで速く並べられるからです。

### 2. 乱数の準備

```go:line-numbers=245
		random := xorshift(length)
		modulus := nextPowerOfTwo(length)
```

乱数の種には **長さそのもの**（20）を使います。`modulus = nextPowerOfTwo(20) = 32` です。

### 3. 中央付近の 3 要素を入れ替える

```go:line-numbers=248
		for idx := a + (length/4)*2 - 1; idx <= a+(length/4)*2+1; idx++ {
			other := int(uint(random.Next()) & (modulus - 1))
			if other >= length {
				other -= length
			}
			data[idx], data[a+other] = data[a+other], data[idx]
		}
```

`(20/4)*2 = 10` なので、位置 9, 10, 11 の 3 つが対象です。
それぞれ、乱数を `& 31` で 0〜31 にし、20 以上なら 20 を引いて 0〜19 に収め、その位置の要素と入れ替えます。

## ここがすごい

- **決定的な「ランダム」**: 種に配列の長さを使うので、同じ入力なら毎回同じ動きになります。本物の乱数を使うと、テストで再現できない不具合が出たり、乱数の初期化コストがかかったりします。
- **割り算を使わずに範囲に収める**: `% length` は割り算で遅いので、2 の累乗のマスクで 0〜modulus-1 にし、はみ出たら 1 回引くだけにしています。`modulus < 2*length` なので、1 回引けば必ず収まります。わずかな偏りは出ますが、目的（パターンを崩す）には十分です。
- **最小限の手入れ**: 配列全体をシャッフルすると時間がかかります。次のピボット選びに使われる真ん中付近だけを少し崩せば十分、という見切りが見事です。
- **Rust 由来の工夫**: pdqsort は Orson Peters 氏が考案したアルゴリズムで、Rust の標準ライブラリなどにも採用されています。Go もそれを取り入れました。

## まとめ

- クイックソートの最悪ケースは、基準値の選び方が偏り続けたときに起こる。
- パターンを崩すには、全体をかき混ぜなくても、要所を少し入れ替えるだけで足りる。
- 種を固定した疑似乱数を使うと、動きが再現可能になる。
- 割り算の代わりにマスクと 1 回の引き算で範囲に収める小技がある。
