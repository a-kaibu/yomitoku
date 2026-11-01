---
title: "「ほぼ並んでいる」なら数か所直して終わらせる部分挿入ソート"
description: "pdqsort の partialInsertionSort。並びの乱れが 5 か所以内なら、その場で直してソートを終わらせます。乱れが多ければすぐあきらめるのがポイントです。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2022 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/zsortordered.go"
lines: [197, 238]
function: "partialInsertionSortOrdered"
difficulty: 3
tags: [ソート, アルゴリズム, 最適化, 標準ライブラリ]
---

## ひとことで

現実のデータは「ほとんど並んでいて、数か所だけ順番がずれている」ことがよくあります。
`partialInsertionSort` は、そうした配列を見つけたら **ずれている箇所を最大 5 回まで直して、並べ替えを完了させてしまう** 関数です。
5 回直しても終わらなければ、すぐにあきらめて `false` を返し、ふつうのクイックソートに戻ります。

## コード

```go:line-numbers=197
func partialInsertionSortOrdered[E cmp.Ordered](data []E, a, b int) bool {
	const (
		maxSteps         = 5  // maximum number of adjacent out-of-order pairs that will get shifted
		shortestShifting = 50 // don't shift any elements on short arrays
	)
	i := a + 1
	for j := 0; j < maxSteps; j++ {
		for i < b && !cmp.Less(data[i], data[i-1]) {
			i++
		}

		if i == b {
			return true
		}

		if b-a < shortestShifting {
			return false
		}

		data[i], data[i-1] = data[i-1], data[i]

		// Shift the smaller one to the left.
		if i-a >= 2 {
			for j := i - 1; j >= 1; j-- {
				if !cmp.Less(data[j], data[j-1]) {
					break
				}
				data[j], data[j-1] = data[j-1], data[j]
			}
		}
		// Shift the greater one to the right.
		if b-i >= 2 {
			for j := i + 1; j < b; j++ {
				if !cmp.Less(data[j], data[j-1]) {
					break
				}
				data[j], data[j-1] = data[j-1], data[j]
			}
		}
	}
	return false
}
```

## 前提知識

- **挿入ソート**: 要素を 1 つずつ見て、左側の並んだ部分の正しい位置まで移していくソートです。ほぼ並んだ配列では非常に速いですが、ばらばらだと遅くなります。
- **`cmp.Less(x, y)`**: `x < y` かを返す関数です。浮動小数点数の NaN（非数）も一貫して扱えるように、`<` の代わりに使われています。
- **`data[i], data[i-1] = data[i-1], data[i]`**: 2 つの要素を入れ替えます。
- **ラベルなしの `break`**: いちばん内側のループだけを抜けます。
- **変数のシャドーイング**: 外側のループの `j` と、220 行目・229 行目の `for j := ...` の `j` は別の変数です。内側で新しく宣言すると、そのブロックの中では外側の `j` が隠れます。

## 何をしているか

`[1, 2, 4, 3, 5, 6]` で追います（実際は 50 要素以上でないと直しませんが、考え方を見るために小さくしています）。

### 1. 並んでいる間は進む（204〜206 行目）

`data[i] < data[i-1]` になる場所を探します。`4, 3` のところで止まり、`i = 3` です。

### 2. 最後まで行けたら完了（208〜210 行目）

途中で止まらずに最後まで行けたら、もう並んでいるので `true` を返します。

### 3. 短い配列ではあきらめる（212〜214 行目）

50 要素未満なら、直すより他の方法が速いので `false` を返します。

### 4. 入れ替えて、左右になじませる（216〜235 行目）

`data[3]` と `data[2]` を入れ替えて `[1, 2, 3, 4, 5, 6]`。
入れ替えで左に来た小さいほう（`3`）は、さらに左の要素より小さい間だけ左へ移します（220〜225 行目）。右に来た大きいほう（`4`）も、右の要素より大きい間だけ右へ移します（229〜234 行目）。これは挿入ソートの 1 ステップと同じです。

### 5. 最大 5 回まで（203 行目）

これを `maxSteps = 5` 回まで繰り返し、それでも最後まで行けなければ `false` を返します。

## ここがすごい

- **賭けに負けても損が小さい**: 最大 5 か所しか直さないので、ばらばらな配列で試しても無駄になるのは少しの時間だけです。勝てば（ほぼ並んでいれば）、クイックソートの再帰をまるごと省けます。
- **呼ぶタイミングが賢い**: pdqsort は、基準値で分割したときに「1 つも入れ替えが起きなかった」（ほぼ並んでいそう）場合にだけこの関数を試します。疑わしいときだけ賭ける設計です。
- **挿入ソートの「いいとこ取り」**: 挿入ソートはほぼ並んだデータに強いという長所を、回数制限付きで使っています。短所（ばらばらだと遅い）は回数制限で封じています。

## まとめ

- ほぼ並んだデータは現実によくあるので、それを見抜くと並べ替えが大幅に速くなる。
- 「少しだけ試して、だめならすぐやめる」という回数制限付きの楽観的な処理は、損を小さく得を大きくできる。
- アルゴリズムの長所だけを、条件付きで借りてくることができる。
